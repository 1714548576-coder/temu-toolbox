const PROVIDERS: Record<string, { base: string; model: string }> = {
  openai: { base: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  deepseek: { base: "https://api.deepseek.com/v1", model: "deepseek-chat" },
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  provider: string,
  options?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  const config = PROVIDERS[provider] || PROVIDERS.openai;

  const res = await fetch(`${config.base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model || config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export interface AICompetitor {
  title: string;
  price: number;
  platform: string;
  url: string;
  rating: number;
  sales: number;
}

export interface AIAnalysisResult {
  competitors: AICompetitor[];
  avgPrice: number;
  priceRange: { min: number; max: number };
  marketPosition: "low" | "mid" | "high";
  insights: string[];
  trends: string;
}

export async function generateCompetitorAnalysis(
  productName: string,
  productPrice: number,
  category: string,
  platform: string,
  apiKey: string,
  provider: string
): Promise<AIAnalysisResult> {
  const systemPrompt = `你是一个跨境电商竞品分析专家，专门分析 Temu、Amazon 等平台的商品定价策略。
你的回答必须是严格的 JSON 格式，不要包含 markdown 代码块标记或其他文字。

根据用户提供的商品信息，模拟对该品类市场的深度调研结果。你需要：
1. 生成 3-5 个逼真的竞品（标题、价格、平台、评分 1-5、预估销量）
2. 计算市场均价和价格区间
3. 判断用户的定价策略属于低价/中价/高价
4. 给出 3-5 条可操作的定价和运营建议
5. 用简短段落总结该品类趋势

重要：url 字段必须是真实可用的搜索链接，格式如下：
- Temu: https://www.temu.com/search_result.html?search_key=竞品标题关键词
- Amazon: https://www.amazon.com/s?k=竞品标题关键词
- Shopee: https://shopee.com/search?keyword=竞品标题关键词
URL 中的搜索词用竞品标题的核心关键词（英文，用 + 号连接），不要编造不存在的商品详情页。

格式要求：
{
  "competitors": [
    { "title": "竞品标题", "price": 数字, "platform": "temu/amazon/shopee", "url": "对应平台的搜索链接", "rating": 1-5数字, "sales": 数字 }
  ],
  "avgPrice": 数字,
  "priceRange": { "min": 数字, "max": 数字 },
  "marketPosition": "low/mid/high",
  "insights": ["建议1", "建议2", ...],
  "trends": "市场趋势分析段落"
}`;

  const userPrompt = `请分析以下商品：
- 商品名称：${productName}
- 售价：¥${productPrice}
- 类目：${category}
- 平台：${platform}

请生成竞品分析数据（用中文回复）。`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    apiKey,
    provider,
    { temperature: 0.8, maxTokens: 2000 }
  );

  const cleaned = response.replace(/```json\s*|\s*```/g, "").trim();
  return JSON.parse(cleaned);
}

export interface AIListingResult {
  title: string;
  description: string;
  bulletPoints: string[];
  keywords: string[];
}

export async function generateListing(
  productName: string,
  category: string,
  targetMarket: string,
  language: "zh" | "en",
  keywords: string[],
  apiKey: string,
  provider: string
): Promise<AIListingResult> {
  const langInstruction = language === "en"
    ? "Generate in English"
    : "Generate in Chinese (中文)";

  const systemPrompt = `你是一个顶级的跨境电商 Listing 优化专家，精通 Temu、Amazon、Shopee 等平台的搜索算法和用户心理。
你的任务是根据商品信息，生成高转化率的商品 Listing。

${langInstruction}

你的回答必须是严格的 JSON 格式，不要包含 markdown 代码块标记或其他文字。

格式要求：
{
  "title": "商品标题（需包含核心关键词、卖点、场景，控制在200字符内）",
  "description": "商品详情描述（300-500字，包含材质/功能/场景/售后承诺）",
  "bulletPoints": ["卖点1", "卖点2", "卖点3", "卖点4", "卖点5"],
  "keywords": ["关键词1", "关键词2", "关键词3", ...最多10个]
}

生成原则：
- 标题：关键词前置 + 核心卖点 + 情感触发词 + 场景词
- 卖点：每条 15-25 字，解决一个用户痛点
- 描述：AIDA 模型
- 关键词：长尾词为主`;

  const userPrompt = `
商品名称：${productName}
类目：${category}
目标市场：${targetMarket}
已有关键词：${keywords.join(", ") || "无"}

请生成优化后的 Listing。`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    apiKey,
    provider,
    { temperature: 0.9, maxTokens: 2500 }
  );

  const cleaned = response.replace(/```json\s*|\s*```/g, "").trim();
  return JSON.parse(cleaned);
}
