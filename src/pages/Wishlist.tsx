import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Trash2,
  ShoppingCart,
  Share2,
  MessageCircle,
  User,
  Loader2,
  MapPin,
  Calendar,
  Tag,
  Sparkles,
  Eye,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FavoriteProduct {
  id: string;
  product_id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  seller_id: string;
  seller_name: string;
  seller_avatar: string | null;
  condition: string;
  status: string;
  location: string;
  created_at: string;
  favorite_id: string;
}

export default function Wishlist() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to view your wishlist");
        navigate("/signin");
        return;
      }

      const { data, error } = await supabase
        .from("favorites")
        .select(
          `
          id,
          created_at,
          products (
            id,
            name,
            price,
            category,
            images,
            condition,
            status,
            location,
            created_at,
            user_id,
            profiles!products_user_id_fkey (
              username,
              full_name,
              avatar_url
            )
          )
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading favorites:", error);
        throw error;
      }

      if (!data) {
        setFavorites([]);
        return;
      }

      const formattedFavorites: FavoriteProduct[] = data
        .filter((item) => item.products !== null)
        .map((item) => ({
          id: item.products.id,
          product_id: item.products.id,
          name: item.products.name,
          price: item.products.price,
          category: item.products.category,
          images: item.products.images || [],
          seller_id: item.products.user_id,
          seller_name:
            item.products.profiles?.full_name ||
            item.products.profiles?.username ||
            "Unknown Seller",
          seller_avatar: item.products.profiles?.avatar_url || null,
          condition: item.products.condition,
          status: item.products.status,
          location: item.products.location,
          created_at: item.created_at,
          favorite_id: item.id,
        }));

      setFavorites(formattedFavorites);
    } catch (error) {
      console.error("Failed to load favorites:", error);
      toast.error("Failed to load your wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string, productName: string) => {
    try {
      setRemovingIds((prev) => new Set(prev).add(favoriteId));

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) {
        console.error("Error removing favorite:", error);
        throw error;
      }

      setFavorites((prev) => prev.filter((f) => f.favorite_id !== favoriteId));
      toast.success(`"${productName}" removed from wishlist`);
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      toast.error("Failed to remove item from wishlist. Please try again.");
    } finally {
      setRemovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(favoriteId);
        return newSet;
      });
    }
  };

  const clearAllFavorites = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Error clearing favorites:", error);
        throw error;
      }

      setFavorites([]);
      setClearAllDialogOpen(false);
      toast.success("All items removed from wishlist");
    } catch (error) {
      console.error("Failed to clear favorites:", error);
      toast.error("Failed to clear wishlist. Please try again.");
    }
  };

  const shareProduct = (product: FavoriteProduct) => {
    const url = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Product link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy link. Please try again.");
      });
  };

  const handleContactSeller = (product: FavoriteProduct) => {
    navigate(`/messages?product=${product.id}&seller=${product.seller_id}`);
  };

  const handleBuyNow = (product: FavoriteProduct) => {
    navigate(`/product/${product.id}`);
  };

  const handleViewProduct = (product: FavoriteProduct) => {
    navigate(`/product/${product.id}`);
  };

  const getConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case "new":
        return "bg-green-100 text-green-800 border-green-200";
      case "like new":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "used":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "refurbished":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "sold":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <Heart className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Loading Your Wishlist
            </h2>
            <p className="text-muted-foreground">
              Gathering your favorite items...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-50 to-pink-100 rounded-2xl mb-6 border border-red-200">
            <Heart className="w-10 h-10 text-red-500 fill-red-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Wishlist
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Your curated collection of favorite products
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge
              variant="secondary"
              className="text-lg px-4 py-2 bg-primary/10 text-primary border-primary/20"
            >
              {favorites.length}{" "}
              {favorites.length === 1 ? "Premium Item" : "Premium Items"}
            </Badge>
            {favorites.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setClearAllDialogOpen(true)}
                size="lg"
                className="border-destructive/20 text-destructive hover:bg-destructive/10"
                disabled={removingIds.size > 0}
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Wishlist Items */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {favorites.map((product) => (
              <Card
                key={product.favorite_id}
                className="group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl bg-card/50 backdrop-blur-sm"
              >
                {/* Image Section */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
                  <img
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />

                  {/* Status Overlay */}
                  {product.status !== "active" && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge
                        variant="destructive"
                        className="text-sm px-3 py-2 bg-white/20 backdrop-blur-sm text-white border-0"
                      >
                        {product.status.toUpperCase()}
                      </Badge>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                      onClick={() =>
                        removeFavorite(product.favorite_id, product.name)
                      }
                      disabled={removingIds.has(product.favorite_id)}
                    >
                      {removingIds.has(product.favorite_id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => shareProduct(product)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share Product
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleContactSeller(product)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contact Seller
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Condition Badge */}
                  {product.condition && (
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${getConditionColor(
                          product.condition
                        )}`}
                      >
                        {product.condition}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  {/* Category & Price */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="text-xs font-medium">
                      <Tag className="w-3 h-3 mr-1" />
                      {product.category}
                    </Badge>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        KES {product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Product Name */}
                  <h3 className="text-lg font-semibold mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>

                  {/* Seller Info */}
                  <div className="flex items-center gap-3 mb-3 p-3 bg-muted/30 rounded-lg">
                    {product.seller_avatar ? (
                      <img
                        src={product.seller_avatar}
                        alt={product.seller_name}
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-background">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {product.seller_name}
                      </p>
                      {product.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {product.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Added Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Calendar className="w-3 h-3" />
                    Added{" "}
                    {new Date(product.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full font-medium"
                      onClick={() => handleBuyNow(product)}
                      disabled={product.status !== "active"}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {product.status === "active" ? "Buy Now" : "Unavailable"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full font-medium"
                      onClick={() => handleContactSeller(product)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
                <Heart className="w-12 h-12 text-muted-foreground/60" />
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Your Wishlist Awaits
              </h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                Start building your collection of favorite products. Items you
                love will appear here for easy access.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/marketplace">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Explore Marketplace
                  </Button>
                </Link>
                <Link to="/search">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-primary/20"
                  >
                    Search Products
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog
        open={clearAllDialogOpen}
        onOpenChange={setClearAllDialogOpen}
      >
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Clear Entire Wishlist?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {favorites.length} items from your wishlist.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAllFavorites}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

