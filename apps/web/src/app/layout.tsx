import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IELTScope | AI 雅思提分系统",
  description: "教师校准的雅思诊断、动态学习计划与写作口语精批系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
