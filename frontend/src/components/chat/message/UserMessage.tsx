import MessageImage from './MessageImage';

interface UserMessageProps {
  content: string;
  imageUrl?: string | null;
}

export default function UserMessage({ content, imageUrl }: UserMessageProps) {
  return (
    <div className="flex w-full justify-end mb-6">
      <div className="flex max-w-[65%] flex-col items-end gap-2">
        {imageUrl ? (
          <div className="mb-1">
            <MessageImage url={imageUrl} />
          </div>
        ) : null}
        
        {content ? (
          <div className="bg-[#2563eb] text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm text-[15px] leading-relaxed break-words text-left w-fit">
            <div className="whitespace-pre-wrap">{content}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}