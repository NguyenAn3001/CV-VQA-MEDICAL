import json
from typing import List, Dict

def get_fallback_system_prompt(tools_config: List[Dict]) -> str:
    """
    Generates a fallback system prompt that instructs the LLM to output JSON
    for tool calling when native tool calling is not supported.
    """
    prompt = """
You have access to the following tools. To use a tool, you MUST respond with a JSON object in the following format and NOTHING ELSE:
{"tool_call": {"name": "tool_name", "arguments": {"arg1": "value1"}}}

When you have all the information you need, or if you do not need to use a tool, respond with your final answer normally (without JSON).

Available tools:
"""
    for tool in tools_config:
        if tool.get("type") == "function":
            func = tool.get("function", {})
            name = func.get("name", "")
            desc = func.get("description", "")
            params = func.get("parameters", {})
            
            prompt += f"\n- {name}: {desc}\n  Parameters: {json.dumps(params)}\n"
            
    return prompt

def parse_fallback_tool_call(content: str) -> List[Dict]:
    """
    Attempts to parse a JSON tool call from the LLM's text output.
    Returns a list of ToolCall dictionaries (matching the expected format) or None.
    """
    try:
        # Try to parse the entire content as JSON first
        data = json.loads(content.strip())
        if isinstance(data, dict) and "tool_call" in data:
            tc = data["tool_call"]
            if "name" in tc and "arguments" in tc:
                return [{
                    "id": "fallback_call",
                    "name": tc["name"],
                    "arguments": tc["arguments"]
                }]
    except json.JSONDecodeError:
        pass
        
    return None
