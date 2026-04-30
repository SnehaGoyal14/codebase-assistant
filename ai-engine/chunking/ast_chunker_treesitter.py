from tree_sitter import Language, Parser
import os
import argparse
import json

# ===== BUILD / LOAD LANGUAGE =====
LIB_PATH = "build/my-languages.so"

if not os.path.exists(LIB_PATH):
    Language.build_library(
        LIB_PATH,
        ["tree-sitter-python"]
    )

PY_LANGUAGE = Language(LIB_PATH, "python")


def ast_chunk_treesitter(file_path, with_meta=False):
    """
    Tree-sitter based chunking:
    - Extracts full functions/classes (incl. nested)
    - Optionally returns metadata
    """

    with open(file_path, "rb") as f:
        source = f.read()

    parser = Parser()
    parser.set_language(PY_LANGUAGE)

    tree = parser.parse(source)
    root = tree.root_node

    chunks = []
    seen_ranges = set()  # avoid duplicates

    def extract(node, depth=0):
        if node.type in ["function_definition", "class_definition"]:
            start, end = node.start_byte, node.end_byte

            # avoid duplicates
            if (start, end) not in seen_ranges:
                seen_ranges.add((start, end))

                code = source[start:end].decode("utf-8")

                # extract name if possible
                name = None
                for child in node.children:
                    if child.type == "identifier":
                        name = source[child.start_byte:child.end_byte].decode("utf-8")
                        break

                if with_meta:
                    chunks.append({
                        "type": node.type,
                        "name": name,
                        "start_line": node.start_point[0] + 1,
                        "end_line": node.end_point[0] + 1,
                        "depth": depth,
                        "code": code
                    })
                else:
                    chunks.append(code)

        for child in node.children:
            extract(child, depth + 1)

    extract(root)
    return chunks


# ===== OPTIONAL CLI (makes your work visible) =====
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tree-sitter AST Chunker")
    parser.add_argument("file", help="Python file path")
    parser.add_argument("--preview", action="store_true", help="Show first 2 chunks")
    parser.add_argument("--json", action="store_true", help="Output with metadata")

    args = parser.parse_args()

    result = ast_chunk_treesitter(args.file, with_meta=args.json)

    print(f"\nTotal chunks: {len(result)}")

    if args.preview:
        print("\n--- Preview ---\n")
        for chunk in result[:2]:
            if isinstance(chunk, dict):
                print(chunk["code"][:300])
            else:
                print(chunk[:300])
            print("\n" + "-" * 50)

    if args.json:
        with open("chunking/tree_sitter_chunks.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        print("\nSaved metadata to chunking/tree_sitter_chunks.json")