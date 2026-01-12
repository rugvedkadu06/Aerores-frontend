from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
# We ensure it's loaded from .env if not already in environment
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in environment variables.")
else:
    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-2.5-flash", contents="Explain how AI works in a few words"
        )
        print(response.text)
    except Exception as e:
        print(f"Error occurred: {e}")
