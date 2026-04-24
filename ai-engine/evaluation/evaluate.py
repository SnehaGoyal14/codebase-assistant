import json
import csv
import requests

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

        # Send question to FastAPI server
        response = requests.post(
            "http://127.0.0.1:8000/ask",
            json={
                "repo_id": "flask_test",
                "question": question
            }
        )
        data = response.json()
        answer = data.get("answer", "")
        sources = data.get("sources", [])
        source_file = sources[0] if sources else ""

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
print("\nAll Results saved to evaluation/results.csv")