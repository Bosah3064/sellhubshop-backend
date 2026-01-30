import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Check,
  Search,
  Star,
  MapPin,
  Loader2,
  Heart,
  Shield,
  Package,
  AlertCircle,
  Filter,
  ChevronDown,
  Zap,
  Sparkles,
  TrendingUp,
  BarChart3,
  Target,
  Crown,
  Award,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { PriceDisplay, CompactPriceDisplay } from "@/components/PriceDisplay";
import SEO from "@/components/SEO";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
  subcategory: string | null;
  condition: string;
  location: string;
  images: string[];
  verified: boolean;
  featured: boolean;
  is_urgent: boolean;
  is_negotiable: boolean;
  created_at: string;
  status: string;
  user_id: string;
  owner_id: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    rating: number | null;
    total_ratings: number | null;
    location: string | null;
  } | null;
  properties?: Record<string, any>;
}

interface CompareProps {
  initialProductIds?: string[];
}

// Enhanced Categories with Safaricom-inspired colors
const categoryStructure = {
  Electronics: [
    "Laptops",
    "Smartphones",
    "Tablets",
    "Cameras",
    "Audio",
    "Gaming",
    "Accessories",
  ],
  Fashion: ["Men", "Women", "Kids", "Shoes", "Accessories", "Jewelry"],
  "Home & Garden": [
    "Furniture",
    "Kitchen",
    "Decor",
    "Garden",
    "Tools",
    "Appliances",
  ],
  Vehicles: ["Cars", "Motorcycles", "Bicycles", "Parts", "Accessories"],
  Sports: ["Fitness", "Outdoor", "Team Sports", "Water Sports", "Cycling"],
  Books: ["Fiction", "Non-Fiction", "Academic", "Children", "Textbooks"],
  Beauty: ["Skincare", "Makeup", "Haircare", "Fragrances", "Wellness"],
  Toys: ["Educational", "Action Figures", "Dolls", "Puzzles", "Outdoor"],
  Jewelry: ["Rings", "Necklaces", "Earrings", "Watches", "Bracelets"],
  Health: ["Supplements", "Fitness", "Medical", "Personal Care", "Wellness"],
  Food: ["Groceries", "Beverages", "Snacks", "Organic", "Local"],
  Pets: ["Dogs", "Cats", "Fish", "Birds", "Supplies"],
  Office: ["Stationery", "Furniture", "Electronics", "Supplies"],
  "Art & Crafts": ["Painting", "Drawing", "Craft Supplies", "Fabric", "DIY"],
  Music: ["Instruments", "Records", "Equipment", "Accessories"],
  "Baby & Kids": ["Clothing", "Toys", "Furniture", "Safety", "Feeding"],
  Travel: ["Luggage", "Accessories", "Outdoor", "Camping"],
  Industrial: ["Tools", "Equipment", "Materials", "Safety"],
  Collectibles: ["Coins", "Stamps", "Art", "Memorabilia", "Antiques"],
};

// Safaricom-inspired color palette
const safaricomColors = {
  green: "#00A650",
  blue: "#0077BE",
  purple: "#8B5CF6",
  orange: "#FF6B35",
  teal: "#14B8A6",
};

const COLORS = [
  safaricomColors.green,
  safaricomColors.blue,
  safaricomColors.purple,
  safaricomColors.orange,
];

