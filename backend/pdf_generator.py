import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, Flowable
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import io
from datetime import datetime
import math

class Seal(Flowable):
    """A custom flowable that draws a seal/stamp-like graphic"""
    
    def __init__(self, width=2*inch, height=2*inch):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        
    def draw(self):
        # Save canvas state
        self.canv.saveState()
        
        # Draw outer circle
        self.canv.setStrokeColor(colors.darkblue)
        self.canv.setFillColor(colors.white)
        self.canv.setLineWidth(2)
        self.canv.circle(self.width/2, self.height/2, self.width/2 - 10, stroke=1, fill=1)
        
        # Draw inner circle
        self.canv.setStrokeColor(colors.darkblue)
        self.canv.setLineWidth(1)
        self.canv.circle(self.width/2, self.height/2, self.width/2 - 20, stroke=1, fill=0)
        
        # Add text around the circle
        self.canv.setFillColor(colors.darkblue)
        self.canv.setFont("Helvetica-Bold", 10)
        
        # Top text
        self.canv.drawCentredString(self.width/2, self.height - 25, "CONFIDENTIAL")
        
        # Bottom text
        self.canv.drawCentredString(self.width/2, 20, "MEDICAL ASSESSMENT")
        
        # Center text
        self.canv.setFont("Helvetica-Bold", 12)
        self.canv.drawCentredString(self.width/2, self.height/2 + 10, "VERIFIED")
        self.canv.setFont("Helvetica", 8)
        self.canv.drawCentredString(self.width/2, self.height/2 - 10, datetime.now().strftime("%Y-%m-%d"))
        
        # Restore canvas state
        self.canv.restoreState()

def add_watermark(canvas, doc):
    """Add a diagonal watermark across the page"""
    canvas.saveState()
    canvas.setFont("Helvetica", 60)
    canvas.setFillColor(colors.lightgrey.clone(alpha=0.3))
    canvas.translate(doc.pagesize[0]/2, doc.pagesize[1]/2)
    canvas.rotate(45)
    canvas.drawCentredString(0, 0, "CONFIDENTIAL")
    canvas.restoreState()

