 
# ai_services4/resume-analyzer/services/pdf_parser.py

import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_file) -> str:
    """Extract text from uploaded PDF file"""
    try:
        # Read PDF bytes
        pdf_bytes = pdf_file.file.read()
        
        # Open PDF with PyMuPDF
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        # Extract text from all pages
        text = ""
        for page in doc:
            text += page.get_text()
        
        doc.close()
        
        return text
    except Exception as e:
        print(f"❌ Error extracting PDF text: {str(e)}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")