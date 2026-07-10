## Context

In `app/services/llm_orchestrator.py`, the `stream_chat` method handles multi-turn conversations where the LLM might decide to call a tool. 

Currently, when a tool is called, the code does this:
1. Adds an `assistant` message with the `tool_calls` payload.
2. Executes the tool.
3. Yields the result back to the frontend stream so the user sees progress (`*[Tool X returned: Y]*`).
4. Adds a `tool` message with the execution result.
5. Loops back to call the LLM provider again, passing this updated message array so the LLM can synthesize a final answer.

The bug is in step 4. When constructing the `tool` message to append to the `messages` array, the code does this:

```python
tool_msg = {
    "role": "user" if use_fallback else "tool",
    "content": f"Tool {tool_name} result: {result_str}" if use_fallback else result_str
}
if not use_fallback:
    tool_msg["tool_call_id"] = tc.id
```

The issue is that when appending the assistant's `tool_calls` message right before this, the code loops over `tool_calls` but doesn't correctly associate multiple tools or properly format them for all providers. More importantly, when it sends the `messages` array back to the provider (OpenAI or Gemini), the provider rejects it or fails silently because the `tool_calls` structure doesn't match what the provider SDK expects, or because it expects a single `assistant` message followed by multiple `tool` messages, but the loop logic might be creating multiple `assistant` messages or interweaving them incorrectly.

Looking closely at `app/services/llm_orchestrator.py` lines 151-177:
```python
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
                    ...
```
Wait, the `assistant` message *is* appended once before the loop. But the `tc.arguments` might already be a JSON string or a dictionary depending on the provider. If `tc.arguments` is already a dictionary, `json.dumps()` works. If it's a string, `json.dumps()` will double-encode it, breaking the provider's parser. Let's verify `ToolCall.arguments` type.

Actually, the problem might just be that the `gemini_provider.py` and `openai_compatible.py` handle these injected messages differently. Gemini, in particular, is notoriously strict about message history roles (must alternate user/model, tool calls are weird).

Let's look at `openai_compatible.py`:
It expects the standard OpenAI format.

## Goals / Non-Goals

**Goals:**
- Ensure the LLM orchestrator correctly formats the message history after a tool call.
- Ensure the final synthesized answer is generated and streamed to the user.

**Non-Goals:**
- Modifying the underlying AI pipeline or model.

## Decisions

**Decision 1: Ensure `tool_calls` arguments are properly formatted.**
- *Rationale*: If `tc.arguments` is already a string (which it often is from streaming chunks), `json.dumps(tc.arguments)` will double-encode it. We need to ensure it's a valid JSON string without double-encoding.
- *Implementation*: Check if `tc.arguments` is a string; if so, pass it directly or parse/re-dump.

**Decision 2: Ensure correct message appending order.**
- *Rationale*: We must append one `assistant` message containing all `tool_calls`, followed immediately by one `tool` message for *each* tool call. The current code seems to do this, but we must ensure it doesn't break if `use_fallback` is True.

**Decision 3: Fix Gemini Provider message conversion for Tools.**
- *Rationale*: `gemini_provider.py`'s `_format_history` likely fails when it encounters a "tool" role or an "assistant" role with "tool_calls".
Looking at `gemini_provider.py`:
```python
            elif role == "tool":
                # Convert the 'content' back to what Gemini expects.
                # ... wait, Gemini expects a `FunctionResponse` part, not just text.
```
If we fix the orchestrator to format OpenAI-style messages correctly, we must ensure `gemini_provider.py` translates them correctly. However, a simpler fix at the orchestrator level might be to just squash the tool results into a `user` message if the provider struggles, OR fix the orchestrator to properly pass the OpenAI spec and let the provider adapters handle it.

Actually, if we look at the user's prompt: "trên server chỉ gọi tool call nhưng không có tổng hợp" (on the server it only calls the tool but doesn't synthesize). This usually means the stream breaks during the second LLM call, OR the orchestrator swallows the final stream.
Wait, look at `llm_orchestrator.py`:
```python
        while iteration < max_iterations:
            ...
            async for chunk in stream:
                ...
            if tool_calls:
                 ... execute tools ...
                 messages.append(tool_msg)
            else:
                 break
```
If `tool_calls` happens, it appends messages and loops back to `stream = provider.chat_stream(messages, tools=tools_to_pass)`. Then it should yield the text.
Why wouldn't it? If the `provider.chat_stream` throws an exception, it gets caught and logged by the provider, returning an empty stream.
Let's fix the `tc.arguments` double-encoding in `llm_orchestrator.py`, as that is the most common cause of OpenAI rejecting a tool_call history.

## Risks / Trade-offs

- **[Risk]** Changing message format breaks existing fallback logic. → *Mitigation*: We will carefully respect the `use_fallback` flag.