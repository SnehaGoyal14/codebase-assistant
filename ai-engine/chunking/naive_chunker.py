import sys

def naive_chunk(filename, chunk_size=400, overlap=50):
    """
    Splits a file into overlapping chunks based on character count
    """
    with open(filename, "r", encoding="utf-8") as file:
        text = file.read()

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python naive_chunker.py <file>")
        sys.exit(1)

    filename = sys.argv[1]
    chunks = naive_chunk(filename)

    for i, chunk in enumerate(chunks, start=1):
        print(f"\nChunk {i}:")
        print(chunk)
        print("-" * 50)