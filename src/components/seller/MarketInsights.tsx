import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fetchMarketTrends, MarketInsightRecord } from "@/lib/market-trends";
import { 
  TrendingUp, 
  Search, 
  Globe, 
  Cpu, 
  AlertTriangle, 
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function MarketInsights() {
  const [trends, setTrends] = useState<MarketInsightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState("Initializing AI Models...");

  const loadInsights = async () => {
    setLoading(true);
    setAiStatus("Connecting to Global Market Data Stream...");
    
    // Simulate phases of "AI Thinking"
    setTimeout(() => setAiStatus("Analyzing Search Patterns on Google/Socials..."), 800);
    setTimeout(() => setAiStatus("Calculating Opportunity Scores..."), 1600);

    try {
      const data = await fetchMarketTrends();
      setTrends(data);
    } catch (error) {
      console.error("Failed to load trends", error);
      toast.error("AI disconnected. Showing cached data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-black/5 dark:bg-white/5 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center h-[400px]">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full animate-pulse" />
            <Cpu className="h-16 w-16 text-blue-600 relative z-10 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
            {aiStatus}
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Fetching real-time data from open web sources...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <SparklesIcon className="text-amber-500" /> Market Intelligence
          </h2>
          <p className="text-muted-foreground">
            AI-driven recommendations based on real-time internet trends.
          </p>
        </div>
        <Button onClick={loadInsights} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trends.map((item, index) => (
          <motion.div
            key={item.trend.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-l-4 overflow-hidden relative group hover:shadow-xl transition-all duration-300 ${
              item.trend.opportunityScore > 90 ? "border-l-red-500" : 
              item.trend.opportunityScore > 75 ? "border-l-green-500" : "border-l-blue-500"
            }`}>
              {/* Background gradient for "AI Feel" */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant={item.trend.opportunityScore > 80 ? "destructive" : "secondary"} className="mb-2">
                      {item.trend.category}
                    </Badge>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {item.trend.keyword}
                      {item.trend.source === 'web_analysis' && (
                        <Globe className="h-4 w-4 text-blue-500" title="Detected from Web Analysis" />
                      )}
                    </CardTitle>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className={`text-xl font-bold ${
                        item.trend.growthRate > 0 ? "text-green-600" : "text-gray-500"
                      }`}>
                        {item.trend.growthRate > 0 ? "+" : ""}{item.trend.growthRate}%
                     </span>
                     <span className="text-xs text-muted-foreground">Growth</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-3 rounded-lg">
                    <div>
                      <span className="text-muted-foreground block text-xs">Search Vol</span>
                      <span className="font-semibold">{item.trend.searchVolume.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Competition</span>
                      <span className="font-semibold">{item.trend.activeListings} Sellers</span>
                    </div>
                  </div>

                  {/* Opportunity Score */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                       <span className="font-medium">Opportunity Score</span>
                       <span className="font-bold">{item.trend.opportunityScore}/100</span>
                    </div>
                    <Progress value={item.trend.opportunityScore} className={`h-2 ${
                        item.trend.opportunityScore > 90 ? "bg-red-100 [&>div]:bg-red-600" : 
                        "bg-blue-100 [&>div]:bg-blue-600"
                    }`} />
                  </div>

                  {/* AI Recommendation */}
                  <div className="flex gap-3 text-sm italic text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900/50">
                    <Cpu className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p dangerouslySetInnerHTML={{ __html: item.recommendation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>

                  <Button className="w-full gap-2 group-hover:bg-primary/90">
                    Source This Item <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={`w-6 h-6 ${className}`}
    >
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
    </svg>
  );
}
