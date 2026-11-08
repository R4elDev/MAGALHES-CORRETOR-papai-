import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Magalhães Corretor", template: "%s | Magalhães Corretor" },
  description: "Imóveis selecionados pelo Magalhães. Explore o catálogo ou descubra quais combinam com você.",
};

export const viewport: Viewport = { themeColor: "#092A5E", width: "device-width", initialScale: 1 };

// Root layout neutro: o site público (header/footer/ChatWidget) vive em app/(site)/layout.tsx; /admin tem layout próprio.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
