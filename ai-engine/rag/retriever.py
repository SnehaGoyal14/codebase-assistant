import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
client = chromadb.PersistentClient(path="chroma_db")

CONFIDENCE_THRESHOLD = 0.3

def retrieve(repo_id, question, n_results=10):
    col = client.get_collection(repo_id)
    q_emb = model.encode([question]).tolist()
    results = col.query(
        query_embeddings=q_emb,
        n_results=n_results,
        include=['documents', 'metadatas', 'distances']
    )
    chunks = results['documents'][0]
    sources = [m['file'] for m in results['metadatas'][0]]
    distances = results['distances'][0]

    # ChromaDB L2 distances range 0-2
    # Convert to similarity 0-1 scale: 1 - (distance/2)
    similarities = [1 - (d/2) for d in distances]
    best_similarity = max(similarities) if similarities else 0

    # Flag low confidence
    low_confidence = best_similarity < CONFIDENCE_THRESHOLD

    return chunks, sources, low_confidence

if __name__ == "__main__":
    question = "how does routing work?"
    chunks, sources, low_confidence = retrieve("flask_test", question)
    print(f"Question: {question}")
    print(f"Low confidence: {low_confidence}\n")
    for i, (chunk, source) in enumerate(zip(chunks, sources)):
        print(f"Result {i+1}: {source}")
        print(chunk[:200])
        print("-" * 50)