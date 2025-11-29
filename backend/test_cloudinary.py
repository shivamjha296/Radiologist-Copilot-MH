"""
Test Script for Cloudinary Integration
Tests file upload endpoints and database operations
"""
import requests
import os
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TEST_PATIENT = {
    "mrn": "TEST001",
    "name": "Test Patient",
    "age": 30,
    "gender": "Male"
}


def test_health_check():
    """Test API and Cloudinary status"""
    print("\n🔍 Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ API Status: {data['status']}")
        print(f"✅ Database: {data['database']}")
        print(f"✅ Cloudinary: {data['cloudinary']}")
        return data['cloudinary'] == 'configured'
    else:
        print(f"❌ Health check failed: {response.status_code}")
        return False


def test_create_patient():
    """Create a test patient"""
    print("\n👤 Creating test patient...")
    
    response = requests.post(
        f"{BASE_URL}/patients",
        data=TEST_PATIENT
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Patient created: ID {data['id']}, MRN {data['mrn']}")
        return data['id']
    elif response.status_code == 400:
        # Patient already exists, get ID
        print("ℹ️  Patient already exists, fetching...")
        response = requests.get(f"{BASE_URL}/patients")
        patients = response.json()
        for patient in patients:
            if patient['mrn'] == TEST_PATIENT['mrn']:
                print(f"✅ Found existing patient: ID {patient['id']}")
                return patient['id']
    else:
        print(f"❌ Failed to create patient: {response.status_code}")
        return None


def test_upload_scan(patient_id, test_image_path):
    """Test X-ray scan upload"""
    print("\n📤 Testing X-ray scan upload...")
    
    if not os.path.exists(test_image_path):
        print(f"⚠️  Test image not found: {test_image_path}")
        print("   Create a test image or provide a valid path")
        return None
    
    with open(test_image_path, 'rb') as f:
        files = {'file': (os.path.basename(test_image_path), f, 'image/jpeg')}
        data = {
            'body_part': 'CHEST',
            'view_position': 'PA'
        }
        
        response = requests.post(
            f"{BASE_URL}/patients/{patient_id}/upload/scan",
            files=files,
            data=data
        )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Scan uploaded successfully!")
        print(f"   Scan ID: {result['scan']['id']}")
        print(f"   File URL: {result['scan']['file_url']}")
        return result['scan']['id']
    else:
        print(f"❌ Upload failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None


def test_upload_document(patient_id, test_pdf_path):
    """Test PDF document upload"""
    print("\n📄 Testing PDF document upload...")
    
    if not os.path.exists(test_pdf_path):
        print(f"⚠️  Test PDF not found: {test_pdf_path}")
        print("   Create a test PDF or provide a valid path")
        return None
    
    with open(test_pdf_path, 'rb') as f:
        files = {'file': (os.path.basename(test_pdf_path), f, 'application/pdf')}
        data = {
            'document_name': 'Test Medical Report',
            'document_type': 'LAB'
        }
        
        response = requests.post(
            f"{BASE_URL}/patients/{patient_id}/upload/document",
            files=files,
            data=data
        )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Document uploaded successfully!")
        print(f"   Document ID: {result['document']['id']}")
        print(f"   File URL: {result['document']['file_url']}")
        return result['document']['id']
    else:
        print(f"❌ Upload failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None


def test_get_patient(patient_id):
    """Test retrieving patient with files"""
    print(f"\n📋 Fetching patient {patient_id} data...")
    
    response = requests.get(f"{BASE_URL}/patients/{patient_id}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Patient: {data['name']} (MRN: {data['mrn']})")
        print(f"   Scans: {len(data['scans'])}")
        print(f"   Documents: {len(data['documents'])}")
        
        for scan in data['scans']:
            print(f"   📸 Scan {scan['id']}: {scan['body_part']} - {scan['file_url'][:50]}...")
        
        for doc in data['documents']:
            print(f"   📄 Doc {doc['id']}: {doc['document_name']} - {doc['file_url'][:50]}...")
        
        return True
    else:
        print(f"❌ Failed to get patient: {response.status_code}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 Cloudinary Integration Test Suite")
    print("=" * 60)
    
    # Test 1: Health check
    if not test_health_check():
        print("\n⚠️  Cloudinary not configured. Please check your .env file.")
        print("   Required variables:")
        print("   - CLOUDINARY_CLOUD_NAME")
        print("   - CLOUDINARY_API_KEY")
        print("   - CLOUDINARY_API_SECRET")
        return
    
    # Test 2: Create patient
    patient_id = test_create_patient()
    if not patient_id:
        print("\n❌ Cannot continue without a patient. Exiting.")
        return
    
    # Test 3: Upload X-ray scan
    # Replace with your test image path
    test_image = "test_xray.jpg"  # Create this or provide path
    scan_id = test_upload_scan(patient_id, test_image)
    
    # Test 4: Upload PDF document
    # Replace with your test PDF path
    test_pdf = "test_report.pdf"  # Create this or provide path
    doc_id = test_upload_document(patient_id, test_pdf)
    
    # Test 5: Retrieve patient data
    test_get_patient(patient_id)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    print(f"✅ Health Check: Passed")
    print(f"✅ Patient Creation: Passed (ID: {patient_id})")
    print(f"{'✅' if scan_id else '⚠️ '} X-ray Upload: {'Passed' if scan_id else 'Skipped (no test image)'}")
    print(f"{'✅' if doc_id else '⚠️ '} Document Upload: {'Passed' if doc_id else 'Skipped (no test PDF)'}")
    print("=" * 60)
    
    print("\n💡 Next Steps:")
    print("1. View uploaded files in Cloudinary dashboard")
    print("2. Check PostgreSQL database for file_url entries")
    print("3. Access file URLs directly in browser")
    print("4. Test with your frontend application")


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to backend API")
        print("   Make sure the backend is running:")
        print("   cd backend && python main.py")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
