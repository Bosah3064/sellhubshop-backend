import { addDays, format } from "date-fns";

export interface TrendData {
  id: string;
  keyword: string;
  category: string;
  searchVolume: number;
  activeListings: number;
  growthRate: number; // Percentage growth
  opportunityScore: number; // 0-100
  sentiment: "positive" | "neutral" | "negative";
  lastUpdated: string;
  source: "internal_data" | "web_analysis" | "predictive_ai";
}

export interface MarketInsightRecord {
  trend: TrendData;
  recommendation: string;
}

// Simulated "Open Web" Patterns
// In a real implementation, these would be fetched from Google Trends or Social Media APIs
const TREND_PATTERNS = [
  { keyword: "iPhone 15 Pro", category: "Electronics", baseVolume: 15000, baseListings: 45 },
  { keyword: "Winter Jackets", category: "Fashion", baseVolume: 8500, baseListings: 120 },
  { keyword: "Generated AI Art", category: "Digital Services", baseVolume: 12000, baseListings: 5 },
  { keyword: "Gaming Laptops", category: "Electronics", baseVolume: 6700, baseListings: 25 },
  { keyword: "Organic Honye", category: "Argiculture", baseVolume: 4200, baseListings: 12 },
  { keyword: "Toyota Axio", category: "Vehicles", baseVolume: 3100, baseListings: 80 },
  { keyword: "Affordable Housing", category: "Property", baseVolume: 9800, baseListings: 15 },
];

/**
 * Calculates a 0-100 Opportunity Score
 * High Search + Low Competition = High Score
 */
const calculateOpportunityScore = (volume: number, listings: number): number => {
  if (listings === 0) return 99;
  const ratio = volume / listings; // e.g. 1000 / 10 = 100 demand per listing
  // Normalize: assume > 500 demand/listing is amazing (100)
  return Math.min(Math.round((ratio / 500) * 100), 99);
};

/**
 * Simulates fetching data from "The Internet" / AI Models
 * This is the integration point for real APIs in the future.
 */
export async function fetchMarketTrends(): Promise<MarketInsightRecord[]> {
  // Simulate network delay for "AI Processing"
  await new Promise(resolve => setTimeout(resolve, 1500));

  const insights: MarketInsightRecord[] = TREND_PATTERNS.map((pattern) => {
    // Add randomness to make it feel "live"
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x
    const currentVolume = Math.round(pattern.baseVolume * randomFactor);
    const currentListings = pattern.baseListings; // Keep stable for now, or randomize slightly
    
    // Simulate growth
    const growth = Math.round((Math.random() * 20) - 5); // -5% to +15%

    const score = calculateOpportunityScore(currentVolume, currentListings);
    
    let source: TrendData["source"] = "internal_data";
    if (growth > 10) source = "web_analysis"; // "Viral" trends come from web
    if (score > 85) source = "predictive_ai"; // High opportunity detected by AI

    return {
      trend: {
        id: Math.random().toString(36).substr(2, 9),
        keyword: pattern.keyword,
        category: pattern.category,
        searchVolume: currentVolume,
        activeListings: currentListings,
        growthRate: growth,
        opportunityScore: score,
        sentiment: growth > 0 ? "positive" : "neutral",
        lastUpdated: new Date().toISOString(),
        source: source,
      },
      recommendation: generateRecommendation(pattern.keyword, score, growth),
    };
  });

  // Sort by Opportunity Score (Highest first)
  return insights.sort((a, b) => b.trend.opportunityScore - a.trend.opportunityScore);
}

function generateRecommendation(keyword: string, score: number, growth: number): string {
  if (score > 90) return `🔥 **Urgent:** High demand for **${keyword}** detected on external sites. Supply is critically low. List now!`;
  if (score > 75) return `✅ **Good Bet:** ${keyword} is trending with ${growth}% growth. Good profit margin expected.`;
  if (growth > 12) return `📈 **Viral:** ${keyword} is spiking in search. Get in before the market floods.`;
  return `ℹ️ **Steady:** ${keyword} has consistent demand. Safe for long-term listing.`;
}
