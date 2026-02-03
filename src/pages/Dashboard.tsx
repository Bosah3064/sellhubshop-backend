import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import {
  Package,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  MapPin,
  Star,
  Image as ImageIcon,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
  Users,
  Share2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CompactPriceDisplay } from "@/components/PriceDisplay";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area 
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketInsights } from "@/components/seller/MarketInsights";
import { ShareProductDialog } from "@/components/social/ShareProductDialog";
import { SellerOrders } from "@/components/seller/SellerOrders";
import { BuyerOrders } from "@/components/dashboard/BuyerOrders";

interface DashboardStats {
  totalProducts: number;
  totalViews: number;
  activeProducts: number;
  totalRevenue: number;
  totalMessages: number;
  pendingProducts: number;
  todayViews: number;
  monthlyRevenue: number;
}

interface UserPlan {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  plans?: {
    id: string;
    name: string;
  };
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: string;
  featured: boolean;
  verified: boolean;
  created_at: string;
  views: number;
  location: string;
  images: string[];
  category: string | null;
  user_id: string;
}

// Custom hook for dashboard data
const useDashboardData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalViews: 0,
    activeProducts: 0,
    totalRevenue: 0,
    totalMessages: 0,
    pendingProducts: 0,
    todayViews: 0,
    monthlyRevenue: 0,
  });
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [recentViewers, setRecentViewers] = useState<any[]>([]); // New State for "Who Viewed"
  const { toast } = useToast();

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please sign in to access dashboard",
        });
        return;
      }

      if (userError) throw userError;

      console.log("🔄 Loading dashboard for user:", user.id);

      // Load data in parallel for better performance
      const [productsResponse, planResponse, messagesResponse, profileResponse] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, description, price, status, views, created_at, images, category, location, featured, verified, user_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        (supabase
          .from("user_plans")
          .select("id, status, user_id, plan_id, plans!plan_id(id, name)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle() as any),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user.id)
          .eq("is_read", false),
        supabase
          .from("profiles")
          .select("username, plan_type")
          .eq("id", user.id)
          .single(),
      ]);

      // Process products
      const userProducts = (productsResponse.data || []) as Product[];
      setProducts(userProducts);

      // Process username
      if (profileResponse.data) {
        setUsername(profileResponse.data.username);
      }

      // Process plan
      if (planResponse.data) {
        setPlan(planResponse.data as any);
      } else {
        // Fallback: If no active user_plan found, check profiles.plan_type
        const profile = profileResponse.data;

        if (profile?.plan_type && profile.plan_type !== 'free') {
          setPlan({
            plan_id: '',
            status: 'active',
            user_id: user.id,
            id: 'fallback',
            plans: {
              id: '',
              name: profile.plan_type.charAt(0).toUpperCase() + profile.plan_type.slice(1),
              product_limit: profile.plan_type === 'gold' ? Infinity : 50
            }
          } as any);
        } else {
          setPlan(null);
        }
      }

      // Process messages
      const unreadMessagesCount = messagesResponse.count || 0;

      // Calculate stats from products (fast calculation)
      let totalViews = 0;
      let activeProducts = 0;
      let pendingProducts = 0;

      userProducts.forEach((product) => {
        const productViews = Number(product.views) || 0;
        totalViews += productViews;

        if (product.status === "active" || product.status === "approved") {
          activeProducts++;
        } else if (product.status === "pending") {
          pendingProducts++;
        }
      });

      // Set initial stats immediately
      const initialStats: DashboardStats = {
        totalProducts: userProducts.length,
        totalViews,
        activeProducts,
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalMessages: unreadMessagesCount,
        pendingProducts,
        todayViews: 0,
      };

      setStats(initialStats);

      // Load revenue data in background (slower operation)
      setTimeout(async () => {
        try {
          let totalRevenue = 0;
          let monthlyRevenue = 0;

          const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select("price, status, created_at, seller_id, user_id")
            .or(`seller_id.eq.${user.id},user_id.eq.${user.id}`)
            .eq("status", "completed");

          if (!ordersError && ordersData) {
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            ordersData.forEach((order) => {
              const amount = Number(order.price) || 0;
              totalRevenue += amount;

              if (order.created_at) {
                const orderDate = new Date(order.created_at);
                if (
                  orderDate.getMonth() === currentMonth &&
                  orderDate.getFullYear() === currentYear
                ) {
                  monthlyRevenue += amount;
                }
              }
            });
          }

          // Update stats with revenue data
          setStats((prev) => ({
            ...prev,
            totalRevenue,
            monthlyRevenue,
          }));
        } catch (error) {
          console.log("❌ Error loading revenue data:", error);
        }
      }, 100);

      // ---------------------------------------------------------
      // 📊 Load Real Chart Data & "Who Viewed"
      // ---------------------------------------------------------
      const productIds = userProducts.map((p) => p.id);
      
      if (productIds.length > 0) {
        // A. Fetch Views History (Last 7 Days) for Chart
        const { data: viewsData } = await supabase
          .from("product_views")
          .select("created_at")
          .in("product_id", productIds)
          .gte("created_at", subDays(new Date(), 7).toISOString());

        // Process Views into Chart Data
        const chartMap = new Map<string, number>();
        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
          const dateStr = format(subDays(new Date(), i), "MMM dd");
          chartMap.set(dateStr, 0);
        }

        if (viewsData) {
          viewsData.forEach((view) => {
            const dateStr = format(new Date(view.created_at), "MMM dd");
            if (chartMap.has(dateStr)) {
              chartMap.set(dateStr, (chartMap.get(dateStr) || 0) + 1);
            }
          });
        }

        const realChartData = Array.from(chartMap.entries()).map(([date, views]) => ({
          date,
          views,
        }));
        setPerformanceData(realChartData);

        // B. Fetch Recent Unique Viewers ("Who Viewed")
        // Note: product_views might not have user_id if anonymous, so we filter where user_id is not null
        // We need to fetch views with user_id, then get unique user profiles
        const { data: viewerIdsData } = await supabase
           .from("product_views")
           .select("user_id, created_at")
           .in("product_id", productIds)
           .not("user_id", "is", null) 
           .order("created_at", { ascending: false })
           .limit(20);

        if (viewerIdsData && viewerIdsData.length > 0) {
           const uniqueViewerIds = [...new Set(viewerIdsData.map(v => v.user_id))].slice(0, 5);
           
           if (uniqueViewerIds.length > 0) {
              const { data: profiles } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url, username")
                .in("id", uniqueViewerIds);
                
              setRecentViewers(profiles || []);
           }
        }
      } else {
        // No products = No views
         const emptyChart = Array.from({ length: 7 }).map((_, i) => ({
            date: format(subDays(new Date(), 6 - i), 'MMM dd'),
            views: 0
         }));
         setPerformanceData(emptyChart);
      }
    } catch (error: any) {
      console.error("❌ Error loading dashboard data:", error);
      toast({
        variant: "destructive",
        title: "Error loading dashboard",
        description: error.message || "Failed to load dashboard data",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Removed Mock Data Generation
  // const performanceData = ... (replaced by state)

  return {
    products,
    stats,
    performanceData, // Now returns real data state
    recentViewers, // Export new state
    plan,
    username,
    setUsername,
    isLoading,
    loadDashboardData,
  };
};

export default function Dashboard() {
  const { products, stats, performanceData, recentViewers, plan, username, isLoading, loadDashboardData } =
    useDashboardData();
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Dashboard - Manage Your Products | SellHub";
    loadDashboardData();

    // 🚀 Add Realtime listener for automatic updates
    // When the profile table changes (e.g., via backend callback), refresh the dashboard
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('dashboard-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          () => {
            console.log('✨ Profile updated! Refreshing dashboard...');
            loadDashboardData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanupPromise = setupRealtime();

    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [loadDashboardData]);

  const refreshData = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);

    toast({
      title: "Dashboard Updated",
      description: "All statistics have been refreshed",
    });
  };

  const deleteProduct = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("products")
        .update({ status: "deleted" })
        .eq("id", id);

      if (error) throw error;

      // Optimistic update
      const deletedProduct = products.find((p) => p.id === id);
      if (deletedProduct) {
        loadDashboardData(); // Reload data to ensure consistency
      }

      toast({
        title: "Product deleted",
        description: "Product has been successfully deleted.",
      });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({
        variant: "destructive",
        title: "Error deleting product",
        description: error.message || "Failed to delete product",
      });
    }
  };

  const getProductLimit = (): number => {
    if (!plan) return 5;
    const planName = plan.plans?.name?.toLowerCase() || "free";

    switch (planName) {
      case "silver":
      case "professional":
        return 50;
      case "gold":
      case "enterprise":
        return Infinity;
      default:
        return 5;
    }
  };

  const getPlanFeatures = () => {
    const planName = plan?.plans?.name?.toLowerCase() || "free";
    if (planName === "gold" || planName === "enterprise") {
      return [
        "Unlimited product listings",
        "Featured homepage placement",
        "Unlimited product images",
        "Advanced analytics & insights",
        "Dedicated account manager",
        "24/7 priority support"
      ];
    }
    if (planName === "silver" || planName === "professional") {
      return [
        "Up to 50 products",
        "Priority search placement",
        "10 product images per listing",
        "Advanced sales analytics",
        "Promotional badges",
        "Priority email support"
      ];
    }
    return [
      "Up to 5 products",
      "Basic seller profile",
      "3 product images per listing",
      "Email support",
      "Community forum access"
    ];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
      case "approved":
        return "bg-green-500";
      case "sold":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "deleted":
        return "bg-gray-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "approved":
        return "active";
      default:
        return status;
    }
  };

  const canAddMoreProducts = stats.totalProducts < getProductLimit();

  if (isLoading) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/3 rounded-xl" />
            <Skeleton className="h-6 w-1/2 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] lg:col-span-2 rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Seller Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your marketplace presence and track performance
            </p>
          </div>
          <Button
            onClick={refreshData}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </header>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="purchases">My Purchases</TabsTrigger>
          <TabsTrigger value="market-insights">Market Insights</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Seller Orders</TabsTrigger>
        </TabsList>

        {/* TAB: ORDERS - Smart Order Management */}
        <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-none bg-transparent">
             <CardHeader className="px-0 pt-0">
               <div className="flex justify-between items-center">
                 <div>
                   <CardTitle>Order Management</CardTitle>
                   <CardDescription>Track and manage your customer orders efficiently.</CardDescription>
                 </div>
                 {/* Smart Badge for pending orders could go here */}
               </div>
             </CardHeader>
             <CardContent className="px-0">
               <SellerOrders />
             </CardContent>
          </Card>
        </TabsContent>



        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border-l-4 border-l-blue-500 rounded-2xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">
                    {stats.activeProducts} active
                  </span>
                  {stats.pendingProducts > 0 && (
                    <span className="text-yellow-500 ml-2">
                      {stats.pendingProducts} pending
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border-l-4 border-l-green-500 rounded-2xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalViews.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalViews === 0 ? (
                    <span className="text-orange-500">No views yet</span>
                  ) : (
                    "Across all products"
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border-l-4 border-l-purple-500 rounded-2xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CompactPriceDisplay kesAmount={stats.totalRevenue} />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.monthlyRevenue > 0 ? (
                    <span className="text-green-500">
                      KES {stats.monthlyRevenue.toLocaleString()} this month
                    </span>
                  ) : (
                    "No revenue yet"
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-md border border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 border-l-4 border-l-orange-500 rounded-2xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMessages}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalMessages === 0
                    ? "No new messages"
                    : "Unread messages"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/products/upload">
              <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/40">
                <CardContent className="p-6 text-center">
                  <Plus className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold">Add New Product</p>
                  <p className="text-sm text-muted-foreground">
                    {canAddMoreProducts
                      ? "List a new item for sale"
                      : "Upgrade to add more products"}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/messages">
              <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-semibold">View Messages</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalMessages === 0
                      ? "No new messages"
                      : `${stats.totalMessages} unread messages`}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/analytics">
              <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold">View Analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Track your sales and performance
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Performance Analytics Section */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Chart */}
              <Card className="lg:col-span-2 overflow-hidden border-2 border-gray-100 shadow-xl rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-8">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Product Views Trend
                    </CardTitle>
                    <CardDescription>Visual tracker for your listing reach</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">7-Day Trend</Badge>
                </CardHeader>
                <CardContent className="h-[300px] pr-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        stroke="#16a34a" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorViews)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Viewers Card */}
               <Card className="border-2 border-indigo-50 shadow-xl bg-white rounded-2xl overflow-hidden">
                 <CardHeader className="bg-indigo-50/50 pb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-900">
                    <Eye className="h-5 w-5 text-indigo-600" />
                    Who Viewed Your Products
                  </CardTitle>
                 </CardHeader>
                 <CardContent className="pt-6">
                    {recentViewers.length > 0 ? (
                      <div className="space-y-4">
                        {recentViewers.map((viewer) => (
                          <div key={viewer.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                             <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                <AvatarImage src={viewer.avatar_url} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700">
                                  {viewer.full_name?.charAt(0) || viewer.username?.charAt(0) || "U"}
                                </AvatarFallback>
                             </Avatar>
                             <div>
                                <p className="text-sm font-bold text-gray-900">{viewer.full_name || viewer.username || "Anonymous User"}</p>
                                <p className="text-xs text-indigo-600 font-medium">Viewed your listings</p>
                             </div>
                          </div>
                        ))}
                        {recentViewers.length >= 5 && (
                            <div className="text-center pt-2">
                              <Button variant="link" className="text-xs text-indigo-600">View All Activity</Button>
                            </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                         <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                           <Users className="h-6 w-6 text-indigo-300" />
                         </div>
                         <p className="text-sm font-medium">No identified viewers yet</p>
                         <p className="text-xs mt-1">Share your shop link to get more traffic!</p>
                      </div>
                    )}
                 </CardContent>
               </Card>
            </div>
          </section>

          {/* Plan Status Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Current Plan: {plan?.plans?.name || "Free"}
              </CardTitle>
              <CardDescription className="text-base">
                Products:{" "}
                <span className="font-semibold">
                  {stats.totalProducts} / {getProductLimit() === Infinity ? "Unlimited" : getProductLimit()}
                </span>
              </CardDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                {getPlanFeatures().map((feature, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] py-0">
                    <CheckCircle2 className="h-2 w-2 mr-1 text-green-500" />
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {!canAddMoreProducts && getProductLimit() !== Infinity ? (
                <div className="flex items-center gap-4">
                  <Badge variant="destructive" className="text-sm">
                    Limit Reached
                  </Badge>
                  <Link to="/pricing">
                    <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                      Upgrade Plan
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (stats.totalProducts / getProductLimit()) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getProductLimit() - stats.totalProducts} products remaining
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shop Link Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                Your Shop Link
              </CardTitle>
              <CardDescription>
                Share this link to let customers view all your products in one place
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {username ? (
                  <div className="flex-1 w-full flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                    <span className="text-gray-500 font-medium">sellhubshop.co.ke/u/</span>
                    <span className="font-bold text-blue-700">{username}</span>
                  </div>
                ) : (
                  <div className="flex-1 w-full">
                    <p className="text-sm text-yellow-600 mb-2 font-medium">
                      <AlertCircle className="inline h-4 w-4 mr-1" />
                      Set a username to create your unique shop link
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Enter username (e.g. janeshop)" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        id="username-input"
                      />
                      <Button 
                        onClick={async () => {
                          const input = document.getElementById("username-input") as HTMLInputElement;
                          const newUsername = input.value.trim();
                          if (!newUsername) return;
                          
                          // Basic validation
                          if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
                            toast({ variant: "destructive", title: "Invalid format", description: "Username can only contain letters, numbers, underscores and dashes" });
                            return;
                          }

                          try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) return;

                            // Check uniqueness
                            const { data: existing } = await supabase.from('profiles').select('id').eq('username', newUsername).single();
                            if (existing) {
                              toast({ variant: "destructive", title: "Taken", description: "This username is already taken" });
                              return;
                            }

                            const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user.id);
                            if (error) throw error;
                            
                            toast({ title: "Success", description: "Username set successfully!" });
                            loadDashboardData();
                          } catch (e: any) {
                            toast({ variant: "destructive", title: "Error", description: e.message });
                          }
                        }}
                      >
                        Claim Link
                      </Button>
                    </div>
                  </div>
                )}
                
                {username && (
                   <Button
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={() => {
                       const url = `${window.location.origin}/u/${username}`;
                       navigator.clipboard.writeText(url);
                       toast({ title: "Copied!", description: "Shop link copied to clipboard" });
                    }}
                   >
                     <LinkIcon className="h-4 w-4 mr-2" />
                     Copy Link
                   </Button>
                )}
                
                {username && (
                  <a href={`/u/${username}`} target="_blank" rel="noreferrer" className="w-full md:w-auto">
                     <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                       Visit Shop
                     </Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: MARKET INSIGHTS */}
        <TabsContent value="market-insights" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <MarketInsights />
        </TabsContent>

        <TabsContent value="purchases" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <BuyerOrders />
        </TabsContent>

        {/* TAB 3: PRODUCTS */}
        <TabsContent value="products" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Your Products ({products.length})
                </CardTitle>
                <CardDescription>
                  Manage your product listings and track performance
                </CardDescription>
              </div>
              <Link to="/products/upload">
                <Button
                  disabled={!canAddMoreProducts}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4 text-lg">
                    You haven't added any products yet
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Start selling by adding your first product to the marketplace
                  </p>
                  <Link to="/products/upload">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onDelete={deleteProduct}
                      formatDate={formatDate}
                      getStatusColor={getStatusColor}
                      getStatusText={getStatusText}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

// Optimized Product Card Component
const ProductCard = ({
  product,
  onDelete,
  formatDate,
  getStatusColor,
  getStatusText,
}: {
  product: Product;
  onDelete: (id: string) => void;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}) => {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-all duration-200 group">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallback =
                  e.currentTarget.parentElement?.querySelector(
                    ".image-fallback"
                  );
                fallback?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div
            className={`image-fallback w-full h-full flex items-center justify-center ${product.images && product.images.length > 0 ? "hidden" : ""
              }`}
          >
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-semibold text-lg truncate">{product.name}</h3>
          <div className="flex gap-1">
            {product.featured && (
              <Badge
                variant="secondary"
                className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {product.verified && (
              <Badge
                variant="default"
                className="text-xs bg-green-500 hover:bg-green-600 text-white"
              >
                Verified
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          <CompactPriceDisplay kesAmount={product.price || 0} className="inline-flex" />
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {Number(product.views) || 0} views
          </span>
          <span>•</span>
          <span>Created {formatDate(product.created_at)}</span>
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-4 mt-1">
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}
          {product.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {product.location}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className={`capitalize ${getStatusColor(
            product.status
          )} text-white border-0`}
        >
          {getStatusText(product.status)}
        </Badge>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ShareProductDialog 
            trigger={
              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-primary">
                <Share2 className="h-3 w-3" />
              </Button>
            }
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              description: product.description,
              image: product.images?.[0]
            }}
          />
          <Button size="icon" variant="ghost" asChild className="h-8 w-8">
            <Link to={`/product/${product.id}`}>
              <Eye className="h-3 w-3" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost" asChild className="h-8 w-8">
            <Link to={`/edit/${product.id}`}>
              <Edit className="h-3 w-3" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(product.id)}
            disabled={product.status === "sold"}
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
