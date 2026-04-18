import sys
import csv
from chunking.naive_chunker import naive_chunk
from chunking.ast_chunker import ast_chunk


def is_complete_chunk(chunk):
    """
    More accurate check:
    A chunk is incomplete if:
    - It contains 'def' but is cut abruptly
    - OR likely missing ending of function
    """
    chunk = chunk.strip()

    if "def " not in chunk:
        return "yes"

    # Detect abrupt cut (very common in naive chunking)
    if chunk.endswith("(") or chunk.endswith(":"):
        return "no"

    # If function is large but no return → likely incomplete
    if "return" not in chunk and len(chunk) > 200:
        return "no"

    return "yes"


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m chunking.evaluate_chunking <python_file>")
        return

    filename = sys.argv[1]

    # Read file
    try:
        with open(filename, "r", encoding="utf-8") as file:
            text = file.read()
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found.")
        return

    # Run chunkers
    naive_chunks = naive_chunk(text)
    ast_chunks = ast_chunk(filename)

    rows = []

    # Process naive chunks
    for i, chunk in enumerate(naive_chunks, start=1):
        rows.append([
            "naive",
            i,
            chunk[:100].replace("\n", " "),
            is_complete_chunk(chunk),
            len(naive_chunks)
        ])

    # Process ast chunks
    for i, chunk in enumerate(ast_chunks, start=1):
        rows.append([
            "ast",
            i,
            chunk[:100].replace("\n", " "),
            is_complete_chunk(chunk),
            len(ast_chunks)
        ])

    # Write CSV
    with open("chunking_results.csv", "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        writer.writerow([
            "method",
            "chunk_number",
            "chunk_text",
            "is_complete",
            "total_chunks"
        ])

        writer.writerows(rows)

    print("chunking_results.csv generated successfully!")


if __name__ == "__main__":
    main()