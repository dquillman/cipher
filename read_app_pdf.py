import pypdf
import os

pdf_path = "Exam Coach App.pdf"

if os.path.exists(pdf_path):
    print(f"--- Extracting {pdf_path} ---")
    try:
        reader = pypdf.PdfReader(pdf_path)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n"
        
        print(f"--- Dumping full text to pdf_dump.txt ---")
        with open('pdf_dump.txt', 'w', encoding='utf-8') as f:
            f.write(full_text)
        print("Done.")
            
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
else:
    print(f"File not found: {pdf_path}")
