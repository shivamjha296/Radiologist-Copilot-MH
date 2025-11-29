"""
Integration helper to add WhatsApp functionality to existing report generation
"""
import sys
import os

# Add helper functions that can be imported into medical_ner.py and cap.py

def extract_phone_from_pdf_text(text):
    """
    Extract phone number from PDF text using regex patterns.
    
    Args:
        text: PDF text content
    
    Returns:
        str: Phone number or None
    """
    import re
    
    phone_patterns = [
        r'(?:phone|mobile|contact|tel)?\s*:?\s*(\+?\d{1,3})?[-.\s]?(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})',
        r'(\+91|91)?[-.\s]?([6-9]\d{9})',
        r'\b(\d{10})\b',
        r'\b(\+\d{10,15})\b'
    ]
    
    for pattern in phone_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            # Extract all digits
            phone = ''.join(filter(str.isdigit, ''.join(match.groups())))
            # Validate length
            if len(phone) >= 10 and len(phone) <= 15:
                return phone
    
    return None


def prompt_for_phone_number(patient_name):
    """
    Prompt user to enter phone number in Streamlit.
    
    Args:
        patient_name: Name of the patient
    
    Returns:
        str: Phone number
    """
    try:
        import streamlit as st
        phone = st.text_input(
            f"📱 Enter WhatsApp number for {patient_name}",
            placeholder="+91XXXXXXXXXX or 10-digit number",
            help="Report will be sent to this number via WhatsApp"
        )
        return phone if phone else None
    except:
        # Fallback for non-Streamlit environments
        phone = input(f"Enter WhatsApp number for {patient_name}: ")
        return phone if phone else None


def add_whatsapp_to_patient_details(patient_details, pdf_text=None, prompt=True):
    """
    Add phone number to patient details dictionary.
    
    Args:
        patient_details: Dict with patient info
        pdf_text: Optional PDF text to extract from
        prompt: Whether to prompt user if not found
    
    Returns:
        dict: Updated patient_details with phone_number
    """
    # Try to extract from PDF first
    if pdf_text:
        phone = extract_phone_from_pdf_text(pdf_text)
        if phone:
            patient_details['phone_number'] = phone
            return patient_details
    
    # Prompt user if needed
    if prompt and 'phone_number' not in patient_details:
        phone = prompt_for_phone_number(patient_details.get('name', 'Patient'))
        if phone:
            patient_details['phone_number'] = phone
    
    return patient_details


def auto_send_report_whatsapp(report_id, phone_number=None, report_content=None):
    """
    Automatically send report via WhatsApp after generation.
    
    Args:
        report_id: Database report ID
        phone_number: Optional phone number
        report_content: Optional report text
    
    Returns:
        tuple: (success, message)
    """
    try:
        from whatsapp_service import send_report_to_patient
        success, message = send_report_to_patient(report_id, phone_number)
        return success, message
    except ImportError:
        return False, "WhatsApp service not available. Install: pip install twilio"
    except Exception as e:
        return False, f"Error sending WhatsApp: {str(e)}"


def show_whatsapp_status(success, message):
    """
    Display WhatsApp send status in Streamlit.
    
    Args:
        success: Boolean success status
        message: Status message
    """
    try:
        import streamlit as st
        if success:
            st.success(f"📱 WhatsApp: {message}")
        else:
            st.warning(f"⚠️ WhatsApp: {message}")
    except:
        # Fallback for non-Streamlit
        status = "✅" if success else "⚠️"
        print(f"{status} WhatsApp: {message}")


def create_streamlit_whatsapp_widget():
    """
    Create a Streamlit widget for manual WhatsApp sending.
    """
    try:
        import streamlit as st
        
        st.subheader("📱 Send via WhatsApp")
        
        col1, col2 = st.columns(2)
        
        with col1:
            report_id = st.number_input("Report ID", min_value=1, step=1)
        
        with col2:
            phone = st.text_input("Phone Number (optional)", placeholder="+91XXXXXXXXXX")
        
        if st.button("📤 Send Report via WhatsApp", type="primary"):
            with st.spinner("Sending..."):
                success, message = auto_send_report_whatsapp(
                    report_id, 
                    phone_number=phone if phone else None
                )
                show_whatsapp_status(success, message)
    
    except ImportError:
        pass  # Streamlit not available


# Example integration code for medical_ner.py
INTEGRATION_CODE_MEDICAL_NER = """
# Add this to medical_ner.py after storing to database:

from integration_helper import (
    add_whatsapp_to_patient_details, 
    auto_send_report_whatsapp,
    show_whatsapp_status
)

# In the upload section, after extracting patient details:
patient_details = extract_patient_details(text)
patient_details = add_whatsapp_to_patient_details(patient_details, text, prompt=True)

# After store_to_mysql:
patient_id, report_id = store_to_mysql(patient, entities, uploaded_file.name, report_content=text)

# Auto-send via WhatsApp
if patient_details.get('phone_number'):
    success, msg = auto_send_report_whatsapp(report_id)
    show_whatsapp_status(success, msg)
"""

# Example integration for cap.py
INTEGRATION_CODE_CAP = """
# Add this to cap.py after generating report:

from integration_helper import (
    prompt_for_phone_number,
    auto_send_report_whatsapp,
    show_whatsapp_status
)

# After report generation:
phone_number = prompt_for_phone_number(patient_name)

if phone_number and report_id:
    success, msg = auto_send_report_whatsapp(report_id, phone_number, report_content)
    show_whatsapp_status(success, msg)
"""


if __name__ == "__main__":
    print("=" * 60)
    print("WhatsApp Integration Helper")
    print("=" * 60)
    print("\n📋 Integration Instructions:\n")
    print("1. Import helper functions in your medical report scripts")
    print("2. Add phone number collection to patient details")
    print("3. Call auto_send_report_whatsapp after saving to DB")
    print("4. Display status with show_whatsapp_status")
    print("\n" + "=" * 60)
    print("\n📝 Example Code for medical_ner.py:")
    print(INTEGRATION_CODE_MEDICAL_NER)
    print("\n" + "=" * 60)
    print("\n📝 Example Code for cap.py:")
    print(INTEGRATION_CODE_CAP)
    print("\n" + "=" * 60)
