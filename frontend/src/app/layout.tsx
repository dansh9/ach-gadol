import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "אח גדול למען חיילים בודדים",
  description:
    "כל הזכויות, המידע וההכוונה לחיילים בודדים בצה\"ל — במקום אחד. בדיקת זכאות, צ'אטבוט חכם ומאות מתנדבים לשירותך.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
