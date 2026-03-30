import asyncio
from langchain_core.messages import SystemMessage, HumanMessage
import os

# Import the RAG vector store and shared LLM utils
from rag.vector_store import retrieve_rules
from mcp_tools.llm_utils import async_llm_call

async def generate_examples(topic: str) -> str:
    """
    Generates high-quality prompt templates/examples for a given topic.
    Extracts patterns from best practices via RAG.
    """
    rules = retrieve_rules(topic)
    
    system_msg = f"""You are an expert AI Prompt Template Creator.
Using the following guidelines retrieved from our prompt engineering knowledge base:

{rules}

Generate 3 high-quality, distinct prompt examples for the topic provided by the user. 
Format as a numbered list with a brief title for each template.
Make them robust, complex, and professional.
"""
    
    messages = [
        SystemMessage(content=system_msg),
        HumanMessage(content=f"Topic:\n{topic}")
    ]
    
    return await async_llm_call(messages)
