from openai import AsyncOpenAI
from typing import List, Dict, Any
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_embedding(text: str) -> List[float]:
    response = await client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding


async def summarize_document(text: str) -> str:
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are an expert at summarizing business documents. Provide concise, actionable summaries."},
            {"role": "user", "content": f"Summarize this document:\n\n{text[:4000]}"}
        ],
        max_tokens=500
    )
    return response.choices[0].message.content


async def extract_knowledge(text: str, document_type: str) -> Dict[str, Any]:
    prompt = f"""Extract key information from this {document_type} document:
    - Obligations and responsibilities
    - Important deadlines
    - Risks or compliance issues
    - Key metrics or financial data
    
    Document text:
    {text[:4000]}
    
    Return as JSON with keys: obligations, deadlines, risks, metrics"""
    
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are an AI that extracts structured information from business documents."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        max_tokens=1000
    )
    
    import json
    return json.loads(response.choices[0].message.content)


async def answer_query(query: str, context: str) -> str:
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are an AI advisor for SMEs. Answer questions based on the provided context."},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
        ],
        max_tokens=500
    )
    return response.choices[0].message.content


async def classify_document(filename: str, text_preview: str) -> str:
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "Classify documents into: contract, invoice, policy, report, tax_document, hr_document, compliance, or other."},
            {"role": "user", "content": f"Filename: {filename}\nContent preview: {text_preview[:500]}\n\nClassify this document."}
        ],
        max_tokens=50
    )
    return response.choices[0].message.content.strip().lower()
