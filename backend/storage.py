"""
Cloudinary Storage Service for Remote File Storage
Handles X-ray images and PDF documents upload to Cloudinary
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from typing import Literal

# Load environment variables from parent directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Initialize Cloudinary configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)


def upload_to_cloud(
    file: UploadFile,
    folder: str,
    resource_type: Literal["image", "raw"] = "image"
) -> str:
    """
    Upload file to Cloudinary and return the secure URL.
    
    Args:
        file: FastAPI UploadFile object (X-ray image or PDF)
        folder: Cloudinary folder name (e.g., "xrays", "reports")
        resource_type: "image" for X-rays, "raw" for PDFs and other documents
    
    Returns:
        str: Cloudinary secure HTTPS URL
    
    Raises:
        HTTPException: If upload fails or Cloudinary is not configured
    
    Example:
        >>> xray_url = upload_to_cloud(file, "xrays", "image")
        >>> pdf_url = upload_to_cloud(file, "reports", "raw")
    """
    # Validate Cloudinary configuration
    if not all([
        os.getenv("CLOUDINARY_CLOUD_NAME"),
        os.getenv("CLOUDINARY_API_KEY"),
        os.getenv("CLOUDINARY_API_SECRET")
    ]):
        raise HTTPException(
            status_code=500,
            detail="Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file."
        )
    
    try:
        # Read file content
        file_content = file.file.read()
        
        # Reset file pointer for potential re-reads
        file.file.seek(0)
        
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type=resource_type,
            use_filename=True,
            unique_filename=True,
            overwrite=False,
            # Optional: Add tags for better organization
            tags=[folder, resource_type],
            # Optional: Set quality for images
            quality="auto" if resource_type == "image" else None,
            # Optional: Format for images (keep original or convert)
            fetch_format="auto" if resource_type == "image" else None
        )
        
        # Extract secure URL from response
        secure_url = upload_result.get("secure_url")
        
        if not secure_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve URL from Cloudinary response"
            )
        
        return secure_url
    
    except cloudinary.exceptions.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cloudinary upload failed: {str(e)}"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File upload error: {str(e)}"
        )


def delete_from_cloud(file_url: str, resource_type: Literal["image", "raw"] = "image") -> bool:
    """
    Delete file from Cloudinary using its URL.
    
    Args:
        file_url: Cloudinary secure URL
        resource_type: "image" or "raw"
    
    Returns:
        bool: True if deletion successful, False otherwise
    
    Example:
        >>> success = delete_from_cloud("https://res.cloudinary.com/.../xray.jpg", "image")
    """
    try:
        # Extract public_id from URL
        # Example URL: https://res.cloudinary.com/cloud_name/image/upload/v123456/xrays/file.jpg
        # public_id: xrays/file
        
        parts = file_url.split("/")
        # Find the upload index and extract everything after version
        if "upload" in parts:
            upload_index = parts.index("upload")
            # Skip version (v123456) and get folder/filename
            public_id_parts = parts[upload_index + 2:]  # Skip "upload" and version
            public_id = "/".join(public_id_parts).rsplit(".", 1)[0]  # Remove extension
            
            # Delete from Cloudinary
            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            return result.get("result") == "ok"
        
        return False
    
    except Exception as e:
        print(f"Error deleting from Cloudinary: {e}")
        return False


def get_cloudinary_status() -> dict:
    """
    Check Cloudinary configuration status.
    
    Returns:
        dict: Configuration status
    """
    return {
        "configured": all([
            os.getenv("CLOUDINARY_CLOUD_NAME"),
            os.getenv("CLOUDINARY_API_KEY"),
            os.getenv("CLOUDINARY_API_SECRET")
        ]),
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME", "Not set"),
        "api_key_set": bool(os.getenv("CLOUDINARY_API_KEY")),
        "api_secret_set": bool(os.getenv("CLOUDINARY_API_SECRET"))
    }


def upload_local_file(
    file_path: str,
    folder: str,
    resource_type: Literal["image", "raw"] = "image"
) -> str:
    """
    Upload a local file to Cloudinary and return the secure URL.
    
    Args:
        file_path: Absolute path to the local file
        folder: Cloudinary folder name
        resource_type: "image" or "raw"
    
    Returns:
        str: Cloudinary secure HTTPS URL
    """
    # Validate Cloudinary configuration
    if not all([
        os.getenv("CLOUDINARY_CLOUD_NAME"),
        os.getenv("CLOUDINARY_API_KEY"),
        os.getenv("CLOUDINARY_API_SECRET")
    ]):
        raise HTTPException(
            status_code=500,
            detail="Cloudinary credentials not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file."
        )
        
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file_path,
            folder=folder,
            resource_type=resource_type,
            use_filename=True,
            unique_filename=True,
            overwrite=False,
            tags=[folder, resource_type]
        )
        
        # Extract secure URL from response
        secure_url = upload_result.get("secure_url")
        
        if not secure_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve URL from Cloudinary response"
            )
        
        return secure_url
    
    except cloudinary.exceptions.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cloudinary upload failed: {str(e)}"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File upload error: {str(e)}"
        )
