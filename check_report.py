import requests
import json

def check_report():
    try:
        response = requests.get("http://localhost:8000/api/reports/1")
        if response.status_code == 200:
            data = response.json()
            print(f"Report ID: {data.get('id')}")
            print(f"Status: {data.get('status')}")
            print(f"PDF URL: {data.get('pdf_url')}") # Check if this key exists in response
            # Also check inside 'scan' or other nested fields just in case
            print(json.dumps(data, indent=2))
        else:
            print(f"API Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    check_report()
