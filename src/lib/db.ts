import { Product, CompetitorAnalysis, ListingDraft } from "@/types";

const STORE_KEY = "temu_toolbox_data";

interface StoreData {
  products: Product[];
  analyses: CompetitorAnalysis[];
  listings: ListingDraft[];
}

function getStore(): StoreData {
  if (typeof window === "undefined") return { products: [], analyses: [], listings: [] };
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return { products: [], analyses: [], listings: [] };
  return JSON.parse(raw);
}

function setStore(data: StoreData): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

// Products
export function getAllProducts(): Product[] {
  return getStore().products;
}

export function addProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
  const store = getStore();
  const newProduct: Product = {
    ...product,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.products.unshift(newProduct);
  setStore(store);
  return newProduct;
}

export function importProducts(products: Omit<Product, "id" | "createdAt" | "updatedAt">[]): Product[] {
  const store = getStore();
  const now = new Date().toISOString();
  const newProducts: Product[] = products.map((p, i) => ({
    ...p,
    id: crypto.randomUUID(),
    createdAt: new Date(Date.now() - i * 1000).toISOString(), // preserve order
    updatedAt: now,
  }));
  store.products = [...newProducts, ...store.products];
  setStore(store);
  return newProducts;
}

export function deleteProduct(id: string): void {
  const store = getStore();
  store.products = store.products.filter((p) => p.id !== id);
  setStore(store);
}

export function deleteAllProducts(): void {
  const store = getStore();
  store.products = [];
  setStore(store);
}

// Analyses
export function getAllAnalyses(): CompetitorAnalysis[] {
  return getStore().analyses;
}

export function addAnalysis(analysis: Omit<CompetitorAnalysis, "id" | "createdAt">): CompetitorAnalysis {
  const store = getStore();
  const newAnalysis: CompetitorAnalysis = { ...analysis, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  store.analyses.unshift(newAnalysis);
  setStore(store);
  return newAnalysis;
}

// Listings
export function getAllListings(): ListingDraft[] {
  return getStore().listings;
}

export function addListing(listing: Omit<ListingDraft, "id" | "createdAt">): ListingDraft {
  const store = getStore();
  const newListing: ListingDraft = { ...listing, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  store.listings.unshift(newListing);
  setStore(store);
  return newListing;
}

export function deleteListing(id: string): void {
  const store = getStore();
  store.listings = store.listings.filter((l) => l.id !== id);
  setStore(store);
}

// Dashboard Stats
export function getDashboardStats() {
  const store = getStore();
  const products = store.products;

  const prices = products.map((p) => p.price).filter(Boolean);
  const salesValues = products.map((p) => p.sales || 0);
  const revenueValues = products.map((p) => p.revenue || 0);
  const ctrValues = products.map((p) => p.ctr || 0).filter((v) => v > 0);
  const convValues = products.map((p) => p.conversionRate || 0).filter((v) => v > 0);

  return {
    totalProducts: products.length,
    totalAnalyses: store.analyses.length,
    totalListings: store.listings.length,
    avgMarketPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
    totalSales: salesValues.reduce((a, b) => a + b, 0),
    totalRevenue: revenueValues.reduce((a, b) => a + b, 0),
    avgCtr: ctrValues.length > 0 ? +(ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length).toFixed(1) : 0,
    avgConversion: convValues.length > 0 ? +(convValues.reduce((a, b) => a + b, 0) / convValues.length).toFixed(1) : 0,
  };
}

// CSV Parsing utility
export function parseTemuCSV(csvText: string): Omit<Product, "id" | "createdAt" | "updatedAt">[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(/[,\t]/).map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

  // Column mapping: common Temu/Amazon CSV column names
  const colMap: Record<string, keyof Product> = {
    "商品名称": "title", "标题": "title", "产品名称": "title", "title": "title", "product name": "title",
    "价格": "price", "售价": "price", "price": "price", "销售价": "price",
    "原价": "originalPrice", "original price": "originalPrice",
    "sku": "sku", "sku编码": "sku",
    "类目": "category", "分类": "category", "category": "category",
    "销量": "sales", "已售": "sales", "sales": "sales", "sold": "sales",
    "浏览量": "views", "曝光": "views", "views": "views", "impressions": "views",
    "点击量": "clicks", "点击": "clicks", "clicks": "clicks",
    "点击率": "ctr", "ctr": "ctr", "click rate": "ctr",
    "转化率": "conversionRate", "转化": "conversionRate", "conversion": "conversionRate", "conversion rate": "conversionRate",
    "订单数": "orders", "订单": "orders", "orders": "orders",
    "销售额": "revenue", "收入": "revenue", "revenue": "revenue", "gmv": "revenue",
    "库存": "inventory", "stock": "inventory", "inventory": "inventory",
    "评分": "rating", "rating": "rating",
    "评论数": "reviews", "reviews": "reviews",
    "上架日期": "listingDate", "date": "listingDate",
    "平台": "platform", "platform": "platform",
    "链接": "url", "url": "url", "link": "url",
    "标签": "tags", "tags": "tags",
    "图片": "image", "image": "image",
  };

  // Find column indices
  const mapping: { index: number; field: keyof Product }[] = [];
  headers.forEach((h, i) => {
    const field = colMap[h];
    if (field) mapping.push({ index: i, field });
  });

  const products: Omit<Product, "id" | "createdAt" | "updatedAt">[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const product: Record<string, unknown> = {
      title: "",
      price: 0,
      platform: "temu",
      url: "",
      category: "未分类",
      tags: [],
    };

    mapping.forEach(({ index, field }) => {
      const val = cols[index]?.replace(/^"|"$/g, "").trim();
      if (!val) return;

      // Number fields
      const numFields: (keyof Product)[] = ["price", "originalPrice", "rating", "reviews", "sales", "views", "clicks", "orders", "inventory"];
      const floatFields: (keyof Product)[] = ["ctr", "conversionRate", "revenue"];

      if (numFields.includes(field)) {
        product[field] = Number(val.replace(/[¥$￥,]/g, "")) || 0;
      } else if (floatFields.includes(field)) {
        product[field] = parseFloat(val.replace(/[%]/g, "")) || 0;
      } else if (field === "tags") {
        product[field] = val.split(/[,，\s]+/).filter(Boolean);
      } else {
        product[field] = val;
      }
    });

    if (product.title) {
      products.push(product as Omit<Product, "id" | "createdAt" | "updatedAt">);
    }
  }

  return products;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if ((ch === "," || ch === "\t") && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
