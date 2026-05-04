# AI Prompt Debugger (Local MCP + RAG + Ollama) 🚀

A high-performance, local AI Prompt Engineering assistant that uses **RAG (Retrieval Augmented Generation)** and **MCP (Model Context Protocol)** to analyze, score, and improve your prompts. 

This version runs **fully locally** using **Ollama (Llama 3.1)** - no API keys, no monthly costs, and 100% privacy.

---

## ✨ Features
- **Local AI Analysis**: Uses Llama 3.1 via Ollama for deep prompt analysis.
- **MCP Tool Suite**: 4 core tools for scoring, fixing, examples, and auto-completion.
- **RAG Engine**: Powered by ChromaDB with vector embeddings to use prompt engineering best practices.
- **Real-time Autocomplete**: AI suggests prompt improvements as you type.
- **Modern UI**: Dark-mode glassmorphism dashboard built with React.

---

## 🏗️ Architecture
- **Backend**: FastAPI (Python) + LangChain
- **LLM**: Ollama (Llama 3.1)
- **Database**: ChromaDB (Vector Store)
- **Frontend**: React (Vite) + Lucide Icons
- **Tooling**: Model Context Protocol (MCP)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Ollama**: [Download here](https://ollama.com/)
- **Node.js & Python**: (v18+ and v3.9+ respectively)

### 2. Set Up LLM
Pull the required model:
```bash
ollama serve
ollama pull llama3.1
```

### 3. Backend Setup
```bash
git clone https://github.com/nanthitha25/AI-Prompt-Debugger-using-MCP-RAG-Ollama.git
cd AI-Prompt-Debugger-using-MCP-RAG-Ollama
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to start debugging your prompts!

---

## 🛠️ MCP Tools Included
- `score_prompt`: Detailed analysis of clarity, context, and structure.
- `fix_prompt`: Automatically rewrites prompts for better accuracy.
- `generate_examples`: Creates 3 distinct templates for different audiences.
- `autocomplete_prompt`: Real-time suggestion engine for the frontend.

---

