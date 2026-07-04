import { useId } from 'react';
import { ArrowUp, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="pointer-events-none sticky bottom-0 w-full px-4 pb-6 pt-4">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
        {selectedFile ? (
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-slate-800">{selectedFile.name}</div>
              <div className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onFileChange(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        <div className="flex items-end gap-3">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full border border-slate-200"
            onClick={() => document.getElementById(inputId)?.click()}
            disabled={isGenerating}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <textarea
            value={inputText}
            onChange={(event) => onInputTextChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Ask about the scan, findings, or follow-up care..."
            className="min-h-[48px] flex-1 resize-none border-0 bg-transparent px-1 py-3 text-[15px] leading-6 text-slate-700 outline-none placeholder:text-slate-400"
            disabled={isGenerating}
            rows={1}
          />
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8]"
            onClick={onSubmit}
            disabled={isGenerating || (!inputText.trim() && !selectedFile)}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
