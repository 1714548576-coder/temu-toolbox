"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DashboardPage from "@/components/DashboardPage";
import AnalysisPage from "@/components/AnalysisPage";
import ListingPage from "@/components/ListingPage";
import ProductsPage from "@/components/ProductsPage";
import SettingsPage from "@/components/SettingsPage";

const TABS = [
  { id: "dashboard", label: "数据面板", icon: "📊" },
  { id: "analysis", label: "竞品分析", icon: "🔍" },
  { id: "listing", label: "AI 生成", icon: "✨" },
  { id: "products", label: "商品管理", icon: "📦" },
  { id: "settings", label: "设置", icon: "⚙️" },
] as const;

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Restore tab from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("active_tab");
    if (saved && TABS.some((t) => t.id === saved)) {
      setActiveTab(saved);
    }
  }, []);

  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem("active_tab", tabId);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-white antialiased">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-orange-400">Temu</span>Toolbox
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">卖家运营工具箱</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                activeTab === tab.id
                  ? "bg-orange-500/10 text-orange-400 font-medium"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 text-xs text-gray-600">
          v1.0 · Made with Codex
        </div>
      </aside>

      {/* Main content - all tabs kept alive */}
      <main className="flex-1 overflow-y-auto p-6">
        <div style={{ display: activeTab === "dashboard" ? "block" : "none" }}>
          <DashboardPage />
        </div>
        <div style={{ display: activeTab === "analysis" ? "block" : "none" }}>
          <AnalysisPage />
        </div>
        <div style={{ display: activeTab === "listing" ? "block" : "none" }}>
          <ListingPage />
        </div>
        <div style={{ display: activeTab === "products" ? "block" : "none" }}>
          <ProductsPage />
        </div>
        <div style={{ display: activeTab === "settings" ? "block" : "none" }}>
          <SettingsPage />
        </div>
      </main>
    </div>
  );
}
