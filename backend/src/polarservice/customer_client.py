from polar_sdk import Polar
from src.settings import get_settings

def get_polar_customer_client(customer_token: str) -> Polar:
    settings = get_settings()
    server = "sandbox" if settings.polar_base_api and "sandbox" in settings.polar_base_api else "production"
    return Polar(
        access_token=customer_token,
        server=server
    )
