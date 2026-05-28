"use client";

import { useState, useEffect, useRef } from "react";
import { getAllProducts, getAllAnalyses, addAnalysis, addProduct } from "@/lib/db";
import { generateCompetitorAnalysis } from "@/lib/openai";
import { Product, CompetitorAnalysis, CompetitorItem } from "@/types";

const MEMORY_KEY = "analysis_form_state";

interface AnalysisMemory {
  aiProductName: string;
  aiProductPrice: string;
  aiCategory: string;
  aiPlatform: string;
  aiResult: CompetitorAnalysis | null;
}

export default function AnalysisPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [analyses, setAnalyses] = useState<CompetitorAnalysis[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const mounted = useRef(false);

  // AI analysis state - restore from memory
  const [aiProductName, setAiProductName] = useState("");
  const [aiProductPrice, setAiProductPrice] = useState("");
  const [aiCategory, setAiCategory] = useState("");
  const [aiPlatform, setAiPlatform] = useState("temu");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState<CompetitorAnalysis | null>(null);

  // Manual competitor
  const [competitors, setCompetitors] = useState<CompetitorItem[]>([]);
  const [newComp, setNewComp] = useState({ title: "", price: "", platform: "temu", url: "", rating: "", sales: "" });

  // Load data on mount
  useEffect(() => {
    setProducts(getAllProducts());
    setAnalyses(getAllAnalyses());
    mounted.current = true;
  }, []);

  // Restore form state from memory
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      if (saved) {
        const m: AnalysisMemory = JSON.parse(saved);
        if (m.aiProductName) setAiProductName(m.aiProductName);
        if (m.aiProductPrice) setAiProductPrice(m.aiProductPrice);
        if (m.aiCategory) setAiCategory(m.aiCategory);
        if (m.aiPlatform) setAiPlatform(m.aiPlatform);
        if (m.aiResult) setAiResult(m.aiResult);
      }
    } catch {}
  }, []);

  // Save form state to memory
  const saveMemory = (updates: Partial<AnalysisMemory>) => {
    const current: AnalysisMemory = { aiProductName, aiProductPrice, aiCategory, aiPlatform, aiResult };
    const merged = { ...current, ...updates };
    localStorage.setItem(MEMORY_KEY, JSON.stringify(merged));
  };

  // ====== AI Smart Analysis ======
  const runAIAnalysis = async () => {
    if (!aiProductName || !aiProductPrice) return;
    setAiLoading(true);
    setAiError("");

    const apiKey = localStorage.getItem("openai_api_key");
    const provider = localStorage.getItem("ai_provider") || "openai";
    if (!apiKey) {
      setAiError("请先在「设置」页面配置 API Key");
      setAiLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/analysis/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: aiProductName, productPrice: Number(aiProductPrice),
          category: aiCategory, platform: aiPlatform, apiKey, provider,
        }),
      });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "请求失败"); }

      const data = await res.json();

      const product = addProduct({
        title: aiProductName, price: Number(aiProductPrice),
        platform: aiPlatform as Product["platform"], url: "",
        category: aiCategory || "通用", tags: [],
      });

      const analysis = addAnalysis({
        productId: product.id,
        competitors: data.competitors.map((c: { title: string; price: number; platform: string; url?: string; rating: number; sales: number }) => ({
          title: c.title, price: c.price, platform: c.platform,
          url: c.url || "", rating: c.rating, sales: c.sales,
        })),
        avgPrice: data.avgPrice, priceRange: data.priceRange,
        marketPosition: data.marketPosition,
        insights: [...data.insights, data.trends],
      });

      setAiResult(analysis);
      saveMemory({ aiResult: analysis });
      setProducts(getAllProducts());
      setAnalyses((prev) => [analysis, ...prev]);
    } catch (error: unknown) {
      setAiError(error instanceof Error ? error.message : "请求失败");
    } finally {
      setAiLoading(false);
    }
  };

  const runManualAnalysis = () => {
    if (!selectedProduct || competitors.length === 0) return;
    const prices = [selectedProduct.price, ...competitors.map((c) => c.price)];
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    let position: "low" | "mid" | "high" = "mid";
    if (selectedProduct.price <= Math.min(...prices) * 1.05) position = "low";
    else if (selectedProduct.price >= Math.max(...prices) * 0.95) position = "high";
    const analysis = addAnalysis({
      productId: selectedProduct.id, competitors, avgPrice,
      priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
      marketPosition: position,
      insights: [
        position === "low" ? "价格处于市场低位，适合走量策略" : position === "high" ? "价格偏高，需通过品质/服务支撑溢价" : "中等价位，适合均衡打法",
        `市场均价 ¥${avgPrice}，共分析 ${competitors.length + 1} 个商品`, "建议持续关注竞品动态",
      ],
    });
    setAnalyses((prev) => [analysis, ...prev]);
    setCompetitors([]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h2 className="text-2xl font-bold">🔍 竞品分析</h2>
        <p className="text-gray-400 mt-1">AI 智能分析市场竞品，或手动添加竞品对比</p>
      </header>

      {/* AI Analysis */}
      <div className="bg-gradient-to-br from-purple-900/30 to-orange-900/20 border border-purple-500/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="font-semibold text-purple-300">AI 智能竞品分析</h3>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">推荐</span>
        </div>
        <p className="text-sm text-gray-400">输入商品名和价格，AI 自动生成竞品数据和分析报告（含店铺链接）</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <AIInput label="商品名称 *" value={aiProductName} onChange={(v) => { setAiProductName(v); saveMemory({ aiProductName: v }); }} placeholder="如：蓝牙耳机" />
          <AIInput label="价格 (¥) *" value={aiProductPrice} onChange={(v) => { setAiProductPrice(v); saveMemory({ aiProductPrice: v }); }} type="number" placeholder="59" />
          <div>
            <label className="block text-xs text-gray-400 mb-1">类目</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={aiCategory} onChange={(e) => { setAiCategory(e.target.value); saveMemory({ aiCategory: e.target.value }); }}>
              <option value="">通用</option>
              <option value="服装">服装</option><option value="电子产品">电子产品</option><option value="家居">家居</option>
              <option value="美妆">美妆</option><option value="玩具">玩具</option><option value="运动户外">运动户外</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">平台</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={aiPlatform} onChange={(e) => { setAiPlatform(e.target.value); saveMemory({ aiPlatform: e.target.value }); }}>
              <option value="temu">Temu</option><option value="amazon">Amazon</option><option value="shopee">Shopee</option>
            </select>
          </div>
        </div>

        <button onClick={runAIAnalysis} disabled={!aiProductName || !aiProductPrice || aiLoading}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {aiLoading ? "⏳ AI 分析中..." : "🤖 AI 智能分析"}
        </button>

        {aiError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
            {aiError}
            {aiError.includes("API Key") && <span className="ml-2 underline cursor-pointer" onClick={() => { localStorage.setItem("active_tab", "settings"); window.location.reload(); }}>去设置 →</span>}
          </div>
        )}

        {aiResult && <AnalysisResults product={{ title: aiProductName, price: Number(aiProductPrice), platform: aiPlatform } as Product} analyses={[aiResult]} />}
      </div>

      {/* Manual */}
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-gray-800" /><span className="text-xs text-gray-600">或手动分析</span><div className="flex-1 border-t border-gray-800" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <label className="block text-sm text-gray-300 mb-2 font-medium">选择商品</label>
        <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm" value={selectedProduct?.id || ""} onChange={(e) => setSelectedProduct(products.find((p) => p.id === e.target.value) || null)}>
          <option value="">-- 选择商品 --</option>
          {products.map((p) => (<option key={p.id} value={p.id}>{p.title} - ¥{p.price}</option>))}
        </select>
      </div>

      {selectedProduct && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-sm text-gray-300">添加竞品 ({competitors.length} 个)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <CInput label="竞品标题" value={newComp.title} onChange={(v) => setNewComp({ ...newComp, title: v })} />
              <CInput label="价格 (¥)" value={newComp.price} onChange={(v) => setNewComp({ ...newComp, price: v })} type="number" />
              <CInput label="链接" value={newComp.url} onChange={(v) => setNewComp({ ...newComp, url: v })} />
              <CInput label="评分" value={newComp.rating} onChange={(v) => setNewComp({ ...newComp, rating: v })} type="number" />
              <CInput label="销量" value={newComp.sales} onChange={(v) => setNewComp({ ...newComp, sales: v })} type="number" />
            </div>
            <button onClick={() => { if (newComp.title && newComp.price) { setCompetitors([...competitors, { title: newComp.title, price: Number(newComp.price), platform: newComp.platform, url: newComp.url, rating: newComp.rating ? Number(newComp.rating) : undefined, sales: newComp.sales ? Number(newComp.sales) : undefined }]); setNewComp({ title: "", price: "", platform: "temu", url: "", rating: "", sales: "" }); } }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">+ 添加竞品</button>
          </div>
          {competitors.length > 0 && (
            <div className="flex justify-center">
              <button onClick={runManualAnalysis} className="px-8 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-base font-bold transition-colors">🎯 开始分析</button>
            </div>
          )}
        </>
      )}

      {/* History */}
      {analyses.length > 0 && aiResult && analyses[0].id !== aiResult.id && (
        <AnalysisResults product={products.find((p) => p.id === analyses[0].productId) || ({ title: "未知", price: 0, platform: "temu" } as Product)} analyses={analyses} />
      )}
    </div>
  );
}

