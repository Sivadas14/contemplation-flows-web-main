import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import urllib.parse

async def test_password():
    passwords = ["Atrium$palm303"]
    ports = [5432, 6543]
    for port in ports:
        for pwd in passwords:
            encoded_pwd = urllib.parse.quote_plus(pwd)
            url = f"postgresql+asyncpg://postgres:{encoded_pwd}@db.jmmqzddkwsmwdczwtrwq.supabase.co:{port}/postgres"
            print(f"Testing port {port}, password: {pwd}")
            # Add a timeout to the connection attempt
            engine = create_async_engine(url, connect_args={"timeout": 5})
            try:
                # Use wait_for to avoid hanging forever
                async with asyncio.timeout(10):
                    async with engine.connect() as conn:
                        await conn.execute(text("SELECT 1"))
                        print(f"  SUCCESS! Port: {port}, Password: {pwd}")
                        return pwd
            except Exception as e:
                print(f"  Failed on port {port}: {type(e).__name__}")
            finally:
                await engine.dispose()
    return None

if __name__ == "__main__":
    asyncio.run(test_password())
