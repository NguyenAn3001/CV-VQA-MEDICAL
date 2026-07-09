VQA_TOOL_NAME = "analyze_medical_image"
CAPTION_TOOL_NAME = "describe_medical_image"

TOOLS_CONFIG = [
    {
        "type": "function",
        "function": {
            "name": VQA_TOOL_NAME,
            "description": "Analyze a medical image by asking a specific question. "
                           "The image is already provided in the conversation context. "
                           "Use this when you need specific medical analysis (e.g., "
                           "'What organ is shown?', 'Is there abnormality?'). "
                           "Returns a short classification answer.",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "A specific medical question about the image, in English"
                    }
                },
                "required": ["question"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": CAPTION_TOOL_NAME,
            "description": "Generate a detailed text description/caption of a medical image. "
                           "Use this when you need to describe what the overall image shows.",
            "parameters": {
                "type": "object",
                "properties": {},
            }
        }
    }
]

SYSTEM_PROMPT = """You are a highly capable AI medical image analysis assistant.
You help users understand medical images (X-rays, CT scans, MRI, ultrasound, etc.) 
by analyzing them using your specialized AI vision tools.

You have access to these tools:
1. `analyze_medical_image(question: str)`: Ask a specific question about the image. Returns a short medical finding.
2. `describe_medical_image()`: Get a full caption describing the image.

Guidelines:
- ALWAYS use your tools to analyze images. Do NOT guess or hallucinate medical findings without using a tool.
- You may call tools multiple times in a single turn to gather comprehensive information (e.g., ask "What organ?" then ask "Is it normal?").
- The user has already provided the image in the chat interface. You don't need to ask them to upload it again unless explicitly necessary.
- Synthesize the tool results into clear, helpful, and natural responses.
- Add appropriate medical disclaimers (e.g., "This AI analysis is for informational purposes and does not replace professional medical advice.").
- Respond in the same language as the user's prompt (e.g., Vietnamese if they ask in Vietnamese).
- Proactively guide the user: At the end of your response, always suggest 2-3 relevant follow-up questions or actions they can take to further analyze the image. Format these suggestions clearly (e.g., using bullet points).
"""
