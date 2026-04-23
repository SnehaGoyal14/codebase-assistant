# AI Engine — Codebase Onboarding Assistant

The AI engine powers the core intelligence of the Codebase Onboarding Assistant. It indexes any GitHub repository, enables semantic search over code, and generates plain English answers to developer questions using GPT-4o mini.

---

## What it does

A new developer pastes a GitHub repo URL. The system clones it, reads every code file, splits it into chunks, converts them to meaning-vectors, and stores them in ChromaDB. When the developer asks a question like "how does routing work?", the system finds the 5 most relevant code chunks and sends them to GPT-4o mini which returns a plain English explanation with source citations.

---

## Setup

**Requirements:**
- Python 3.11
- OpenAI API key

**Install:**
```bash
python3.11 -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows
pip install -r requirements.txt
```

**Configure:**
```bash
echo "OPENAI_API_KEY=your-key-here" > .env
```

**Run the server:**
```bash
python3.11 -m uvicorn main:app --reload
```

Server runs at: http://127.0.0.1:8000

API docs at: http://127.0.0.1:8000/docs

---

## API Endpoints

### POST /index
Index a GitHub repository.
```json
Request:  { "repo_url": "https://github.com/pallets/flask", "repo_id": "flask" }
Response: { "status": "done", "chunks": 1724 }
```

### GET /status/{repo_id}
Check if a repository is indexed.
```json
Response: { "status": "ready", "chunks": 1724 }
```

### POST /ask
Ask a question about an indexed repository.
```json
Request:  { "repo_id": "flask", "question": "how does routing work?" }
Response: { "question": "...", "answer": "...", "sources": ["file1.py", "file2.py"] }
```

### POST /guide
Generate an onboarding guide for an indexed repository.
```json
Request:  { "repo_id": "flask" }
Response: { "repo_id": "flask", "guide": "# Onboarding Guide..." }
```

---

## Project Structure
ai-engine/
├── chunking/
│   ├── naive_chunker.py      # Splits code every 400 characters
│   ├── ast_chunker.py        # Splits at function/class boundaries
│   ├── compare.py            # Compares both chunking methods
│   └── evaluate_chunking.py  # Generates chunking comparison data
├── evaluation/
│   ├── questions.json        # 20 test questions for Flask repo
│   ├── evaluate.py           # Runs evaluation and scores answers
│   └── results.csv           # Evaluation results with scores
├── rag/
│   ├── indexer.py            # Clones repo and indexes code chunks
│   ├── retriever.py          # Searches ChromaDB by meaning
│   ├── llm.py                # Calls GPT-4o mini to generate answers
│   └── guide.py              # Generates onboarding guides
├── main.py                   # FastAPI server
└── test_rag.py               # Week 1 proof of concept
---

## Tech Stack

| Component | Technology | Cost |
|---|---|---|
| Vector database | ChromaDB | Free |
| Embeddings | sentence-transformers all-MiniLM-L6-v2 | Free |
| LLM | GPT-4o mini | ~$2 total |
| Server | FastAPI + Uvicorn | Free |
| Repo cloning | GitPython | Free |

Total evaluation cost: under $2. This addresses CodeMap's limitation of requiring hundreds of dollars of proprietary OpenAI infrastructure.

---

## Research Context

This AI engine is built as part of a final year research project addressing limitations of CodeMap (Gao et al., ICPC 2026). Specifically:

- **Limitation 1**: CodeMap uses expensive proprietary OpenAI infrastructure → We use ChromaDB + sentence-transformers + GPT-4o mini at under $2 total
- **Limitation 2**: CodeMap never evaluated chunking strategy → We compare naive vs AST chunking (Paper 1)
- **Limitation 3**: CodeMap never measured onboarding time → We run a controlled user study (Paper 2)
- **Limitation 4**: CodeMap breaks on large repos (27% accuracy) → Our retrieval approach maintains consistent accuracy regardless of repo size

---

## Team

- **Sneha Goyal** — AI engine, RAG pipeline, FastAPI server
- **Shreyansh** — Evaluation framework, question design, scoring
- **Shaivy** — Chunking strategies, AST vs naive comparison
