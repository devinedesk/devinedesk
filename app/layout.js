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

import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers>
          <Toaster position="bottom-right" />
          <main className="h-full w-full">
            {children}
          </main>
        </Providers>
      {/* impeccable-live-start */}
<script src="http://localhost:8400/live.js?token=415d6bd9-c978-409e-bf73-97b4355add5d" async></script>
{/* impeccable-live-end */}
</body>
    </html>
  );
}
