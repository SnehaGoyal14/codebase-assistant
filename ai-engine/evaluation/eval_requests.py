import csv
import time
import requests

BASE_URL = "http://127.0.0.1:8000"
REPO_URL = "https://github.com/psf/requests"
REPO_ID  = "requests_eval"
OUTPUT   = "evaluation/results_requests.csv"
DELAY    = 2  # seconds between /ask calls

QUESTIONS = [
    (1,  "What is the main entry point for making HTTP requests in this codebase?"),
    (2,  "How does the Session class manage persistent settings across requests?"),
    (3,  "Where is authentication handled in this codebase?"),
    (4,  "How are redirects handled internally?"),
    (5,  "Where is SSL/TLS certificate verification implemented?"),
    (6,  "How does the PreparedRequest class work?"),
    (7,  "Where are HTTP headers merged and processed?"),
    (8,  "How does connection pooling work in this codebase?"),
    (9,  "Where is timeout handling implemented?"),
    (10, "How are cookies managed across requests?"),
    (11, "What is the role of the adapters in this codebase?"),
    (12, "How does the Response class handle content encoding?"),
    (13, "Where is proxy support implemented?"),
    (14, "How are query parameters encoded and attached to URLs?"),
    (15, "What happens internally when you call requests.get()?"),
    (16, "How does the HTTPAdapter interact with urllib3?"),
    (17, "Where is error handling and exception raising implemented?"),
    (18, "How does the codebase handle multipart form data?"),
    (19, "What is the purpose of the utils.py file?"),
    (20, "How does stream=True affect response handling?"),
]


def index_repo():
    print(f"Indexing {REPO_URL} as '{REPO_ID}'...")
    print("This may take several minutes — please wait.\n")
    try:
        res = requests.post(
            f"{BASE_URL}/index",
            json={"repo_url": REPO_URL, "repo_id": REPO_ID},
            timeout=600,
        )
        res.raise_for_status()
        data = res.json()
        chunks = data.get("chunks", data.get("total_chunks", "?"))
        print(f"Indexing complete. Chunks indexed: {chunks}\n")
        return True
    except Exception as e:
        print(f"ERROR during indexing: {e}")
        return False


def ask_question(question):
    try:
        res = requests.post(
            f"{BASE_URL}/ask",
            json={"repo_id": REPO_ID, "question": question},
            timeout=120,
        )
        res.raise_for_status()
        return res.json().get("answer", "").strip()
    except Exception as e:
        return f"ERROR: {e}"


def main():
    if not index_repo():
        print("Aborting — indexing failed.")
        return

    total = len(QUESTIONS)
    rows = []

    for i, (qid, question) in enumerate(QUESTIONS, start=1):
        print(f"Question {i}/{total}: {question[:70]}...")
        answer = ask_question(question)
        rows.append({
            "id": qid,
            "question": question,
            "answer": answer,
            "score": "",
            "notes": "",
            "hallucination": "",
        })
        if i < total:
            time.sleep(DELAY)

    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["id", "question", "answer", "score", "notes", "hallucination"]
        )
        writer.writeheader()
        writer.writerows(rows)

    errors = sum(1 for r in rows if r["answer"].startswith("ERROR"))
    print(f"\nDone.")
    print(f"  Questions answered : {total - errors}/{total}")
    print(f"  Errors             : {errors}")
    print(f"  Output saved to    : {OUTPUT}")
    print("\nScore, notes, and hallucination columns left blank for manual review.")


if __name__ == "__main__":
    main()
