from google import genai
from google.genai import types
from typing import List, Dict, Optional, AsyncIterator
import json
import logging

from app.llm.base import BaseLLMProvider, LLMResponse, ToolCall, StreamChunk

logger = logging.getLogger(__name__)

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str, temperature: float = 0.3, max_tokens: int = 1024):
        self.client = genai.Client(api_key=api_key)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def _convert_messages(self, messages: List[Dict[str, str]]) -> List[types.Content]:
        """Convert standard OpenAI message format to Gemini format"""
        gemini_messages = []
        system_instruction = None
        
        for msg in messages:
            role = msg["role"]
            content = msg.get("content", "")
            
            if role == "system":
                # Gemini handles system instructions differently
                system_instruction = content
            elif role == "user":
                gemini_messages.append(types.Content(role="user", parts=[types.Part.from_text(text=content)]))
            elif role == "assistant":
                if "tool_calls" in msg:
                    # Not handling tool call history perfectly here for brevity, 
                    # requires parsing the specific function call parts
                    parts = []
                    for tc in msg["tool_calls"]:
                        parts.append(types.Part.from_function_call(name=tc["function"]["name"], args=json.loads(tc["function"]["arguments"])))
                    gemini_messages.append(types.Content(role="model", parts=parts))
                else:
                    gemini_messages.append(types.Content(role="model", parts=[types.Part.from_text(text=content)]))
            elif role == "tool":
                parts = [types.Part.from_function_response(name=msg["name"], response={"result": msg["content"]})]
                gemini_messages.append(types.Content(role="function", parts=parts))
                
        return gemini_messages, system_instruction

    def _convert_tools(self, tools: List[Dict]) -> List[types.Tool]:
        """Convert OpenAI tool format to Gemini format"""
        if not tools:
            return None
            
        gemini_tools = []
        for t in tools:
            func = t["function"]
            
            # Simple conversion, real implementation needs full JSON Schema parsing to types.Schema
            # For our specific tools (VQA has 1 string param, Caption has 0), this is a simplified version
            properties = {}
            required = func.get("parameters", {}).get("required", [])
            
            for prop_name, prop_details in func.get("parameters", {}).get("properties", {}).items():
                prop_type = "STRING" if prop_details.get("type") == "string" else "OBJECT"
                properties[prop_name] = types.Schema(
                    type=prop_type,
                    description=prop_details.get("description", "")
                )
            
            schema = types.Schema(
                type="OBJECT",
                properties=properties,
                required=required
            ) if properties else None
                
            decl = types.FunctionDeclaration(
                name=func["name"],
                description=func["description"],
                parameters=schema
            )
            gemini_tools.append(types.Tool(function_declarations=[decl]))
            
        return gemini_tools

    async def chat(self, messages: List[Dict[str, str]], tools: Optional[List[Dict]] = None) -> LLMResponse:
        gemini_messages, system_instruction = self._convert_messages(messages)
        gemini_tools = self._convert_tools(tools)
        
        config = types.GenerateContentConfig(
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
            system_instruction=system_instruction,
            tools=gemini_tools
        )

        try:
            # Using async client method
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=gemini_messages,
                config=config
            )
            
            content = ""
            tool_calls = None
            has_tool_calls = False
            
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.text:
                        content += part.text
                    elif part.function_call:
                        has_tool_calls = True
                        if not tool_calls:
                            tool_calls = []
                        # Convert dict/proto args to Python dict
                        args_dict = {k: v for k, v in part.function_call.args.items()} if part.function_call.args else {}
                        tool_calls.append(ToolCall(
                            id=f"call_{part.function_call.name}", # Gemini doesn't provide IDs like OpenAI
                            name=part.function_call.name,
                            arguments=args_dict
                        ))

            return LLMResponse(
                content=content,
                tool_calls=tool_calls,
                has_tool_calls=has_tool_calls
            )
        except Exception as e:
            logger.error(f"Error calling Gemini: {e}")
            raise

    async def chat_stream(self, messages: List[Dict[str, str]], tools: Optional[List[Dict]] = None) -> AsyncIterator[StreamChunk]:
        gemini_messages, system_instruction = self._convert_messages(messages)
        gemini_tools = self._convert_tools(tools)
        
        config = types.GenerateContentConfig(
            temperature=self.temperature,
            max_output_tokens=self.max_tokens,
            system_instruction=system_instruction,
            tools=gemini_tools
        )

        try:
            stream = self.client.aio.models.generate_content_stream(
                model=self.model,
                contents=gemini_messages,
                config=config
            )
            
            final_tool_calls = []
            
            async for chunk in stream:
                if chunk.candidates and chunk.candidates[0].content.parts:
                    for part in chunk.candidates[0].content.parts:
                        if part.text:
                            yield StreamChunk(content=part.text)
                        elif part.function_call:
                            # Gemini sends full function calls in the stream, not delta chunks
                            args_dict = {k: v for k, v in part.function_call.args.items()} if part.function_call.args else {}
                            final_tool_calls.append(ToolCall(
                                id=f"call_{part.function_call.name}",
                                name=part.function_call.name,
                                arguments=args_dict
                            ))
                            
            if final_tool_calls:
                yield StreamChunk(tool_calls=final_tool_calls)
                
            yield StreamChunk(is_done=True)
            
        except Exception as e:
            logger.error(f"Error streaming from Gemini: {e}")
            raise
