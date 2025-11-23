from fastapi import APIRouter, HTTPException, status, Depends
from uuid import UUID

from app.services.rag_service import rag_service
from app.services.generator import generator_service # <--- NEW
from app.services import parser as doc_parser
from app import schemas_ai

router = APIRouter()

def get_rag_service():
    if not rag_service:
        raise HTTPException(status_code=503, detail="RAG service unavailable")
    return rag_service

@router.post("/process-file", status_code=status.HTTP_200_OK)
async def process_file(
    req: schemas_ai.FileProcessingRequest,
    rag: rag_service = Depends(get_rag_service)
):
    print(f"Processing file {req.filename}")
    if req.filename.endswith('.pdf'):
        docs = doc_parser.parse_pdf(req.file_path, req.filename)
    elif req.filename.endswith('.docx'):
        docs = doc_parser.parse_docx(req.file_path, req.filename)
    else:
        docs = doc_parser.parse_txt(req.file_path, req.filename)
        
    text_chunks = [doc.page_content for doc in docs]
    metadata_list = [doc.metadata for doc in docs]
    
    await rag.process_and_embed_chunks(str(req.workspace_id), req.source_id, text_chunks, metadata_list)
    return {"status": "COMPLETED"}

@router.post("/process-qa", status_code=status.HTTP_200_OK)
async def process_qa(req: schemas_ai.QASProcessingRequest, rag: rag_service = Depends(get_rag_service)):
    docs = doc_parser.chunk_qna(req.qa_in, "Q&A")
    await rag.process_and_embed_chunks(str(req.workspace_id), req.source_id, [d.page_content for d in docs], [d.metadata for d in docs])
    return {"status": "COMPLETED"}

@router.post("/process-article", status_code=status.HTTP_200_OK)
async def process_article(req: schemas_ai.ArticleProcessingRequest, rag: rag_service = Depends(get_rag_service)):
    docs = doc_parser.chunk_article(req.article_in)
    await rag.process_and_embed_chunks(str(req.workspace_id), req.source_id, [d.page_content for d in docs], [d.metadata for d in docs])
    return {"status": "COMPLETED"}

@router.post("/delete-embeddings")
async def delete_embeddings(req: schemas_ai.EmbeddingDeleteRequest, rag: rag_service = Depends(get_rag_service)):
    await rag.delete_embeddings(req.collection_name, req.source_id)
    return {"status": "DELETED"}

@router.post("/query", response_model=schemas_ai.QueryResponse)
async def query_ai_service(
    req: schemas_ai.QueryRequest,
    rag: rag_service = Depends(get_rag_service)
):
    answer, sources, emotion = await rag.answer_query(
        workspace_id=req.workspace_id,
        question=req.question,
        session_id=req.session_id
    )
    return schemas_ai.QueryResponse(
        answer=answer,
        sources=sources,
        emotion=emotion # Возвращаем эмоцию
    )

# --- НОВЫЙ ЭНДПОИНТ ---
@router.post("/generate-quiz", response_model=schemas_ai.GenerateQuizResponse)
async def generate_quiz(
    req: schemas_ai.GenerateQuizRequest
):
    """Генерирует тест по тексту"""
    questions = await generator_service.generate_quiz(req.text_content)
    return schemas_ai.GenerateQuizResponse(questions=questions)