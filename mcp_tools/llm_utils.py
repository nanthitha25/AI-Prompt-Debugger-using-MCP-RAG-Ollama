import os
import time
import asyncio
import logging
from langchain_ollama import ChatOllama
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("llm_utils")

# Shared semaphore to manage local CPU/GPU load (limit to 1 concurrent call)
semaphore = asyncio.Semaphore(1)

def get_llm():
    """Returns a configured local Ollama Llama 3.1 model."""
    return ChatOllama(
        model="llama3.1",
        temperature=0.3,
    )

async def async_llm_call(messages, retries=5):
    """
    Executes an LLM call asynchronously with exponential backoff and concurrency control.
    """
    llm = get_llm()
    delay = 2
    
    async with semaphore:
        for attempt in range(retries):
            try:
                logger.info(f"Calling Gemini model (Attempt {attempt + 1})")
                response = await llm.ainvoke(messages)
                return response.content
            except Exception as e:
                if attempt == retries - 1:
                    logger.error(f"Final attempt failed: {e}")
                    raise e
                
                logger.warning(f"Retry {attempt + 1} after {delay}s due to error: {e}")
                await asyncio.sleep(delay)
                delay *= 2
    
    return ""

def safe_llm_call(messages, retries=5):
    """
    Executes an LLM call synchronously with exponential backoff.
    (Used for tools that aren't yet async or for legacy support)
    """
    llm = get_llm()
    delay = 2
    
    for attempt in range(retries):
        try:
            logger.info(f"Calling Gemini model (Sync Attempt {attempt + 1})")
            response = llm.invoke(messages)
            return response.content
        except Exception as e:
            if attempt == retries - 1:
                logger.error(f"Final sync attempt failed: {e}")
                raise e
            
            logger.warning(f"Sync Retry {attempt + 1} after {delay}s due to error: {e}")
            time.sleep(delay)
            delay *= 2
    
    return ""
