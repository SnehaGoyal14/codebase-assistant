from openai import OpenAI
import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')
client = chromadb.PersistentClient(path="chroma_db")

def generate_guide(repo_id, api_key):
    col = client.get_collection(repo_id)
    
    questions = [
        "what is the entry point of this project",
        "what are the main modules and components",
        "how does the application start up",
        "what are the key files a new developer should read",
        "what does this project do"
    ]
    
    all_chunks = []
    for question in questions:
        q_emb = model.encode([question]).tolist()
        results = col.query(query_embeddings=q_emb, n_results=3)
        all_chunks.extend(results['documents'][0])
    
    unique_chunks = list(dict.fromkeys(all_chunks))[:10]
    chunks_text = "\n\n---\n\n".join(unique_chunks)
    
    openai_client = OpenAI(api_key=api_key)
    
    prompt = f"""You are a senior developer creating an onboarding guide for a new developer joining a project.

Based on these code snippets from the repository, create a structured onboarding guide.

Code snippets:
{chunks_text}

Write a clear onboarding guide with these sections:
1. What this project does (2-3 sentences)
2. Entry point (which file to start reading)
3. Main components (list the key modules)
4. How the application works (brief flow)
5. First 5 files a new developer should read (in order)
6. Key concepts to understand

Keep it concise and practical. Write for a developer who is new to this codebase."""

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000
    )
    
    return response.choices[0].message.content
