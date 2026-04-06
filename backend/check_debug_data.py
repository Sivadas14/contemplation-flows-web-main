import asyncio
from sqlalchemy import select
from src.db import get_db_session, UserProfile, Plan

async def check_data():
    target_user_id = "f306c93a-cab6-4dce-94f8-e741db21b900"
    target_product_id = "f5acc179-0cd6-42ad-88b2-c7ac14177f18"

    print("Checking for User and Plan...")
    async for session in get_db_session():
        # Check User
        stmt = select(UserProfile).where(UserProfile.id == target_user_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            print(f"User FOUND: {user.id} | Email: {user.email_id}")
        else:
            print(f"User NOT FOUND: {target_user_id}")

        # Check Plan
        stmt = select(Plan).where(Plan.polar_plan_id == target_product_id)
        result = await session.execute(stmt)
        plan = result.scalar_one_or_none()
        if plan:
            print(f"Plan FOUND: {plan.name} | Polar ID: {plan.polar_plan_id}")
        else:
            print(f"Plan NOT FOUND for Polar ID: {target_product_id}")
            # List all plans to see what we have
            all_plans_stmt = select(Plan)
            all_plans = (await session.execute(all_plans_stmt)).scalars().all()
            print("Available Plans:")
            for p in all_plans:
                print(f"- {p.name}: {p.polar_plan_id}")
        break

if __name__ == "__main__":
    asyncio.run(check_data())
