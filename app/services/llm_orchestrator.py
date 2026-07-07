import json
import logging
import hashlib
from typing import AsyncIterator, Optional
from PIL import Image

from app.llm.factory import get_llm_provider
from app.llm.tools import TOOLS_CONFIG, SYSTEM_PROMPT, VQA_TOOL_NAME, CAPTION_TOOL_NAME
from app.llm.base import StreamChunk, ToolCall
from app.ml.inference import ai_pipeline
from app.core.config import settings
from app.llm.fallback_prompts import get_fallback_system_prompt, parse_fallback_tool_call
from app.core.redis import redis_client

logger = logging.getLogger(__name__)

class LLMOrchestrator:
    def __init__(self):
        self.tools = TOOLS_CONFIG
        
    def _format_history(self, db_messages, use_fallback: bool = False) -> list[dict]:
        """Convert DB messages to LLM expected format"""
        base_prompt = SYSTEM_PROMPT
        if use_fallback:
            base_prompt += "\n" + get_fallback_system_prompt(self.tools)
            
        messages = [{"role": "system", "content": base_prompt}]
        
        for msg in db_messages:
            role = msg.role
            content = msg.content or ""
            
            if msg.tool_calls:
                tool_summary = "\n[Tool Results used to form this answer: "
                for tc in msg.tool_calls:
                    tool_summary += f"{tc.get('name')} -> {tc.get('result', 'Success')}; "
                tool_summary += "]\n"
                
                if role == "assistant":
                    content = tool_summary + content
            
            # Squash consecutive messages of the same role
            if messages and messages[-1]["role"] == role:
                messages[-1]["content"] += "\n\n" + content
            else:
                messages.append({"role": role, "content": content})
            
        return messages

    async def generate_title(self, first_user_message: str) -> str:
        """Auto-generate a short title based on the first message"""
        messages = [
            {"role": "system", "content": "You are a title generator. Generate a very short (max 5 words) descriptive title for a chat session that starts with the following message. Respond ONLY with the title string, no quotes, no extra text."},
            {"role": "user", "content": first_user_message}
        ]
        try:
            provider = await get_llm_provider()
            response = await provider.chat(messages=messages, tools=None)
            return response.content.strip('"\' ')
        except Exception as e:
            logger.error(f"Failed to generate title: {e}")
            return "New Chat Session"

    def _get_image_hash(self, image: Image.Image) -> str:
        """Generate a stable hash for PIL Image bytes"""
        try:
            img_bytes = image.tobytes()
            return hashlib.sha256(img_bytes).hexdigest()
        except Exception as e:
            logger.warning(f"Failed to generate image hash: {e}")
            # Fallback to a random/unique string if hashing fails to avoid None/collision
            return str(hash(image))

    async def _get_cached_result(self, cache_key: str) -> Optional[dict]:
        """Fetch result from Redis cache if available"""
        if not redis_client.redis:
            return None
        try:
            cached_res = await redis_client.redis.get(cache_key)
            if cached_res:
                return json.loads(cached_res)
        except Exception as e:
            logger.warning(f"Cache lookup failed for key {cache_key}: {e}")
        return None

    async def _set_cached_result(self, cache_key: str, data: dict, expiry: int = 3600):
        """Set result to Redis cache"""
        if not redis_client.redis:
            return
        try:
            await redis_client.redis.set(cache_key, json.dumps(data), ex=expiry)
        except Exception as e:
            logger.warning(f"Cache set failed for key {cache_key}: {e}")

    async def stream_chat(self, db_history: list, current_message: str, current_image: Image.Image = None) -> AsyncIterator[StreamChunk]:
        """
        Handle a chat turn, managing tool calls if the LLM requests them.
        """
        # Always default to true for modern LLMs configured in settings
        use_fallback = False 
        messages = self._format_history(db_history, use_fallback=use_fallback)
        provider = await get_llm_provider()
        
        # Also squash the current message if the last one in history was also "user"
        if messages[-1]["role"] == "user":
            messages[-1]["content"] += "\n\n" + current_message
        else:
            messages.append({"role": "user", "content": current_message})
        
        iteration = 0
        max_iterations = 3
        
        while iteration < max_iterations:
            iteration += 1
            
            # 1. Start streaming from LLM
            tools_to_pass = self.tools if not use_fallback else None
            stream = provider.chat_stream(messages, tools=tools_to_pass)
            
            tool_calls = []
            accumulated_content = ""
            
            # 2. Yield chunks to client, collect tool calls
            async for chunk in stream:
                if chunk.tool_calls:
                    tool_calls.extend(chunk.tool_calls)
                    yield chunk
                elif chunk.content:
                    accumulated_content += chunk.content
                    # Only yield content if we are not potentially buffering a JSON payload (fallback)
                    if use_fallback and accumulated_content.strip().startswith("{"):
                        pass # Buffering for JSON check
                    else:
                        yield chunk
                elif chunk.is_done and not tool_calls:
                    # Check fallback before done
                    if use_fallback and accumulated_content.strip().startswith("{"):
                        fallback_tc = parse_fallback_tool_call(accumulated_content)
                        if fallback_tc:
                            for ftc in fallback_tc:
                                tc_obj = ToolCall(id=ftc["id"], name=ftc["name"], arguments=ftc["arguments"])
                                tool_calls.append(tc_obj)
                            yield StreamChunk(tool_calls=tool_calls)
                        else:
                             yield StreamChunk(content=accumulated_content)
                    
                    yield chunk
                    if not tool_calls:
                        return
                    
            # 3. If LLM requested tools, execute them
            if tool_calls:
                # Add strictly compliant assistant message
                ast_msg = {
                    "role": "assistant",
                    "content": accumulated_content if use_fallback else ""
                }
                if not use_fallback:
                    ast_msg["tool_calls"] = [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {"name": tc.name, "arguments": json.dumps(tc.arguments)}
                        } for tc in tool_calls
                    ]
                messages.append(ast_msg)
                
                for tc in tool_calls:
                    tool_name = tc.name
                    args = tc.arguments
                    result_str = ""
                    
                    if not current_image:
                        result_str = "Error: No image available in this session. Ask the user to upload one."
                    elif tool_name in (VQA_TOOL_NAME, CAPTION_TOOL_NAME):
                        img_hash = self._get_image_hash(current_image)
                        
                        if tool_name == VQA_TOOL_NAME:
                            question = args.get("question", "")
                            logger.info(f"Executing tool {VQA_TOOL_NAME} with question: {question}")
                            
                            q_hash = hashlib.sha256(question.encode('utf-8')).hexdigest()
                            cache_key = f"inference:predict:{img_hash}:{q_hash}"
                            
                            cached_data = await self._get_cached_result(cache_key)
                            if cached_data:
                                logger.info(f"Returning cached VQA tool result for: {question}")
                                result_str = f"Answer: {cached_data['answer']} (Confidence: {cached_data['confidence']:.2f})"
                            else:
                                try:
                                    res = ai_pipeline.predict(current_image, question)
                                    result_str = f"Answer: {res['answer']} (Confidence: {res['confidence']:.2f})"
                                    await self._set_cached_result(cache_key, {
                                        "answer": res["answer"],
                                        "confidence": res["confidence"]
                                    })
                                except Exception as e:
                                    result_str = f"Error running VQA tool: {str(e)}"
                                    
                        elif tool_name == CAPTION_TOOL_NAME:
                            logger.info(f"Executing tool {CAPTION_TOOL_NAME}")
                            
                            cache_key = f"inference:caption:{img_hash}"
                            cached_data = await self._get_cached_result(cache_key)
                            if cached_data:
                                logger.info("Returning cached Captioning tool result")
                                result_str = f"Caption: {cached_data['caption']}"
                            else:
                                try:
                                    res = ai_pipeline.generate_caption(current_image)
                                    result_str = f"Caption: {res['caption']}"
                                    await self._set_cached_result(cache_key, {
                                        "caption": res["caption"]
                                    })
                                except Exception as e:
                                    result_str = f"Error running Caption tool: {str(e)}"
                    else:
                        result_str = f"Error: Unknown tool {tool_name}"
                        
                    yield StreamChunk(content=f"\n*[Tool {tool_name} returned: {result_str}]*\n")
                    
                    # Add strictly compliant tool result message
                    tool_msg = {
                        "role": "user" if use_fallback else "tool",
                        "content": f"Tool {tool_name} result: {result_str}" if use_fallback else result_str
                    }
                    if not use_fallback:
                        tool_msg["tool_call_id"] = tc.id
                        
                    messages.append(tool_msg)
            else:
                break
                
llm_orchestrator = LLMOrchestrator()
