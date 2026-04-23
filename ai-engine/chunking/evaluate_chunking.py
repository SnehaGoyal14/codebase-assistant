import sys
import os
import csv
from chunking.naive_chunker import naive_chunk
from chunking.ast_chunker import ast_chunk


def is_complete_chunk(chunk):
    chunk = chunk.strip()

    if "def " not in chunk:
        return "yes"

    if chunk.endswith("(") or chunk.endswith(":"):
        return "no"

    if "return" not in chunk and len(chunk) > 200:
        return "no"

    return "yes"


def process_file(file_path, writer):
    try:
        naive_chunks = naive_chunk(file_path)
        ast_chunks = ast_chunk(file_path)

        naive_incomplete = 0
        ast_incomplete = 0

        # NAIVE
        for i, chunk in enumerate(naive_chunks, start=1):
            status = is_complete_chunk(chunk)
            if status == "no":
                naive_incomplete += 1

            writer.writerow([
                "naive",
                i,
                chunk[:100].replace("\n", " "),
                status,
                len(naive_chunks)
            ])

        # AST
        for i, chunk in enumerate(ast_chunks, start=1):
            status = is_complete_chunk(chunk)
            if status == "no":
                ast_incomplete += 1

            writer.writerow([
                "ast",
                i,
                chunk[:100].replace("\n", " "),
                status,
                len(ast_chunks)
            ])

        # 🔥 PER-FILE SUMMARY (VISIBLE IMPACT)
        if len(naive_chunks) > 0:
            reduction = round((1 - len(ast_chunks) / len(naive_chunks)) * 100, 2)
        else:
            reduction = 0

        print(
            f"Processed: {os.path.basename(file_path)} | "
            f"naive: {len(naive_chunks)} | ast: {len(ast_chunks)} | "
            f"reduction: {reduction}% | "
            f"naive_incomplete: {naive_incomplete} | ast_incomplete: {ast_incomplete}"
        )

    except Exception as e:
        print(f"Skipped {file_path}: {e}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m chunking.evaluate_chunking <repo_folder>")
        return

    repo_path = sys.argv[1]

    output_file = "chunking/chunking_results.csv"

    with open(output_file, "w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        writer.writerow([
            "method",
            "chunk_number",
            "chunk_text",
            "is_complete",
            "total_chunks"
        ])

        for root, _, files in os.walk(repo_path):
            for file in files:
                if file.endswith(".py"):
                    file_path = os.path.join(root, file)
                    process_file(file_path, writer)

    print("\nchunking_results.csv generated successfully!")


if __name__ == "__main__":
    main()