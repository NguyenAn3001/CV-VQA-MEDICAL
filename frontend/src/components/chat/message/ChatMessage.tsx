import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import type { ChatMessage as ChatMessageType } from '../../../types/models';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export default function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {message.role === 'user' ? (
        <UserMessage content={message.content} imageUrl={message.image_url} />
      ) : (
        <AssistantMessage content={message.content} isStreaming={isStreaming} />
      )}
    </motion.div>
  );
}