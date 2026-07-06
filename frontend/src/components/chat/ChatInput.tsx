import { useId, useState, useEffect, useRef } from 'react';
import { Paperclip, ArrowUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  inputText: string;
  onInputTextChange: (value: string) => void;
  onSubmit: () => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  isGenerating: boolean;
}

export default function ChatInput({
  inputText,
  onInputTextChange,
  onSubmit,
  selectedFile,
  onFileChange,
  isGenerating,
}: ChatInputProps) {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileChange(file);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          onFileChange(file);
        }
        break;
      }
    }
  };

  const hasContent = inputText.trim().length > 0 || !!selectedFile;

  return (
    <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none z-20">
      <div className="w-full max-w-[850px] pointer-events-auto">
        <div 
          className={`bg-white border rounded-[24px] shadow-sm transition-all duration-200 overflow-hidden flex flex-col ${
            isDragging ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-500/10' : 'border-slate-300 focus-within:border-slate-400 focus-within:shadow-md'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
        >
          {/* Attachment Preview Area */}
          <AnimatePresence>
            {selectedFile && previewUrl && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pt-4 pb-2 flex gap-3"
              >
                <div className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 w-16 h-16 shrink-0 flex items-center justify-center">
                  <img alt="Preview" className="w-full h-full object-cover" src={previewUrl} />
                  <button 
                    onClick={() => onFileChange(null)}
                    className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="flex items-end gap-2 p-2">
            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
            
            <button 
              className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors shrink-0 mb-0.5 ml-1"
              onClick={() => document.getElementById(inputId)?.click()}
              disabled={isGenerating}
              aria-label="Attach image"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            
            <textarea 
              ref={textareaRef}
              className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-slate-800 placeholder:text-slate-400 px-1 py-3 outline-none resize-none min-h-[48px] max-h-[200px]" 
              placeholder="Ask anything..." 
              value={inputText}
              onChange={(e) => onInputTextChange(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onSubmit();
                }
              }}
              disabled={isGenerating}
              rows={1}
            />
            
            <button 
              className={`p-2 rounded-full shrink-0 flex items-center justify-center w-10 h-10 mb-0.5 mr-1 transition-all ${
                hasContent 
                  ? 'bg-black text-white hover:bg-slate-800' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              onClick={onSubmit}
              disabled={isGenerating || !hasContent}
              aria-label="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="text-center mt-3">
          <span className="text-xs text-slate-400">AI can make mistakes. Consider verifying important information.</span>
        </div>
      </div>
    </div>
  );
}
