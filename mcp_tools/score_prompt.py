import asyncio
from langchain_core.messages import SystemMessage, HumanMessage
import os

# Import the RAG vector store and shared LLM utils
from rag.vector_store import retrieve_rules
from mcp_tools.llm_utils import async_llm_call

async def score_prompt(prompt: str) -> str:
    """
    Evaluates a user prompt based on prompt engineering best practices.
    Retrieves rules via RAG and uses an LLM to score the prompt from 1-10,
    listing any issues detected and identifying the prompt type.
    """
    rules = retrieve_rules(prompt)
    
    system_msg = f"""You are an expert AI Prompt Engineer.
Analyze the user's prompt based on the following best practices retrieved from our knowledge base:

{rules}

Your task is to:
1. Detect the Prompt Type (Educational, Coding, Creative, Analytical, Instructional).
2. Provide a Quality Score (1-10).
3. Provide a visual breakdown for Clarity, Context, and Structure using the following format:
   Clarity:     ████████░░ 80%
   Context:     ████░░░░░░ 40%
   Structure:   ██████░░░░ 60%
4. List specific Issues detected or Strengths.

Format your response exactly like this:

Prompt Type: [Type]
Prompt Quality Score: X/10

Clarity:     [Visual Bar] [Percentage]
Context:     [Visual Bar] [Percentage]
Structure:   [Visual Bar] [Percentage]

Issues detected:
- Issue 1
- Issue 2
(or "Strengths:" if excellent)
"""
    
    messages = [
        SystemMessage(content=system_msg),
        HumanMessage(content=f"Analyze this prompt:\n{prompt}")
    ]
    
    return await async_llm_call(messages)
