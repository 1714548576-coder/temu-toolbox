"use client";

import { useState, useEffect, useRef } from "react";
import { getAllProducts, addProduct, deleteProduct, importProducts, parseTemuCSV, deleteAllProducts } from "@/lib/db";
import { Product } from "@/types";

const CATEGORIES = ["服装", "电子产品", "家居", "美妆", "玩具", "运动户外", "宠物用品", "母婴", "饰品", "办公用品", "其他"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", price: "", platform: "temu", url: "", category: "", tags: "", rating: "", reviews: "", sales: "", views: "", clicks: "", ctr: "", conversionRate: "", orders: "", revenue: "", inventory: "", sku: "", listingDate: "" });

  // CSV import state
  const [showImport, setShowImport] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Product[]>([]);
  const [importMsg, setImportMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setProducts(getAllProducts()); }, []);

  const handleAdd = () => {
    if (!form.title || !form.price || !form.category) return;
    const product = addProduct({
      title: form.title, price: Number(form.price),
      platform: form.platform as Product["platform"], url: form.url, category: form.category,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      rating: form.rating ? Number(form.rating) : undefined,
      reviews: form.reviews ? Number(form.reviews) : undefined,
      sales: form.sales ? Number(form.sales) : undefined,
      views: form.views ? Number(form.views) : undefined,
      clicks: form.clicks ? Number(form.clicks) : undefined,
      ctr: form.ctr ? parseFloat(form.ctr) : undefined,
      conversionRate: form.conversionRate ? parseFloat(form.conversionRate) : undefined,
      orders: form.orders ? Number(form.orders) : undefined,
      revenue: form.revenue ? Number(form.revenue) : undefined,
      inventory: form.inventory ? Number(form.inventory) : undefined,
      sku: form.sku || undefined, listingDate: form.listingDate || undefined,
    });
    setProducts((prev) => [product, ...prev]);
    setForm({ title: "", price: "", platform: "temu", url: "", category: "", tags: "", rating: "", reviews: "", sales: "", views: "", clicks: "", ctr: "", conversionRate: "", orders: "", revenue: "", inventory: "", sku: "", listingDate: "" });
    setShowForm(false);
  };

  // CSV Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseTemuCSV(text);
      setCsvPreview(parsed as unknown as Product[]);
      setImportMsg(`识别到 ${parsed.length} 个商品`);
    };
    reader.onerror = () => setImportMsg("❌ 文件读取失败");
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (csvPreview.length === 0) return;
    const imported = importProducts(csvPreview);
    setProducts((prev) => [...imported, ...prev]);
    setCsvPreview([]);
    setImportMsg(`✅ 成功导入 ${imported.length} 个商品`);
    setShowImport(false);
    setTimeout(() => setImportMsg(""), 3000);
  };

  // Drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const parsed = parseTemuCSV(text);
        setCsvPreview(parsed as unknown as Product[]);
        setImportMsg(`识别到 ${parsed.length} 个商品`);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div><h2 className="text-2xl font-bold">📦 商品管理</h2><p className="text-gray-400 mt-1">{products.length} 个商品</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(!showImport)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors">
            📥 CSV 导入
          </button>
          <button onClick={() => { if (confirm("确定删除全部商品？")) { deleteAllProducts(); setProducts([]); } }} className="px-3 py-2 bg-red-600/30 hover:bg-red-600/50 rounded-lg text-sm text-red-400 transition-colors">
            🗑️ 清空
          </button>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors">
            {showForm ? "取消" : "+ 手动添加"}
          </button>
        </div>
      </header>

      {importMsg && <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-sm text-purple-400">{importMsg}</div>}

      {/* CSV Import Panel */}
      {showImport && (
        <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-purple-300">📥 导入 Temu 店铺 CSV</h3>
          <p className="text-sm text-gray-400">
            从 Temu 卖家中心导出商品 CSV，拖拽或点击上传。自动识别标题、价格、销量、点击率等字段。
          </p>

          <div
            className="border-2 border-dashed border-gray-700 hover:border-purple-500 rounded-xl p-8 text-center cursor-pointer transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-4xl mb-3">📁</div>
            <p className="text-sm text-gray-300">拖拽 CSV 文件到这里，或点击选择</p>
            <p className="text-xs text-gray-600 mt-1">支持 .csv 格式，自动解析中文/英文列名</p>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </div>

          {/* Preview table */}
          {csvPreview.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-300">预览 ({csvPreview.length} 个商品)</h4>
                <button onClick={handleImport} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium">确认导入</button>
              </div>
              <div className="overflow-x-auto max-h-64 rounded-lg border border-gray-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 sticky top-0 bg-gray-900">
                      <th className="text-left p-2">标题</th><th className="text-right p-2">价格</th><th className="text-right p-2">销量</th><th className="text-right p-2">点击率</th><th className="text-right p-2">转化率</th><th className="text-right p-2">销售额</th><th className="text-left p-2">SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((p, i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td className="p-2 truncate max-w-[180px]">{p.title}</td>
                        <td className="p-2 text-right">¥{p.price}</td>
                        <td className="p-2 text-right">{p.sales || "-"}</td>
                        <td className="p-2 text-right">{p.ctr != null ? `${p.ctr}%` : "-"}</td>
                        <td className="p-2 text-right">{p.conversionRate != null ? `${p.conversionRate}%` : "-"}</td>
                        <td className="p-2 text-right text-green-400">{p.revenue ? `¥${p.revenue}` : "-"}</td>
                        <td className="p-2 text-xs text-gray-500">{p.sku || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual add form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm text-gray-300">手动添加商品</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <F label="商品标题 *" v={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <F label="价格 ¥ *" v={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" />
            <Sel label="平台" v={form.platform} opts={["temu", "amazon", "shopee", "other"]} onChange={(v) => setForm({ ...form, platform: v })} />
            <F label="SKU" v={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
            <Sel label="类目" v={form.category} opts={CATEGORIES} onChange={(v) => setForm({ ...form, category: v })} />
            <F label="标签" v={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="逗号分隔" />
            <F label="销量" v={form.sales} onChange={(v) => setForm({ ...form, sales: v })} type="number" />
            <F label="浏览量" v={form.views} onChange={(v) => setForm({ ...form, views: v })} type="number" />
            <F label="点击量" v={form.clicks} onChange={(v) => setForm({ ...form, clicks: v })} type="number" />
            <F label="点击率 %" v={form.ctr} onChange={(v) => setForm({ ...form, ctr: v })} type="number" />
            <F label="转化率 %" v={form.conversionRate} onChange={(v) => setForm({ ...form, conversionRate: v })} type="number" />
            <F label="订单数" v={form.orders} onChange={(v) => setForm({ ...form, orders: v })} type="number" />
            <F label="销售额" v={form.revenue} onChange={(v) => setForm({ ...form, revenue: v })} type="number" />
            <F label="库存" v={form.inventory} onChange={(v) => setForm({ ...form, inventory: v })} type="number" />
            <F label="上架日期" v={form.listingDate} onChange={(v) => setForm({ ...form, listingDate: v })} placeholder="2024-01-01" />
          </div>
          <button onClick={handleAdd} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium">确认添加</button>
        </div>
      )}

      {/* Table */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📭</div>
          <p>还没有商品</p>
          <p className="text-sm mt-1">点击「CSV 导入」上传 Temu 数据，或「手动添加」</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-800 text-gray-400 text-xs"><th className="text-left p-3">商品</th><th className="text-left p-3">SKU</th><th className="text-right p-3">价格</th><th className="text-right p-3">销量</th><th className="text-right p-3">点击率</th><th className="text-right p-3">转化率</th><th className="text-right p-3">销售额</th><th className="text-right p-3">操作</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-3"><p className="font-medium truncate max-w-[180px]">{p.title}</p><p className="text-xs text-gray-500">{p.platform.toUpperCase()} · {p.category}</p></td>
                  <td className="p-3 text-xs text-gray-500 font-mono">{p.sku || "-"}</td>
                  <td className="p-3 text-right font-semibold text-orange-400">¥{p.price}</td>
                  <td className="p-3 text-right">{p.sales?.toLocaleString() || "-"}</td>
                  <td className="p-3 text-right">{p.ctr != null ? `${p.ctr}%` : "-"}</td>
                  <td className="p-3 text-right">{p.conversionRate != null ? `${p.conversionRate}%` : "-"}</td>
                  <td className="p-3 text-right text-green-400">{p.revenue ? `¥${p.revenue.toLocaleString()}` : "-"}</td>
                  <td className="p-3 text-right"><button onClick={() => { deleteProduct(p.id); setProducts((prev) => prev.filter((x) => x.id !== p.id)); }} className="text-red-400 hover:text-red-300 text-xs">删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, v, onChange, type = "text", placeholder }: { label: string; v: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input type={type} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors" value={v} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Sel({ label, v, opts, onChange }: { label: string; v: string; opts: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value={v} onChange={(e) => onChange(e.target.value)}>
        {label === "类目" && <option value="">选择类目</option>}
        {opts.map((o) => (<option key={o} value={o}>{o.toUpperCase()}</option>))}
      </select>
    </div>
  );
}
