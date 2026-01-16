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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CompactPriceDisplay } from "@/components/PriceDisplay";

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
    product_limit: number;
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
      const [productsResponse, planResponse, messagesResponse] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, description, price, status, views, created_at, images, category, location, featured, verified, user_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        (supabase
          .from("user_plans")
          .select("id, status, user_id, plan_id, plans!plan_id(id, name, product_limit)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle() as any),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .eq("is_read", false),
      ]);

      // Process products
      const userProducts = (productsResponse.data || []) as Product[];
      setProducts(userProducts);

      // Process plan
      if (planResponse.data) {
        setPlan(planResponse.data as any);
      } else {
        // Fallback: If no active user_plan found, check profiles.plan_type
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan_type")
          .eq("id", user.id)
          .single();

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

  return {
    products,
    stats,
    plan,
    isLoading,
    loadDashboardData,
  };
};

export default function Dashboard() {
  const { products, stats, plan, isLoading, loadDashboardData } =
    useDashboardData();
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Dashboard - Manage Your Products | Pi Network Coming Soon";
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
      <main className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your dashboard...</p>
          </div>
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

      {/* Plan Status Card */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
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

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
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

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
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

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
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

        <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

      {/* Products Section */}
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
          <Button size="icon" variant="ghost" asChild className="h-8 w-8">
            <Link to={`/product/${product.id}`}>
              <Eye className="h-3 w-3" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost" asChild className="h-8 w-8">
            <Link to={`/products/edit/${product.id}`}>
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
