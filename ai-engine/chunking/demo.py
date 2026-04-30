from chunking.ast_chunker import ast_chunk
from chunking.ast_chunker_treesitter import ast_chunk_treesitter

file_path = "rag/indexer.py"

old = ast_chunk(file_path)
new = ast_chunk_treesitter(file_path)

print("\n===== DEMO: NAIVE vs TREE-SITTER =====\n")
print(f"Old AST chunks: {len(old)}")
print(f"Tree-sitter chunks: {len(new)}")

print("\n--- Old AST Sample ---\n")
print(old[0][:300])

print("\n--- Tree-sitter Sample ---\n")
print(new[0][:300])

print("\nObservation:")
print("Tree-sitter preserves full function structure, naive chunking may break it.")