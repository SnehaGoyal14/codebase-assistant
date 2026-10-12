import csv
import re
import os
import subprocess
from pathlib import Path

INPUT_FILE = "evaluation/results_hard_ast_v2.csv"
REPORT_FILE = "evaluation/hallucination_report.txt"
FLASK_CLONE = "/tmp/flask_verify"
SEARCH_ROOT = f"{FLASK_CLONE}/src"


def clone_flask():
    if os.path.exists(FLASK_CLONE):
        print(f"Removing existing clone at {FLASK_CLONE}...")
        subprocess.run(["rm", "-rf", FLASK_CLONE], check=True)
    print("Cloning Flask repo...")
    subprocess.run(
        ["git", "clone", "--depth", "1", "https://github.com/pallets/flask.git", FLASK_CLONE],
        check=True,
    )
    print("Clone complete.\n")


def build_corpus(search_root):
    """Read all .py files under search_root into a single concatenated string."""
    corpus = []
    for path in Path(search_root).rglob("*.py"):
        try:
            corpus.append(path.read_text(encoding="utf-8", errors="ignore"))
        except Exception:
            pass
    return "\n".join(corpus)


def extract_bold_terms(text):
    """Return list of unique terms wrapped in **...**."""
    terms = re.findall(r"\*\*(.+?)\*\*", text)
    # Strip inline code markers that sometimes appear inside bold
    terms = [t.strip("`").strip() for t in terms]
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for t in terms:
        if t not in seen:
            seen.add(t)
            unique.append(t)
    return unique


def main():
    clone_flask()
    corpus = build_corpus(SEARCH_ROOT)
    print(f"Corpus built from {SEARCH_ROOT} ({len(corpus):,} chars)\n")

    with open(INPUT_FILE, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    report_lines = []
    total_terms = 0
    total_verified = 0
    total_unverified = 0
    questions_with_unverified = 0

    for row in rows:
        qid = row["id"]
        answer = row["answer"]
        terms = extract_bold_terms(answer)

        if not terms:
            line = f"Q{qid}: no bold terms found"
            print(line)
            report_lines.append(line)
            continue

        verified = [t for t in terms if t in corpus]
        unverified = [t for t in terms if t not in corpus]

        total_terms += len(terms)
        total_verified += len(verified)
        total_unverified += len(unverified)
        if unverified:
            questions_with_unverified += 1

        if unverified:
            line = (
                f"Q{qid}: {len(verified)}/{len(terms)} terms verified, "
                f"{len(unverified)} unverified: {unverified}"
            )
        else:
            line = f"Q{qid}: {len(verified)}/{len(terms)} terms verified ✓"

        print(line)
        report_lines.append(line)

    summary = [
        "",
        "Summary:",
        f"  Total terms checked:                 {total_terms}",
        f"  Verified:                            {total_verified}",
        f"  Unverified (possible hallucinations): {total_unverified}",
        f"  Questions with unverified terms:     {questions_with_unverified}/20",
    ]
    for line in summary:
        print(line)
        report_lines.append(line)

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines) + "\n")

    print(f"\nReport saved to {REPORT_FILE}")


if __name__ == "__main__":
    main()
