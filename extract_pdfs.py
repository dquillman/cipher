
import pypdf
import os

def extract_text(pdf_path):
    print(f"--- Extracting {pdf_path} ---")
    try:
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            print(page.extract_text())
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    print(f"--- End of {pdf_path} ---\n")

files = ["Exam Coach App.pdf", "Exam Coach DB Schema.pdf"]
for f in files:
    if os.path.exists(f):
        extract_text(f)
    else:
        print(f"File not found: {f}")
