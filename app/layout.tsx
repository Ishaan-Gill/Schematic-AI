import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multi-Table Analyst",
  description: "AI analyst interface for uploaded datasets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full dark antialiased"
    >
      <body className="min-h-full flex flex-col bg-black text-zinc-100">{children}</body>
    </html>
  );
}
