import httpx
import chromadb
from chromadb.config import Settings
from app.core.config import settings

# Важно: название модели должно совпадать с тем, что загружено в Ollama.
# В логах видно "nomic-embed-text-v1.5", поэтому меняем дефолтное значение
EMBEDDING_MODEL_NAME = "nomic-embed-text" 

class RAGService:
    def __init__(self):
        self.chroma_client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=Settings(anonymized_telemetry=False)
        )
        self.ollama_base_url = settings.OLLAMA_BASE_URL

    async def _get_ollama_embeddings(self, texts: list[str], model: str) -> list[list[float]]:
        """Получает эмбеддинги от Ollama."""
        url = f"{self.ollama_base_url}/api/embeddings"
        embeddings = []
        
        async with httpx.AsyncClient() as client:
            for text in texts:
                try:
                    # Некоторые версии Ollama требуют "model" и "prompt"
                    response = await client.post(url, json={
                        "model": model,
                        "prompt": text
                    }, timeout=60.0)
                    response.raise_for_status()
                    embeddings.append(response.json()["embedding"])
                except httpx.HTTPStatusError as e:
                    # Если модель не найдена (404), попробуем fallback или выбросим ошибку
                    print(f"Error requesting embedding for model {model}: {e}")
                    raise e
                except Exception as e:
                    print(f"Connection error to Ollama: {e}")
                    raise e
                    
        return embeddings

    async def process_and_embed_chunks(self, workspace_id: str, source_id: str, chunks: list[str], metadata_list: list[dict]):
        """Создает коллекцию (если нет) и добавляет чанки."""
        collection_name = f"workspace_{workspace_id}"
        
        # Получаем или создаем коллекцию
        collection = self.chroma_client.get_or_create_collection(name=collection_name)

        # Генерируем эмбеддинги
        try:
            embeddings = await self._get_ollama_embeddings(chunks, EMBEDDING_MODEL_NAME)
        except Exception:
             # Fallback: Если базовая модель не найдена, пробуем v1.5 явно, если она в Ollama под таким тегом
             embeddings = await self._get_ollama_embeddings(chunks, "nomic-embed-text-v1.5")

        ids = [f"{source_id}_{i}" for i in range(len(chunks))]
        
        # Добавляем source_id в метаданные
        for meta in metadata_list:
            meta["source_id"] = str(source_id)

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadata_list
        )
        print(f"Successfully added {len(chunks)} chunks to collection {collection_name}")

    async def query_knowledge_base(self, workspace_id: str, query_text: str, n_results: int = 5):
        """Поиск по базе знаний."""
        collection_name = f"workspace_{workspace_id}"
        try:
            collection = self.chroma_client.get_collection(name=collection_name)
        except Exception:
            return [] # Коллекции нет

        # Эмбеддинг запроса
        try:
            query_embedding = (await self._get_ollama_embeddings([query_text], EMBEDDING_MODEL_NAME))[0]
        except Exception:
            query_embedding = (await self._get_ollama_embeddings([query_text], "nomic-embed-text-v1.5"))[0]

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )

        # Форматируем ответ
        formatted_results = []
        if results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                formatted_results.append({
                    "text_chunk": doc,
                    "metadata": results["metadatas"][0][i]
                })
        
        return formatted_results

rag_service = RAGService()