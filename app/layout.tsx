import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kursum | Eğitim Kurumları Bilgi ve Yönetim Sistemi",
    template: "%s | Kursum",
  },
  description: "Kursum - Eğitim Kurumları Bilgi ve Yönetim Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-background text-foreground font-sans`}
      >
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
