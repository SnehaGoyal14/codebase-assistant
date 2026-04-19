import json
import csv
from sentence_transformers import SentenceTransformer
import chromadb

# Load model and the database
model = SentenceTransformer('all-MiniLM-L6-v2')
client = chromadb.PersistentClient(path="chroma_db")
col = client.get_collection("flask_test")

# Read questions from questions.json file
with open("evaluation/questions.json", "r") as f:
    questions = json.load(f)

# Opening CSV file to save the response
with open("evaluation/results.csv", "w", newline="", encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["id", "question", "answer", "source_file", "score", "notes"])

    for item in questions:
        question = item["question"]
        q_id = item["id"]

        # Ask queries from the system
        q_emb = model.encode([question]).tolist()
        results = col.query(query_embeddings=q_emb, n_results=1)
        answer = results["documents"][0][0][:300]
        source_file = results["metadatas"][0][0]["file"]

        # Show question and answer
        print(f"\n--- Question {q_id} ---")
        print(f"Q: {question}")
        print(f"A: {answer}")
        print(f"Source: {source_file}")

        # Ask for score
        while True:
            score = input("Score (0, 1, or 2): ").strip()
            if score in ["0", "1", "2"]:
                break
            print("Please enter 0, 1, or 2 only")

        # Ask for notes
        notes = input("Notes (optional, press Enter to skip): ").strip()

        # Saving to CSV
        writer.writerow([q_id, question, answer, source_file, score, notes])

print("\nAll done! Results saved to evaluation/results.csv")