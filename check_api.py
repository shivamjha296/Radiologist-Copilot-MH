import requests
import json

def check_api():
    try:
        response = requests.get("http://localhost:8000/api/patients")
        if response.status_code == 200:
            data = response.json()
            print(f"API Status: {response.status_code}")
            print(f"Record Count: {len(data)}")
            print(json.dumps(data, indent=2))
        else:
            print(f"API Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    check_api()
