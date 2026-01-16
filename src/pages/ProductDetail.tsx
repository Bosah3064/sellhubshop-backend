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
    profile_image?: string;
    username?: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  profile_image?: string;
  phone: string;
  whatsapp: string;
  location: string;
  rating: number;
  total_reviews: number;
  followers_count: number;
  following_count: number;
  bio?: string;
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (id) {
      loadProductData();
    }
  }, [id, currentUser]);

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

        // Load similar products
        const { data: similarData } = await supabase
          .from("products")
          .select("*")
          .eq("category", productData.category)
          .neq("id", productData.id)
          .eq("status", "active")
          .limit(4);

        setSimilarProducts(similarData || []);

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
        .select("id, full_name, profile_image, username")
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

      const productUrl = window.location.href;
      const productName = product.name;
      const productPrice = `KES ${product.price.toLocaleString()}`;
      const productImage = product.images?.[0] || "/placeholder.svg";
      const sellerName = sellerProfile.full_name || sellerProfile.username;

      const shareText = `Check out "${productName}" for ${productPrice} by ${sellerName} on MarketHub!`;

      switch (platform) {
        case "whatsapp":
          const whatsappText = `${shareText}\n\n${productUrl}`;
          window.open(
            `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
            "_blank"
          );
          break;

        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              productUrl
            )}`,
            "_blank"
          );
          break;

        case "twitter":
          const twitterText = `${shareText}\n\n${productUrl}`;
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              twitterText
            )}`,
            "_blank"
          );
          break;

        case "telegram":
          const telegramText = `${shareText}\n\n${productUrl}`;
          window.open(
            `https://t.me/share/url?url=${encodeURIComponent(
              productUrl
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

Check it out here: ${productUrl}

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

🔗 ${productUrl}

