from typing import List, Dict, Any
from fastapi import APIRouter, status, HTTPException
from app.schemas.agent import AgentPromptRequest, AgentExecutionResponse
from app.services.agent_service import AgentService
from app.mcp.tools import get_mcp_tools_manifest

router = APIRouter()


@router.post(
    "/parse",
    response_model=AgentExecutionResponse,
    status_code=status.HTTP_200_OK,
    summary="Parse natural language booking prompt with ReAct Agent and MCP tools",
)
async def parse_prompt_with_agent(request: AgentPromptRequest):
    """
    Parses unstructured appointment request using Groq (LangChain) and Model Context Protocol (MCP) tools.
    Returns:
    - Intermediate ReAct thought trace (Thought -> Action -> Observation -> Decision)
    - Structured appointment JSON ready to auto-populate the frontend form
    - Human-in-the-Loop status
    """
    try:
        return await AgentService.process_booking_request(request.prompt)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ReAct Agent processing failed: {str(e)}"
        )


@router.get(
    "/tools",
    response_model=List[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="List available clinical MCP tools",
)
def list_mcp_tools():
    """Returns Model Context Protocol (MCP) compliant tools specification."""
    return get_mcp_tools_manifest()

