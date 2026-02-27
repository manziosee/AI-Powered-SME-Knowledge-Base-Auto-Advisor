from groq import AsyncGroq
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
from app.core.config import settings
import json

client = AsyncGroq(api_key=settings.GROQ_API_KEY)
embedding_model = SentenceTransformer(settings.HUGGINGFACE_MODEL)


async def generate_embedding(text: str) -> List[float]:
    embedding = embedding_model.encode(text, convert_to_tensor=False)
    return embedding.tolist()


async def summarize_document(text: str) -> str:
    response = await client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": "You are an expert at summarizing business documents. Provide concise, actionable summaries."},
            {"role": "user", "content": f"Summarize this document:\n\n{text[:4000]}"}
        ],
        max_tokens=500,
        temperature=0.3
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
    
    Return ONLY valid JSON with keys: obligations, deadlines, risks, metrics"""
    
    response = await client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": "You are an AI that extracts structured information from business documents. Always respond with valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1000,
        temperature=0.1
    )
    
    try:
        return json.loads(response.choices[0].message.content)
    except:
        return {"obligations": [], "deadlines": [], "risks": [], "metrics": []}


async def answer_query(query: str, context: str) -> str:
    response = await client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": "You are an AI advisor for SMEs. Answer questions based on the provided context."},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
        ],
        max_tokens=500,
        temperature=0.5
    )
    return response.choices[0].message.content


async def classify_document(filename: str, text_preview: str) -> str:
    response = await client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": "Classify documents into: contract, invoice, policy, report, tax_document, hr_document, compliance, or other. Respond with ONE word only."},
            {"role": "user", "content": f"Filename: {filename}\nContent preview: {text_preview[:500]}\n\nClassify this document."}
        ],
        max_tokens=10,
        temperature=0.1
    )
    return response.choices[0].message.content.strip().lower()
