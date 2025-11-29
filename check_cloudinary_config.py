from backend.storage import get_cloudinary_status
import cloudinary

def check_config():
    status = get_cloudinary_status()
    print(f"Cloudinary Status: {status}")
    
    config = cloudinary.config()
    print(f"Cloud Name: {config.cloud_name}")
    print(f"API Key: {'*' * 5 if config.api_key else 'None'}")
    
    if not status['configured']:
        print("ERROR: Cloudinary not configured.")
    else:
        print("Cloudinary configured (theoretically).")

if __name__ == "__main__":
    check_config()
