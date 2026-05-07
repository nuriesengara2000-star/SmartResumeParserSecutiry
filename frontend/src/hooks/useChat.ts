import { useState, useCallback, useRef } from 'react';
import { Message, ApiError } from '@/lib/types';
import { streamGenerate } from '@/lib/api';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || isStreaming) return;

    setError(null);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt.trim(),
    };

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamGenerate(
        prompt.trim(),
        512,
        (token) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMsg.id
                ? { ...m, content: m.content + token }
                : m
            )
          );
        },
        controller.signal
      );
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // Пользователь остановил — оставляем что успело прийти
      } else {
        const apiError: ApiError = e.type
          ? e
          : { type: 'network', message: 'Нет соединения с сервером. Проверьте интернет.' };
        setError(apiError);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsg.id
              ? { ...m, content: m.content || 'Ошибка при получении ответа.', error: true }
              : m
          )
        );
      }
    } finally {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
        )
      );
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [isStreaming]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    if (!isStreaming) {
      setMessages([]);
      setError(null);
    }
  }, [isStreaming]);

  return { messages, isStreaming, error, sendMessage, stopGeneration, clearChat };
}
