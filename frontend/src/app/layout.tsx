import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "אח גדול למען חיילים בודדים",
  description:
    "כל הזכויות, המידע וההכוונה לחיילים בודדים בצה\"ל — במקום אחד. בדיקת זכאות, צ'אטבוט חכם ומאות מתנדבים לשירותך.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
