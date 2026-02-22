import httpx
import asyncio
import os
import sys

# Add backend to path to load settings
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def test_mailtrap():
    from app.config import settings
    
    print("--- Mailtrap Debug Tester ---")
    print(f"API Key: {settings.mailtrap_api_key[:5]}...{settings.mailtrap_api_key[-5:] if settings.mailtrap_api_key else 'None'}")
    print(f"Sender: {settings.mailtrap_sender_email}")
    
    if not settings.mailtrap_api_key:
        print("ERROR: Mailtrap API key is missing in .env")
        return

    url = "https://send.api.mailtrap.io/api/send"
    headers = {
        "Authorization": f"Bearer {settings.mailtrap_api_key}",
        "Content-Type": "application/json",
    }

    # Test with a known email
    test_email = "your-test-email@example.com" # User should change this if needed
    payload = {
        "from": {"email": settings.mailtrap_sender_email, "name": "OstrichAi Test"},
        "to": [{"email": settings.mailtrap_sender_email}], # Sending to self as a test
        "subject": "Mailtrap Connection Test",
        "text": "If you see this, your Mailtrap integration working correctly!",
        "category": "Test"
    }

    print(f"Sending test email to: {settings.mailtrap_sender_email}...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            print(f"Status Code: {response.status_code}")
            print(f"Response Body: {response.text}")
            
            if response.status_code == 200:
                print("SUCCESS: Email sent!")
            else:
                print("FAILED: Check the response body above for details.")
                if "domain" in response.text.lower():
                    print("\nTIP: This error usually means the domain in 'MAILTRAP_SENDER_EMAIL' is not verified in your Mailtrap account.")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_mailtrap())
