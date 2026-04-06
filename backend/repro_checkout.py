import asyncio
import os
import sys

# Add src to path
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.services.subscription import create_checkout_session
from src.settings import get_settings

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    polar_product_id = "9c16088c-6378-45fc-84e2-5b2216a640aa"
    user_id = "a8143884-605b-462a-bd51-511d6aa93e2d"
    redirect_url = "http://localhost:3000/billing"
    
    async with async_session() as session:
        try:
            print(f"Testing create_checkout_session with product={polar_product_id}, user={user_id}")
            url = await create_checkout_session(polar_product_id, user_id, redirect_url, session)
            print(f"SUCCESS! Checkout URL: {url}")
        except Exception as e:
            print(f"FAILED with error: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
