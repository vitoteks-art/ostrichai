import httpx
import asyncio
import json

async def list_polar_resources(token):
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    url = "https://api.polar.sh/v1/products"
    
    print(f"Listing products from: {url}...")
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                print(f"✅ Success! Found {len(data.get('items', []))} products.")
                for item in data.get('items', []):
                    print(f"\nProduct: {item.get('name')} (ID: {item.get('id')})")
                    for price in item.get('prices', []):
                        print(f"  - Price: {price.get('price_currency')} {price.get('price_amount')/100:.2f} (ID: {price.get('id')}) - Type: {price.get('type')}")
                
                with open('polar_catalog.json', 'w') as f:
                    json.dump(data, f, indent=2)
            else:
                print(f"❌ Error ({resp.status_code}): {resp.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    token = "polar_oat_JMooyGAfqGhyDmyxpfN4mGScXpEyCBuHSwkEU0QacJn"
    asyncio.run(list_polar_resources(token))
