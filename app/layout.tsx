import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workspace AI",
  description: "A compact multi-model AI chat workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
