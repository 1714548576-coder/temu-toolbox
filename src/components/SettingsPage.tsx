"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("openai");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem("openai_api_key") || "");
    setProvider(localStorage.getItem("ai_provider") || "openai");
  }, []);

  const handleSave = () => {
    localStorage.setItem("openai_api_key", apiKey);
    localStorage.setItem("ai_provider", provider);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header><h2 className="text-2xl font-bold">⚙️ 设置</h2><p className="text-gray-400 mt-1">配置 AI 平台和 API 密钥</p></header>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-sm text-gray-300">🌐 AI 平台</h3>
        <div className="flex gap-3">
          <label className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${provider === "deepseek" ? "border-purple-500 bg-purple-500/10" : "border-gray-700 bg-gray-800"}`}>
            <input type="radio" name="provider" value="deepseek" checked={provider === "deepseek"} onChange={() => setProvider("deepseek")} className="sr-only" />
            <div className="text-sm font-medium">🚀 DeepSeek</div><div className="text-xs text-gray-500 mt-0.5">便宜好用 · 中文友好</div>
          </label>
          <label className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${provider === "openai" ? "border-purple-500 bg-purple-500/10" : "border-gray-700 bg-gray-800"}`}>
            <input type="radio" name="provider" value="openai" checked={provider === "openai"} onChange={() => setProvider("openai")} className="sr-only" />
            <div className="text-sm font-medium">🧠 OpenAI</div><div className="text-xs text-gray-500 mt-0.5">官方原版 · 最强模型</div>
          </label>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-sm text-gray-300">🔑 API Key</h3>
        <p className="text-xs text-gray-500">{provider === "deepseek" ? "在 platform.deepseek.com 获取" : "在 platform.openai.com 获取"}。仅保存在浏览器本地。</p>
        <div className="flex gap-3">
          <input type="password" className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors" value={apiKey} placeholder="sk-..." onChange={(e) => setApiKey(e.target.value)} />
          <button onClick={handleSave} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors">{saved ? "✅ 已保存" : "保存"}</button>
        </div>
      </div>

      <div className="bg-gray-900 border border-red-500/30 rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-sm text-red-400">⚠️ 危险操作</h3>
        <button onClick={() => { if (confirm("确定要清除所有数据？")) { localStorage.clear(); window.location.reload(); } }} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors">清除所有数据</button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5"><h3 className="font-semibold text-sm text-gray-300">ℹ️ 关于</h3><p className="text-sm text-gray-500 mt-1">Temu 卖家工具箱 v1.0 · 支持 OpenAI & DeepSeek</p></div>
    </div>
  );
}
