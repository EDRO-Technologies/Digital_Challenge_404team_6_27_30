import httpx
import json
import re
from typing import List
from app.core.config import settings
from app import schemas_ai

class QuizGenerator:
    def __init__(self):
        # Увеличиваем таймаут до 300 секунд (5 минут), так как Llama на CPU может быть медленной
        self.ollama_client = httpx.AsyncClient(base_url=str(settings.OLLAMA_HOST), timeout=300.0)

    def _clean_json_response(self, text: str) -> str:
        """
        Очищает ответ LLM от Markdown разметки (```json ... ```)
        """
        print(f"[Generator DEBUG] Cleaning text: {text[:100]}...") # Log start of text
        
        # 1. Пытаемся найти блок кода ```json ... ```
        match = re.search(r"```json\s*([\s\S]*?)\s*```", text)
        if match:
            return match.group(1)
        
        # 2. Пытаемся найти блок кода ``` ... ```
        match = re.search(r"```\s*([\s\S]*?)\s*```", text)
        if match:
            return match.group(1)
            
        # 3. Пытаемся найти просто массив JSON [...]
        # Ищем от первой [ до последней ]
        start = text.find('[')
        end = text.rfind(']')
        
        if start != -1 and end != -1 and end > start:
            return text[start:end+1]
            
        return text.strip()

    async def generate_quiz(self, text_content: str) -> List[schemas_ai.GeneratedQuestion]:
        """
        Генерирует вопросы на основе переданного текста.
        """
        prompt = f"""
        You are a quiz generator. 
        Task: Create 3 multiple-choice questions based on the text below.
        Output format: A raw JSON list of objects. NO introduction, NO markdown formatting, just the JSON array.
        
        [Text]
        {text_content[:3000]} 
        
        [JSON Schema]
        [
            {{
                "question_text": "Question?",
                "options": [
                    {{"text": "Option 1", "is_correct": false}},
                    {{"text": "Option 2", "is_correct": true}}
                ]
            }}
        ]
        """

        print(f"[Generator] Sending request to Ollama ({settings.LLM_MODEL_NAME})...")
        
        try:
            # Используем format="json" для принудительного JSON режима
            response = await self.ollama_client.post("/api/generate", json={
                "model": settings.LLM_MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "format": "json", 
                "options": {
                    "temperature": 0.1 # Минимальная температура для строгости
                }
            })
            response.raise_for_status()
            
            result_text = response.json().get("response", "")
            
            # --- DEBUG LOG: Самое важное! ---
            print(f"\n[DEBUG] OLLAMA RAW RESPONSE:\n{result_text}\n[END DEBUG]\n")
            # --------------------------------

            # Очистка и парсинг
            cleaned_json = self._clean_json_response(result_text)
            questions_data = json.loads(cleaned_json)
            
            # Если вернулся dict вместо list (бывает, если модель обернула в корень)
            if isinstance(questions_data, dict):
                for key in ["questions", "quiz", "test"]:
                    if key in questions_data and isinstance(questions_data[key], list):
                        questions_data = questions_data[key]
                        break
            
            if not isinstance(questions_data, list):
                print(f"[Generator] Error: Model returned {type(questions_data)} instead of list")
                return []

            # Валидируем через Pydantic
            questions = [schemas_ai.GeneratedQuestion(**q) for q in questions_data]
            print(f"[Generator] Successfully parsed {len(questions)} questions")
            return questions

        except json.JSONDecodeError as e:
            print(f"[Generator] JSON Parsing Error: {e}")
            print(f"[Generator] Faulty JSON: {cleaned_json}")
            return []
        except Exception as e:
            print(f"[Generator] General Error: {e}")
            return []

generator_service = QuizGenerator()