#MarketHub #${product.category.replace(
            /\s+/g,
            ""
          )} #${product.subcategory.replace(/\s+/g, "")}
          `.trim();

          await navigator.clipboard.writeText(richText);
          setCopied(true);
          toast.success("Product details copied to clipboard!");

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
      <Helmet>
        <title>{metaTags.title}</title>
        <meta name="description" content={metaTags.description} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={metaTags.url} />
        <meta property="og:title" content={metaTags.productName} />
        <meta property="og:description" content={metaTags.description} />
        <meta property="og:image" content={metaTags.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="MarketHub" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Markethub" />
        <meta name="twitter:title" content={metaTags.productName} />
        <meta name="twitter:description" content={metaTags.description} />
        <meta name="twitter:image" content={metaTags.image} />
        <meta name="twitter:creator" content="@Markethub" />

        {/* Additional Product Meta */}
        <meta
          property="product:price:amount"
          content={metaTags.price?.toString()}
        />
        <meta property="product:price:currency" content={metaTags.currency} />
        <meta property="product:condition" content={metaTags.condition} />
        <meta property="product:brand" content={metaTags.sellerName} />
        <meta property="product:availability" content="in stock" />

        {/* Additional Meta */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={metaTags.url} />
      </Helmet>

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
            <div className="space-y-2">
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
              {product.is_negotiable && (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
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

              {product.properties &&
                Object.keys(product.properties).length > 0 && (
                  <div>
                    <span className="font-semibold">Specifications:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(product.properties).map(
                        ([key, value]) => (
                          <Badge key={key} variant="outline">
                            <strong>{key}:</strong> {value}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
                asChild
              >
                <a
                  href={`https://wa.me/${sellerProfile?.whatsapp}?text=Hi! I'm interested in your product: ${product.name} - KES ${product.price}`}
                  target="_blank"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact Seller
                </a>
              </Button>

              <Button size="lg" variant="outline" asChild>
                <a href={`tel:${sellerProfile?.phone}`}>
                  <Phone className="h-5 w-5 mr-2" />
                  Call Now
                </a>
              </Button>

              <Button
                size="icon"
                variant="outline"
                onClick={handleAddToWishlist}
              >
                <Heart
                  className={`h-5 w-5 ${isInWishlist ? "fill-red-500 text-red-500" : ""
                    }`}
                />
              </Button>

              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Enhanced Seller Info with Social Features */}
            {sellerProfile && (
              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar
                    className="w-16 h-16 cursor-pointer"
                    onClick={handleViewSellerProfile}
                  >
                    <AvatarImage src={sellerProfile.profile_image} />
                    <AvatarFallback className="text-lg">
                      {sellerProfile.full_name?.charAt(0) ||
                        sellerProfile.username?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3
                          className="font-semibold text-lg cursor-pointer hover:text-green-600 transition-colors"
                          onClick={handleViewSellerProfile}
                        >
                          {sellerProfile.full_name || sellerProfile.username}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          {sellerProfile.location}
                        </div>
                        {sellerProfile.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {sellerProfile.bio}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {currentUser && currentUser.id !== sellerProfile.id && (
                          <Button
                            variant={isFollowingSeller ? "outline" : "default"}
                            size="sm"
                            onClick={handleFollowSeller}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {isFollowingSeller ? "Following" : "Follow"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleViewSellerProfile}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>

                    {/* Seller Stats - Clickable */}
                    <div className="flex items-center gap-6 text-center border-t pt-3">
                      <button
                        onClick={handleViewSellerProducts}
                        className="flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
                      >
                        <span className="font-bold text-lg">
                          {sellerProfile.total_reviews || 0}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Products
                        </span>
                      </button>
                      <button
                        onClick={handleViewSellerFollowers}
                        className="flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
                      >
                        <span className="font-bold text-lg">
                          {sellerProfile.followers_count}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Followers
                        </span>
                      </button>
                      <button
                        onClick={handleViewSellerFollowing}
                        className="flex flex-col items-center hover:scale-105 transition-transform cursor-pointer"
                      >
                        <span className="font-bold text-lg">
                          {sellerProfile.following_count}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Following
                        </span>
                      </button>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-bold text-lg">
                            {sellerProfile.rating?.toFixed(1) || "5.0"}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Rating
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Social Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share this product
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Product Preview */}
              <div className="flex gap-4 p-4 border rounded-lg bg-muted/30">
                <img
                  src={product.images?.[0] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm line-clamp-2">
                    {product.name}
                  </h4>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    KES {product.price?.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {sellerProfile?.full_name || sellerProfile?.username}
                  </p>
                </div>
              </div>

              {/* Social Platforms Grid */}
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => handleSocialShare("whatsapp")}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-green-50 hover:border-green-200 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center group-hover:bg-green-700 transition-colors">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-medium">WhatsApp</span>
                </button>

                <button
                  onClick={() => handleSocialShare("facebook")}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                    <Facebook className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-medium">Facebook</span>
                </button>

                <button
                  onClick={() => handleSocialShare("twitter")}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                    <Twitter className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-medium">Twitter</span>
                </button>

                <button
                  onClick={() => handleSocialShare("copy")}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 hover:border-gray-200 transition-colors group"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${copied
                        ? "bg-green-600"
                        : "bg-gray-600 group-hover:bg-gray-700"
                      }`}
                  >
                    {copied ? (
                      <Check className="h-6 w-6 text-white" />
                    ) : (
                      <Link2 className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <span className="text-xs font-medium">
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </button>
              </div>

              {/* Additional Share Options */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleSocialShare("telegram")}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Telegram
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSocialShare("email")}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Description & Details Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="seller-reviews">
              Seller Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                Product Description
              </h3>
              <p className="text-lg leading-relaxed whitespace-pre-line">
                {product.description || "No description provided."}
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                Product Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">Category:</span>
                    <p className="text-muted-foreground">{product.category}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Subcategory:</span>
                    <p className="text-muted-foreground">
                      {product.subcategory}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold">Condition:</span>
                    <p className="text-muted-foreground">{product.condition}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">Location:</span>
                    <p className="text-muted-foreground">{product.location}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Price Type:</span>
                    <p className="text-muted-foreground">
                      {product.is_negotiable ? "Negotiable" : "Fixed Price"}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold">Listed:</span>
                    <p className="text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="seller-reviews" className="mt-6">
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id} className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar
                        className="cursor-pointer"
                        onClick={() =>
                          review.reviewer &&
                          navigate(`/profile/${review.reviewer.id}`)
                        }
                      >
                        <AvatarImage src={review.reviewer?.profile_image} />
                        <AvatarFallback>
                          {review.reviewer?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p
                            className="font-semibold text-lg cursor-pointer hover:text-green-600 transition-colors"
                            onClick={() =>
                              review.reviewer &&
                              navigate(`/profile/${review.reviewer.id}`)
                            }
                          >
                            {review.reviewer?.full_name || "Anonymous User"}
                          </p>
                          <div className="flex">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                className={`w-4 h-4 ${index < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-base">{review.comment}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-xl text-muted-foreground">
                    No reviews yet
                  </p>
                  <p className="text-muted-foreground mt-2">
                    Be the first to review this seller!
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((similarProduct) => (
                <Card
                  key={similarProduct.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  <Link to={`/product/${similarProduct.id}`}>
                    <div className="aspect-square overflow-hidden bg-muted/30">
                      <img
                        src={similarProduct.images?.[0] || "/placeholder.svg"}
                        alt={similarProduct.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {similarProduct.name}
                      </h3>
                      <p className="text-xl font-bold text-green-600 mb-2">
                        KES {similarProduct.price?.toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {similarProduct.category}
                        </Badge>
                        <Badge variant="outline">
                          {similarProduct.condition}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
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
