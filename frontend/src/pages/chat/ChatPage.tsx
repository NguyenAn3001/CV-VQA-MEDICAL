import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import ChatInput from '../../components/chat/ChatInput';
import ChatWindow from '../../components/chat/ChatWindow';
import { useChatStore } from '../../store/chatStore';
import { useSSEChat } from '../../hooks/useSSEChat';
import type { ChatMessage } from '../../types/models';

export default function ChatPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const {
    sessions,
    activeSessionId,
    sessionDetailsById,
    fetchSessions,
    fetchSessionDetail,
    createSession,
    setActiveSession,
    setSessionMessages,
    upsertSession,
  } = useChatStore();
  const { streamingContent, activeTools, isGenerating, sendMessage } = useSSEChat();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      setActiveSession(sessionId);
    } else {
      setActiveSession(null);
    }
  }, [sessionId, setActiveSession]);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const cached = sessionDetailsById[activeSessionId];
    if (cached?.messages) {
      setMessages(cached.messages);
      return;
    }

    fetchSessionDetail(activeSessionId).then((detail) => {
      setMessages(detail?.messages ?? []);
    });
  }, [activeSessionId, fetchSessionDetail, sessionDetailsById]);

  // Expose a global resize listener to let image load / markdown reflows trigger a re-scroll
  useEffect(() => {
    const handleResize = () => {
      // Force a slight state update to trigger layout effect in ChatWindow
      window.dispatchEvent(new CustomEvent('chat-reflow'));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedFile) || isGenerating) {
      return;
    }

    setErrorMessage(null);

    // Capture current input state
    const textToSend = inputText;
    const fileToSend = selectedFile;
    
    // Create temporary optimistic message
    const tempUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      image_url: fileToSend ? URL.createObjectURL(fileToSend) : null,
      created_at: new Date().toISOString()
    };

    // Immediate UI Update
    setMessages(prev => [...prev, tempUserMessage]);
    setInputText('');
    setSelectedFile(null);

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = await createSession();
      if (!targetSessionId) {
        setErrorMessage('Unable to create a chat session.');
        // Remove optimistic message if session creation fails
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
        return;
      }

      setActiveSession(targetSessionId);
      navigate(`/chat/${targetSessionId}`, { replace: true });
    }

    try {
      const { assistantMessage } = await sendMessage(targetSessionId, textToSend, fileToSend);
      
      // We don't need the server's userMessage as we already have our optimistic one.
      // But we should fetch the final details to ensure sync.
      const detail = await fetchSessionDetail(targetSessionId);
      if (detail) {
        setMessages(detail.messages);
        setSessionMessages(targetSessionId, detail.messages);
        upsertSession(detail);
      } else {
        // Fallback if fetch fails
        const nextMessages = [...messages, tempUserMessage, assistantMessage];
        setMessages(nextMessages);
        setSessionMessages(targetSessionId, nextMessages);
      }

      await fetchSessions();
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to complete the request.');
      // Keep user message but maybe show error state in future
    }
  };

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions]
  );

  const handleSuggestionClick = (suggestionText: string) => {
    setInputText(suggestionText);
  };

  return (
    <div className="flex flex-col h-full">
      <Navbar
        title={activeSession?.title || 'New Chat'}
        subtitle={activeSession ? (activeSession.model ?? 'GPT-4o + Medical') : 'Start a new medical review'}
      />
      <ChatWindow
        messages={messages}
        streamingContent={streamingContent}
        activeTools={activeTools}
        isGenerating={isGenerating}
        isEmptyState={!activeSessionId && messages.length === 0}
        onSuggestionClick={handleSuggestionClick}
      />
      {errorMessage ? (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
          {errorMessage}
        </div>
      ) : null}
      <ChatInput
        inputText={inputText}
        onInputTextChange={setInputText}
        onSubmit={handleSend}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        isGenerating={isGenerating}
      />
    </div>
  );
}
