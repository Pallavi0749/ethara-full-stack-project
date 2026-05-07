import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'ProjectFlow — Collaborative Project Management',
    template: '%s | ProjectFlow',
  },
  description:
    'A modern SaaS project management platform for teams to collaborate, track tasks, and ship faster.',
  keywords: ['project management', 'task management', 'team collaboration', 'kanban', 'productivity'],
  authors: [{ name: 'ProjectFlow' }],
  openGraph: {
    type: 'website',
    title: 'ProjectFlow',
    description: 'Collaborative project management for modern teams.',
    siteName: 'ProjectFlow',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} gradient-bg min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
