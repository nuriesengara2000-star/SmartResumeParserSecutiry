import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartResume AI — Resume Parser',
  description: 'AI-powered resume parsing and structured data extraction',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
