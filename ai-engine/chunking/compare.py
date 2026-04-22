import sys
from chunking.naive_chunker import naive_chunk
from chunking.ast_chunker import ast_chunk


def is_cut_chunk(chunk):
    """
    Simple check:
    If a chunk contains 'def' but looks incomplete → it's cut
    """
    chunk = chunk.strip()

    if "def " not in chunk:
        return False

    # If it ends abruptly
    if not chunk.endswith("\n") or chunk.endswith(":"):
        return True

    return False


def compare(file_path):
    naive_chunks = naive_chunk(file_path)
    ast_chunks = ast_chunk(file_path)

    naive_count = len(naive_chunks)
    ast_count = len(ast_chunks)

    # Check naive chunk issues
    naive_cut = any(is_cut_chunk(chunk) for chunk in naive_chunks)

    # 🔥 FINAL FIX: detect real functions (not strings)
    has_function = any(
        line.strip().startswith("def ")
        for chunk in ast_chunks
        for line in chunk.split("\n")
    )

    if has_function:
        ast_complete = not any(is_cut_chunk(chunk) for chunk in ast_chunks)
    else:
        ast_complete = True  # no real functions → nothing to break

    print("\n===== COMPARISON REPORT =====\n")

    print(f"Naive Chunk Count: {naive_count}")
    print(f"AST Chunk Count: {ast_count}")

    # % reduction
    if naive_count > 0:
        reduction = round((1 - ast_count / naive_count) * 100, 2)
        print(f"Chunk reduction: {reduction}%")

    # Clear wording
    print(f"Naive chunking breaks functions? {'YES' if naive_cut else 'NO'}")
    print(f"AST chunking preserves functions? {'YES' if ast_complete else 'NO'}")

    # Clean comparison
    print("\n===== CHUNK 1 COMPARISON =====")

    print("\n[NAIVE CHUNK 1]")
    print(naive_chunks[0][:300] if naive_chunks else "No chunk")

    print("\n[AST CHUNK 1]")
    print(ast_chunks[0][:300] if ast_chunks else "No chunk")


if __name__ == "__main__":
    compare(sys.argv[1])