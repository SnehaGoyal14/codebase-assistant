import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
client = chromadb.PersistentClient(path="chroma_db")

def retrieve(repo_id, question, n_results=5):
    col = client.get_collection(repo_id)
    q_emb = model.encode([question]).tolist()
    results = col.query(query_embeddings=q_emb, n_results=n_results)
    chunks = results['documents'][0]
    sources = [m['file'] for m in results['metadatas'][0]]
    return chunks, sources

if __name__ == "__main__":
    question = "how does routing work?"
    chunks, sources = retrieve("flask_test", question)
    print(f"Question: {question}\n")
    for i, (chunk, source) in enumerate(zip(chunks, sources)):
        print(f"Result {i+1}: {source}")
        print(chunk[:200])
        print("-" * 50)
