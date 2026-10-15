import csv
import time
import sys
import requests
import chromadb

BASE_URL  = "http://127.0.0.1:8000"
REPO_URL  = "https://github.com/numpy/numpy"
REPO_ID   = "numpy_eval"
OUTPUT    = "evaluation/results_numpy.csv"
DELAY     = 3   # seconds between /ask calls
INDEX_TIMEOUT = 900  # seconds for HTTP index call

QUESTIONS = [
    (1,  "What is the main data structure in this codebase?"),
    (2,  "How does numpy handle array creation internally?"),
    (3,  "Where is broadcasting implemented in this codebase?"),
    (4,  "How does numpy handle dtype (data type) management?"),
    (5,  "Where is memory layout and strides implemented?"),
    (6,  "How does numpy implement mathematical operations like add and multiply?"),
    (7,  "Where is the random number generation implemented?"),
    (8,  "How does numpy handle array indexing and slicing?"),
    (9,  "Where is linear algebra implemented in this codebase?"),
    (10, "How does numpy handle Fourier transforms?"),
    (11, "Where is array sorting implemented?"),
    (12, "How does numpy handle reading and writing files?"),
    (13, "Where is string/character array handling implemented?"),
    (14, "How does numpy implement universal functions (ufuncs)?"),
    (15, "Where is the C extension interface implemented?"),
    (16, "How does numpy handle masked arrays?"),
    (17, "Where is polynomial math implemented?"),
    (18, "How does numpy handle datetime and timedelta arrays?"),
    (19, "Where is matrix operations implemented separately from arrays?"),
    (20, "How does numpy's testing framework work?"),
]


def chroma_chunk_count(repo_id, chroma_path="chroma_db"):
    """Return chunk count from ChromaDB directly, or 0 if not found."""
    try:
        client = chromadb.PersistentClient(path=chroma_path)
        return client.get_collection(repo_id).count()
    except Exception:
        return 0


def index_repo():
    """
    POST to /index. If the HTTP connection times out (large repo), the server
    continues indexing in the background. We then poll ChromaDB directly until
    the chunk count stabilises, and wait for the server to become responsive
    again before returning.
    """
    print("Indexing numpy... this may take 5-10 minutes")
    print(f"  repo : {REPO_URL}")
    print(f"  id   : {REPO_ID}\n")

    try:
        res = requests.post(
            f"{BASE_URL}/index",
            json={"repo_url": REPO_URL, "repo_id": REPO_ID},
            timeout=INDEX_TIMEOUT,
        )
        res.raise_for_status()
        data = res.json()
        chunks = data.get("chunks", data.get("total_chunks", "?"))
        print(f"Indexing complete. Chunks indexed: {chunks}\n")
        return True

    except requests.exceptions.Timeout:
        print("HTTP connection timed out — server is still indexing in the background.")
        print("Polling ChromaDB directly until indexing stabilises...\n")

        prev_count = -1
        stable_rounds = 0
        poll_interval = 30  # seconds

        while True:
            count = chroma_chunk_count(REPO_ID)
            print(f"  numpy_eval chunks so far: {count}")
            if count > 0 and count == prev_count:
                stable_rounds += 1
                if stable_rounds >= 2:
                    print(f"\nChunk count stable at {count}. Indexing appears complete.")
                    break
            else:
                stable_rounds = 0
            prev_count = count
            time.sleep(poll_interval)

        # Now wait for the server to become responsive again
        print("Waiting for server to become responsive...")
        for _ in range(60):
            try:
                r = requests.get(f"{BASE_URL}/", timeout=5)
                if r.ok:
                    print("Server is responsive.\n")
                    return True
            except Exception:
                pass
            time.sleep(10)

        print("WARNING: Server did not recover in time. Attempting questions anyway.")
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
    # Skip indexing if already present
    existing = chroma_chunk_count(REPO_ID)
    if existing > 0:
        print(f"numpy_eval already indexed ({existing} chunks). Skipping index step.\n")
    else:
        if not index_repo():
            print("Aborting — indexing failed.")
            sys.exit(1)

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
