# Backend — Codebase Assistant

Node.js/Express REST API that sits between the frontend and the AI engine.

## Endpoints

### Auth
- POST /auth/signup — Register a new user
- POST /auth/login — Login and receive a JWT token

### Repos (all require Authorization: Bearer <token>)
- GET /repos — List all indexed repos for the current user
- POST /repos/index — Index a new GitHub repository
- POST /repos/ask — Ask a question about an indexed repo
- POST /repos/guide — Generate an onboarding guide
- POST /repos/graph — Build a dependency graph
- GET /repos/history/:repo_id — Get conversation history
- DELETE /repos/:repo_id — Delete a repo and its conversations

## Setup

See the root README.md for full setup instructions.

## Stack
- Express.js
- PostgreSQL (via pg)
- JWT authentication (jsonwebtoken)
- bcrypt for password hashing
- axios for FastAPI communication
