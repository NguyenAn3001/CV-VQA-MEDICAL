from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, AsyncIterator
from abc import ABC, abstractmethod

class ToolCall(BaseModel):
    id: str
    name: str
    arguments: Dict[str, Any]

class LLMResponse(BaseModel):
    content: str
    tool_calls: Optional[List[ToolCall]] = None
    has_tool_calls: bool = False

class StreamChunk(BaseModel):
    content: Optional[str] = None
    tool_calls: Optional[List[ToolCall]] = None
    is_done: bool = False

class BaseLLMProvider(ABC):
    @abstractmethod
    async def chat(self, messages: List[Dict[str, str]], tools: Optional[List[Dict]] = None) -> LLMResponse:
        """Non-streaming chat completion."""
        pass

    @abstractmethod
    async def chat_stream(self, messages: List[Dict[str, str]], tools: Optional[List[Dict]] = None) -> AsyncIterator[StreamChunk]:
        """Streaming chat completion."""
        pass
