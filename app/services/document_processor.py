from pypdf import PdfReader
from docx import Document as DocxDocument
from openpyxl import load_workbook
from io import BytesIO
from typing import Optional


async def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        pdf = PdfReader(BytesIO(file_content))
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception:
        return ""


async def extract_text_from_docx(file_content: bytes) -> str:
    try:
        doc = DocxDocument(BytesIO(file_content))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()
    except Exception:
        return ""


async def extract_text_from_xlsx(file_content: bytes) -> str:
    try:
        wb = load_workbook(BytesIO(file_content), read_only=True)
        text = ""
        for sheet in wb.worksheets:
            for row in sheet.iter_rows(values_only=True):
                text += " ".join([str(cell) for cell in row if cell]) + "\n"
        return text.strip()
    except Exception:
        return ""


async def extract_text(file_content: bytes, mime_type: str) -> Optional[str]:
    if mime_type == "application/pdf":
        return await extract_text_from_pdf(file_content)
    elif mime_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
        return await extract_text_from_docx(file_content)
    elif mime_type in ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]:
        return await extract_text_from_xlsx(file_content)
    elif mime_type.startswith("text/"):
        return file_content.decode('utf-8', errors='ignore')
    return None
