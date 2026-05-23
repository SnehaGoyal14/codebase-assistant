# AI Engine — Codebase Onboarding Assistant

An AI-powered system that helps new developers understand unfamiliar codebases quickly. Paste any GitHub repository URL and ask questions about the code in plain English.

---

## What it does

A developer pastes a GitHub repo URL. The system clones it, reads every code file, splits it into chunks using Tree-sitter AST-based chunking, converts them to meaning-vectors using sentence-transformers, and stores them in ChromaDB. When the developer asks a question like "how does routing work?", the system retrieves the 10 most relevant code chunks and sends them to GPT-4o mini which returns a detailed plain English answer with source file citations. The system also auto-generates onboarding guides and dependency graphs showing which files import which files.

---

## Research Context

This system directly addresses 4 limitations of the state-of-the-art paper CodeMap (Gao et al., ICPC 2026):

| Limitation | CodeMap | Our System |
|---|---|---|
| Cost | Hundreds of dollars | Under $2 total |
| Chunking evaluation | Never done | 61.67% chunk reduction proven |
| Large repo accuracy | 27% | 82.5-90% |
| Multi-repo testing | Limited | 5 repos tested |

---

## Results

### Phase 1 — General Questions

| Condition | Accuracy | Improvement |
|---|---|---|
| Baseline (no GPT) | 42.5% | baseline |
| GPT-4o mini + naive chunking | 85% | +42.5% |
| GPT-4o mini + AST chunking | 90% | +47.5% |

### Phase 2 — Hard Repo-Specific Questions

| Condition | Accuracy | Hallucination Rate |
|---|---|---|
| GPT-4o mini + AST chunking | 82.5% | 30% |

### Chunking Analysis

| Method | Total Chunks | Incomplete % |
|---|---|---|
| Naive chunking | 1727 | 24.55% |
| AST chunking | 662 | 22.21% |
| Chunk reduction | 61.67% | — |

### Multi-Repo Testing

| Repository | Chunks | Category |
|---|---|---|
| Flask | 1724 | Web framework |
| Requests | 1091 | HTTP library |
| Click | 2240 | CLI library |
| Jinja | 2232 | Template engine |
| Werkzeug | 3453 | WSGI library |

---

## Setup

**Requirements:**
- Python 3.11
- OpenAI API key

**Install:**

```bash
python3.11 -m venv venv
source venv/bin/activate
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

### POST /graph
Return dependency graph data for an indexed repository.
```json
Request:  { "repo_url": "https://github.com/pallets/flask", "repo_id": "flask" }
Response: { "repo_id": "flask", "graph": { "nodes": [...], "edges": [...], "total_files": 83, "total_connections": 330 } }
```

---

## Project Structure

    ai-engine/
    ├── chunking/
    │   ├── naive_chunker.py           Splits code every 400 characters
    │   ├── ast_chunker.py             Splits at function/class boundaries
    │   ├── ast_chunker_treesitter.py  Tree-sitter based chunking
    │   ├── compare.py                 Compares both chunking methods
    │   ├── evaluate_chunking.py       Generates chunking comparison data
    │   ├── analysis.py                Analyses chunking results
    │   ├── analysis_report.txt        Full chunking analysis report
    │   └── demo.py                    Side by side chunking demo
    ├── evaluation/
    │   ├── questions.json             20 general Flask questions
    │   ├── questions_hard.json        20 hard repo-specific questions
    │   ├── evaluate.py                Phase 1 evaluation script
    │   ├── evaluate_hard.py           Phase 2 evaluation script
    │   ├── results.csv                Baseline results (42.5%)
    │   ├── results_ast.csv            Phase 1 AST results (90%)
    │   └── results_hard_ast.csv       Phase 2 hard results (82.5%)
    ├── rag/
    │   ├── indexer.py                 Clones repo and indexes code chunks
    │   ├── retriever.py               Searches ChromaDB by meaning
    │   ├── llm.py                     Calls GPT-4o mini to generate answers
    │   ├── guide.py                   Generates onboarding guides
    │   └── graph.py                   Returns dependency graph data
    ├── main.py                        FastAPI server with 6 endpoints
    └── requirements.txt               Python dependencies

---

## Tech Stack

| Component | Technology | Cost |
|---|---|---|
| Vector database | ChromaDB | Free |
| Embeddings | sentence-transformers all-MiniLM-L6-v2 | Free |
| LLM | GPT-4o mini | ~$2 total |
| Server | FastAPI + Uvicorn | Free |
| Repo cloning | GitPython | Free |
| AST chunking | Tree-sitter | Free |

Total cost: under $2. This is 50-100x cheaper than CodeMap's proprietary infrastructure.
