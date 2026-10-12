import csv
import time
import requests

INPUT_FILE = "evaluation/results_hard_ast.csv"
OUTPUT_FILE = "evaluation/results_hard_ast_v2.csv"
ASK_URL = "http://127.0.0.1:8000/ask"
REPO_ID = "flask_ast"
DELAY = 2  # seconds between requests

def main():
    with open(INPUT_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        questions = [(row["id"], row["question"]) for row in reader]

    total = len(questions)

    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as out:
        writer = csv.DictWriter(out, fieldnames=["id", "question", "answer", "score", "notes", "hallucination"])
        writer.writeheader()

        for i, (qid, question) in enumerate(questions, start=1):
            print(f"Question {i}/{total}: {question[:60]}...")
            try:
                res = requests.post(ASK_URL, json={"repo_id": REPO_ID, "question": question}, timeout=60)
                res.raise_for_status()
                answer = res.json().get("answer", "").strip()
            except Exception as e:
                print(f"  ERROR: {e}")
                answer = f"ERROR: {e}"

            writer.writerow({
                "id": qid,
                "question": question,
                "answer": answer,
                "score": "",
                "notes": "",
                "hallucination": "",
            })

            if i < total:
                time.sleep(DELAY)

    print(f"\nDone. Results saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
