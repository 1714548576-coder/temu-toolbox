export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image?: string;
  platform: "temu" | "amazon" | "shopee" | "other";
  url: string;
  rating?: number;
  reviews?: number;
  sales?: number;
  views?: number;
  clicks?: number;
  ctr?: number;
  conversionRate?: number;
  orders?: number;
  revenue?: number;
  inventory?: number;
  sku?: string;
  listingDate?: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorAnalysis {
  id: string;
  productId: string;
  competitors: CompetitorItem[];
  avgPrice: number;
  priceRange: { min: number; max: number };
  marketPosition: "low" | "mid" | "high";
  insights: string[];
  createdAt: string;
}

export interface CompetitorItem {
  title: string;
  price: number;
  platform: string;
  url: string;
  rating?: number;
  sales?: number;
}

export interface ListingDraft {
  id: string;
  title: string;
  description: string;
  bulletPoints: string[];
  keywords: string[];
  language: "zh" | "en";
  targetMarket: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalAnalyses: number;
  totalListings: number;
  avgMarketPrice: number;
  totalSales: number;
  totalRevenue: number;
  avgCtr: number;
  avgConversion: number;
  recentProducts: Product[];
  priceDistribution: { range: string; count: number }[];
  weeklyActivity: { day: string; analyses: number; listings: number }[];
}
