'use client';

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import ChatWindow from '@/components/ChatWindow';
import PromptInput from '@/components/PromptInput';
import ErrorBanner from '@/components/ErrorBanner';

export default function Home() {
  const { messages, isStreaming, error, sendMessage, stopGeneration, clearChat } = useChat();
  const [lastPrompt, setLastPrompt] = useState('');

  const handleSend = (prompt: string) => {
    setLastPrompt(prompt);
    sendMessage(prompt);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-gray-800 text-sm">SmartResume AI</h1>
              <p className="text-xs text-gray-400">Resume Parser</p>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Возможности</p>
          {[
            { icon: '📄', text: 'Извлечение данных из резюме' },
            { icon: '🔍', text: 'Анализ навыков и опыта' },
            { icon: '📊', text: 'Структурированный JSON вывод' },
            { icon: '🛡️', text: 'Rate limiting & защита' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 py-2 text-xs text-gray-500">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={clearChat}
            disabled={isStreaming || messages.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Очистить чат
          </button>
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-300">Лимит: 10 запросов / мин</span>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Header (mobile) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-800 text-sm">SmartResume AI</span>
          </div>
          <button
            onClick={clearChat}
            disabled={isStreaming || messages.length === 0}
            className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            Очистить
          </button>
        </header>

        <ChatWindow messages={messages} isStreaming={isStreaming} />

        <ErrorBanner
          error={error}
          onRetry={() => lastPrompt && sendMessage(lastPrompt)}
          onDismiss={() => {/* error clears on next send */}}
        />

        <PromptInput
          onSend={handleSend}
          onStop={stopGeneration}
          isStreaming={isStreaming}
        />
      </main>
    </div>
  );
}
