import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Share2,
  Heart,
  Calendar,
  Loader2,
  AlertCircle,
  ShoppingBag,
  User,
  Mail,
  Eye,
  Users,
  UserPlus,
  ChevronLeft,
  MoreHorizontal,
  MessageSquare,
  Bookmark,
  Play,
  Video,
  Zap,
  Award,
  TrendingUp,
  Shield,
  BadgeCheck,
  Copy,
  Check,
  Sparkles,
  Target,
  BarChart3,
  Crown,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  condition: string;
  description: string;
  location: string;
  created_at: string;
  status: string;
  owner_id: string;
  video_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
}

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
  rating: number;
  total_ratings: number;
  status: string;
}

interface ProfileStats {
  total_products: number;
  total_reviews: number;
  average_rating: number;
  member_since: string;
  followers_count: number;
  following_count: number;
  total_views: number;
  response_rate: number;
}

interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    rating: number;
    total_reviews: number;
  };
}

// Safaricom color palette
const safaricomColors = {
  green: "#00A650",
  blue: "#0077BE",
  purple: "#8B5CF6",
  orange: "#FF6B35",
  teal: "#14B8A6",
  darkGreen: "#008040",
};

const useProfileData = (email?: string, id?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let profileData;

      if (email) {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", decodeURIComponent(email))
          .single();
        if (profileError) throw profileError;
        profileData = data;
      } else if (id) {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();
        if (profileError) throw profileError;
        profileData = data;
      } else {
        throw new Error("Profile identifier required");
      }

      if (!profileData) throw new Error("User not found");
      setProfile(profileData);

      const [
        productsData,
        followersData,
        followingData,
        followersCount,
        followingCount,
        totalViews,
      ] = await Promise.all([
        supabase
          .from("products")
          .select(
            "id, name, price, images, condition, views_count, likes_count, video_url, status"
          )
          .eq("owner_id", profileData.id)
          .in("status", ["active", "approved"])
          .order("created_at", { ascending: false })
          .limit(12)
          .then(({ data, error }) => (error ? [] : data || [])),

        supabase
          .from("followers")
          .select(
            `
            id, follower_id, following_id, created_at,
            follower:profiles!followers_follower_id_fkey(
              id, full_name, username, avatar_url, bio, rating, total_reviews
            )
          `
          )
          .eq("following_id", profileData.id)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(({ data, error }) =>
            error
              ? []
              : (data || []).map((item) => ({
                  id: item.id,
                  follower_id: item.follower_id,
                  following_id: item.following_id,
                  created_at: item.created_at,
                  user: item.follower,
                }))
          ),

        supabase
          .from("followers")
          .select(
            `
            id, follower_id, following_id, created_at,
            following:profiles!followers_following_id_fkey(
              id, full_name, username, avatar_url, bio, rating, total_reviews
            )
          `
          )
          .eq("follower_id", profileData.id)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(({ data, error }) =>
            error
              ? []
              : (data || []).map((item) => ({
                  id: item.id,
                  follower_id: item.follower_id,
                  following_id: item.following_id,
                  created_at: item.created_at,
                  user: item.following,
                }))
          ),

        supabase
          .from("followers")
          .select("*", { count: "exact", head: true })
          .eq("following_id", profileData.id)
          .then(({ count, error }) => (error ? 0 : count || 0)),

        supabase
          .from("followers")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", profileData.id)
          .then(({ count, error }) => (error ? 0 : count || 0)),

        supabase
          .from("products")
          .select("views_count")
          .eq("owner_id", profileData.id)
          .then(({ data, error }) =>
            error
              ? 0
              : data?.reduce(
                  (sum, product) => sum + (product.views_count || 0),
                  0
                ) || 0
          ),
      ]);

      const profileStats: ProfileStats = {
        total_products: productsData.length,
        total_reviews: 0,
        average_rating: 5.0,
        member_since: new Date(profileData.created_at).getFullYear().toString(),
        followers_count: followersCount,
        following_count: followingCount,
        total_views: totalViews,
        response_rate: Math.min(95, Math.max(70, Math.random() * 100)),
      };

      setProducts(productsData);
      setStats(profileStats);
      setFollowers(followersData);
      setFollowing(followingData);
    } catch (error) {
      console.error("Error loading profile data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load profile data"
      );
    } finally {
      setLoading(false);
    }
  }, [email, id]);

  useEffect(() => {
    if (email || id) {
      loadProfileData();
    }
  }, [email, id, loadProfileData]);

  return {
    profile,
    products,
    stats,
    followers,
    following,
    loading,
    error,
    refetch: loadProfileData,
  };
};

