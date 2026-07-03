import json
import re
from typing import List, Dict

def get_fallback_system_prompt(tools_config: List[Dict]) -> str:
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
    try:
        # Extract json from markdown if present
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        data_str = match.group(1) if match else content.strip()
        
        data = json.loads(data_str)
        if isinstance(data, dict) and "tool_call" in data:
            tc = data["tool_call"]
            if "name" in tc and "arguments" in tc:
                args = tc["arguments"]
                if isinstance(args, str):
                    try: args = json.loads(args)
                    except: pass
                return [{
                    "id": "fallback_call",
                    "name": tc["name"],
                    "arguments": args
                }]
    except Exception:
        pass
    return None
