import csv
import time
import requests

BASE_URL = "http://127.0.0.1:8000"
REPO_URL = "https://github.com/django/django"
REPO_ID  = "django_eval"
OUTPUT   = "evaluation/results_django.csv"
DELAY    = 3  # seconds between /ask calls

QUESTIONS = [
    (1,  "What is the main entry point for a Django web application?"),
    (2,  "How does Django's URL routing system work internally?"),
    (3,  "Where is the ORM query execution implemented?"),
    (4,  "How does Django handle database migrations internally?"),
    (5,  "Where is middleware processing implemented in Django?"),
    (6,  "How does Django's template engine render templates?"),
    (7,  "Where is user authentication handled in this codebase?"),
    (8,  "How does Django handle HTTP request and response objects?"),
    (9,  "Where is the admin interface implemented?"),
    (10, "How does Django's form validation work internally?"),
    (11, "Where are database model fields defined and validated?"),
    (12, "How does Django handle static files?"),
    (13, "Where is session management implemented?"),
    (14, "How does Django's caching framework work?"),
    (15, "Where is the CSRF protection implemented?"),
    (16, "How does Django handle database transactions?"),
    (17, "Where are management commands implemented?"),
    (18, "How does Django's signal system work?"),
    (19, "Where is internationalization (i18n) handled?"),
    (20, "How does Django handle file uploads?"),
]


def index_repo():
    print(f"Indexing Django... this may take 5-10 minutes")
    print(f"  repo : {REPO_URL}")
    print(f"  id   : {REPO_ID}\n")
    try:
        res = requests.post(
            f"{BASE_URL}/index",
            json={"repo_url": REPO_URL, "repo_id": REPO_ID},
            timeout=900,
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
    # Indexing skipped — django_eval is already in ChromaDB (52,780 chunks)
    # index_repo()

    print(f"Using existing index: {REPO_ID}\n")
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
