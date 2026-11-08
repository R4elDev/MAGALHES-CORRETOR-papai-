import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin — Magalhães Corretor", template: "%s" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="font-sans antialiased">{children}</div>;
}
