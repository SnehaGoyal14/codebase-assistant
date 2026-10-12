# Codebase Assistant

An AI-powered developer onboarding tool that helps developers understand unfamiliar codebases through natural language Q&A, dependency visualization, and automated onboarding guides.

## What it does

- **Chat** — Ask plain-English questions about any indexed GitHub repository and get structured answers with Mermaid architecture diagrams and source file citations
- **Onboarding Guide** — Auto-generate a structured guide covering entry points, key components, and mental models for any codebase
- **Dependency Graph** — Interactive force-directed graph showing file-level import relationships, with click-to-explore and search

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| AI Engine | Python 3.11, FastAPI, ChromaDB, GPT-4o mini, all-MiniLM-L6-v2, Tree-sitter |
| Backend | Node.js, Express.js, PostgreSQL, JWT |
| Frontend | Next.js 16, React, Tailwind CSS, Mermaid.js, react-force-graph-2d |

## Supported Languages

Python, JavaScript/TypeScript, Java, C/C++, Go, Ruby, Rust

## Project Structure

codebase-assistant/
├── ai-engine/          # FastAPI server, RAG pipeline, evaluation
│   ├── rag/            # Indexer, retriever, LLM, graph, guide modules
│   ├── chunking/       # Naive and AST chunking implementations
│   └── evaluation/     # Evaluation scripts and results CSVs
├── backend/            # Node.js/Express REST API
│   ├── db/             # PostgreSQL schema and connection
│   ├── middleware/      # JWT authentication
│   └── routes/         # Auth and repo endpoints
└── frontend/           # Next.js web application
    └── app/            # Pages: login, dashboard, chat, guide, graph

## Getting Started

### Prerequisites
- Python 3.11
- Node.js 18+
- PostgreSQL 15
- OpenAI API key

### 1. AI Engine

cd ai-engine
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

Create a .env file:
OPENAI_API_KEY=your_key_here

Start the server:
python3.11 -m uvicorn main:app --reload

### 2. Backend

cd backend
npm install

Create a .env file:
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=codebase_assistant
DB_USER=your_mac_username
DB_PASSWORD=
JWT_SECRET=your_secret_key
FASTAPI_URL=http://127.0.0.1:8000

Set up the database:
createdb codebase_assistant
psql -d codebase_assistant -f db/schema.sql

Start the server:
node server.js

### 3. Frontend

cd frontend
npm install
npm run dev

Open http://localhost:3000

## Evaluation Results

| Configuration | Accuracy | Hallucination Rate |
|--------------|----------|--------------------|
| Baseline (keyword search) | 42.5% | — |
| GPT-4o mini + naive chunking | 85.0% | — |
| GPT-4o mini + AST chunking | 87.5% | 30% |
| GPT-4o mini + AST chunking + source grounding (n=15) | 92.5% | 15% |

Evaluated on 20 hard questions against the Flask codebase (1,723 chunks).
AST chunking reduces chunk count by 61.67% compared to naive chunking.

## Team

- **Sneha** — Project lead, AI engine, frontend
- **Shaivy** — JWT middleware, auth endpoints
- **Shreyansh** — Repo endpoints, evaluation

## Academic Context

This project is developed as a research system complementary to CodeMap (Gao et al., ICPC 2026). CodeMap provides visual business component mapping; Codebase Assistant provides conversational Q&A with RAG-based retrieval.
