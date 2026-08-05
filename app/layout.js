import './globals.css';
import { Inter } from "next/font/google";
import { Providers } from "./Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: 'devinedesk — AI Image & Video Studio',
  description: 'Generate AI images and videos using 200+ models — Flux, Midjourney, Kling, Veo, Seedance and more.',
};

import ToastContainer from '@/src/components/ToastContainer';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers>
          <ToastContainer />
          <main className="h-full w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
