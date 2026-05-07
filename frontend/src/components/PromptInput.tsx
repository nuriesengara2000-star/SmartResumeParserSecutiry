'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface Props {
  onSend: (prompt: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export default function PromptInput({ onSend, onStop, isStreaming }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || isStreaming) return;
    onSend(value);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const isEmpty = !value.trim();

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Вставьте текст резюме или задайте вопрос… (Enter — отправить)"
            rows={1}
            disabled={isStreaming}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent disabled:opacity-60 transition-all"
          />
        </div>

        {isStreaming ? (
          <button
            onClick={onStop}
            className="shrink-0 w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-sm"
            title="Остановить генерацию"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={isEmpty}
            className="shrink-0 w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-sm"
            title="Отправить (Enter)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m-7 7l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-center text-xs text-gray-300 mt-2">
        Shift+Enter — новая строка · Enter — отправить
      </p>
    </div>
  );
}
