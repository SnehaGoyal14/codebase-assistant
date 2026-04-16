import sys

def naive_chunk(text, chunk_size=400, overlap=50):
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


with open(sys.argv[1], "r", encoding="utf-8") as file:
    text = file.read()

chunks = naive_chunk(text)

for i, chunk in enumerate(chunks, start=1):
    print(f"\nChunk {i}:")
    print(chunk)
    print("-" * 50)