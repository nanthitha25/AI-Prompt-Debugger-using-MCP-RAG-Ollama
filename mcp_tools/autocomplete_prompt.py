import asyncio
from langchain_core.messages import SystemMessage, HumanMessage
from mcp_tools.llm_utils import async_llm_call

async def autocomplete_prompt(partial_prompt: str) -> str:
    """
    Given a partial user prompt, suggests a complete, high-quality version 
    based on prompt engineering best practices.
    """
    if not partial_prompt.strip():
        return ""

    system_msg = """You are an AI Prompt Completion Assistant.
Your goal is to take a partial or weak user prompt and suggest a single, HIGH-QUALITY completion that follows best practices (clarity, context, persona, constraints).

Rules:
1. Provide ONLY ONE suggestion.
2. Keep it concise but effective.
3. If the user input is already good, refine it slightly.
4. Do NOT include any introductory text, just the suggested prompt.

Example:
Input: "Explain ML"
Output: "Explain machine learning to a non-technical audience using three simple real-world analogies."
"""
    
    messages = [
        SystemMessage(content=system_msg),
        HumanMessage(content=f"Suggest a completion for this partial prompt: '{partial_prompt}'")
    ]
    
    # Use a faster, low-temperature call for suggestions
    return await async_llm_call(messages)
