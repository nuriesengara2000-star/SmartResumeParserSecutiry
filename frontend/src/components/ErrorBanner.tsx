'use client';

import { ApiError } from '@/lib/types';
import { useEffect, useState } from 'react';

interface Props {
  error: ApiError | null;
  onRetry?: () => void;
  onDismiss: () => void;
}

export default function ErrorBanner({ error, onRetry, onDismiss }: Props) {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (error?.type === 'rate_limit' && error.retryAfter) {
      setCountdown(error.retryAfter);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) { clearInterval(interval); return null; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [error]);

  if (!error) return null;

  const isRateLimit = error.type === 'rate_limit';
  const isNetwork = error.type === 'network';

  return (
    <div className={`mx-4 mb-3 rounded-xl px-4 py-3 text-sm flex items-start justify-between gap-3 ${
      isRateLimit ? 'bg-amber-50 border border-amber-200 text-amber-800' :
      isNetwork   ? 'bg-blue-50 border border-blue-200 text-blue-800' :
                    'bg-red-50 border border-red-200 text-red-800'
    }`}>
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">
          {isRateLimit ? '⏳' : isNetwork ? '🔌' : '⚠️'}
        </span>
        <div>
          <p className="font-medium">{error.message}</p>
          {isRateLimit && countdown !== null && (
            <p className="text-xs mt-0.5 opacity-75">Повторить через {countdown} сек.</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {(isNetwork || error.type === 'server') && onRetry && (
          <button onClick={onRetry} className="text-xs underline underline-offset-2 opacity-75 hover:opacity-100">
            Повторить
          </button>
        )}
        <button onClick={onDismiss} className="opacity-50 hover:opacity-100 text-lg leading-none">×</button>
      </div>
    </div>
  );
}
