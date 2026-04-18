import sys

def ast_chunk(filename):
    with open(filename, "r", encoding="utf-8") as file:
        lines = file.readlines()

    chunks = []
    current_chunk = []

    for line in lines:
        if line.startswith("def ") or line.startswith("class "):
            if current_chunk:
                chunks.append("".join(current_chunk))
                current_chunk = []

        current_chunk.append(line)

    if current_chunk:
        chunks.append("".join(current_chunk))

    return chunks


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ast_chunker.py <file>")
        sys.exit(1)

    chunks = ast_chunk(sys.argv[1])

    for i, chunk in enumerate(chunks, start=1):
        print(f"\nChunk {i}:")
        print(chunk)
        print("-" * 50)