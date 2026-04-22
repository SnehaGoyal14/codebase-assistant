import os
import git
import shutil
import sys
from sentence_transformers import SentenceTransformer
import chromadb

# AST import
from chunking.ast_chunker import ast_chunk

model = SentenceTransformer('all-MiniLM-L6-v2')
client = chromadb.PersistentClient(path="chroma_db")


def remove_readonly(func, path, excinfo):
    os.chmod(path, 0o777)
    func(path)


def clone_repo(repo_url, local_path="temp_repo"):
    if os.path.exists(local_path):
        shutil.rmtree(local_path, onerror=remove_readonly)

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


# NAIVE CHUNKER
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

    except Exception:
        return []


# AST CHUNKER
def chunk_file_ast(file_path):
    try:
        chunks = ast_chunk(file_path)
        chunks = [c for c in chunks if len(c.strip()) > 20]
        return chunks
    except Exception as e:
        print(f"Error in AST chunking for {file_path}: {e}")
        return []


def index_repo(repo_url, repo_id, chunking_method='naive'):
    local_path = clone_repo(repo_url)
    code_files = get_code_files(local_path)

    try:
        client.delete_collection(repo_id)
    except:
        pass

    col = client.create_collection(repo_id)
    total_chunks = 0

    for file_path in code_files:

        if chunking_method == 'ast':
            chunks = chunk_file_ast(file_path)
        else:
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

    # FINAL CLEANUP FIX
    shutil.rmtree(local_path, onerror=remove_readonly)

    print(f"\nDone! Total chunks indexed: {total_chunks}")
    return total_chunks


# CLI SUPPORT
if __name__ == "__main__":
    repo_url = sys.argv[1]
    repo_id = sys.argv[2]

    chunking_method = 'naive'
    if len(sys.argv) > 3:
        chunking_method = sys.argv[3]

    print(f"Starting indexing using {chunking_method.upper()} chunking...\n")

    total = index_repo(repo_url, repo_id, chunking_method)

    print(f"\nRepo indexed successfully with {total} chunks!")