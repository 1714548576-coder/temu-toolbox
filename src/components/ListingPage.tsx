"use client";

import { useState, useEffect } from "react";
import { getAllListings, addListing, deleteListing } from "@/lib/db";
import { generateListing } from "@/lib/openai";
import { ListingDraft } from "@/types";

const MEMORY_KEY = "listing_form_state";

export default function ListingPage() {
  const [listings, setListings] = useState<ListingDraft[]>([]);
  const [form, setForm] = useState({ productName: "", category: "", keywords: "", language: "zh" as "zh" | "en", targetMarket: "美国" });
  const [generated, setGenerated] = useState<{ title: string; description: string; bulletPoints: string[]; keywords: string[] } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setListings(getAllListings());
    // Restore form state
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      if (saved) {
        const m = JSON.parse(saved);
        setForm(m.form || form);
        if (m.generated) setGenerated(m.generated);
      }
    } catch {}
  }, []);

  // Persist form
  useEffect(() => {
    localStorage.setItem(MEMORY_KEY, JSON.stringify({ form, generated }));
  }, [form, generated]);

  const generate = async () => {
    if (!form.productName) return;
    const apiKey = localStorage.getItem("openai_api_key");
    const provider = localStorage.getItem("ai_provider") || "openai";
    if (!apiKey) { setError("请先在「设置」页面配置 API Key"); return; }

    setIsGenerating(true); setError(""); setGenerated(null);
    try {
      const res = await fetch("/api/listing/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.productName, category: form.category,
          targetMarket: form.targetMarket, language: form.language,
          keywords: form.keywords ? form.keywords.split(/[,，]/).map((k: string) => k.trim()) : [],
          apiKey, provider,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "生成失败"); }
      const data = await res.json();
      setGenerated(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally { setIsGenerating(false); }
  };

  const saveDraft = () => {
    if (!generated) return;
    const listing = addListing({
      title: generated.title, description: generated.description,
      bulletPoints: generated.bulletPoints, keywords: generated.keywords,
      language: form.language, targetMarket: form.targetMarket,
    });
    setListings((prev) => [listing, ...prev]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h2 className="text-2xl font-bold">✨ AI Listing 生成</h2>
        <p className="text-gray-400 mt-1">GPT 驱动的智能 Listing 生成</p>
      </header>

      <div className="bg-gradient-to-br from-purple-900/20 to-orange-900/10 border border-purple-500/20 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2"><span className="text-lg">🤖</span><h3 className="font-semibold text-purple-300">AI 智能生成</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <LInput label="商品名称 *" value={form.productName} onChange={(v) => setForm({ ...form, productName: v })} placeholder="如：纯棉短袖T恤" />
          <div>
            <label className="block text-xs text-gray-400 mb-1">类目</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">通用</option><option value="服装">服装</option><option value="电子产品">电子产品</option><option value="家居">家居</option>
            </select>
          </div>
          <LInput label="目标市场" value={form.targetMarket} onChange={(v) => setForm({ ...form, targetMarket: v })} placeholder="如：美国" />
          <div>
            <label className="block text-xs text-gray-400 mb-1">语言</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as "zh" | "en" })}>
              <option value="zh">中文</option><option value="en">English</option>
            </select>
          </div>
        </div>
        <LInput label="关键词 (逗号分隔)" value={form.keywords} onChange={(v) => setForm({ ...form, keywords: v })} placeholder="如：纯棉, 透气, 夏季" />

        <button onClick={generate} disabled={!form.productName || isGenerating}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 rounded-lg text-sm font-bold transition-all disabled:opacity-50">
          {isGenerating ? "⏳ AI 生成中..." : "✨ AI 生成 Listing"}
        </button>
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}
      </div>

      {generated && (
        <div className="bg-gray-900 border border-green-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-green-400">✅ AI 生成结果</h3>
            <button onClick={saveDraft} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium">保存草稿</button>
          </div>
          <Card label="📌 商品标题" content={generated.title} onCopy={() => navigator.clipboard.writeText(generated.title)} />
          <Card label="📋 卖点列表" content={generated.bulletPoints.join("\n")} onCopy={() => navigator.clipboard.writeText(generated.bulletPoints.join("\n"))}>
            <ul className="space-y-1 mt-1">{generated.bulletPoints.map((bp, i) => (<li key={i} className="text-sm text-gray-300">{bp}</li>))}</ul>
          </Card>
          <Card label="📝 商品描述" content={generated.description} onCopy={() => navigator.clipboard.writeText(generated.description)}>
            <p className="text-sm text-gray-300 leading-relaxed mt-1">{generated.description}</p>
          </Card>
          <div>
            <span className="text-xs text-gray-500 uppercase">🏷️ 关键词 ({generated.keywords.length}个)</span>
            <div className="flex flex-wrap gap-2 mt-2">{generated.keywords.map((kw) => (<span key={kw} className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-md text-xs text-gray-400">{kw}</span>))}</div>
          </div>
        </div>
      )}

      {listings.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-gray-300 mb-3">📁 历史草稿</h3>
          <div className="space-y-2">
            {listings.map((l) => (
              <div key={l.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{l.title}</p><p className="text-xs text-gray-500 mt-0.5">{l.targetMarket} · {l.language === "zh" ? "中文" : "EN"}</p></div>
                <button onClick={() => { deleteListing(l.id); setListings((prev) => prev.filter((x) => x.id !== l.id)); }} className="text-xs text-red-400 hover:text-red-300 ml-4">删除</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Card({ label, content, onCopy, children }: { label: string; content: string; onCopy: () => void; children?: React.ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 group">
      <div className="flex items-center justify-between mb-1"><span className="text-xs text-gray-500 uppercase">{label}</span><button onClick={onCopy} className="text-xs text-gray-500 hover:text-white transition-colors">复制</button></div>
      {children}
    </div>
  );
}
