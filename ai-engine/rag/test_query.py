from sentence_transformers import SentenceTransformer
import chromadb

model = SentenceTransformer('all-MiniLM-L6-v2')
client = chromadb.PersistentClient(path="chroma_db")

col = client.get_collection("flask_test")

questions = [
    "how does routing work?",
    "how does the app start up?",
    "how does error handling work?"
]

for question in questions:
    q_emb = model.encode([question]).tolist()
    results = col.query(query_embeddings=q_emb, n_results=1)
    print(f"\nQuestion: {question}")
    print(f"Found in: {results['metadatas'][0][0]['file']}")
    print(f"Chunk: {results['documents'][0][0][:200]}...")
    print("-" * 50)
