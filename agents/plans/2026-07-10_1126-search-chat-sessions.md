# Plan: Tìm kiếm chat sessions trong Sidebar

## Objective
Add a search input in Sidebar to filter chat sessions by title locally.

## Files to Modify
- `frontend/src/store/chatStore.ts` — Add `searchQuery: string` + `setSearchQuery(query: string)`
- `frontend/src/components/layout/Sidebar.tsx` — Add search input, filter sessions, clear button

## Files to Create
- *(none)*

## Implementation Steps
1. **chatStore.ts**: Add `searchQuery` state and `setSearchQuery` action
2. **Sidebar.tsx**: Add search input at top of session list, filter pinned + other sessions by query (case-insensitive), debounce 300ms, clear button when query non-empty

## Test Plan
- [ ] Input search hiển thị ở đầu danh sách session
- [ ] Gõ text → danh sách filter theo title (case-insensitive)
- [ ] Clear button xoá searchQuery và hiện lại full list
- [ ] `npx tsc --noEmit`: 0 errors
- [ ] `npm run build`: success
