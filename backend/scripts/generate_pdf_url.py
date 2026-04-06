
import asyncio
from src.settings import get_settings, get_supabase_client

async def generate_url():
    settings = get_settings()
    client = get_supabase_client(settings)
    
    filename = "Happiness_and_the_Art_of_Being.pdf"
    # Generate 7 days signed URL
    res = client.storage.from_("source-files").create_signed_url(filename, 604800)
    
    print("\n" + "="*50)
    print(f"NEW SIGNED URL FOR: {filename}")
    print("="*50)
    if isinstance(res, dict):
        if res.get("error"):
            print(f"Error: {res.get('error')}")
        else:
            print(res.get("signedURL"))
    else:
        print(res)
    print("="*50 + "\n")

if __name__ == "__main__":
    asyncio.run(generate_url())
