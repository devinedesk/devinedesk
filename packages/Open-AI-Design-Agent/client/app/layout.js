import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Open Local API Assistant by DevineDesk",
  description: "Open source AI creative assistant powered by Local API API, built by DevineDesk",
  keywords: ["devinedesk", "devinedesk.com", "open local api assistant", "ai creative assistant", "local api"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
