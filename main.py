from fastapi import FastAPI, HTTPException
import traceback
import asyncio
from pydantic import BaseModel
from fastmcp import FastMCP
from dotenv import load_dotenv

import os

load_dotenv()

# We need to make sure API keys are available before initializing
from mcp_tools.score_prompt import score_prompt
from mcp_tools.fix_prompt import fix_prompt
from mcp_tools.generate_examples import generate_examples
from mcp_tools.autocomplete_prompt import autocomplete_prompt
from rag.vector_store import get_vector_store

# Force initialization of Chroma DB on startup
try:
    get_vector_store()
except Exception as e:
    print(f"Failed to initialize Vector Store: {e}")

# FastAPI API for HTTP requests
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Prompt Debugger API", description="An API to analyze, score, and fix AI Prompts.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FastMCP Server for MCP Clients
mcp = FastMCP("PromptDebugger")

# Register tools with MCP
mcp.add_tool(score_prompt)
mcp.add_tool(fix_prompt)
mcp.add_tool(generate_examples)
mcp.add_tool(autocomplete_prompt)

class PromptRequest(BaseModel):
    prompt: str

@app.post("/debug-prompt")
async def debug_prompt_endpoint(req: PromptRequest):
    """
    HTTP endpoint that tests the prompt debugger logic by combining the results 
    of the 3 MCP tools concurrently using asyncio.gather.
    """
    try:
        prompt_text = req.prompt
        
        # Run all 3 MCP tools concurrently
        # 1. Score the prompt (now includes Type Detection and Visual Bars)
        # 2. Fix the prompt
        # 3. Generate examples
        score_task = score_prompt(prompt_text)
        fix_task = fix_prompt(prompt_text)
        example_task = generate_examples(prompt_text)
        
        score_report, improved, examples = await asyncio.gather(
            score_task, fix_task, example_task
        )
        
        return {
            "original_prompt": prompt_text,
            "score_report": score_report,
            "improved_prompt": improved,
            "examples": examples
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/autocomplete-prompt")
async def autocomplete_prompt_endpoint(req: PromptRequest):
    """
    HTTP endpoint that provides real-time prompt suggestions using Ollama.
    """
    try:
        suggestion = await autocomplete_prompt(req.prompt)
        return {"suggestion": suggestion}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# To run both, usually you run FastAPI via uvicorn. 
# You can run FastMCP by running this file directly with standard input/output.
if __name__ == "__main__":
    import sys
    # If run directly without arguments, fallback to MCP server over stdio
    # This allows it to be used as an MCP tool directly in Cursor/Claude
    mcp.run()
