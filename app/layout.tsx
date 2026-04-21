import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '재무보고서 자동화 시스템',
  description: '재무보고서 자동화 웹 애플리케이션'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