export default function Profile() {
  const { email, id } = useParams<{ email?: string; id?: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("products");
  const [copied, setCopied] = useState(false);

  const {
    profile,
    products,
    stats,
    followers,
    following,
    loading,
    error,
    refetch,
  } = useProfileData(email, id);

  useEffect(() => {
    const initializeUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUser && profile && currentUser.id !== profile.id) {
      checkIfFollowing(profile.id);
    }
  }, [currentUser, profile]);

  const checkIfFollowing = async (profileId: string) => {
    const { data } = await supabase
      .from("followers")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profileId)
      .single();
    setIsFollowing(!!data);
  };

  const isOwnProfile = useMemo(() => {
    return currentUser && profile && currentUser.id === profile.id;
  }, [currentUser, profile]);

  const handleViewNetwork = (type: "following" | "followers") => {
    navigate(`/following/${profile?.id}?tab=${type}`);
  };

  const handleTabClick = (tab: string) => {
    if (tab === "followers" || tab === "following") {
      handleViewNetwork(tab);
    } else {
      setActiveTab(tab);
    }
  };

  const handleShare = async () => {
    try {
      const profileUrl = profile?.id
        ? `${window.location.origin}/profile/${profile.id}`
        : email
        ? `${window.location.origin}/profile/email/${encodeURIComponent(
            email!
          )}`
        : window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: `Check out ${profile?.full_name || profile?.email}'s profile`,
          text: `View ${
            profile?.full_name || profile?.email
          }'s products on Marketplace`,
          url: profileUrl,
        });
        toast.success("Profile shared! 🚀");
      } else {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        toast.success("Link copied! 📋");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("AbortError")) {
        toast.error("Failed to share");
      }
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error("Please sign in to follow users");
      navigate("/signin");
      return;
    }

    if (!profile || isOwnProfile) {
      toast.info(
        isOwnProfile ? "You can't follow yourself" : "Profile not available"
      );
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.id);
        setIsFollowing(false);
        toast.success(
          `Unfollowed ${profile.full_name || profile.email.split("@")[0]}!`
        );
      } else {
        await supabase.from("followers").insert({
          follower_id: currentUser.id,
          following_id: profile.id,
          created_at: new Date().toISOString(),
        });
        setIsFollowing(true);
        toast.success(
          `Following ${profile.full_name || profile.email.split("@")[0]}!`
        );
      }
      refetch();
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };

  const handleContact = (method: "whatsapp" | "phone" | "email" | "sms") => {
    if (!profile) return;

    try {
      let url: string | null = null;
      let message = "";

      switch (method) {
        case "whatsapp":
          if (profile.whatsapp) {
            message = `Hi! I'm interested in connecting with you from your marketplace profile.`;
            url = `https://wa.me/${profile.whatsapp.replace(
              /\D/g,
              ""
            )}?text=${encodeURIComponent(message)}`;
          } else {
            toast.error("WhatsApp number not available");
            return;
          }
          break;
        case "phone":
          if (profile.phone) {
            url = `tel:${profile.phone}`;
          } else {
            toast.error("Phone number not available");
            return;
          }
          break;
        case "email":
          message = `Interest from Marketplace Profile`;
          url = `mailto:${profile.email}?subject=${encodeURIComponent(
            message
          )}&body=${encodeURIComponent(
            "Hi! I saw your profile and would like to connect."
          )}`;
          break;
        case "sms":
          if (profile.phone) {
            message =
              "Hi! I saw your profile on the marketplace and would like to connect.";
            url = `sms:${profile.phone}?body=${encodeURIComponent(message)}`;
          } else {
            toast.error("Phone number not available for SMS");
            return;
          }
          break;
      }

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        toast.success(`Contact opened! 📱`);
      }
    } catch (error) {
      toast.error("Failed to open contact");
    }
  };

  const handleFollowUser = async (userId: string) => {
    if (!currentUser) {
      toast.error("Please sign in to follow users");
      navigate("/signin");
      return;
    }

    try {
      await supabase.from("followers").insert({
        follower_id: currentUser.id,
        following_id: userId,
        created_at: new Date().toISOString(),
      });
      toast.success("Following user! 🤝");
      refetch();
    } catch (error) {
      toast.error("Failed to follow user");
    }
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const getInitials = (name: string | null, email: string): string => {
    return name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(price);
  };

  // Enhanced Professional Stats with Safaricom Theme
  const ProfessionalStats = useMemo(
    () => () =>
      (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {stats?.total_products || 0}
              </div>
            </div>
            <div className="text-sm font-semibold text-blue-700">Products</div>
          </Card>

          <Card
            className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => handleViewNetwork("followers")}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {stats?.followers_count || 0}
              </div>
            </div>
            <div className="text-sm font-semibold text-green-700">
              Followers
            </div>
          </Card>

          <Card
            className="p-4 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
            onClick={() => handleViewNetwork("following")}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <UserPlus className="w-5 h-5 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">
                {stats?.following_count || 0}
              </div>
            </div>
            <div className="text-sm font-semibold text-purple-700">
              Following
            </div>
          </Card>

          <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all hover:scale-105">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <div className="text-2xl font-bold text-orange-600">
                {stats?.average_rating || "5.0"}
              </div>
            </div>
            <div className="text-sm font-semibold text-orange-700">Rating</div>
          </Card>
        </div>
      ),
    [stats]
  );

  // Enhanced Contact Buttons with Safaricom Theme
  const EnhancedContactButtons = useMemo(
    () => () =>
      (
        <div className="flex flex-col md:flex-row gap-3 justify-center md:justify-start items-center">
          {!isOwnProfile && currentUser && (
            <Button
              onClick={handleFollow}
              size="sm"
              className={`font-semibold transition-all shadow-lg ${
                isFollowing
                  ? "bg-green-600 hover:bg-green-700 text-white border-0"
                  : "bg-white text-green-600 border-2 border-green-600 hover:bg-green-50"
              }`}
            >
              <Heart
                className={`w-4 h-4 mr-2 ${isFollowing ? "fill-current" : ""}`}
              />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            {profile?.whatsapp && (
              <Button
                onClick={() => handleContact("whatsapp")}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white shadow-lg border-0"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            )}

            {profile?.phone && (
              <Button
                onClick={() => handleContact("phone")}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg border-0"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            )}

            <Button
              onClick={() => handleContact("email")}
              size="sm"
              className="bg-purple-500 hover:bg-purple-600 text-white shadow-lg border-0"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg border-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Share2 className="w-4 h-4 mr-2" />
                  )}
                  {copied ? "Copied!" : "Share"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-xl">
                <DropdownMenuItem
                  onClick={handleShare}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                >
                  <Share2 className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-700">
                    Share Profile
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleShare}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <Copy className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-700">
                    Copy Profile Link
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ),
    [isOwnProfile, currentUser, isFollowing, profile, copied]
  );

  // Enhanced User Card with Safaricom Theme
  const EnhancedUserCard = useMemo(
    () =>
      ({ user, showActions = true }: { user: any; showActions?: boolean }) =>
        (
          <Card className="p-4 hover:shadow-xl transition-all border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30 group hover:scale-105">
            <div className="flex items-center gap-4">
              <Avatar
                className="w-14 h-14 cursor-pointer border-2 border-green-200 group-hover:border-green-400 transition-all"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold">
                  {user.full_name?.charAt(0) || user.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <h3 className="font-bold text-base truncate text-gray-900">
                    {user.full_name || "Unknown User"}
                  </h3>
                  {user.username && (
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  )}
                  {user.bio && (
                    <p className="text-sm text-gray-700 line-clamp-2 mt-2 leading-relaxed">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>

              {showActions && currentUser && currentUser.id !== user.id && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleFollowUser(user.id)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg border-0"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Follow
                </Button>
              )}
            </div>
          </Card>
        ),
    [currentUser, navigate]
  );

  // Enhanced Product Card with Safaricom Theme
  const ProductCard = useMemo(
    () =>
      ({ product }: { product: Product }) =>
        (
          <Card
            className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer border-0 shadow-lg group bg-gradient-to-br from-white to-green-50/30"
            onClick={() => handleViewProduct(product.id)}
          >
            <div className="aspect-square overflow-hidden bg-muted/30 relative">
              {product.video_url ? (
                <div className="w-full h-full relative">
                  <video
                    src={product.video_url}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    muted
                    loop
                    preload="metadata"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/80 text-white text-xs border-0 shadow-lg">
                      <Play className="w-3 h-3 mr-1" />
                      Video
                    </Badge>
                  </div>
                </div>
              ) : (
                <img
                  src={product.images?.[0] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              )}

              {/* Enhanced Product Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {product.views_count || 0}
                    </span>
                    <Heart className="w-4 h-4 ml-2" />
                    <span className="text-sm font-medium">
                      {product.likes_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-base mb-2 line-clamp-2 text-gray-900">
                {product.name}
              </h3>
              <p className="text-xl font-bold text-green-600 mb-3">
                {formatPrice(product.price)}
              </p>
              <div className="flex items-center justify-between">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 border-blue-200 text-xs"
                >
                  {product.condition}
                </Badge>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{product.views_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    <span>{product.likes_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ),
    [handleViewProduct, formatPrice]
  );

  // Loading State with Enhanced Design
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center border-0 shadow-xl bg-gradient-to-br from-white to-green-50/30">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            Loading Profile
          </h2>
          <p className="text-muted-foreground">{email || id}</p>
        </Card>
      </div>
    );
  }

  // Error State with Enhanced Design
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center border-0 shadow-xl bg-gradient-to-br from-white to-red-50/30">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">
            Profile Not Found
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-3">
            <Button
              onClick={refetch}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
            >
              <Loader2 className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full border-green-200 text-green-600 hover:bg-green-50"
            >
              <Link to="/marketplace">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="hover:bg-green-50 text-green-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-green-200">
                  <AvatarImage src={profile.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold">
                    {getInitials(profile.full_name, profile.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-bold text-base text-gray-900">
                    {profile.full_name || profile.email.split("@")[0]}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {stats?.total_products || 0} products •{" "}
                    <span
                      className="cursor-pointer hover:text-green-600 hover:underline font-medium"
                      onClick={() => handleViewNetwork("followers")}
                    >
                      {stats?.followers_count || 0} followers
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Profile Header */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white/30 shadow-2xl">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="text-3xl bg-white/20 text-white font-bold">
                {getInitials(profile.full_name, profile.email)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-6">
                <h1 className="text-3xl md:text-5xl font-bold">
                  {profile.full_name || profile.email.split("@")[0]}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-0"
                  >
                    {profile.email}
                  </Badge>
                  {profile.username && (
                    <Badge
                      variant="secondary"
                      className="bg-white/10 text-white/90 border-0"
                    >
                      @{profile.username}
                    </Badge>
                  )}
                  {profile.status === "verified" && (
                    <Badge className="bg-blue-500/90 text-white border-0 shadow-lg">
                      <BadgeCheck className="w-4 h-4 mr-1" />
                      Verified Seller
                    </Badge>
                  )}
                  {stats?.total_products && stats.total_products > 10 && (
                    <Badge className="bg-yellow-500/90 text-white border-0 shadow-lg">
                      <Award className="w-4 h-4 mr-1" />
                      Top Seller
                    </Badge>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p className="text-lg text-white/90 mb-6 max-w-3xl leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {profile.location && (
                <div className="flex items-center justify-center md:justify-start gap-2 mb-6 text-white/80">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">{profile.location}</span>
                </div>
              )}

              <ProfessionalStats />
              <EnhancedContactButtons />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Profile Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={handleTabClick}
          className="space-y-8"
        >
          <TabsList className="w-full grid grid-cols-3 bg-green-50/50 p-2 rounded-2xl border border-green-200">
            <TabsTrigger
              value="products"
              className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-700 font-semibold rounded-xl transition-all"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger
              value="followers"
              className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-700 font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Users className="w-5 h-5 mr-2" />
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-700 font-semibold rounded-xl transition-all cursor-pointer"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Following ({following.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-16 border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  No Products Listed
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {isOwnProfile
                    ? "Start your selling journey today! List your first product and begin connecting with buyers."
                    : "This user hasn't listed any products yet. Check back later to see their offerings."}
                </p>
                {isOwnProfile && (
                  <Button
                    asChild
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                  >
                    <Link to="/products/upload">
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      List Your First Product
                    </Link>
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="followers" className="space-y-4">
            <div className="space-y-4">
              {followers.length > 0 ? (
                followers.map((follower) => (
                  <EnhancedUserCard
                    key={follower.id}
                    user={follower.user}
                    showActions={true}
                  />
                ))
              ) : (
                <Card className="text-center py-16 border-0 shadow-xl bg-gradient-to-br from-white to-purple-50/30">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">
                    No Followers Yet
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {isOwnProfile
                      ? "Engage with the community, share great products, and build your following!"
                      : "This user is building their community. Be the first to follow them!"}
                  </p>
                  {!isOwnProfile && currentUser && (
                    <Button
                      onClick={handleFollow}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Be the First Follower
                    </Button>
                  )}
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            <div className="space-y-4">
              {following.length > 0 ? (
                following.map((follow) => (
                  <EnhancedUserCard
                    key={follow.id}
                    user={follow.user}
                    showActions={true}
                  />
                ))
              ) : (
                <Card className="text-center py-16 border-0 shadow-xl bg-gradient-to-br from-white to-orange-50/30">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserPlus className="w-10 h-10 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">
                    Not Following Anyone
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {isOwnProfile
                      ? "Discover amazing sellers, connect with like-minded people, and build your network!"
                      : "This user is exploring the community and building connections."}
                  </p>
                  {isOwnProfile && (
                    <Button
                      asChild
                      className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg"
                    >
                      <Link to="/marketplace">
                        <Users className="w-5 h-5 mr-2" />
                        Discover People
                      </Link>
                    </Button>
                  )}
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
