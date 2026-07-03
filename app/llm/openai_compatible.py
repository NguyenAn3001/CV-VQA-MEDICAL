from typing import List, Dict, Optional, AsyncIterator
import json
import logging
import httpx
from openai import AsyncOpenAI

from app.llm.base import BaseLLMProvider, LLMResponse, ToolCall, StreamChunk

logger = logging.getLogger(__name__)

async def prepare_request(request: httpx.Request):
    # Set a standard web browser User-Agent
    request.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    # Remove x-stainless-* headers which get blocked by WAFs
    for key in list(request.headers.keys()):
        if key.lower().startswith("x-stainless"):
            del request.headers[key]

    logger.debug(f"HTTP Request: {request.method} {request.url}")

async def log_response(response: httpx.Response):
    logger.debug(f"HTTP Response: {response.status_code} {response.url}")

class OpenAICompatibleProvider(BaseLLMProvider):
    def __init__(self, base_url: str, api_key: str, model: str, temperature: float = 0.3, max_tokens: int = 1024, timeout: int = 120, supports_tool_calling: bool = True):
        # Allow empty API key for local providers like Ollama
        api_key = api_key if api_key else "not-needed"
        
        http_client = httpx.AsyncClient(
            event_hooks={'request': [prepare_request], 'response': [log_response]},
            timeout=timeout
        )
        
        self.client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key,
            http_client=http_client
        )
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.supports_tool_calling = supports_tool_calling

    async def chat(self, messages: List[Dict[str, str]], tools: Optional[List[Dict]] = None) -> LLMResponse:
        params = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }
        
        if tools and self.supports_tool_calling:
            params["tools"] = tools
            params["tool_choice"] = "auto"

        try:
            response = await self.client.chat.completions.create(**params)
            message = response.choices[0].message
            
            tool_calls = None
            has_tool_calls = False
            
            if message.tool_calls:
                has_tool_calls = True
                tool_calls = []
                for tc in message.tool_calls:
                    try:
                        args = json.loads(tc.function.arguments)
                    except json.JSONDecodeError:
                        args = {}
                    tool_calls.append(ToolCall(
                        id=tc.id,
                        name=tc.function.name,
                        arguments=args
                    ))

            return LLMResponse(
                content=message.content or "",
                tool_calls=tool_calls,
                has_tool_calls=has_tool_calls
            )
        except Exception as e:
            logger.error(f"Error calling OpenAI-compatible LLM: {e}")
            raise

    async def chat_stream(self, messages: List[Dict[str, str]], tools: Optional[List[Dict]] = None) -> AsyncIterator[StreamChunk]:
        params = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": True
        }
        
        if tools and self.supports_tool_calling:
            params["tools"] = tools
            params["tool_choice"] = "auto"

        try:
            stream = await self.client.chat.completions.create(**params)
            
            current_tool_calls = {}
            
            async for chunk in stream:
                if len(chunk.choices) == 0:
                    continue
                    
                delta = chunk.choices[0].delta
                
                # Handle text content
                if delta.content:
                    yield StreamChunk(content=delta.content)
                    
                # Handle tool calls in stream
                if delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in current_tool_calls:
                            current_tool_calls[idx] = {
                                "id": tc.id,
                                "name": tc.function.name,
                                "arguments": ""
                            }
                        if tc.function.arguments:
                            current_tool_calls[idx]["arguments"] += tc.function.arguments
                            
            # If we collected tool calls, emit them at the end
            if current_tool_calls:
                final_tool_calls = []
                for idx, tc in current_tool_calls.items():
                    try:
                        args = json.loads(tc["arguments"])
                    except json.JSONDecodeError:
                        args = {}
                    final_tool_calls.append(ToolCall(
                        id=tc["id"],
                        name=tc["name"],
                        arguments=args
                    ))
                yield StreamChunk(tool_calls=final_tool_calls)
                
            # Signal done
            yield StreamChunk(is_done=True)
            
        except Exception as e:
            logger.error(f"Error streaming from OpenAI-compatible LLM: {e}")
            raise
