import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
import json
import logging

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

router = APIRouter()
logger = logging.getLogger(__name__)

class FactCheckRequest(BaseModel):
    text: str

class FactCheckResponse(BaseModel):
    verdict: str
    explanation: str
    raw: dict | None = None

@router.post("/fact-check", response_model=FactCheckResponse)
async def fact_check(req: FactCheckRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured on server")

    combined_prompt = (
        "You are a strict fact-check assistant. "
        "Return a short JSON object with keys 'verdict' (True/False/Uncertain) "
        "and 'explanation' (1-2 sentences with optional sources).\n\n"
        f"Fact check this claim:\n{req.text}\n\n"
        "Respond only in pure JSON format."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": combined_prompt}
                ]
            }
        ]
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

    try:
        limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        async with httpx.AsyncClient(
            timeout=30, 
            limits=limits,
            follow_redirects=True
        ) as client:
            resp = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json=payload
            )
            
            if resp.status_code != 200:
                error_detail = resp.text
                logger.error(f"Gemini API error: {error_detail}")
                raise HTTPException(
                    status_code=502, 
                    detail=f"Gemini API error: {resp.status_code} - {error_detail}"
                )

            result = resp.json()
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Gemini API request timed out")
    except httpx.ConnectError as e:
        logger.error(f"Connection error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Failed to connect to Gemini API: {str(e)}")
    except httpx.RequestError as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Request error: {str(e)}")
    
    try:
        assistant_text = (
            result.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
                .strip()
        )
    except (IndexError, KeyError) as e:
        logger.error(f"Unexpected response format: {result}")
        raise HTTPException(status_code=502, detail="Unexpected response format from Gemini API")

    try:
        if assistant_text.startswith("```json"):
            assistant_text = assistant_text.split("```json")[1].split("```")[0].strip()
        elif assistant_text.startswith("```"):
            assistant_text = assistant_text.split("```")[1].split("```")[0].strip()
            
        parsed = json.loads(assistant_text)
        
        
        verdict_raw = parsed.get("verdict", "Uncertain")
        if isinstance(verdict_raw, bool):
            verdict = "True" if verdict_raw else "False"
        else:
            verdict = str(verdict_raw)
            
        explanation = parsed.get("explanation", assistant_text)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse JSON: {assistant_text}")
        verdict = "Uncertain"
        explanation = assistant_text if assistant_text else "Failed to get a response"

    return {"verdict": verdict, "explanation": explanation, "raw": result}