from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
from pydantic import BaseModel
from dotenv import load_dotenv
from workflow import RAGWorkflow

load_dotenv()

router = APIRouter()

class ProcessFormRequest(BaseModel):
    """Request model for processing a visa application form"""
    visa_info: str
    visa_id: str
    application_form: str
    use_existing_index: bool = True
    visa_filter_ids: List[str]

@router.post("/process-form")
async def process_form(
    request: ProcessFormRequest
) -> Dict[str, Any]:
    """
    Process a visa application form using LlamaIndex.
    
    Parameters:
    - visa_info: Path or content of the visa information document
    - visa_id: Unique identifier for this visa document
    - application_form: Path to the application form to be filled
    - use_existing_index: Whether to use existing index if available
    - visa_filter_ids: List of visa IDs to query against
    """
    try:
        workflow = RAGWorkflow(timeout=120, verbose=False)
        result = await workflow.run(
            visa_info=request.visa_info,
            visa_id=request.visa_id,
            application_form=request.application_form,
            use_existing_index=request.use_existing_index,
            visa_filter_ids=request.visa_filter_ids
        )
        
        return {
            "success": True,
            "result": result.result if hasattr(result, 'result') else str(result)
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )
