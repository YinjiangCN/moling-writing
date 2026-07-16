import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "墨灵写作 - AI 驱动的网文创作平台",
  description:
    "集 AI 写作、章节管理、设定库、长文本记忆于一体的专业网文创作平台。一句话灵感自动生成简介、大纲、角色，AI 不再失忆。",
  keywords: ["AI写作", "网文创作", "小说创作", "AI助手", "墨灵写作"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSerifSC.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <SonnerToaster richColors position="top-center" />
        <Toaster />
      </body>
    </html>
  );
}
