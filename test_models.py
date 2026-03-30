import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", os.environ.get("GOOGLE_API_KEY")))

print("Available embedding models:")
for m in genai.list_models():
    if 'embedContent' in m.supported_generation_methods:
        print(m.name)
