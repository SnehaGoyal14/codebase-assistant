import sys
from naive_chunker import naive_chunk
from ast_chunker import ast_chunk


def detect_mid_function_cut(chunks):
    for chunk in chunks:
        if "def " in chunk and not chunk.strip().endswith(":") and len(chunk) >= 400:
            return True
    return False


filename = sys.argv[1]

# Read file
with open(filename, "r", encoding="utf-8") as file:
    text = file.read()

# Run chunkers
naive_chunks = naive_chunk(text)
ast_chunks = ast_chunk(filename)

print("\n===== COMPARISON REPORT =====")
print(f"Naive Chunk Count: {len(naive_chunks)}")
print(f"AST Chunk Count: {len(ast_chunks)}")
print(f"Naive cut mid-function? {'YES' if detect_mid_function_cut(naive_chunks) else 'NO'}")

print("\n===== SIDE BY SIDE: CHUNK 1 =====")

print("\n--- NAIVE CHUNK 1 ---")
print(naive_chunks[0])

print("\n--- AST CHUNK 1 ---")
print(ast_chunks[0])