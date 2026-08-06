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
                padding: '12px 16px' 
              } 
            }} 
          />
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
