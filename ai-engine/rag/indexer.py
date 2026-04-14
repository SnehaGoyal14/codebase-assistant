import os
import git
import shutil
from sentence_transformers import SentenceTransformer
import chromadb

model = SentenceTransformer('all-MiniLM-L6-v2')
client = chromadb.PersistentClient(path="chroma_db")

def clone_repo(repo_url, local_path="temp_repo"):
    if os.path.exists(local_path):
        shutil.rmtree(local_path)
    print(f"Cloning {repo_url}...")
    git.Repo.clone_from(repo_url, local_path)
    print("Cloning done!")
    return local_path

def get_code_files(repo_path):
    code_files = []
    extensions = ['.py', '.js', '.ts', '.java']
    skip_folders = ['node_modules', '.git', 'venv', '__pycache__']
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in skip_folders]
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                code_files.append(os.path.join(root, file))
    print(f"Found {len(code_files)} code files")
    return code_files

def chunk_file(file_path, chunk_size=400, overlap=50):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
        if len(text) < 50:
            return []
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - overlap
        return chunks
    except Exception as e:
        return []

def index_repo(repo_url, repo_id):
    local_path = clone_repo(repo_url)
    code_files = get_code_files(local_path)
    try:
        client.delete_collection(repo_id)
    except:
        pass
    col = client.create_collection(repo_id)
    total_chunks = 0
    for file_path in code_files:
        chunks = chunk_file(file_path)
        if not chunks:
            continue
        relative_path = file_path.replace(local_path, '')
        for i, chunk in enumerate(chunks):
            embedding = model.encode(chunk).tolist()
            chunk_id = f"{repo_id}_{total_chunks}"
            col.add(
                documents=[chunk],
                embeddings=[embedding],
                ids=[chunk_id],
                metadatas=[{"file": relative_path, "chunk": i}]
            )
            total_chunks += 1
        print(f"Indexed {relative_path} — {len(chunks)} chunks")
    shutil.rmtree(local_path)
    print(f"\nDone! Total chunks indexed: {total_chunks}")
    return total_chunks

if __name__ == "__main__":
    repo_url = "https://github.com/pallets/flask"
    repo_id = "flask_test"
    print("Starting indexer test on Flask repo...")
    total = index_repo(repo_url, repo_id)
    print(f"\nFlask repo indexed successfully with {total} chunks!")
    print("Your indexer works on real GitHub repos!")
