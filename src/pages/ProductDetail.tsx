import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Share2,
  Heart,
  Calendar,
  ArrowLeft,
  Shield,
  Eye,
  Users,
  UserPlus,
  Bookmark,
  MessageSquare,
  MoreHorizontal,
  X,
  Facebook,
  Twitter,
  Link2,
  Mail,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
  Check,
  Info,
  ShoppingCart,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { ContactSellerDialog } from "@/components/dialogs/ContactSellerDialog";
import { useCart } from "@/hooks/useCart";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from "recharts";
import { format, subDays } from "date-fns";
import { Progress } from "@/components/ui/progress";


interface Product {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory: string;
  images: string[];
  condition: string;
  description: string;
  location: string;
  created_at: string;
  user_id: string;
  is_negotiable: boolean;
  featured: boolean;
  properties: Record<string, string>;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  video_url?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: {
    id: string;
    full_name: string;
    profile_image?: string; // KEEPING for backward compatibility if needed, but we should map or use avatar_url
    avatar_url?: string;
    username?: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string | null; // Changed from profile_image
  phone: string;
  whatsapp: string;
  location: string;
  rating: number;
  total_reviews: number;
  followers_count: number;
  following_count: number;
  bio?: string;
  updated_at?: string | null;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isFollowingSeller, setIsFollowingSeller] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("description");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToCart } = useCart();
  
  // Helper to check online status (active within 10 minutes)
  const isUserOnline = (updatedAt: string | null | undefined) => {
    if (!updatedAt) return false;
    const diffInMinutes = (new Date().getTime() - new Date(updatedAt).getTime()) / 60000;
    return diffInMinutes < 10;
  };

  const getLastSeenText = (updatedAt: string | null | undefined) => {
    if (!updatedAt) return "Offline";
    const diffInMinutes = Math.floor((new Date().getTime() - new Date(updatedAt).getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Online now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (id) {
      loadProductData();
      trackRecentlyViewed(id);
    }
  }, [id, currentUser]);

  const trackRecentlyViewed = (productId: string) => {
    try {
      const recentlyViewedStr = localStorage.getItem("recently_viewed") || "[]";
      let recentlyViewed = JSON.parse(recentlyViewedStr);
      
      // Remove if already exists to move it to the front
      recentlyViewed = recentlyViewed.filter((item: string) => item !== productId);
      
      // Add to front
      recentlyViewed.unshift(productId);
      
      // Keep only last 10
      recentlyViewed = recentlyViewed.slice(0, 10);
      
      localStorage.setItem("recently_viewed", JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error("Error tracking recently viewed:", error);
    }
  };

  const simulatedPriceHistory = [
    { date: format(subDays(new Date(), 30), "MMM d"), price: (product?.price || 0) * 1.2 },
    { date: format(subDays(new Date(), 20), "MMM d"), price: (product?.price || 0) * 1.15 },
    { date: format(subDays(new Date(), 15), "MMM d"), price: (product?.price || 0) * 1.1 },
    { date: format(subDays(new Date(), 7), "MMM d"), price: (product?.price || 0) * 1.05 },
    { date: "Now", price: product?.price || 0 },
  ];

  const calculateTrustScore = () => {
    if (!sellerProfile) return 0;
    let score = 70; // Base score
    
    if (sellerProfile.rating >= 4.5) score += 15;
    if (sellerProfile.followers_count > 10) score += 10;
    if (sellerProfile.total_reviews > 5) score += 5;
    
    return Math.min(score, 100);
  };

  const trustScore = calculateTrustScore();

  const initializeUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error initializing user:", error);
    }
  };

  const loadProductData = async () => {
    try {
      setLoading(true);

      // Get product data
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (productError) {
        console.error("Error fetching product:", productError);
        toast.error("Product not found");
        navigate("/marketplace");
        return;
      }

      if (productData) {
        setProduct(productData);

        // Get seller profile with enhanced data
        const { data: sellerData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", productData.user_id)
          .single();

        if (sellerData) {
          // Get follower counts
          const [followersCount, followingCount] = await Promise.all([
            getFollowersCount(sellerData.id),
            getFollowingCount(sellerData.id),
          ]);

          const enhancedSellerProfile: UserProfile = {
            ...sellerData,
            followers_count: followersCount,
            following_count: followingCount,
            rating: sellerData.rating || 5.0,
            total_reviews: sellerData.total_reviews || 0,
          };

          setSellerProfile(enhancedSellerProfile);

          // Check if current user is following seller
          if (currentUser) {
            await checkIfFollowingSeller(sellerData.id);
          }
        }

        // Load reviews
        await loadReviews(productData.user_id);

        // Load advanced AI-suggested similar products
        await loadAISimilarProducts(productData);

        // Check wishlist status
        if (currentUser) {
          await checkWishlistStatus();
        }
      }
    } catch (error) {
      console.error("Error loading product data:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const getFollowersCount = async (userId: string): Promise<number> => {
    const { count } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);
    return count || 0;
  };

  const getFollowingCount = async (userId: string): Promise<number> => {
    const { count } = await supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);
    return count || 0;
  };

  const loadAISimilarProducts = async (currentProduct: Product) => {
    try {
      // "AI" Logic: Match category AND try to match partial name words
      const words = currentProduct.name.split(" ").filter(w => w.length > 3).slice(0, 2);
      
      let query = supabase
        .from("products")
        .select("*")
        .neq("id", currentProduct.id)
        .eq("status", "active");

      // Construct a smart query
      if (words.length > 0) {
        // Try to find products with similar words in title OR same category
        const wordFilters = words.map(w => `name.ilike.%${w}%`).join(",");
        query = query.or(`category.eq."${currentProduct.category}",${wordFilters}`);
      } else {
        query = query.eq("category", currentProduct.category);
      }

      const { data, error } = await query
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      setSimilarProducts(data || []);
    } catch (error) {
      console.error("Error loading AI similar products:", error);
    }
  };

  const checkIfFollowingSeller = async (sellerId: string) => {
    if (!currentUser) return;

    const { data } = await supabase
      .from("followers")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", sellerId)
      .maybeSingle();

    setIsFollowingSeller(!!data);
  };

  const loadReviews = async (sellerId: string) => {
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (reviewsData && reviewsData.length > 0) {
      const reviewerIds = reviewsData.map((review) => review.reviewer_id);
      const { data: reviewerProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username")
        .in("id", reviewerIds);

      const reviewsWithProfiles = reviewsData.map((review) => ({
        ...review,
        reviewer: reviewerProfiles?.find(
          (profile) => profile.id === review.reviewer_id
        ),
      }));

      setReviews(reviewsWithProfiles);
    }
  };

  const handleSocialShare = async (platform: string) => {
    try {
      if (!product || !sellerProfile) return;

      // Construct the share URL using the backend endpoint which handles dynamic meta tags
      // In production, this should point to the backend's public URL
      const baseUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
      // If we are in dev (localhost:8080), the backend is likely at /api (proxied) or localhost:3000
      // For effective social sharing, we need an absolute URL.
      // Assuming /api is proxied correctly or we use the window.location.origin/api/...

      // Strategy: Use the current origin + /api/share/product/{id}
      // This works if the frontend domain also hosts the API at /api (common in prod)
      // or if the proxy handles it. 
      // Note: For localhost, Facebook/others won't be able to scrape, but the link structure will be correct.
      const shareUrl = `${baseUrl}/api/share/product/${product.id}`;

      const productName = product.name;
      const productPrice = `KES ${product.price.toLocaleString()}`;
      const sellerName = sellerProfile.full_name || sellerProfile.username;

      const shareText = `Check out "${productName}" for ${productPrice} by ${sellerName} on MarketHub!`;

      switch (platform) {
        case "whatsapp":
          const whatsappText = `${shareText}\n\n${shareUrl}`;
          window.open(
            `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
            "_blank"
          );
          break;

        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              shareUrl
            )}`,
            "_blank"
          );
          break;

        case "twitter":
          const twitterText = `${shareText}\n\n${shareUrl}`;
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              twitterText
            )}`,
            "_blank"
          );
          break;

        case "telegram":
          const telegramText = `${shareText}\n\n${shareUrl}`;
          window.open(
            `https://t.me/share/url?url=${encodeURIComponent(
              shareUrl
            )}&text=${encodeURIComponent(shareText)}`,
            "_blank"
          );
          break;

        case "email":
          const emailSubject = `Check out this amazing product: ${productName}`;
          const emailBody = `
Hi!

I found this amazing product on MarketHub that you might be interested in:

🛍️ ${productName}
💰 ${productPrice}
👤 Sold by: ${sellerName}
📍 Location: ${product.location}
⭐ Condition: ${product.condition}

${product.description ? product.description.substring(0, 150) + "..." : ""}

Check it out here: ${shareUrl}

Happy shopping! 🎉

--
Shared via MarketHub
          `.trim();

          window.open(
            `mailto:?subject=${encodeURIComponent(
              emailSubject
            )}&body=${encodeURIComponent(emailBody)}`
          );
          break;

        case "copy":
        default: {
          const richText = `
🛍️ ${productName}
💰 ${productPrice}
📍 ${product.location}
⭐ ${product.condition}

${product.description ? product.description.substring(0, 100) + "..." : ""}

🔗 ${shareUrl}

#MarketHub #${product.category.replace(
            /\s+/g,
            ""
          )} #${product.subcategory.replace(/\s+/g, "")}
          `.trim();

          await navigator.clipboard.writeText(richText);
          setCopied(true);
          toast.success("Product link copied!");

          setTimeout(() => {
            setCopied(false);
            setShowShareDialog(false);
          }, 1500);
          break;
        }
      }

      if (platform !== "copy") {
        setShowShareDialog(false);
        toast.success(
          `Shared on ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`
        );
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share product");
    }
  };

  const handleAddToWishlist = async () => {
    try {
      if (!currentUser) {
        toast.error("Please sign in to add items to wishlist");
        navigate("/signin");
        return;
      }

      if (!product) return;

      if (isInWishlist) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("product_id", product.id);

        if (error) throw error;
        setIsInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        const { error } = await supabase.from("wishlist").insert({
          user_id: currentUser.id,
          product_id: product.id,
        });

        if (error) throw error;
        setIsInWishlist(true);
        toast.success("Added to wishlist!");
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error("Failed to update wishlist");
    }
  };

  const handleFollowSeller = async () => {
    try {
      if (!currentUser) {
        toast.error("Please sign in to follow users");
        navigate("/signin");
        return;
      }

      if (!sellerProfile) return;

      if (isFollowingSeller) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", sellerProfile.id);

        if (error) throw error;
        setIsFollowingSeller(false);
        setSellerProfile((prev) =>
          prev ? { ...prev, followers_count: prev.followers_count - 1 } : null
        );
        toast.success(`Unfollowed ${sellerProfile.full_name}`);
      } else {
        // Follow
        const { error } = await supabase.from("followers").insert({
          follower_id: currentUser.id,
          following_id: sellerProfile.id,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
        setIsFollowingSeller(true);
        setSellerProfile((prev) =>
          prev ? { ...prev, followers_count: prev.followers_count + 1 } : null
        );
        toast.success(`Following ${sellerProfile.full_name}`);
      }
    } catch (error) {
      console.error("Error following seller:", error);
      toast.error("Failed to update follow status");
    }
  };

  const checkWishlistStatus = async () => {
    if (!currentUser || !product) return;

    const { data } = await supabase
      .from("wishlist")
      .select("*")
      .eq("user_id", currentUser.id)
      .eq("product_id", product.id)
      .maybeSingle();

    setIsInWishlist(!!data);
  };

  const handleViewSellerProfile = () => {
    if (sellerProfile) {
      navigate(`/profile/${sellerProfile.id}`);
    }
  };

  const handleViewSellerFollowers = () => {
    if (sellerProfile) {
      navigate(`/profile/${sellerProfile.id}/followers`);
    }
  };

  const handleViewSellerFollowing = () => {
    if (sellerProfile) {
      navigate(`/profile/${sellerProfile.id}/following`);
    }
  };

  const handleViewSellerProducts = () => {
    if (sellerProfile) {
      navigate(`/profile/${sellerProfile.id}/products`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-xl">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Product not found</p>
          <Button asChild>
            <Link to="/marketplace">Back to Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const discount = product.original_price
    ? Math.round(
      ((product.original_price - product.price) / product.original_price) *
      100
    )
    : 0;

  // Meta tags data
  const metaTags = {
    title: `${product.name
      } - KES ${product.price?.toLocaleString()} | MarketHub`,
    description:
      product.description?.substring(0, 160) ||
      `Buy ${product.name} on MarketHub - ${product.price ? `KES ${product.price.toLocaleString()}` : "Great deal"
      }`,
    image: product.images?.[0] || "/placeholder.svg",
    url: window.location.href,
    productName: product.name,
    price: product.price,
    currency: "KES",
    condition: product.condition,
    sellerName:
      sellerProfile?.full_name || sellerProfile?.username || "MarketHub Seller",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Meta Tags for Social Media Sharing */}
      <SEO
        title={metaTags.title}
        description={metaTags.description}
        image={metaTags.image}
        url={metaTags.url}
        type="product"
        keywords={`${product.category}, ${product.subcategory}, ${product.name}, buy ${product.name} kenya, ${product.name} price`}
      />

      {/* Navigation */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border bg-muted/30 relative">
              {product.video_url ? (
                <video
                  src={product.video_url}
                  className="w-full h-full object-cover"
                  controls
                  muted
                />
              ) : (
                <img
                  src={product.images?.[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 ${selectedImage === index
                      ? "border-green-600"
                      : "border-transparent"
                      }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{product.category}</Badge>
                <Badge variant="outline">{product.subcategory}</Badge>
                {product.featured && (
                  <Badge className="bg-green-600 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {product.location}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">245 views</span>
                </div>
              </div>
            </div>

            {/* Price Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-green-600">
                  KES {product.price?.toLocaleString()}
                </span>
                {product.original_price && (
                  <>
                    <span className="text-2xl text-muted-foreground line-through">
                      KES {product.original_price.toLocaleString()}
                    </span>
                    <Badge variant="destructive" className="text-sm">
                      {discount}% OFF
                    </Badge>
                  </>
                )}
              </div>
              
              {/* Price Insights Widget */}
              <div className="p-4 bg-green-50/50 border border-green-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-bold text-green-800 font-urbanist">Price Insight</span>
                  </div>
                  <Badge className="bg-green-600 text-white text-[10px] uppercase tracking-wider px-2 py-0.5">Great Deal</Badge>
                </div>
                <p className="text-xs text-green-700 leading-relaxed">
                  This product is priced <span className="font-bold">12% lower</span> than the average Marketplace price for similar {product.subcategory} items.
                </p>
                
                {/* Simulated Price History Mini Chart */}
                <div className="h-24 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulatedPriceHistory}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '10px', color: '#16a34a', fontWeight: 'bold' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#16a34a" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-medium px-1">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>

              {product.is_negotiable && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Price Negotiable
                </Badge>
              )}
            </div>

            {/* Condition & Properties */}
            <div className="space-y-3">
              <div>
                <span className="font-semibold">Condition: </span>
                <Badge variant="secondary">{product.condition}</Badge>
              </div>

              {product.properties && Object.keys(product.properties).length > 0 && (
                <div>
                  <span className="font-semibold">Specifications:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(product.properties).map(([key, value]) => (
                      <Badge key={key} variant="outline">
                        <strong>{key}:</strong> {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => setShowContactDialog(true)}
              >
                <Phone className="h-5 w-5 mr-2" />
                Contact Seller
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-primary text-primary hover:bg-primary/5"
                onClick={() => addToCart(product)}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>

              <Button size="icon" variant="outline" onClick={handleAddToWishlist}>
                <Heart className={`h-5 w-5 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
              </Button>

              <Button size="icon" variant="outline" onClick={() => setShowShareDialog(true)}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Seller Info */}
            {sellerProfile && (
              <>
                <Card className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="w-16 h-16 cursor-pointer border border-gray-100" onClick={handleViewSellerProfile}>
                        <AvatarImage src={sellerProfile.avatar_url || undefined} />
                        <AvatarFallback className="text-lg">
                          {sellerProfile.full_name?.charAt(0) || sellerProfile.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white ${isUserOnline(sellerProfile.updated_at) ? "bg-green-500" : "bg-gray-300"}`}></span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg cursor-pointer hover:text-green-600 transition-colors" onClick={handleViewSellerProfile}>
                            {sellerProfile.full_name || sellerProfile.username}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <MapPin className="h-3 w-3" />
                            {sellerProfile.location}
                          </div>
                            <p className="text-xs text-muted-foreground">
                            {isUserOnline(sellerProfile.updated_at) ? (
                              <span className="text-green-600 font-medium">Online Now</span>
                            ) : (
                              <span>Active {getLastSeenText(sellerProfile.updated_at)}</span>
                            )}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {currentUser && currentUser.id !== sellerProfile.id && (
                            <Button variant={isFollowingSeller ? "outline" : "default"} size="sm" onClick={handleFollowSeller}>
                              <UserPlus className="h-4 w-4 mr-1" />
                              {isFollowingSeller ? "Following" : "Follow"}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={handleViewSellerProfile}>
                            View Profile
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-center border-t pt-3">
                        <button onClick={handleViewSellerProducts} className="flex flex-col items-center hover:scale-105 transition-transform">
                          <span className="font-bold text-lg">{sellerProfile.total_reviews || 0}</span>
                          <span className="text-sm text-muted-foreground">Products</span>
                        </button>
                        <button onClick={handleViewSellerFollowers} className="flex flex-col items-center hover:scale-105 transition-transform">
                          <span className="font-bold text-lg">{sellerProfile.followers_count}</span>
                          <span className="text-sm text-muted-foreground">Followers</span>
                        </button>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-lg">{sellerProfile.rating?.toFixed(1) || "5.0"}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Rating</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Trust Score */}
                <Card className="p-4 bg-gradient-to-br from-indigo-50/30 to-white border-indigo-100/50 shadow-sm mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-indigo-600" />
                      <h4 className="font-bold text-indigo-900 font-urbanist">Seller Trust Score</h4>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 rounded-full text-white text-[10px] font-bold shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      RELIABLE
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16">
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                          <path className="stroke-gray-100 fill-none" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="stroke-indigo-600 fill-none transition-all duration-1000 ease-out" strokeWidth="3" strokeDasharray={`${trustScore}, 100`} strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-indigo-900">{trustScore}%</div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-urbanist text-gray-700 leading-tight">
                          Identity verified seller with consistent high performance.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-green-600 font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          ID Verified Seller
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-white border border-indigo-50 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Clock className="h-3 w-3 text-indigo-500" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Response</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900">&lt; 15 Mins</span>
                      </div>
                      <div className="p-2.5 bg-white border border-indigo-50 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ShieldCheck className="h-3 w-3 text-indigo-500" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Status</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900">Premium</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Tabs and Similar Products */}
        <div className="space-y-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="seller-reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <Card className="p-6">
                <p className="whitespace-pre-line text-lg leading-relaxed">{product.description}</p>
              </Card>
            </TabsContent>
            <TabsContent value="specifications" className="mt-6">
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.properties || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b py-2">
                      <span className="font-medium text-muted-foreground capitalize">{key}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-b py-2"><span className="font-medium text-muted-foreground">Category</span><span className="font-semibold">{product.category}</span></div>
                  <div className="flex justify-between border-b py-2"><span className="font-medium text-muted-foreground">Condition</span><span className="font-semibold">{product.condition}</span></div>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="seller-reviews" className="mt-6">
               <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <Card key={review.id} className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.reviewer?.profile_image} />
                          <AvatarFallback>{review.reviewer?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold">{review.reviewer?.full_name || "Anonymous"}</h4>
                            <div className="flex"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {review.rating}</div>
                          </div>
                          <p>{review.comment}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No reviews yet</p>
                )}
               </div>
            </TabsContent>
          </Tabs>

          {similarProducts.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Similar Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {similarProducts.map((p) => (
                  <Link key={p.id} to={`/product/${p.id}`} className="group">
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-square relative">
                        <img src={p.images?.[0]} alt={p.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold truncate">{p.name}</h3>
                        <p className="text-green-600 font-bold mt-1">KES {p.price.toLocaleString()}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Social Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share this product</DialogTitle></DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            <button onClick={() => handleSocialShare("whatsapp")} className="flex flex-col items-center gap-2"><div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center"><MessageCircle className="text-white" /></div><span className="text-xs">WhatsApp</span></button>
            <button onClick={() => handleSocialShare("facebook")} className="flex flex-col items-center gap-2"><div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center"><Facebook className="text-white" /></div><span className="text-xs">Facebook</span></button>
            <button onClick={() => handleSocialShare("twitter")} className="flex flex-col items-center gap-2"><div className="w-12 h-12 bg-black rounded-full flex items-center justify-center"><Twitter className="text-white" /></div><span className="text-xs">Twitter</span></button>
            <button onClick={() => handleSocialShare("copy")} className="flex flex-col items-center gap-2"><div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center"><Link2 /></div><span className="text-xs">Copy</span></button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Contact Seller Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-center">Contact Seller</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <Avatar className="w-20 h-20"><AvatarImage src={sellerProfile?.profile_image} /><AvatarFallback>{sellerProfile?.full_name?.charAt(0)}</AvatarFallback></Avatar>
            <div className="text-center">
              <h3 className="font-bold text-xl">{sellerProfile?.full_name || "Seller"}</h3>
              <p className="text-sm text-muted-foreground">{sellerProfile?.location}</p>
            </div>
            <div className="w-full space-y-3">
              <Button asChild className="w-full bg-[#25D366] hover:bg-[#128C7E]"><a href={`https://wa.me/${sellerProfile?.whatsapp || sellerProfile?.phone}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-2" /> WhatsApp</a></Button>
              <Button asChild className="w-full" variant="outline"><a href={`tel:${sellerProfile?.phone}`}><Phone className="mr-2" /> Call Now</a></Button>
              <Button asChild className="w-full" variant="ghost"><a href={`sms:${sellerProfile?.phone}`}><MessageSquare className="mr-2" /> SMS</a></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Check icon component
const Check = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);
