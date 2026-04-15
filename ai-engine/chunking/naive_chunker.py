import sys

def naive_chunk(text, chunk_size=400, overlap=50):
    chunks = []
    start = 0
    chunk_number = 1

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)

        print(f"\nChunk {chunk_number}:")
        print(chunk)
        print("-" * 50)

        start += chunk_size - overlap
        chunk_number += 1

    return chunks


with open(sys.argv[1], "r", encoding="utf-8") as file:
    text = file.read()

naive_chunk(text)