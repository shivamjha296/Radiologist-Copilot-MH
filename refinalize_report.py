import requests
import json

def refinalize():
    url = "http://localhost:8000/api/reports/1"
    data = {
        "status": "Final",
        # We need to send other fields or the endpoint might complain? 
        # The endpoint uses ReportUpdate(full_text=None, impression=None, status=None)
        # So sending just status is fine.
    }
    
    try:
        print("Triggering re-finalization...")
        response = requests.put(url, json=data)
        
        if response.status_code == 200:
            result = response.json()
            print("Success!")
            print(f"New PDF URL: {result.get('pdf_url')}")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    refinalize()
