# Plan: Auto-title chat sessions

## Objective
Real-time update of auto-generated title in sidebar via SSE `title_changed` event. Fallback extract 8 words from first message if LLM fails.

## Files to Modify
- `app/services/llm_orchestrator.py` — Fallback extract 8 words from message
- `app/services/chat_service.py` — Return new_title, yield SSE event
- `app/api/chat.py` — Unpack new_title, pass to get_sse_stream
- `frontend/src/store/chatStore.ts` — Add `updateSessionTitleLocally`
- `frontend/src/hooks/useSSEChat.ts` — Parse `title_changed` event

## Implementation Steps
1. **llm_orchestrator.py**: Change `generate_title` fallback to extract first 8 words from `first_user_message`
2. **chat_service.py**: 
   - `prepare_message_and_context`: return tuple + `new_title` (Optional[str])
   - `get_sse_stream`: accept `new_title`, yield `title_changed` event if set
3. **chat.py**: Unpack `new_title`, pass to `get_sse_stream`
4. **chatStore.ts**: Add `updateSessionTitleLocally(id, title)` — only update store, no API
5. **useSSEChat.ts**: Handle `title_changed` event → store action

## Test Plan
- [ ] Gửi tin nhắn đầu tiên → title trong sidebar cập nhật ngay (không cần reload)
- [ ] Title là tiếng Việt có dấu, ≤ 5 từ
- [ ] Nếu LLM fail → fallback extract 8 từ đầu message
