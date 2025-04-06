from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
from pydantic import BaseModel
from dotenv import load_dotenv
from workflow import RAGWorkflow, get_llama_parser

load_dotenv()

router = APIRouter()

class ProcessFormRequest(BaseModel):
    """Request model for processing a medical information form"""
    input_path: str
    input_path_id: str
    document_path: str
    use_existing_index: bool = True
    input_filter_ids: List[str]

@router.post("/process-form")
async def process_form(
    request: ProcessFormRequest
) -> Dict[str, Any]:
    """
    Process a visa application form using LlamaIndex.
    
    Parameters:
    - input_path: Path to the medical information document of the person
    - input_path_id: Unique identifier for the document
    - document_path: Path to the application form to be filled
    - use_existing_index: Whether to use existing index if available
    - input_filter_ids: List of document IDs to query against
    """
    try:
        workflow = RAGWorkflow(timeout=120, verbose=False)
        result = await workflow.run(
            input_path=request.input_path,
            input_path_id=request.input_path_id,
            document_path=request.document_path,
            use_existing_index=request.use_existing_index,
            input_filter_ids=request.input_filter_ids
        )

        return {
            "success": True,
            "result": result
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )

class ParseFieldsRequest(BaseModel):
    visa_form_path: str

@router.post("/parse-fields")
async def parse_fields(request: ParseFieldsRequest):
    llama_parser = get_llama_parser()
    try:
        res = llama_parser.load_data(request.visa_form_path)[0]
        return {
            "success": True,
            "result": res.text
        }
    except Exception as e:
        print("Error parsing fields:", e)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )
    