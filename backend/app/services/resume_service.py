from pypdf import PdfReader


def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text content from a PDF file using pypdf."""
    text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        raise ValueError(f"Failed to extract text from PDF: {str(e)}")

    if not text.strip():
        raise ValueError("No text content found in the PDF. The file may be image-based or empty.")

    return text.strip()
