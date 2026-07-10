import { useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage, ChatToolCall } from '../types/models';
import { API_URL } from '../lib/axios';

interface StreamResult {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export const useSSEChat = () => {
  const [streamingContent, setStreamingContent] = useState('');
  const [activeTools, setActiveTools] = useState<ChatToolCall[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const sendMessage = useCallback(
    async (sessionId: string, text: string, imageFile?: File | null): Promise<StreamResult> => {
      const token = useAuthStore.getState().accessToken;
      setIsGenerating(true);
      setStreamingContent('');
      setActiveTools([]);

      const now = new Date().toISOString();
      const userMessage: ChatMessage = {
        role: 'user',
        content: text,
        image_url: imageFile ? URL.createObjectURL(imageFile) : null,
        created_at: now,
      };

      const formData = new FormData();
      formData.append('message', text);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      try {
        const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });

        if (!response.ok) {
          if (response.status === 401) {
            useAuthStore.getState().logout();
          }

          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported by response');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let buffer = '';
        let currentResponseText = '';
        let toolsCalled: ChatToolCall[] = [];
        let currentEvent = 'message';

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n');
          buffer = chunks.pop() || '';

          for (const line of chunks) {
            const cleanLine = line.trim();
            if (!cleanLine) {
              continue;
            }

            if (cleanLine.startsWith('event:')) {
              currentEvent = cleanLine.replace('event:', '').trim();
              continue;
            }

            if (!cleanLine.startsWith('data:')) {
              continue;
            }

            const dataStr = cleanLine.replace('data:', '').trim();
            let parsed: Record<string, unknown>;

            try {
              parsed = JSON.parse(dataStr) as Record<string, unknown>;
            } catch {
              parsed = { content: dataStr };
            }

            if (currentEvent === 'message') {
              currentResponseText += String(parsed.content ?? '');
              setStreamingContent(currentResponseText);
            } else if (currentEvent === 'title_changed') {
              const { session_id, title } = parsed as { session_id: string; title: string };
              useChatStore.getState().updateSessionTitleLocally(session_id, title);
            } else if (currentEvent === 'tool_call' && Array.isArray(parsed.tools)) {
              toolsCalled = [...toolsCalled, ...(parsed.tools as ChatToolCall[])];
              setActiveTools(toolsCalled);
            } else if (currentEvent === 'error') {
              throw new Error(String(parsed.detail ?? 'Generation failed'));
            }
          }
        }

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: currentResponseText,
          toolsUsed: toolsCalled.length > 0 ? toolsCalled : undefined,
          created_at: now,
        };

        setStreamingContent('');
        setActiveTools([]);

        return {
          userMessage,
          assistantMessage,
        };
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  return {
    streamingContent,
    activeTools,
    isGenerating,
    sendMessage,
  };
};
