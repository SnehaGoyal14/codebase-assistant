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

    for i, chunk in enumerate(chunks, start=1):
        print(f"\nChunk {i}:")
        print(chunk)
        print("-" * 50)


ast_chunk(sys.argv[1])