function AIInput({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input type={type} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function CInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input type={type} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AnalysisResults({ product, analyses }: { product: Product; analyses: CompetitorAnalysis[] }) {
  const latest = analyses[0];
  const positionLabels: Record<string, string> = { low: "💰 低价位", mid: "⚖️ 中等价位", high: "🏆 高价位" };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">📊 分析结果</h3>
      {analyses.map((a) => (
        <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat label="市场均价" value={`¥${a.avgPrice}`} color="white" />
            <MiniStat label="最低价" value={`¥${a.priceRange.min}`} color="green" />
            <MiniStat label="最高价" value={`¥${a.priceRange.max}`} color="red" />
            <MiniStat label="价格定位" value={positionLabels[a.marketPosition] || ""} color={a.marketPosition} />
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs">
                  <th className="text-left p-3">商品</th><th className="text-left p-3">平台</th><th className="text-right p-3">价格</th><th className="text-right p-3">评分</th><th className="text-right p-3">销量</th><th className="text-right p-3">对比</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800 bg-orange-500/5">
                  <td className="p-3 font-medium text-orange-400">⭐ {product.title}</td>
                  <td className="p-3">{product.platform.toUpperCase()}</td>
                  <td className="p-3 text-right text-orange-400 font-semibold">¥{product.price}</td>
                  <td className="p-3 text-right">{product.rating || "-"}</td>
                  <td className="p-3 text-right">{product.sales || "-"}</td>
                  <td className="p-3 text-right text-xs text-gray-500">你的</td>
                </tr>
                {a.competitors.map((c, i) => {
                  const diff = product.price - c.price;
                  const pct = c.price ? ((diff / c.price) * 100).toFixed(0) : "0";
                  return (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="p-3 max-w-[200px]">
                        <span className="truncate block">{c.title}</span>
                        {c.url && (
                          <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block" title={c.url}>
                            🔍 搜竞品
                          </a>
                        )}
                      </td>
                      <td className="p-3 text-xs">{c.platform?.toUpperCase() || "-"}</td>
                      <td className="p-3 text-right">¥{c.price}</td>
                      <td className="p-3 text-right">{c.rating ?? "-"}</td>
                      <td className="p-3 text-right">{c.sales ?? "-"}</td>
                      <td className={`p-3 text-right text-xs font-medium ${diff > 0 ? "text-red-400" : "text-green-400"}`}>{diff > 0 ? `+${pct}%` : `${pct}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">💡 AI 洞察</h4>
            <ul className="space-y-1">
              {a.insights.map((insight, i) => (
                <li key={i} className="text-sm text-gray-400 flex items-start gap-2"><span className="text-orange-400 mt-0.5">•</span> {insight}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-gray-600">{new Date(a.createdAt).toLocaleString("zh-CN")}</p>
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  const textColors: Record<string, string> = { white: "text-white", green: "text-green-400", red: "text-red-400", low: "text-green-400", mid: "text-yellow-400", high: "text-red-400" };
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${textColors[color] || "text-white"}`}>{value}</p>
    </div>
  );
}

