import random

def fetch_patient_history(patient_id: str) -> str:
    """
    Mock function to fetch patient history.
    """
    # Simulate some history
    histories = [
        "Patient has a history of mild asthma. Previous X-ray from 2023 showed no significant abnormalities.",
        "No significant past medical history.",
        "Patient treated for pneumonia in 2022. Recovered fully.",
        "History of smoking for 10 years. Complains of chronic cough."
    ]
    return random.choice(histories)

def get_patient_details(patient_id: str) -> dict:
    """
    Mock function to fetch patient details.
    """
    return {
        "id": patient_id,
        "name": f"Patient_{patient_id}",
        "age": random.randint(20, 80),
        "gender": random.choice(["Male", "Female"])
    }

def store_report(patient_id: str, report: str, comparison: str):
    """
    Mock function to store the generated report.
    """
    print(f"--- Storing Report for {patient_id} ---")
    print(f"Report: {report[:100]}...")
    print(f"Comparison: {comparison[:100]}...")
    print("---------------------------------------")
    return True
