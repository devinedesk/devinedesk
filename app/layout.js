import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './Providers';
import { CommandPalette } from '@/components/CommandPalette';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const viewport = {
  themeColor: '#18181b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'DevineDesk — The AI Automation Platform',
  description:
    'Design, build, and deploy world-class AI workflows. Integrate over 200+ models instantly with our visual DAG engine.',
  keywords: [
    'AI automation',
    'workflow engine',
    'DevineDesk',
    'SaaS',
    'DAG builder',
    'OpenAI',
    'Anthropic',
  ],
  authors: [{ name: 'DevineDesk Inc.' }],
  openGraph: {
    title: 'DevineDesk — The AI Automation Platform',
    description: 'Design, build, and deploy world-class AI workflows visually.',
    url: 'https://devinedesk.com',
    siteName: 'DevineDesk',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'DevineDesk Platform Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevineDesk — The AI Automation Platform',
    description: 'Design, build, and deploy world-class AI workflows visually.',
    images: ['/banner.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DevineDesk',
  },
};

import { Toaster } from 'react-hot-toast';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { PostHogProvider } from './providers/PostHogProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <PostHogProvider>
          <Providers>
            <Toaster
              position="top-right"
              containerStyle={{ zIndex: 99999 }}
              toastOptions={{
                duration: 5000,
                style: {
                  background: '#18181b',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: '13px',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                  maxWidth: '440px',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  padding: '12px 16px',
                },
              }}
            />
            <CommandPalette />
            <main className="h-full w-full">{children}</main>
          </Providers>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
