"use client";
import dynamic from "next/dynamic";
import "@maxhub/max-ui/dist/styles.css";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const MaxUI = dynamic(() => import("@maxhub/max-ui").then((mod) => mod.MaxUI), {
  ssr: false,
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MaxUI>{children}</MaxUI>
      </body>
    </html>
  );
}
