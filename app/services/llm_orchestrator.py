import json
import logging
from typing import AsyncIterator
from PIL import Image

from app.llm.factory import get_llm_provider
from app.llm.tools import TOOLS_CONFIG, SYSTEM_PROMPT, VQA_TOOL_NAME, CAPTION_TOOL_NAME
from app.llm.base import StreamChunk
from app.ml.inference import ai_pipeline

logger = logging.getLogger(__name__)

class LLMOrchestrator:
    def __init__(self):
        self.provider = get_llm_provider()
        self.tools = TOOLS_CONFIG
        
    def _format_history(self, db_messages) -> list[dict]:
        """Convert DB messages to LLM expected format"""
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        for msg in db_messages:
            role = msg.role
            content = msg.content
            
            # Simple message appending for now
            # Note: A full robust implementation would reconstruct tool calls and tool responses
            # to maintain exact LLM state, but this suffices for many cases.
            if msg.tool_calls:
                # Add context about what tools were used and results
                tool_summary = "\n[Tool Results used to form this answer: "
                for tc in msg.tool_calls:
                    tool_summary += f"{tc.get('name')} -> {tc.get('result')}; "
                tool_summary += "]\n"
                
                # Append tool summary to user message just before it, or append to assistant content
                if role == "assistant":
                    content = tool_summary + content
                    
            messages.append({"role": role, "content": content})
            
        return messages

    async def generate_title(self, first_user_message: str) -> str:
        """Auto-generate a short title based on the first message"""
        messages = [
            {"role": "system", "content": "You are a title generator. Generate a very short (max 5 words) descriptive title for a chat session that starts with the following message. Respond ONLY with the title string, no quotes, no extra text."},
            {"role": "user", "content": first_user_message}
        ]
        try:
            response = await self.provider.chat(messages=messages, tools=None)
            return response.content.strip('"\' ')
        except Exception as e:
            logger.error(f"Failed to generate title: {e}")
            return "New Chat Session"

    async def stream_chat(self, db_history: list, current_message: str, current_image: Image.Image = None) -> AsyncIterator[StreamChunk]:
        """
        Handle a chat turn, managing tool calls if the LLM requests them.
        """
        messages = self._format_history(db_history)
        messages.append({"role": "user", "content": current_message})
        
        iteration = 0
        max_iterations = 3 # Prevent infinite tool loops
        
        while iteration < max_iterations:
            iteration += 1
            
            # 1. Start streaming from LLM
            stream = self.provider.chat_stream(messages, tools=None)
            
            tool_calls = []
            
            # 2. Yield chunks to client, collect tool calls
            async for chunk in stream:
                if chunk.tool_calls:
                    tool_calls.extend(chunk.tool_calls)
                    yield chunk
                elif chunk.content:
                    yield chunk
                elif chunk.is_done and not tool_calls:
                    yield chunk
                    return # We are completely done
                    
            # 3. If LLM requested tools, execute them
            if tool_calls:
                # We need to simulate adding the assistant's tool call request to the message history
                # This depends on exact provider format, simplified here:
                messages.append({
                    "role": "assistant",
                    "content": None,
                    # We'd normally attach tool_calls here for OpenAI exact format, 
                    # but for our simplified retry loop we just append tool results as user/tool messages.
                })
                
                for tc in tool_calls:
                    tool_name = tc.name
                    args = tc.arguments
                    result_str = ""
                    
                    if not current_image:
                        result_str = "Error: No image available in this session. Ask the user to upload one."
                    elif tool_name == VQA_TOOL_NAME:
                        question = args.get("question", "")
                        logger.info(f"Executing tool {VQA_TOOL_NAME} with question: {question}")
                        try:
                            # Run ML Inference!
                            res = ai_pipeline.predict(current_image, question)
                            result_str = f"Answer: {res['answer']} (Confidence: {res['confidence']:.2f})"
                        except Exception as e:
                            result_str = f"Error running VQA tool: {str(e)}"
                    elif tool_name == CAPTION_TOOL_NAME:
                        logger.info(f"Executing tool {CAPTION_TOOL_NAME}")
                        try:
                            res = ai_pipeline.generate_caption(current_image)
                            result_str = f"Caption: {res['caption']}"
                        except Exception as e:
                            result_str = f"Error running Caption tool: {str(e)}"
                    else:
                        result_str = f"Error: Unknown tool {tool_name}"
                        
                    # Yield tool result to client (optional, for UI debug)
                    yield StreamChunk(content=f"\n*[Tool {tool_name} returned: {result_str}]*\n")
                    
                    # Append result to messages for the next LLM iteration
                    messages.append({
                        "role": "tool",
                        "name": tool_name,
                        "content": result_str
                    })
                    
                # Loop continues, sending tools results back to LLM to get final text response
            else:
                # No tool calls, generation is done
                break
                
llm_orchestrator = LLMOrchestrator()
