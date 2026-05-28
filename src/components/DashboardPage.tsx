"use client";

import { useState, useEffect } from "react";
import { getDashboardStats } from "@/lib/db";
import { Product } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalProducts: 0, totalAnalyses: 0, totalListings: 0, avgMarketPrice: 0, totalSales: 0, totalRevenue: 0, avgCtr: 0, avgConversion: 0 });

  useEffect(() => {
    const refresh = () => setStats(getDashboardStats());
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: "商品数", value: stats.totalProducts, icon: "📦", color: "blue" as const },
    { label: "总销量", value: stats.totalSales, icon: "📈", color: "green" as const },
    { label: "总销售额", value: `¥${stats.totalRevenue.toLocaleString()}`, icon: "💰", color: "orange" as const },
    { label: "均价", value: `¥${stats.avgMarketPrice}`, icon: "🏷️", color: "purple" as const },
    { label: "点击率", value: `${stats.avgCtr}%`, icon: "👆", color: "blue" as const },
    { label: "转化率", value: `${stats.avgConversion}%`, icon: "🎯", color: "green" as const },
    { label: "竞品分析", value: stats.totalAnalyses, icon: "🔍", color: "purple" as const },
    { label: "AI 生成", value: stats.totalListings, icon: "✨", color: "orange" as const },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h2 className="text-2xl font-bold">📊 数据面板</h2>
        <p className="text-gray-400 mt-1">运营数据总览 · 每 3 秒自动刷新</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <StatsCard key={card.label} {...card} />
        ))}
      </div>

      {stats.totalProducts === 0 && (
        <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
          <div className="text-6xl mb-4">📥</div>
          <h3 className="text-xl font-semibold mb-2">还没有商品数据</h3>
          <p className="text-gray-400 mb-4 max-w-md mx-auto">
            去「商品管理」页导入你的 Temu 店铺 CSV 数据，或手动添加商品
          </p>
          <p className="text-xs text-gray-600">支持 Temu 卖家中心导出的 CSV 文件，自动识别列名</p>
        </div>
      )}
    </div>
  );
}

function StatsCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: "blue" | "purple" | "green" | "orange" }) {
  const borderMap = { blue: "border-blue-500/30 bg-blue-500/5", purple: "border-purple-500/30 bg-purple-500/5", green: "border-green-500/30 bg-green-500/5", orange: "border-orange-500/30 bg-orange-500/5" };
  const textMap = { blue: "text-blue-400", purple: "text-purple-400", green: "text-green-400", orange: "text-orange-400" };
  return (
    <div className={`rounded-xl border p-4 ${borderMap[color]}`}>
      <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-400">{label}</span><span className="text-xl">{icon}</span></div>
      <div className={`text-xl font-bold ${textMap[color]}`}>{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}
