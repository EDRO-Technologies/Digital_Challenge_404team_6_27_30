import httpx
from fastapi import HTTPException, status
from uuid import UUID
from typing import List, Tuple, Optional, Dict, Any
import asyncio
import json

from app.core.config import settings
from app.core.database import AsyncSessionFactory
from app import schemas, models

class AIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.AsyncClient(base_url=str(base_url), timeout=300.0)
        print(f"[AI Client] Initialized for {self.base_url}")

    async def _post(self, endpoint: str, json_data: dict) -> dict:
        try:
            response = await self.client.post(endpoint, json=json_data, timeout=300.0)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[AI Client] Error POST {endpoint}: {e}")
            raise HTTPException(status_code=503, detail=f"AI Service unavailable: {e}")

    async def process_file(self, workspace_id: UUID, source_id: UUID, file_path: str, filename: str):
        payload = {"workspace_id": str(workspace_id), "source_id": str(source_id), "file_path": file_path, "filename": filename}
        await self._post(f"{settings.API_V1_STR_AI}/process-file", payload)

    async def process_qa(self, workspace_id: UUID, source_id: UUID, qa_in: Any):
        payload = {"workspace_id": str(workspace_id), "source_id": str(source_id), "qa_in": qa_in.model_dump()}
        await self._post(f"{settings.API_V1_STR_AI}/process-qa", payload)

    async def process_article(self, workspace_id: UUID, source_id: UUID, article_in: Any):
        payload = {"workspace_id": str(workspace_id), "source_id": str(source_id), "article_in": article_in.model_dump()}
        await self._post(f"{settings.API_V1_STR_AI}/process-article", payload)

    async def delete_embeddings(self, collection_name: str, source_id: UUID):
        payload = {"collection_name": collection_name, "source_id": str(source_id)}
        await self._post(f"{settings.API_V1_STR_AI}/delete-embeddings", payload)

    async def answer_query(
            self, workspace_id: UUID, question: str, session_id: UUID
    ) -> Tuple[str, List[schemas.QueryResponseSource], str]: 
        payload = {
            "workspace_id": str(workspace_id),
            "question": question,
            "session_id": str(session_id)
        }
        response_json = await self._post(f"{settings.API_V1_STR_AI}/query", json_data=payload)
        answer = response_json.get("answer", "Ошибка AI")
        sources_data = response_json.get("sources", [])
        emotion = response_json.get("emotion", "neutral") 
        sources = [schemas.QueryResponseSource(**s) for s in sources_data]
        return answer, sources, emotion

    # --- ПЕРЕИМЕНОВАЛИ МЕТОД В v2 ЧТОБЫ СБРОСИТЬ КЭШ ---
    async def generate_quiz_v2(self, text_content: str) -> List[Dict[str, Any]]:
        print(f"[AI Client] Requesting quiz generation v2...")
        payload = {"text_content": text_content, "difficulty": "medium"}
        
        try:
            response = await self._post(f"{settings.API_V1_STR_AI}/generate-quiz", json_data=payload)
            questions = response.get("questions", [])
            print(f"[AI Client] Received {len(questions)} questions")
            return questions
        except Exception as e:
            print(f"[AI Client] Gen Error: {e}")
            return []

ai_client = AIClient(base_url=settings.AI_SERVICE_URL)