import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Temu 卖家工具箱",
  description: "竞品分析 · AI Listing · 数据面板 — 一站式跨境电商运营工具",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
