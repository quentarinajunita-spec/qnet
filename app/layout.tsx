import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#6c5ce7",
};

export const metadata: Metadata = {
  title: "Q-net",
  description: "Ruang karya digital untuk kreator.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