export default function Compare({ initialProductIds = [] }: CompareProps) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [comparisonContext, setComparisonContext] = useState<{
    category: string | null;
    subcategory: string | null;
  }>({
    category: null,
    subcategory: null,
  });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState("specs");

  useEffect(() => {
    loadAvailableProducts();
    loadUserFavorites();
  }, []);

  const loadUserFavorites = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favoritesData, error } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error loading favorites:", error);
        return;
      }

      const favoriteIds = new Set(
        favoritesData?.map((fav) => fav.product_id) || []
      );
      setFavorites(favoriteIds);
    } catch (error: any) {
      console.error("Error loading favorites:", error);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading available products for comparison...");

      const { data: productsData, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          description,
          price,
          original_price,
          category,
          subcategory,
          condition,
          location,
          images,
          properties,
          status,
          verified,
          featured,
          is_urgent,
          is_negotiable,
          created_at,
          user_id,
          owner_id,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            rating,
            total_ratings,
            location
          )
        `
        )
        .in("status", ["active", "approved"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("❌ Error loading products:", error);
        toast.error("Failed to load products");
        setAvailableProducts([]);
        return;
      }

      console.log("✅ Products loaded successfully:", productsData?.length);

      const products: Product[] = (productsData || []).map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.original_price,
        category: product.category,
        subcategory: product.subcategory,
        condition: product.condition,
        location: product.location,
        images: product.images || [],
        verified: product.verified || false,
        featured: product.featured || false,
        is_urgent: product.is_urgent || false,
        is_negotiable: product.is_negotiable || false,
        created_at: product.created_at,
        status: product.status,
        user_id: product.user_id,
        owner_id: product.owner_id,
        profiles: product.profiles
          ? {
            id: product.profiles.id,
            full_name: product.profiles.full_name,
            avatar_url: product.profiles.avatar_url,
            rating: product.profiles.rating,
            total_ratings: product.profiles.total_ratings,
            location: product.profiles.location,
          }
          : null,
        properties: product.properties || {},
      }));

      setAvailableProducts(products);

      // Load initial products if IDs provided
      if (initialProductIds.length > 0) {
        const initialProducts = products.filter((p) =>
          initialProductIds.includes(p.id)
        );
        setSelectedProducts(initialProducts);
        console.log("🎯 Loaded initial products:", initialProducts.length);

        // Set comparison context based on first product
        if (initialProducts.length > 0) {
          const firstProduct = initialProducts[0];
          setComparisonContext({
            category: firstProduct.category,
            subcategory: firstProduct.subcategory,
          });
        }
      }
      // Auto-select first 2 products if we have enough and no initial IDs
      else if (products.length >= 2 && selectedProducts.length === 0) {
        const autoSelected = products.slice(0, 2);
        setSelectedProducts(autoSelected);

        // Set comparison context based on first product
        if (autoSelected.length > 0) {
          const firstProduct = autoSelected[0];
          setComparisonContext({
            category: firstProduct.category,
            subcategory: firstProduct.subcategory,
          });
        }

        console.log(
          "🤖 Auto-selected products for comparison:",
          autoSelected.map((p) => p.name)
        );
        toast.success(`Added ${autoSelected.length} products for comparison`);
      }
      // If we have only one product, select it
      else if (products.length === 1 && selectedProducts.length === 0) {
        setSelectedProducts([products[0]]);
        setComparisonContext({
          category: products[0].category,
          subcategory: products[0].subcategory,
        });
        console.log("🤖 Auto-selected single product:", products[0].name);
        toast.success("Added product for comparison");
      }
    } catch (error: any) {
      console.error("💥 Error loading products:", error);
      toast.error("Failed to load products");
      setAvailableProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (
    query: string,
    category: string = "All",
    subcategory: string = "All"
  ) => {
    setSearchQuery(query);
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);

    // If we have a comparison context, automatically filter by it
    const effectiveCategory =
      comparisonContext.category && category === "All"
        ? comparisonContext.category
        : category;
    const effectiveSubcategory =
      comparisonContext.subcategory && subcategory === "All"
        ? comparisonContext.subcategory
        : subcategory;

    if (
      query.trim() === "" &&
      effectiveCategory === "All" &&
      effectiveSubcategory === "All"
    ) {
      setSearchResults(availableProducts.slice(0, 12));
      return;
    }

    try {
      setSearchLoading(true);

      let queryBuilder = supabase
        .from("products")
        .select(
          `
          id,
          name,
          description,
          price,
          original_price,
          category,
          subcategory,
          condition,
          location,
          images,
          properties,
          status,
          verified,
          featured,
          is_urgent,
          is_negotiable,
          created_at,
          user_id,
          owner_id,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            rating,
            total_ratings,
            location
          )
        `
        )
        .in("status", ["active", "approved"]);

      // Add search conditions if query exists
      if (query.trim()) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${query}%,category.ilike.%${query}%,subcategory.ilike.%${query}%,description.ilike.%${query}%`
        );
      }

      // Add category filter if not "All"
      if (effectiveCategory !== "All") {
        queryBuilder = queryBuilder.eq("category", effectiveCategory);
      }

      // Add subcategory filter if not "All"
      if (effectiveSubcategory !== "All" && effectiveCategory !== "All") {
        queryBuilder = queryBuilder.eq("subcategory", effectiveSubcategory);
      }

      queryBuilder = queryBuilder.limit(20);

      const { data: productsData, error } = await queryBuilder;

      if (error) {
        console.error("Search error, using client-side filtering:", error);
        // Fallback to client-side filtering
        const filtered = availableProducts.filter((product) => {
          const matchesSearch =
            !query.trim() ||
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category?.toLowerCase().includes(query.toLowerCase()) ||
            product.subcategory?.toLowerCase().includes(query.toLowerCase()) ||
            product.description?.toLowerCase().includes(query.toLowerCase());

          const matchesCategory =
            effectiveCategory === "All" ||
            product.category === effectiveCategory;
          const matchesSubcategory =
            effectiveSubcategory === "All" ||
            product.subcategory === effectiveSubcategory;

          return matchesSearch && matchesCategory && matchesSubcategory;
        });
        setSearchResults(filtered);
        return;
      }

      const products: Product[] = (productsData || []).map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.original_price,
        category: product.category,
        subcategory: product.subcategory,
        condition: product.condition,
        location: product.location,
        images: product.images || [],
        verified: product.verified || false,
        featured: product.featured || false,
        is_urgent: product.is_urgent || false,
        is_negotiable: product.is_negotiable || false,
        created_at: product.created_at,
        status: product.status,
        user_id: product.user_id,
        owner_id: product.owner_id,
        profiles: product.profiles
          ? {
            id: product.profiles.id,
            full_name: product.profiles.full_name,
            avatar_url: product.profiles.avatar_url,
            rating: product.profiles.rating,
            total_ratings: product.profiles.total_ratings,
            location: product.profiles.location,
          }
          : null,
        properties: product.properties || {},
      }));

      setSearchResults(products);
    } catch (error) {
      console.error("Error searching products:", error);
      // Final fallback to client-side filtering
      const filtered = availableProducts.filter((product) => {
        const matchesSearch =
          !searchQuery.trim() ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.subcategory
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesCategory =
          effectiveCategory === "All" || product.category === effectiveCategory;
        const matchesSubcategory =
          effectiveSubcategory === "All" ||
          product.subcategory === effectiveSubcategory;

        return matchesSearch && matchesCategory && matchesSubcategory;
      });
      setSearchResults(filtered);
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleFavorite = async (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to add favorites");
        return;
      }

      if (favorites.has(productId)) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("product_id", productId)
          .eq("user_id", user.id);

        if (error) throw error;

        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });

        toast.success("Removed from favorites");
      } else {
        const { error } = await supabase.from("favorites").insert({
          product_id: productId,
          user_id: user.id,
        });

        if (error) throw error;

        setFavorites((prev) => new Set(prev).add(productId));
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites");
    }
  };

  const removeProduct = (id: string) => {
    setSelectedProducts((prev) => {
      const newProducts = prev.filter((p) => p.id !== id);

      // Update comparison context if we removed the last product
      if (newProducts.length === 0) {
        setComparisonContext({ category: null, subcategory: null });
      }

      return newProducts;
    });
    toast.success("Product removed from comparison");
  };

  const addProduct = (product: Product) => {
    if (selectedProducts.length >= 4) {
      toast.error("Maximum 4 products can be compared");
      return;
    }

    if (selectedProducts.find((p) => p.id === product.id)) {
      toast.error("Product already in comparison");
      return;
    }

    // If this is the first product, set the comparison context
    if (selectedProducts.length === 0) {
      setComparisonContext({
        category: product.category,
        subcategory: product.subcategory,
      });
      toast.success(
        `Now comparing ${product.subcategory || product.category} products`
      );
    } else {
      // Check if the product matches the current comparison context
      const matchesContext =
        product.category === comparisonContext.category &&
        product.subcategory === comparisonContext.subcategory;

      if (!matchesContext) {
        toast.error(
          `Please select ${comparisonContext.subcategory || comparisonContext.category
          } products for comparison`
        );
        return;
      }
    }

    setSelectedProducts((prev) => [...prev, product]);
    setIsSearchOpen(false);
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedSubcategory("All");
    toast.success("Product added to comparison");
  };

  const getConditionColor = (condition: string) => {
    const cond = condition?.toLowerCase();
    if (cond.includes("new"))
      return "bg-green-100 text-green-800 border-green-200";
    if (cond.includes("like new") || cond.includes("excellent"))
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (cond.includes("refurbished"))
      return "bg-purple-100 text-purple-800 border-purple-200";
    if (cond.includes("used") || cond.includes("good"))
      return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getAllSpecs = () => {
    const allSpecs = new Set<string>();
    selectedProducts.forEach((product) => {
      if (product.properties && typeof product.properties === "object") {
        Object.keys(product.properties).forEach((spec) => {
          if (
            product.properties![spec] !== null &&
            product.properties![spec] !== undefined
          ) {
            allSpecs.add(spec);
          }
        });
      }
    });
    return Array.from(allSpecs);
  };

  const formatPrice = (price: number) => {
    return `KES ${price.toLocaleString()}`;
  };

  const getSellerRating = (profile: any) => {
    if (!profile?.rating || !profile?.total_ratings) return null;
    return {
      rating: profile.rating,
      totalRatings: profile.total_ratings,
    };
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Get available categories and subcategories from products
  const availableCategories = [
    "All",
    ...new Set(availableProducts.map((p) => p.category).filter(Boolean)),
  ] as string[];

  // Get subcategories for the selected category
  const availableSubcategories =
    selectedCategory !== "All"
      ? [
        "All",
        ...(categoryStructure[
          selectedCategory as keyof typeof categoryStructure
        ] || []),
      ]
      : ["All"];

  // Initialize search results when dialog opens
  useEffect(() => {
    if (isSearchOpen) {
      // Auto-filter by comparison context if it exists
      if (comparisonContext.category) {
        setSelectedCategory(comparisonContext.category);
        if (comparisonContext.subcategory) {
          setSelectedSubcategory(comparisonContext.subcategory);
        }
        searchProducts(
          searchQuery,
          comparisonContext.category,
          comparisonContext.subcategory || "All"
        );
      } else {
        setSearchResults(availableProducts.slice(0, 12));
      }
    }
  }, [isSearchOpen, availableProducts]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategory === "All") {
      setSelectedSubcategory("All");
    }
  }, [selectedCategory]);

  const clearComparison = () => {
    setSelectedProducts([]);
    setComparisonContext({ category: null, subcategory: null });
    toast.success("Comparison cleared");
  };

  // Enhanced Analytics Functions
  const generateComparisonAnalytics = () => {
    if (selectedProducts.length < 2) return null;

    const priceData = selectedProducts.map((product, index) => ({
      name:
        product.name.substring(0, 15) + (product.name.length > 15 ? "..." : ""),
      price: product.price,
      originalPrice: product.original_price || product.price,
      savings: product.original_price
        ? product.original_price - product.price
        : 0,
      color: COLORS[index % COLORS.length],
    }));

    const ratingData = selectedProducts.map((product, index) => ({
      name:
        product.name.substring(0, 15) + (product.name.length > 15 ? "..." : ""),
      rating: product.profiles?.rating || 0,
      totalRatings: product.profiles?.total_ratings || 0,
      color: COLORS[index % COLORS.length],
    }));

    const valueScoreData = selectedProducts.map((product, index) => {
      const rating = product.profiles?.rating || 1;
      const pricePerRating = product.price / rating;
      const maxPrice = Math.max(...selectedProducts.map((p) => p.price));
      const valueScore = Math.max(0, 100 - pricePerRating / (maxPrice / 100));

      return {
        name:
          product.name.substring(0, 15) +
          (product.name.length > 15 ? "..." : ""),
        valueScore: Math.min(100, valueScore),
        price: product.price,
        rating: rating,
        color: COLORS[index % COLORS.length],
      };
    });

    const radarData = [
      "Price",
      "Rating",
      "Condition",
      "Value",
      "Popularity",
    ].map((key) => {
      const dataPoint: any = { subject: key };
      selectedProducts.forEach((product, index) => {
        let value = 0;
        switch (key) {
          case "Price":
            value = Math.max(
              0,
              100 -
              product.price /
              (Math.max(...selectedProducts.map((p) => p.price)) / 100)
            );
            break;
          case "Rating":
            value = (product.profiles?.rating || 0) * 20;
            break;
          case "Condition":
            value = product.condition.includes("new")
              ? 100
              : product.condition.includes("excellent")
                ? 80
                : product.condition.includes("good")
                  ? 60
                  : 40;
            break;
          case "Value":
            const rating = product.profiles?.rating || 1;
            value = Math.max(
              0,
              100 -
              product.price /
              rating /
              (Math.max(
                ...selectedProducts.map(
                  (p) => p.price / (p.profiles?.rating || 1)
                )
              ) /
                100)
            );
            break;
          case "Popularity":
            value = Math.min(100, (product.profiles?.total_ratings || 0) * 2);
            break;
        }
        dataPoint[`product${index}`] = Math.round(value);
      });
      return dataPoint;
    });

    return {
      priceComparison: priceData,
      ratingComparison: ratingData,
      valueAnalysis: valueScoreData,
      radarData: radarData,
      bestValue: valueScoreData.reduce((best, current) =>
        current.valueScore > best.valueScore ? current : best
      ),
      cheapest: priceData.reduce((cheapest, current) =>
        current.price < cheapest.price ? current : cheapest
      ),
      highestRated: ratingData.reduce((best, current) =>
        current.rating > best.rating ? current : best
      ),
    };
  };

  const analyticsData = generateComparisonAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
            Loading Products...
          </h2>
          <p className="text-muted-foreground">
            Preparing your comparison experience
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Compare Prices | Kenya's Premium Marketplace"
        description="Compare product prices and find the best deals, analyze value, and check seller ratings on SellHub Kenya."
        keywords="compare prices, price comparison kenya, best deals kenya, product comparison"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 border-0"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Smart Compare
                </Badge>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                Compare Products
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                Smart side-by-side comparison with advanced analytics
              </p>
              {availableProducts.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Found {availableProducts.length} products across{" "}
                  {availableCategories.length - 1} categories
                </p>
              )}
              {comparisonContext.category && (
                <div className="flex items-center gap-2 mt-3">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 text-sm"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Comparing:{" "}
                    {comparisonContext.subcategory || comparisonContext.category}
                  </Badge>
                  {selectedProducts.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearComparison}
                      className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {selectedProducts.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 text-sm"
                >
                  {selectedProducts.length}/4 Products
                </Badge>
              )}
              {selectedProducts.length >= 2 && (
                <Button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  variant="outline"
                  className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <TrendingUp className="h-4 w-4" />
                  {showAnalytics ? "Hide Analytics" : "Show Analytics"}
                </Button>
              )}
              <Button
                onClick={() => setIsSearchOpen(true)}
                disabled={selectedProducts.length >= 4}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
              <Button
                onClick={loadAvailableProducts}
                variant="outline"
                className="flex items-center gap-2 border-green-200 text-green-600 hover:bg-green-50"
              >
                <Loader2 className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Enhanced Analytics Section */}
          {showAnalytics && analyticsData && (
            <div className="mb-8 space-y-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Comparison Analytics
                    </h2>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Crown className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-700">
                          Best Value
                        </span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 mb-1">
                        {analyticsData.bestValue.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={analyticsData.bestValue.valueScore}
                          className="h-2 bg-green-200"
                        />
                        <span className="text-sm font-medium text-green-600">
                          {analyticsData.bestValue.valueScore.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-700">
                          Lowest Price
                        </span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 mb-1">
                        {analyticsData.cheapest.name}
                      </p>
                      <div className="flex flex-col">
                        <p className="text-lg font-semibold text-blue-600">
                          {formatPrice(analyticsData.cheapest.price)}
                        </p>
                        <CompactPriceDisplay kesAmount={analyticsData.cheapest.price} />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-700">
                          Highest Rated
                        </span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 mb-1">
                        {analyticsData.highestRated.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-lg font-semibold text-purple-600">
                          {analyticsData.highestRated.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Price Comparison Chart */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                      <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-green-600" />
                        Price Comparison
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analyticsData.priceComparison}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis
                            fontSize={12}
                            tickFormatter={(value) => `KES ${value / 1000}k`}
                          />
                          <Tooltip
                            formatter={(value: any) => [
                              `KES ${value.toLocaleString()}`,
                              "Price",
                            ]}
                            labelFormatter={(label) => `Product: ${label}`}
                          />
                          <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                            {analyticsData.priceComparison.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Value Analysis Chart */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                      <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        Value Score Analysis
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={analyticsData.valueAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis fontSize={12} domain={[0, 100]} />
                          <Tooltip
                            formatter={(value: any) => [
                              `${value.toFixed(1)}%`,
                              "Value Score",
                            ]}
                            labelFormatter={(label) => `Product: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="valueScore"
                            stroke={safaricomColors.blue}
                            strokeWidth={3}
                            dot={{
                              fill: safaricomColors.blue,
                              strokeWidth: 2,
                              r: 4,
                            }}
                            activeDot={{ r: 6, fill: safaricomColors.green }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Radar Chart */}
                  <div className="mt-6 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      Product Comparison Radar
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={analyticsData.radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        {selectedProducts.map((_, index) => (
                          <Radar
                            key={index}
                            name={`Product ${index + 1}`}
                            dataKey={`product${index}`}
                            stroke={COLORS[index]}
                            fill={COLORS[index]}
                            fillOpacity={0.2}
                          />
                        ))}
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Enhanced Search Dialog */}
          <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden border-0 shadow-2xl rounded-3xl">
              <DialogHeader className="pb-4">
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Search className="h-6 w-6 text-green-600" />
                  </div>
                  {comparisonContext.category
                    ? `Compare ${comparisonContext.subcategory ||
                    comparisonContext.category
                    }`
                    : "Smart Product Search"}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {comparisonContext.category
                    ? `Select similar ${comparisonContext.subcategory ||
                    comparisonContext.category
                    } products for meaningful comparison`
                    : availableProducts.length === 0
                      ? "No products available yet. Add some products to your marketplace first."
                      : `Smart search across ${availableProducts.length} products with category filtering`}
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-6 h-[600px]">
                {/* Enhanced Category Sidebar */}
                <div className="w-80 flex-shrink-0 bg-gradient-to-b from-gray-50 to-white rounded-2xl p-4 border border-gray-200">
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) =>
                          searchProducts(
                            e.target.value,
                            selectedCategory,
                            selectedSubcategory
                          )
                        }
                        className="pl-10 border-2 border-gray-200 focus:border-green-500 rounded-xl"
                      />
                    </div>

                    {comparisonContext.category && (
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                        <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Comparison Focus
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {comparisonContext.subcategory ||
                            comparisonContext.category}
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700">
                        <Filter className="h-4 w-4" />
                        Smart Filters
                      </h3>

                      {/* All Categories */}
                      <div
                        className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${selectedCategory === "All"
                          ? "bg-green-100 text-green-700 border-2 border-green-200 shadow-sm"
                          : "hover:bg-gray-100 border-2 border-transparent"
                          }`}
                        onClick={() => searchProducts(searchQuery, "All", "All")}
                      >
                        <div className="w-2 h-2 rounded-full bg-current"></div>
                        <span className="text-sm font-medium">
                          All Categories
                        </span>
                        <Badge
                          variant="secondary"
                          className="ml-auto bg-green-100 text-green-700"
                        >
                          {availableProducts.length}
                        </Badge>
                      </div>

                      {/* Individual Categories */}
                      {availableCategories
                        .filter((cat) => cat !== "All")
                        .map((category) => (
                          <Collapsible
                            key={category}
                            open={expandedCategories.has(category)}
                          >
                            <CollapsibleTrigger
                              className="w-full"
                              onClick={() => toggleCategory(category)}
                            >
                              <div
                                className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all ${selectedCategory === category
                                  ? "bg-blue-100 text-blue-700 border-2 border-blue-200 shadow-sm"
                                  : "hover:bg-gray-100 border-2 border-transparent"
                                  }`}
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${expandedCategories.has(category)
                                    ? "rotate-0"
                                    : "-rotate-90"
                                    }`}
                                />
                                <span className="text-sm font-medium">
                                  {category}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="ml-auto bg-blue-100 text-blue-700"
                                >
                                  {
                                    availableProducts.filter(
                                      (p) => p.category === category
                                    ).length
                                  }
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-6 space-y-1 mt-1">
                                {/* All Subcategories for this category */}
                                <div
                                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs ${selectedCategory === category &&
                                    selectedSubcategory === "All"
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : "hover:bg-gray-100"
                                    }`}
                                  onClick={() =>
                                    searchProducts(searchQuery, category, "All")
                                  }
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                  All {category}
                                  <Badge
                                    variant="outline"
                                    className="ml-auto text-xs"
                                  >
                                    {
                                      availableProducts.filter(
                                        (p) => p.category === category
                                      ).length
                                    }
                                  </Badge>
                                </div>

                                {/* Individual Subcategories */}
                                {categoryStructure[
                                  category as keyof typeof categoryStructure
                                ]?.map((subcategory) => {
                                  const subcategoryCount =
                                    availableProducts.filter(
                                      (p) =>
                                        p.category === category &&
                                        p.subcategory === subcategory
                                    ).length;

                                  if (subcategoryCount === 0) return null;

                                  return (
                                    <div
                                      key={subcategory}
                                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs ${selectedCategory === category &&
                                        selectedSubcategory === subcategory
                                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                                        : "hover:bg-gray-100"
                                        }`}
                                      onClick={() =>
                                        searchProducts(
                                          searchQuery,
                                          category,
                                          subcategory
                                        )
                                      }
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                      {subcategory}
                                      <Badge
                                        variant="outline"
                                        className="ml-auto text-xs"
                                      >
                                        {subcategoryCount}
                                      </Badge>
                                    </div>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1">
                  {/* Search Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>
                      Showing {searchResults.length} products
                      {searchQuery && ` for "${searchQuery}"`}
                      {selectedCategory !== "All" && ` in ${selectedCategory}`}
                      {selectedSubcategory !== "All" &&
                        ` > ${selectedSubcategory}`}
                      {comparisonContext.category && ` (Filtered for comparison)`}
                    </span>
                    <span>{selectedProducts.length}/4 selected</span>
                  </div>

                  {/* Products Grid */}
                  <div className="max-h-[500px] overflow-y-auto pr-2">
                    {searchLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {searchResults.map((product) => {
                          const sellerRating = getSellerRating(product.profiles);
                          const isFavorite = favorites.has(product.id);
                          const isSelected = selectedProducts.some(
                            (p) => p.id === product.id
                          );
                          const matchesComparison =
                            !comparisonContext.category ||
                            (product.category === comparisonContext.category &&
                              product.subcategory ===
                              comparisonContext.subcategory);

                          return (
                            <Card
                              key={product.id}
                              className={`cursor-pointer transition-all border-2 group overflow-hidden ${isSelected
                                ? "border-green-500 bg-green-50 shadow-lg scale-[0.98]"
                                : !matchesComparison &&
                                  comparisonContext.category
                                  ? "border-orange-300 bg-orange-50 opacity-70"
                                  : "border-gray-200 hover:border-green-300 hover:bg-green-50 hover:shadow-md"
                                }`}
                              onClick={() => addProduct(product)}
                            >
                              <div className="p-4">
                                {!matchesComparison &&
                                  comparisonContext.category && (
                                    <div className="mb-2 p-2 bg-orange-100 border border-orange-200 rounded-lg text-xs text-orange-800 flex items-center gap-2">
                                      <AlertCircle className="h-3 w-3" />
                                      Different category than current comparison
                                    </div>
                                  )}
                                <div className="flex items-start gap-3">
                                  <div className="relative flex-shrink-0">
                                    {product.images &&
                                      product.images.length > 0 ? (
                                      <img
                                        src={product.images[0]}
                                        alt={product.name}
                                        className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                                      />
                                    ) : (
                                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                                        <Package className="h-6 w-6 text-gray-400" />
                                      </div>
                                    )}
                                    <Button
                                      size="icon"
                                      variant="secondary"
                                      className="absolute -top-1 -right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-all bg-white/80 backdrop-blur-sm border shadow-sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(product.id, e);
                                      }}
                                    >
                                      <Heart
                                        className={`h-3 w-3 transition-all ${isFavorite
                                          ? "fill-red-500 text-red-500"
                                          : "text-gray-600"
                                          }`}
                                      />
                                    </Button>
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-2">
                                    <div>
                                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight text-gray-900">
                                        {product.name}
                                      </h3>
                                      <div className="mt-1">
                                        <p className="text-lg font-bold text-green-600">
                                          {formatPrice(product.price)}
                                        </p>
                                        <CompactPriceDisplay kesAmount={product.price} />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                          variant="outline"
                                          className={getConditionColor(
                                            product.condition
                                          )}
                                        >
                                          {product.condition}
                                        </Badge>
                                        {product.category && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs bg-blue-100 text-blue-700"
                                          >
                                            {product.category}
                                          </Badge>
                                        )}
                                        {product.subcategory && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {product.subcategory}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {sellerRating && (
                                          <div className="flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            <span className="font-medium">
                                              {sellerRating.rating.toFixed(1)}
                                            </span>
                                            <span>
                                              ({sellerRating.totalRatings})
                                            </span>
                                          </div>
                                        )}
                                        {product.verified && (
                                          <div className="flex items-center gap-1 text-green-600">
                                            <Shield className="h-3 w-3" />
                                            <span className="text-xs">
                                              Verified
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {isSelected ? (
                                      <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                        <Check className="h-3 w-3" />
                                        <span className="text-xs font-medium">
                                          Added
                                        </span>
                                      </div>
                                    ) : !matchesComparison &&
                                      comparisonContext.category ? (
                                      <div className="flex items-center gap-1 text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                        <AlertCircle className="h-3 w-3" />
                                        <span className="text-xs font-medium">
                                          Different
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                        <Plus className="h-3 w-3" />
                                        <span className="text-xs font-medium">
                                          Add
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    ) : availableProducts.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">
                          No products available
                        </p>
                        <p className="text-sm mb-6">
                          Add some products to your marketplace first
                        </p>
                        <Button
                          onClick={() =>
                            (window.location.href = "/products/upload")
                          }
                          size="lg"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Add New Product
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">
                          No products found
                        </p>
                        <p className="text-sm">
                          No products found matching your criteria
                        </p>
                        <p className="text-sm mt-1">
                          Try different keywords or categories
                        </p>
                        <Button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("All");
                            setSelectedSubcategory("All");
                            searchProducts("", "All", "All");
                          }}
                          variant="outline"
                          className="mt-4 border-green-200 text-green-600 hover:bg-green-50"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Enhanced Main Comparison Grid */}
          {selectedProducts.length >= 1 ? (
            <div className="space-y-6">
              {/* Comparison Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                    Comparing {selectedProducts.length}{" "}
                    {comparisonContext.subcategory || comparisonContext.category}{" "}
                    Products
                  </h2>
                  <p className="text-muted-foreground">
                    Side-by-side comparison with detailed analytics
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-auto"
                  >
                    <TabsList className="bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger
                        value="specs"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Specifications
                      </TabsTrigger>
                      <TabsTrigger
                        value="details"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Details
                      </TabsTrigger>
                      <TabsTrigger
                        value="sellers"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Sellers
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button
                    variant="outline"
                    onClick={clearComparison}
                    className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                    Clear Comparison
                  </Button>
                </div>
              </div>

              {/* Products Grid */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <div
                    className="grid gap-6"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(
                        selectedProducts.length,
                        1
                      )}, minmax(300px, 1fr))`,
                    }}
                  >
                    {selectedProducts.map((product, index) => {
                      const sellerRating = getSellerRating(product.profiles);
                      const isFavorite = favorites.has(product.id);

                      return (
                        <Card
                          key={product.id}
                          className="relative group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-all bg-white/80 backdrop-blur border shadow-sm"
                            onClick={() => removeProduct(product.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          <div className="relative">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-48 object-cover"
                              />
                            ) : (
                              <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <Package className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 flex flex-col gap-1">
                              <Badge
                                className={`${getConditionColor(
                                  product.condition
                                )} border-0`}
                              >
                                {product.condition}
                              </Badge>
                              {product.featured && (
                                <Badge className="bg-yellow-500 text-white border-0 text-xs">
                                  Featured
                                </Badge>
                              )}
                              {product.verified && (
                                <Badge className="bg-green-500 text-white border-0 text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 transition-all bg-white/80 backdrop-blur border shadow-sm"
                              onClick={(e) => toggleFavorite(product.id, e)}
                            >
                              <Heart
                                className={`h-4 w-4 transition-all ${isFavorite
                                  ? "fill-red-500 text-red-500"
                                  : "text-gray-600"
                                  }`}
                              />
                            </Button>
                          </div>

                          <CardContent className="p-5">
                            <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-900">
                              {product.name}
                            </h3>

                            <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                              <div className="space-y-1">
                                <span className="capitalize font-medium">
                                  {product.category}
                                </span>
                                {product.subcategory && (
                                  <span className="block text-xs text-green-600 font-semibold">
                                    › {product.subcategory}
                                  </span>
                                )}
                              </div>
                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                                <MapPin className="h-3 w-3" />
                                {product.location}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mb-4">
                              {sellerRating ? (
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <div>
                                    <span className="font-bold text-gray-900">
                                      {sellerRating.rating.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-1">
                                      ({sellerRating.totalRatings})
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground bg-gray-100 px-3 py-2 rounded-xl">
                                  No ratings
                                </div>
                              )}
                              {product.profiles && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-700 text-xs"
                                >
                                  {product.profiles.full_name || "Seller"}
                                </Badge>
                              )}
                            </div>

                            <div className="mb-4">
                              <p className="text-2xl font-bold text-green-600">
                                {formatPrice(product.price)}
                              </p>
                              <div className="mt-1">
                                <PriceDisplay kesAmount={product.price} />
                              </div>
                              {product.original_price &&
                                product.original_price > product.price && (
                                  <p className="text-sm text-muted-foreground line-through">
                                    {formatPrice(product.original_price)}
                                  </p>
                                )}
                            </div>

                            {product.is_negotiable && (
                              <Badge
                                variant="outline"
                                className="mb-4 text-xs bg-orange-50 text-orange-700 border-orange-200"
                              >
                                Price Negotiable
                              </Badge>
                            )}

                            <Button
                              className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25"
                              onClick={() =>
                                window.open(`/product/${product.id}`, "_blank")
                              }
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {/* Add Product Card */}
                    {selectedProducts.length < 4 && (
                      <Card
                        className="border-dashed border-2 border-gray-300 flex items-center justify-center min-h-[400px] cursor-pointer hover:border-green-400 transition-all hover:bg-green-50 group"
                        onClick={() => setIsSearchOpen(true)}
                      >
                        <CardContent className="text-center p-6">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                            <Plus className="h-8 w-8 text-green-600" />
                          </div>
                          <p className="text-gray-700 font-medium">
                            Add another{" "}
                            {comparisonContext.subcategory ||
                              comparisonContext.category}{" "}
                            product
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {4 - selectedProducts.length} slot(s) remaining
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Specifications Comparison */}
              {activeTab === "specs" && getAllSpecs().length > 0 && (
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-xl text-gray-900">
                        Specifications Comparison
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {getAllSpecs().map((spec) => (
                        <div
                          key={spec}
                          className="grid gap-4 items-center py-4 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-all rounded-xl px-4"
                          style={{
                            gridTemplateColumns: `200px repeat(${selectedProducts.length}, 1fr)`,
                          }}
                        >
                          <span className="font-semibold capitalize text-sm text-gray-700">
                            {spec.replace(/_/g, " ")}:
                          </span>
                          {selectedProducts.map((product, index) => (
                            <div key={product.id} className="text-center">
                              <span className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-200 inline-block min-w-[120px]">
                                {product.properties?.[spec]
                                  ? String(product.properties[spec])
                                  : "-"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Description Comparison */}
              {activeTab === "details" && (
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Sparkles className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="font-bold text-xl text-gray-900">
                        Detailed Comparison
                      </h3>
                    </div>
                    <div
                      className="grid gap-6"
                      style={{
                        gridTemplateColumns: `repeat(${selectedProducts.length}, 1fr)`,
                      }}
                    >
                      {selectedProducts.map((product) => (
                        <div key={product.id} className="space-y-4">
                          <h4 className="font-semibold text-lg text-gray-900 border-b border-gray-200 pb-2">
                            {product.name}
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Description
                              </p>
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                {product.description ||
                                  "No description available."}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Key Features
                              </p>
                              <ul className="text-sm text-gray-700 space-y-1">
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  Condition: {product.condition}
                                </li>
                                <li className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  Location: {product.location}
                                </li>
                                {product.is_negotiable && (
                                  <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                    Price is negotiable
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Seller Information Comparison */}
              {activeTab === "sellers" && (
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-xl text-gray-900">
                        Seller Comparison
                      </h3>
                    </div>
                    <div
                      className="grid gap-6"
                      style={{
                        gridTemplateColumns: `repeat(${selectedProducts.length}, 1fr)`,
                      }}
                    >
                      {selectedProducts.map((product) => {
                        const sellerRating = getSellerRating(product.profiles);
                        return (
                          <div key={product.id} className="space-y-4">
                            <div className="text-center">
                              {product.profiles?.avatar_url ? (
                                <img
                                  src={product.profiles.avatar_url}
                                  alt={product.profiles.full_name || "Seller"}
                                  className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-green-200"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-green-200">
                                  <span className="text-lg font-semibold text-green-600">
                                    {(product.profiles?.full_name || "S")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <h4 className="font-semibold text-gray-900">
                                {product.profiles?.full_name || "Seller"}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {product.location}
                              </p>
                            </div>

                            <div className="space-y-3">
                              {sellerRating ? (
                                <div className="bg-blue-50 p-3 rounded-xl text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-bold text-lg">
                                      {sellerRating.rating.toFixed(1)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {sellerRating.totalRatings} ratings
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-gray-100 p-3 rounded-xl text-center">
                                  <p className="text-sm text-muted-foreground">
                                    No ratings yet
                                  </p>
                                </div>
                              )}

                              {product.verified && (
                                <div className="bg-green-50 p-3 rounded-xl text-center border border-green-200">
                                  <Shield className="h-5 w-5 text-green-600 mx-auto mb-1" />
                                  <p className="text-xs font-medium text-green-700">
                                    Verified Seller
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* Enhanced Empty State */
            <Card className="border-dashed border-2 border-gray-300 bg-gradient-to-br from-white to-green-50">
              <CardContent className="p-16 text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Plus className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                  Start Comparing Products
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                  {availableProducts.length === 0
                    ? "You need to add products to your marketplace first. Once you have products, you can compare them here."
                    : `Found ${availableProducts.length} products across ${availableCategories.length - 1
                    } categories. Select products to start comparing.`}
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => setIsSearchOpen(true)}
                    size="lg"
                    className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/25 px-8 py-3 text-lg"
                    disabled={availableProducts.length === 0}
                  >
                    <Plus className="h-5 w-5" />
                    {availableProducts.length === 0
                      ? "No Products Available"
                      : "Browse Products"}
                  </Button>
                  {availableProducts.length === 0 && (
                    <Button
                      onClick={() => (window.location.href = "/products/upload")}
                      size="lg"
                      variant="outline"
                      className="border-green-200 text-green-600 hover:bg-green-50 px-8 py-3 text-lg"
                    >
                      Add Products to Marketplace
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
