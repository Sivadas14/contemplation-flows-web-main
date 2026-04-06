from src.polarservice.polar_client import get_polar_client
from src.settings import get_settings

def explore_subscriptions():
    settings = get_settings()
    print("Exploring Polar Subscriptions API...")
    
    try:
        with get_polar_client() as polar:
            # Check if subscriptions attribute exists
            if not hasattr(polar, 'subscriptions'):
                print("polar client has no 'subscriptions' attribute.")
                return

            print("Found 'subscriptions' attribute.")
            print(f"Dir: {dir(polar.subscriptions)}")
            
            # Try to list subscriptions
            # We want to see if we can filter by organization_id (implicit in token?) or other fields
            print("\nAttempting to list subscriptions...")
            try:
                # With Org Token, listing might default to the org's subscriptions
                response = polar.subscriptions.list()
                
                print(f"Response Type: {type(response)}")
                
                # Check for items
                items = getattr(response, 'items', None)
                if not items and hasattr(response, 'result'):
                    items = getattr(response.result, 'items', [])
                
                print(f"Found {len(items) if items else 0} subscriptions.")
                
                if items:
                    first_sub = items[0]
                    print(f"Sample Subscription Dir: {dir(first_sub)}")
                    print(f"Sample Subscription Dump: {first_sub.model_dump() if hasattr(first_sub, 'model_dump') else 'N/A'}")
                    
            except Exception as e:
                print(f"List failed: {e}")

    except Exception as e:
        print(f"Connection/Auth Failed: {e}")

if __name__ == "__main__":
    explore_subscriptions()
