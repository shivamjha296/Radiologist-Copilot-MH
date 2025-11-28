from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch
import os
from datetime import datetime

def generate_pdf_report(patient_details, report_content, output_path):
    """
    Generates a PDF report matching the reference template.
    """
    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            rightMargin=30, leftMargin=30,
                            topMargin=30, bottomMargin=30)
    
    styles = getSampleStyleSheet()
    story = []

    # --- Header ---
    # Assuming a logo exists or we skip it. Let's create a text header for now.
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#0056b3"),
        alignment=1 # Center
    )
    story.append(Paragraph("SMART IMAGING CENTER", header_style))
    story.append(Paragraph("X-Ray | CT-Scan | MRI | USG", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # --- Patient Info Bar ---
    # Create a table for patient details
    data = [
        [f"Name: {patient_details.get('name', 'Unknown')}", f"PID: {patient_details.get('id', 'N/A')}", f"Date: {datetime.now().strftime('%d %b, %y')}"],
        [f"Age: {patient_details.get('age', 'N/A')}", f"Ref By: Dr. Smith", f"Reported: {datetime.now().strftime('%I:%M %p')}"]
    ]
    
    t = Table(data, colWidths=[2.5*inch, 2.5*inch, 2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.aliceblue),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))
    
    # --- Report Title ---
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading2'],
        alignment=1,
        spaceAfter=20
    )
    story.append(Paragraph("RADIOLOGY REPORT", title_style))
    
    # --- Report Content ---
    # Split content by newlines and add as paragraphs
    content_style = ParagraphStyle(
        'Content',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        spaceAfter=10
    )
    
    for line in report_content.split('\n'):
        if line.strip():
            if line.startswith('#'):
                # Handle markdown headers roughly
                story.append(Paragraph(line.replace('#', '').strip(), styles['Heading3']))
            elif line.startswith('-') or line.startswith('*'):
                # Handle bullets
                story.append(Paragraph(f"• {line.strip('-* ')}", content_style))
            else:
                story.append(Paragraph(line, content_style))
                
    story.append(Spacer(1, 30))
    
    # --- Footer ---
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.gray,
        alignment=1
    )
    story.append(Paragraph("****End of Report****", footer_style))
    story.append(Spacer(1, 30))
    
    # Signatures
    sig_data = [
        ["Radiologic Technologists", "Dr. Payal Shah", "Dr. Vimal Shah"],
        ["(MSC, PGDM)", "(MD, Radiologist)", "(MD, Radiologist)"]
    ]
    sig_table = Table(sig_data, colWidths=[2.3*inch, 2.3*inch, 2.3*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('topPadding', (0, 0), (-1, -1), 20),
    ]))
    story.append(sig_table)

    # Build PDF
    doc.build(story)
    return output_path
