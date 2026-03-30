import asyncio
from langchain_core.messages import SystemMessage, HumanMessage
import os

# Import the RAG vector store and shared LLM utils
from rag.vector_store import retrieve_rules
from mcp_tools.llm_utils import async_llm_call

async def fix_prompt(prompt: str) -> str:
    """
    Improves a given user prompt to adhere to best practices based on our rules.
    Retrieves rules via RAG.
    """
    rules = retrieve_rules(prompt)
    
    system_msg = f"""You are an expert AI Prompt Engineer and Fixer.
Based on the following prompt engineering best practices retrieved from our knowledge base:

{rules}

Rewrite the original prompt provided by the user. Your goal is to:
1. Make it highly structured, engaging, and ultra-clear.
2. Add necessary constraints, roles, or few-shot examples if applicable.
3. Remove any ambiguity or passive phrasing.

Do not include any pleasantries, conversational text, or explanations. 
ONLY output the improved prompt itself.
"""
    
    messages = [
        SystemMessage(content=system_msg),
        HumanMessage(content=f"Original Prompt:\n{prompt}")
    ]
    
    return await async_llm_call(messages)
