import sys
from chunking.naive_chunker import naive_chunk
from chunking.ast_chunker import ast_chunk


def detect_mid_function_cut(chunks):
    """
    Detect if any chunk likely cuts a function in the middle.
    Simple heuristic: chunk contains 'def ' but does not end cleanly.
    """
    for chunk in chunks:
        if "def " in chunk and not chunk.strip().endswith(")"):
            return True
    return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python chunking/compare.py <python_file>")
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

    print("\n===== COMPARISON REPORT =====")
    print(f"Naive Chunk Count: {len(naive_chunks)}")
    print(f"AST Chunk Count: {len(ast_chunks)}")
    print(f"Naive cut mid-function? {'YES' if detect_mid_function_cut(naive_chunks) else 'NO'}")

    print("\n===== SIDE BY SIDE: CHUNK 1 =====")

    if naive_chunks:
        print("\n--- NAIVE CHUNK 1 ---")
        print(naive_chunks[0])
    else:
        print("\n--- NAIVE CHUNK 1 ---")
        print("No chunks")

    if ast_chunks:
        print("\n--- AST CHUNK 1 ---")
        print(ast_chunks[0])
    else:
        print("\n--- AST CHUNK 1 ---")
        print("No chunks")


if __name__ == "__main__":
    main()