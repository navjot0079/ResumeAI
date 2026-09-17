import logging
from pypdf import PdfReader
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)

# Minimum character threshold — below this, pypdf output is considered
# too sparse to be a real resume and we fall back to OCR.
MIN_TEXT_LENGTH = 50


def _configure_gemini():
    """Ensure the Gemini client is configured."""
    genai.configure(api_key=settings.GEMINI_API_KEY)


def _extract_with_pypdf(file_path: str) -> str:
    """
    Primary extraction: use pypdf to pull the text layer from the PDF.
    Returns whatever text was found (may be empty for scanned PDFs).
    """
    text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        logger.warning("pypdf extraction failed: %s", e)
    return text.strip()


def _extract_with_gemini_ocr(file_path: str) -> str:
    """
    Fallback extraction: upload the PDF to Gemini's File API and use
    the multimodal vision model to OCR text from scanned/image pages.
    No external system dependencies (Tesseract, Poppler) are needed.
    """
    _configure_gemini()

    uploaded_file = None
    try:
        logger.info("Starting Gemini OCR for: %s", file_path)
        uploaded_file = genai.upload_file(file_path)

        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            [
                uploaded_file,
                (
                    "This is a resume/CV document. Extract ALL text content from "
                    "every page accurately and completely. Preserve the structure "
                    "as much as possible (headings, bullet points, sections). "
                    "Return ONLY the extracted text, no commentary."
                ),
            ]
        )

        ocr_text = response.text.strip()
        logger.info("Gemini OCR extracted %d characters", len(ocr_text))
        return ocr_text

    except Exception as e:
        logger.error("Gemini OCR failed: %s", e)
        raise ValueError(
            f"OCR text extraction failed: {str(e)}. "
            "Please ensure the PDF is a valid resume document."
        )
    finally:
        # Clean up the uploaded file from Gemini storage
        if uploaded_file:
            try:
                genai.delete_file(uploaded_file.name)
            except Exception:
                pass  # best-effort cleanup


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF file.

    Strategy:
      1. Try pypdf (fast, free, no API call).
      2. If the extracted text is too short (< 50 chars), fall back to
         Gemini multimodal OCR to handle scanned/image-based PDFs.
      3. If both methods yield no text, raise an error.
    """
    # --- Step 1: Try pypdf ---
    text = _extract_with_pypdf(file_path)

    if len(text) >= MIN_TEXT_LENGTH:
        logger.info("pypdf extracted %d characters — using direct text", len(text))
        return text

    # --- Step 2: Fall back to Gemini OCR ---
    logger.info(
        "pypdf extracted only %d characters — falling back to Gemini OCR",
        len(text),
    )
    ocr_text = _extract_with_gemini_ocr(file_path)

    if ocr_text and len(ocr_text.strip()) >= MIN_TEXT_LENGTH:
        return ocr_text.strip()

    # --- Step 3: Nothing worked ---
    raise ValueError(
        "No text content could be extracted from the PDF. "
        "The file may be empty, corrupted, or contain only non-text graphics."
    )
