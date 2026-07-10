## Why

Currently, when the LLM orchestrator executes a tool (like VQA or Captioning), it correctly yields the tool's result to the client stream and appends the tool result to the message history. However, in the subsequent loop iteration to get the final answer from the LLM, the message history format may not be correctly recognized by providers (like OpenAI or Gemini), specifically regarding the formatting of `tool_calls` and `tool` roles. This can cause the stream to break or fail silently without returning the final synthesized answer to the user.

## What Changes

- Ensure that the message history appended after a tool call strictly adheres to the format expected by the LLM providers.
- When a tool is called, append an `assistant` message containing the `tool_calls` array, followed immediately by a `tool` role message containing the tool's result and matching `tool_call_id`.
- Ensure that this formatting is compatible across the different providers (OpenAI Compatible and Gemini) supported by the system.

## Capabilities

### New Capabilities
- `llm-tool-streaming-fix`: Robust handling of tool call message history to ensure the LLM receives the correct context to generate a final synthesized response.

### Modified Capabilities
- None

## Impact

- **Affected Code**: `app/services/llm_orchestrator.py` (specifically the `stream_chat` method and how it constructs the `messages` array after tool execution).
- **APIs**: Any endpoint relying on `stream_chat` (e.g., chat API).
- **Systems**: Solves the issue where users do not receive a final answer after the AI uses a tool to analyze an image.