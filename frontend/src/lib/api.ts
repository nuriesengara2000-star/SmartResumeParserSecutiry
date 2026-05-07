const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function streamGenerate(
  prompt: string,
  maxTokens: number = 512,
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${API_URL}/generate/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, max_tokens: maxTokens }),
    signal,
  });

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw { type: 'rate_limit', message: 'Превышен лимит запросов. Подождите немного.', retryAfter: retryAfter ? parseInt(retryAfter) : 60 };
    }
    if (response.status === 422) {
      const data = await response.json();
      throw { type: 'validation', message: data.detail || 'Неверные данные запроса' };
    }
    if (response.status === 400) {
      const data = await response.json();
      throw { type: 'validation', message: data.detail || 'Запрос отклонён' };
    }
    throw { type: 'server', message: `Ошибка сервера: ${response.status}` };
  }

  const reader = response.body?.getReader();
  if (!reader) throw { type: 'server', message: 'Нет данных от сервера' };

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) throw { type: 'server', message: parsed.error };
        if (parsed.token) onToken(parsed.token);
      } catch (e: any) {
        if (e.type) throw e;
      }
    }
  }
}
