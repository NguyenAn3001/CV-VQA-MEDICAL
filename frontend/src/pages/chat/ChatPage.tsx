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
    fetchSessions();
  }, [fetchSessions]);

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

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions]
  );

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedFile) || isGenerating) {
      return;
    }

    setErrorMessage(null);

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = await createSession();
      if (!targetSessionId) {
        setErrorMessage('Unable to create a chat session.');
        return;
      }

      setActiveSession(targetSessionId);
      navigate(`/chat/${targetSessionId}`);
    }

    try {
      const { userMessage, assistantMessage } = await sendMessage(targetSessionId, inputText, selectedFile);
      const nextMessages = [...messages, userMessage, assistantMessage];
      setMessages(nextMessages);
      setSessionMessages(targetSessionId, nextMessages);
      setInputText('');
      setSelectedFile(null);

      const detail = await fetchSessionDetail(targetSessionId);
      if (detail) {
        setMessages(detail.messages);
        setSessionMessages(targetSessionId, detail.messages);
        upsertSession(detail);
      }

      await fetchSessions();
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to complete the request.');
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <Navbar
        title={activeSession?.title || 'New Chat'}
        subtitle={activeSession ? 'GPT-4o + Medical' : 'Start a new medical review'}
      />
      <ChatWindow
        messages={messages}
        streamingContent={streamingContent}
        activeTools={activeTools}
        isGenerating={isGenerating}
        sessionTitle={activeSession?.title}
        isEmptyState={!activeSessionId && messages.length === 0}
      />
      {errorMessage ? (
        <div className="mx-auto mb-2 w-full max-w-3xl px-4 text-sm text-red-600">{errorMessage}</div>
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
