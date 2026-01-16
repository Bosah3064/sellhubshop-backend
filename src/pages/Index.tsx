import SEO from "@/components/SEO";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Users,
  TrendingUp,
  Shield,
  Star,
  Package,
  ArrowRight,
  Phone,
  MessageCircle,
  Mail,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackProductView } from "@/utils/trackProductView";
import { PriceDisplay } from "@/components/PriceDisplay";
import { PiLogo } from "@/components/PiLogo";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  images: string[];
  featured: boolean;
  verified: boolean;
  location: string;
  user_id: string;
  profiles?: {
    id: string;
    full_name: string | null;
    rating: number | null;
    total_ratings: number | null;
  } | null;
}

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          description,
          price,
          category,
          images,
          featured,
          verified,
          location,
          user_id
        `
        )
        .in("status", ["active", "approved"])
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;

      if (productsData && productsData.length > 0) {
        const userIds = productsData.map((p) => p.user_id).filter(Boolean);
        const uniqueUserIds = [...new Set(userIds)] as string[];

        let profilesMap: { [key: string]: any } = {};

        if (uniqueUserIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, rating, total_ratings")
            .in("id", uniqueUserIds);

          if (!profilesError && profilesData) {
            profilesData.forEach((profile) => {
              profilesMap[profile.id] = profile;
            });
          }
        }

        const productsWithProfiles = productsData.map((product) => ({
          ...product,
          profiles: product.user_id ? profilesMap[product.user_id] : null,
        }));

        setFeaturedProducts(productsWithProfiles);
      } else {
        setFeaturedProducts([]);
      }
    } catch (error: any) {
      console.error("Error loading featured products:", error);
      toast({
        variant: "destructive",
        title: "Error loading featured products",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProductRating = (product: Product) => {
    if (!product.profiles?.rating) return 4.5;
    return product.profiles.rating;
  };

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    const category = product.category?.toLowerCase();
    const placeholders: { [key: string]: string } = {
      electronics:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
      fashion:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      home: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
      books: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
      sports:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      beauty:
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
      automotive:
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400",
    };
    return (
      placeholders[category] ||
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"
    );
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return `KES ${price?.toLocaleString() || "0"}`;
  };

  return (
    <>
      <SEO
        title="Home - Buy & Sell | Pi Network Accepted (Soon)"
        description="Your trusted online marketplace in Kenya. Buy and sell with KES or Pi Network (Coming Soon) at sellhubshop.co.ke. Electronics, fashion, home goods, and more."
        keywords="sellhubshop.co.ke, sellhubshop, online marketplace Kenya, buy sell products, Pi Network, Pi currency, accept Pi, KES payment, electronics, fashion, buy with pi, sell with pi, pi network kenya, pay with pi, shop with pi, pi coin value, pi vendors kenya, pioneers kenya, 1 pi to kes, pi network nairobi, pi gcv, pi global consensus value, $314159, pi network price"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Marketplace",
          url: window.location.origin,
          potentialAction: {
            "@type": "SearchAction",
            target: `${window.location.origin}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

      <main className="min-h-screen">
        {/* Hero Section - Optimized for all devices */}
        <section className="relative py-8 md:py-16 lg:py-20 overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-background">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-background -z-10" />
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100/80 backdrop-blur-sm border border-purple-200 text-purple-800 text-sm font-semibold mb-6 shadow-sm hover:shadow-md transition-all">
                <PiLogo className="w-5 h-5 text-purple-600 animate-pulse" />
                <span className="mr-1">Pi Network Payments</span>
                <span className="flex">
                  {"Coming Soon".split("").map((char, index) => (
                    <span
                      key={index}
                      className="animate-neon-flicker inline-block text-purple-700"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        textShadow: "0 0 8px rgba(147, 51, 234, 0.5)"
                      }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                </span>
              </div>
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Your Sellhubshop,
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Your Way
                </span>
              </h1>
              <p className="text-sm xs:text-base sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                Connect buyers and sellers in one powerful platform. Start
                selling or shopping today.
              </p>
              <div className="flex flex-col xs:flex-row gap-3 justify-center items-center">
                <Link to="/products/upload" className="w-full xs:w-auto">
                  <Button
                    size="lg"
                    className="w-full xs:w-auto text-sm sm:text-base md:text-lg px-4 sm:px-6 py-2 sm:py-3"
                  >
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Start Selling
                  </Button>
                </Link>
                <Link to="/marketplace" className="w-full xs:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full xs:w-auto text-sm sm:text-base md:text-lg px-4 sm:px-6 py-2 sm:py-3"
                  >
                    Browse Products
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-6 sm:mb-8 gap-3">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                  Featured Products
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Hand-picked items from top sellers
                </p>
              </div>
              <Link to="/marketplace" className="w-full xs:w-auto mt-2 xs:mt-0">
                <Button variant="outline" className="w-full xs:w-auto text-sm">
                  View All Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(4)].map((_, index) => (
                  <Card key={index} className="overflow-hidden animate-pulse">
                    <div className="w-full h-48 sm:h-56 bg-muted" />
                    <CardContent className="p-3 sm:p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-6 bg-muted rounded mb-2"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  No Featured Products Yet
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">
                  Be the first to feature your products and get more visibility!
                </p>
                <Link to="/products/upload">
                  <Button size="sm">List Your First Product</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {featuredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer"
                  >
                    <Link
                      to={`/marketplace`}
                      onClick={() => trackProductView(product.id)}
                    >
                      <div className="relative">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2 flex gap-1 flex-col">
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Featured
                          </Badge>
                          {product.verified && (
                            <Badge
                              variant="secondary"
                              className="bg-green-500 text-white text-xs"
                            >
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <Badge variant="outline" className="mb-2 text-xs">
                          {product.category || "General"}
                        </Badge>
                        <h3 className="font-semibold mb-2 text-sm sm:text-base line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs sm:text-sm font-medium">
                            {getProductRating(product).toFixed(1)}
                          </span>
                          {product.profiles?.total_ratings && (
                            <span className="text-xs text-muted-foreground">
                              ({product.profiles.total_ratings})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <PriceDisplay kesAmount={product.price} size="md" className="flex-1" />
                          <Button size="sm" variant="outline" className="text-xs h-7 sm:h-8">View</Button>
                        </div>

                        {product.location && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                            📍 {product.location}
                          </p>
                        )}
                        {/* Contact Options - Mobile Optimized */}
                        <div className="flex gap-1 mt-3 pt-3 border-t border-gray-100 justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 flex-1 min-w-0"
                          >
                            <Phone className="h-3 w-3 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 flex-1 min-w-0"
                          >
                            <MessageCircle className="h-3 w-3 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 flex-1 min-w-0"
                          >
                            <Mail className="h-3 w-3 text-primary" />
                          </Button>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
              <div className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1 sm:mb-2">
                  500+
                </div>
                <div className="text-muted-foreground text-xs sm:text-sm md:text-base">
                  Active Sellers
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1 sm:mb-2">
                  2,000+
                </div>
                <div className="text-muted-foreground text-xs sm:text-sm md:text-base">
                  Products Listed
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1 sm:mb-2">
                  95%
                </div>
                <div className="text-muted-foreground text-xs sm:text-sm md:text-base">
                  Seller Satisfaction
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1 sm:mb-2">
                  24/7
                </div>
                <div className="text-muted-foreground text-xs sm:text-sm md:text-base">
                  Customer Support
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 md:mb-12">
              Why Choose Us?
            </h2>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="h-full">
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2 mx-auto" />
                  <CardTitle className="text-base sm:text-lg">
                    Easy Selling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base text-center">
                    List your products in minutes with our simple upload
                    process. Reach thousands of potential buyers instantly.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2 mx-auto" />
                  <CardTitle className="text-base sm:text-lg">
                    Direct Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base text-center">
                    Connect directly with buyers via phone, WhatsApp, or email.
                    No middlemen, better deals.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2 mx-auto" />
                  <CardTitle className="text-base sm:text-lg">
                    Flexible Plans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base text-center">
                    Choose from Free, Silver, or Gold plans that fit your needs.
                    Scale as you grow.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="h-full">
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2 mx-auto" />
                  <CardTitle className="text-base sm:text-lg">
                    Secure Platform
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base text-center">
                    Your data and transactions are protected with
                    enterprise-grade security and privacy.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-8 sm:py-12 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto">
              Join thousands of sellers already growing their business on our
              platform
            </p>
            <div className="flex flex-col xs:flex-row gap-3 justify-center items-center">
              <Link to="/pricing">
                <Button
                  size="lg"
                  className="w-full xs:w-auto text-sm sm:text-base md:text-lg px-4 sm:px-6 py-2 sm:py-3"
                >
                  View Pricing Plans
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full xs:w-auto text-sm sm:text-base md:text-lg px-4 sm:px-6 py-2 sm:py-3"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main >
    </>
  );
};

export default Index;
