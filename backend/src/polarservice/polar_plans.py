from src.settings import get_settings
from .polar_client import get_polar_client
from src.db import BillingCycle
from .polar_utils import Interval
import logging


def update_polar_product_by_amount_free(
    polar_product_id: str,
    plan_name: str,
    description: str | None,
    billing_cycle: BillingCycle,
):
    """
    Updates a Polar product with a FREE price.
    Returns the full response object from Polar.
    """
    cycle_enum = BillingCycle(billing_cycle)
    interval = map_billing_cycle_to_interval(cycle_enum)

    logging.info(f"UPDATING FREE PLAN: interval={interval}")

    # FREE PRICE
    polar_price = {
        "amount_type": "free"
    }

    with get_polar_client() as polar:
        res = polar.products.update(
            id=polar_product_id,
            product_update={
                "name": plan_name,
                "description": description,
                "prices": [polar_price]
            }
        )
        return res


def update_polar_product(
    polar_product_id: str,
    plan_name: str,
    description: str | None,
    billing_cycle: BillingCycle,
    prices: list[dict]
):
    """
    Updates a Polar product with attached prices.
    Returns the full response object from Polar (updated product).
    """
    settings = get_settings()
    
    cycle_enum = BillingCycle(billing_cycle)
    interval = map_billing_cycle_to_interval(cycle_enum)
    
    logging.info(f"UPDATING PLAN (amount fixed): interval={interval}")
    
    polar_prices = []
    for price in prices:
        polar_prices.append({
            "amount_type": "fixed",
            "price_currency": price["currency"].lower(),
            "price_amount": int(price["price"] * 100),  # Convert to cents
        })

    with get_polar_client() as polar:
        res = polar.products.update(
            id=polar_product_id,
            product_update={
                "name": plan_name,
                "description": description,
                "prices": polar_prices
            }
        )
        return res

def map_billing_cycle_to_interval(cycle: BillingCycle) -> str:
    if cycle == BillingCycle.MONTHLY:
        return "month"
    elif cycle == BillingCycle.YEARLY:
        return "year"
    else:
        raise ValueError("Invalid billing cycle")

def create_polar_product_by_amount_free(
    plan_name: str,
    description: str | None,
    billing_cycle: BillingCycle,
):
    """
    Creates a Polar product with a FREE price.
    Returns the full response object from Polar.
    """

    cycle_enum = BillingCycle(billing_cycle)
    interval = map_billing_cycle_to_interval(cycle_enum)
    # print(interval.value)   # "month" or "year"

    logging.info(f"CREATING FREE PLAN: interval={interval}")

    # FREE PRICE
    polar_price = {
        "amount_type": "free"
    }

    with get_polar_client() as polar:
        res = polar.products.create(request={
            "name": plan_name,
            "description": description,
            "prices": [polar_price],
            "recurring_interval": interval,
        })
        return res


def create_polar_product(plan_name: str, description: str | None, billing_cycle: BillingCycle, prices: list[dict]):
    """
    Creates a Polar product with attached prices.
    Returns the full response object from Polar (created product).
    """
    settings = get_settings()
    
    # Map BillingCycle to Polar interval
    
    cycle_enum = BillingCycle(billing_cycle)
    interval = map_billing_cycle_to_interval(cycle_enum)
    # print(interval.value)   # "month" or "year"
    logging.info(f"CREATION OF THE PLAN (amount fixed): interval={interval}")
    
    polar_prices = []
    for price in prices:
        polar_prices.append({
            "amount_type": "fixed",
            "price_currency": price["currency"].lower(),
            "price_amount": int(price["price"] * 100),  # Convert to cents
            
        })

    with get_polar_client() as polar:
        res = polar.products.create(request={
            "name": plan_name,
            "description": description,
            "prices": polar_prices,
            "recurring_interval": interval,
            # "organization_id": settings.polar_organization_id, # Disallowed with Org Token
        })
        return res
