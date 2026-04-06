import asyncio
from sqlalchemy import select
from src.db import get_db_session, UserProfile

async def list_users():
    async for session in get_db_session():
        stmt = select(UserProfile)
        result = await session.execute(stmt)
        users = result.scalars().all()
        print(f"Found {len(users)} users:")
        for u in users:
            print(f"ID: {u.id} | Email: {u.email_id} | Name: {u.name}")
        break

if __name__ == "__main__":
    asyncio.run(list_users())
