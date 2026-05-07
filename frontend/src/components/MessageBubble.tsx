'use client';

import { Message } from '@/lib/types';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-3 mt-1 shrink-0">
          AI
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-violet-600 text-white rounded-tr-sm'
            : message.error
            ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm'
            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-violet-400 ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold ml-3 mt-1 shrink-0">
          Вы
        </div>
      )}
    </div>
  );
}
