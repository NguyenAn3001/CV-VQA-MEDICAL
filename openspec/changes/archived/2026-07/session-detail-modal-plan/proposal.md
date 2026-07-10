# Session Detail Modal Refactoring Plan

## Goal
Implement a detailed modal view for chat sessions, accessible from both the sidebar and navbar, replacing or supplementing the full-page view.

## Context
Users need a quick way to view and manage metadata (title, date, attached images, deletion) for a specific session without navigating away from their current context.

## Proposal

1. **UI Component**: Create `SessionDetailModal.tsx` following the provided design specs (fixed backdrop, centered card).
2. **Sidebar Integration**: Add a 'more options' dropdown to sidebar items to trigger the modal.
3. **Navbar Integration**: Wire the existing 'more options' button in the navbar to open the modal for the current session.
4. **State Management**: Manage modal visibility and the active `sessionId` globally via the `useChatStore`.
