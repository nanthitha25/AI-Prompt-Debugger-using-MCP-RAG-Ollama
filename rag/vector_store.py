import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma

# Use a local directory for ChromaDB
CHROMA_PATH = "chroma_db"
DATA_PATH = "data/prompt_rules.txt"

def get_vector_store():
    """Initializes or returns the existing Chroma vector store for RAG."""
    # Ensure GEMINI_API_KEY is available
    if not os.environ.get("GEMINI_API_KEY") and not os.environ.get("GOOGLE_API_KEY"):
        raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY environment variable not set")
        
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    
    # If the DB already exists, we can just return it
    if os.path.exists(CHROMA_PATH) and os.listdir(CHROMA_PATH):
        try:
            db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)
            return db
        except Exception as e:
            print(f"Failed to load existing Chroma DB: {e}. Recreating...")
            
    # Need to create it
    print("Initializing Vector DB from data...")
    loader = TextLoader(DATA_PATH)
    documents = loader.load()
    
    # We can split by newlines for our rules file
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=50,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    # Add metadata to documents during creation
    for doc in documents:
        doc.metadata["source"] = "prompt_rules"
        
    chunks = text_splitter.split_documents(documents)
    
    db = Chroma.from_documents(
        chunks, 
        embeddings, 
        persist_directory=CHROMA_PATH
    )
    return db

def retrieve_rules(query: str, k: int = 3) -> str:
    """Retrieves top k rules relevant to the query."""
    db = get_vector_store()
    results = db.similarity_search(query, k=k)
    
    context = "\n".join([doc.page_content for doc in results])
    return context
