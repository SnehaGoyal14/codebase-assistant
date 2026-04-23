from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import shutil
from rag.indexer import index_repo
from rag.llm import get_answer
from rag.guide import generate_guide
from rag.graph import build_graph
import chromadb
import git as gitmodule
from sentence_transformers import SentenceTransformer

load_dotenv()
API_KEY = os.getenv("OPENAI_API_KEY")

app = FastAPI()
client = chromadb.PersistentClient(path="chroma_db")
model = SentenceTransformer('all-MiniLM-L6-v2')

class IndexRequest(BaseModel):
    repo_url: str
    repo_id: str

class AskRequest(BaseModel):
    repo_id: str
    question: str

class GuideRequest(BaseModel):
    repo_id: str

class GraphRequest(BaseModel):
    repo_url: str
    repo_id: str

@app.post("/index")
def index(req: IndexRequest):
    total = index_repo(req.repo_url, req.repo_id)
    return {"status": "done", "chunks": total}

@app.get("/status/{repo_id}")
def status(repo_id: str):
    try:
        col = client.get_collection(repo_id)
        return {"status": "ready", "chunks": col.count()}
    except:
        return {"status": "not found"}

@app.post("/ask")
def ask(req: AskRequest):
    col = client.get_collection(req.repo_id)
    q_emb = model.encode([req.question]).tolist()
    results = col.query(query_embeddings=q_emb, n_results=5)
    chunks = results['documents'][0]
    sources = [m['file'] for m in results['metadatas'][0]]
    answer = get_answer(req.question, chunks, API_KEY)
    return {
        "question": req.question,
        "answer": answer,
        "sources": sources
    }

@app.post("/guide")
def guide(req: GuideRequest):
    result = generate_guide(req.repo_id, API_KEY)
    return {"repo_id": req.repo_id, "guide": result}

@app.post("/graph")
def graph(req: GraphRequest):
    local_path = f"temp_graph_{req.repo_id}"
    try:
        if not os.path.exists(local_path):
            gitmodule.Repo.clone_from(req.repo_url, local_path)
        result = build_graph(local_path)
        return {"repo_id": req.repo_id, "graph": result}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(local_path):
            shutil.rmtree(local_path, ignore_errors=True)

@app.get("/")
def root():
    return {"message": "Codebase Assistant API is running!"}