## 1. Fix argument encoding in LLM orchestrator

- [x] 1.1 In `app/services/llm_orchestrator.py`, update the code that appends the `assistant` message after a tool call. Ensure that `tc.arguments` is safely serialized (if it's already a string, don't double `json.dumps` it).

## 2. Verify and test

- [x] 2.1 Verify `stream_chat` yields correctly and synthesize the final answer.