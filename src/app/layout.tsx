import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import SessionRestorer from "@/components/SessionRestorer";

export const metadata: Metadata = {
  title: "Design-Rite Portal",
  description: "Subscriber portal for Design-Rite AI Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionRestorer />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