def create_form_pdf(form_data, output_path=None):
    """
    Create a professional-looking medical assessment PDF with the extracted data.
    
    Args:
        form_data (dict): The extracted form field data
        output_path (str, optional): Path to save the PDF. If None, returns bytes.
    
    Returns:
        bytes or str: If output_path is None, returns the PDF as bytes, otherwise returns the path
    """
    buffer = io.BytesIO()
    
    # Create the PDF with ReportLab
    doc = SimpleDocTemplate(
        buffer if output_path is None else output_path,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Styles
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='FormHeading',
        fontName='Helvetica-Bold',
        fontSize=18,
        spaceAfter=16,
        alignment=1  # Center
    ))
    
    styles.add(ParagraphStyle(
        name='FormSubheading',
        fontName='Helvetica-Bold',
        fontSize=14,
        spaceAfter=16,
        alignment=1  # Center
    ))
    
    styles.add(ParagraphStyle(
        name='FormField',
        fontName='Helvetica-Bold',
        fontSize=10,
        spaceAfter=8
    ))
    
    styles.add(ParagraphStyle(
        name='FormValue',
        fontName='Helvetica',
        fontSize=10,
        spaceAfter=14,
        leading=14
    ))
    
    styles.add(ParagraphStyle(
        name='SectionHeading',
        fontName='Helvetica-Bold',
        fontSize=12,
        spaceAfter=10,
        spaceBefore=15,
        textColor=colors.darkblue
    ))
    
    styles.add(ParagraphStyle(
        name='Footer',
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=colors.gray,
        alignment=1,  # Center
        spaceBefore=20
    ))
    
    # Build content
    elements = []
    
    # Header
    elements.append(Paragraph("MEDICAL ASSESSMENT REPORT", styles['FormHeading']))
    elements.append(Paragraph("PATIENT HEALTH EVALUATION", styles['FormSubheading']))
    elements.append(Spacer(1, 30))
    
    # Add a seal
    elements.append(Seal())
    elements.append(Spacer(1, 25))
    
    # Processing information
    elements.append(Paragraph(f"<b>Date of Assessment:</b> {datetime.now().strftime('%B %d, %Y')}", styles['FormValue']))
    elements.append(Paragraph(f"<b>Medical Record #:</b> MR-{datetime.now().strftime('%Y%m')}-{hash(str(form_data)) % 10000:04d}", styles['FormValue']))
    elements.append(Paragraph(f"<b>Assessment Type:</b> Comprehensive Medical Evaluation", styles['FormValue']))
    elements.append(Spacer(1, 10))
    
    # Filter out empty or "not available" values
    filtered_form_data = {}
    for field, value in form_data.items():
        # Skip fields with empty values or "not available" values or values containing just "no"
        value_lower = str(value).lower()
        # Keep fields that have the invisible character (zero-width space)
        if value == "\u200B":
            filtered_form_data[field] = " "  # Use a single regular space for display
        elif (value and 
            value_lower != "not available" and 
            value_lower != "n/a" and
            value_lower != "none" and
            value_lower != "no information" and
            value_lower != "no information provided" and
            not (value_lower == "no" and len(value_lower) <= 3)):
            filtered_form_data[field] = value
    
    # Organize data into sections if possible
    patient_info = {}
    medical_history = {}
    current_assessment = {}
    recommendations = {}
    
    # Simple categorization by keywords in field names
    for field, value in filtered_form_data.items():
        field_lower = field.lower()
        if any(keyword in field_lower for keyword in ["name", "dob", "birth", "age", "sex", "gender", "contact", "address", "phone", "email", "insurance", "id", "number"]):
            patient_info[field] = value
        elif any(keyword in field_lower for keyword in ["history", "previous", "past", "prior", "family", "allergies"]):
            medical_history[field] = value
        elif any(keyword in field_lower for keyword in ["recommend", "plan", "follow", "referral", "medication"]):
            recommendations[field] = value
        else:
            current_assessment[field] = value
    
    # Helper function to create a section table
    def create_section_table(title, section_data):
        elements.append(Paragraph(title, styles['SectionHeading']))
        elements.append(Spacer(1, 5))
        
        if section_data:
            data = []
            data.append([
                Paragraph("<b>FIELD</b>", styles['FormField']), 
                Paragraph("<b>INFORMATION</b>", styles['FormField'])
            ])
            
            for field, value in section_data.items():
                data.append([
                    Paragraph(field, styles['FormField']), 
                    Paragraph(value, styles['FormValue'])
                ])
            
            table = Table(data, colWidths=[doc.width * 0.4, doc.width * 0.6])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BACKGROUND', (0, 1), (0, -1), colors.lightgrey),
                ('BACKGROUND', (1, 1), (1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            elements.append(table)
            elements.append(Spacer(1, 10))
    
    # Create sections if we categorized data, otherwise use a single table
    if patient_info or medical_history or recommendations:
        if patient_info:
            create_section_table("PATIENT INFORMATION", patient_info)
        if medical_history:
            create_section_table("MEDICAL HISTORY", medical_history)
        if current_assessment:
            create_section_table("CURRENT ASSESSMENT", current_assessment)
        if recommendations:
            create_section_table("RECOMMENDATIONS", recommendations)
    else:
        # If no categorization, use a single table with all data
        elements.append(Paragraph("MEDICAL ASSESSMENT DATA", styles['SectionHeading']))
        elements.append(Spacer(1, 5))
        
        data = []
        data.append([
            Paragraph("<b>ASSESSMENT FIELD</b>", styles['FormField']), 
            Paragraph("<b>CLINICAL FINDING</b>", styles['FormField'])
        ])
        
        for field, value in filtered_form_data.items():
            data.append([
                Paragraph(field, styles['FormField']), 
                Paragraph(value, styles['FormValue'])
            ])
        
        if data:
            table = Table(data, colWidths=[doc.width * 0.4, doc.width * 0.6])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BACKGROUND', (0, 1), (0, -1), colors.lightgrey),
                ('BACKGROUND', (1, 1), (1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
            ]))
            elements.append(table)
    
    elements.append(Spacer(1, 30))
    
    # Add a notice
    elements.append(Paragraph(
        "<i>This medical assessment report has been automatically generated based on information provided. "
        "It is for healthcare provider review only and should be verified by qualified medical personnel. "
        "Please consult with your healthcare provider regarding any findings or recommendations.</i>",
        styles['Footer']
    ))
    
    # Build PDF with watermark
    doc.build(elements, onFirstPage=add_watermark, onLaterPages=add_watermark)
    
    # If no output path, return bytes
    if output_path is None:
        buffer.seek(0)
        return buffer.getvalue()
    else:
        return output_path 