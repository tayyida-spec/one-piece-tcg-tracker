import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Three Hats — One Piece TCG Tracker",
  description: "Track inventory and transactions for One Piece TCG",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
