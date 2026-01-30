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
  Zap,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Heart,
  Search,
  ChevronRight,
  Computer,
  Smartphone,
  Watch,
  Headphones,
  Car,
  Home as HomeIcon,
  Shirt,
  Utensils,
  Camera
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackProductView } from "@/utils/trackProductView";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart } from "lucide-react";

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
  const { addToCart } = useCart();

  const categories = [
    { name: "Electronics", icon: "Smartphone", color: "bg-blue-500", text: "text-blue-500" },
    { name: "Vehicles", icon: "Car", color: "bg-amber-500", text: "text-amber-500" },
    { name: "Property", icon: "HomeIcon", color: "bg-emerald-500", text: "text-emerald-500" },
    { name: "Fashion", icon: "Shirt", color: "bg-purple-500", text: "text-purple-500" },
    { name: "Home & Garden", icon: "Watch", color: "bg-rose-500", text: "text-rose-500" },
    { name: "Jobs", icon: "Users", color: "bg-cyan-500", text: "text-cyan-500" },
    { name: "Services", icon: "Shield", color: "bg-indigo-500", text: "text-indigo-500" },
    { name: "Health & Beauty", icon: "Sparkles", color: "bg-pink-500", text: "text-pink-500" }
  ];

  const getCategoryIcon = (iconName: string) => {
    const iconProps = { className: "w-5 h-5" };
    switch (iconName) {
      case "Smartphone": return <Smartphone {...iconProps} />;
      case "Car": return <Car {...iconProps} />;
      case "HomeIcon": return <HomeIcon {...iconProps} />;
      case "Shirt": return <Shirt {...iconProps} />;
      case "Watch": return <Watch {...iconProps} />;
      case "Users": return <Users {...iconProps} />;
      case "Shield": return <Shield {...iconProps} />;
      case "Sparkles": return <Sparkles {...iconProps} />;
      default: return <Package {...iconProps} />;
    }
  };

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
      electronics: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
      fashion: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      home: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
      books: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
      sports: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
      beauty: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
      automotive: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400",
    };
    return (
      placeholders[category] ||
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400"
    );
  };

  return (
    <>
      <SEO
        title="Kenya's Premium Marketplace | SellHub"
        description="The safest, most vibrant online marketplace in Kenya. Premium electronics, fashion, and more."
      />

      <main className="min-h-screen bg-gray-50/50">
        {/* Animated Hero Section */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
          {/* Enhanced Background Gradients */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-700" />
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />
          </div>

          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-xl shadow-gray-200/50 border border-gray-100 text-gray-800 text-xs sm:text-sm font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="ml-2 text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> 10,000+ Satisfied Users
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <span className="text-gray-900">Premium </span>
                <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-blue-600 bg-clip-text text-transparent">Marketplace</span>
                <br />
                <span className="text-gray-900">For Kenya</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                The most trusted platform to discover, buy, and sell quality products with ease. Secure, fast, and local.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <Link to="/marketplace" className="w-full sm:w-auto">
                    <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold bg-gray-900 hover:bg-black text-white shadow-2xl shadow-gray-400 group w-full">
                        Explore Market
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
                <Link to="/products/upload" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl text-lg font-bold border-2 border-gray-100 bg-white/50 backdrop-blur-md hover:bg-white transition-all w-full">
                        <Zap className="w-5 h-5 mr-2 text-primary" />
                        Start Selling
                    </Button>
                </Link>
              </div>

              {/* Trending Tags */}
              <div className="mt-12 flex flex-wrap justify-center gap-3 animate-in fade-in duration-1000 delay-500">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block w-full mb-2">Trending Searches</span>
                  {["iPhone 15", "Toyota", "Real Estate", "Smart Watch"].map(tag => (
                      <button key={tag} className="px-4 py-1.5 rounded-full bg-white/80 border border-gray-100 text-xs font-bold text-gray-600 hover:border-primary/30 hover:text-primary transition-all shadow-sm">
                          {tag}
                      </button>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* Brand New Visual Category Navigator */}
        <section className="py-12 bg-white relative">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Discovery Centers</h2>
                    <p className="text-gray-500 font-medium">Browse through our curated departments</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {categories.map((cat) => (
                        <Link 
                            key={cat.name} 
                            to={`/marketplace?category=${cat.name}`}
                            className="group flex flex-col items-center p-6 rounded-3xl bg-white border border-gray-50 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${cat.color} bg-opacity-10 flex items-center justify-center ${cat.text} group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                                {getCategoryIcon(cat.icon)}
                            </div>
                            <span className="mt-4 text-[13px] font-bold text-gray-700 group-hover:text-primary transition-colors text-center">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>

        {/* Curated Product Showcase */}
        <section className="py-20">
            <div className="container mx-auto px-4">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-1 w-12 bg-primary rounded-full" />
                            <span className="text-sm font-black text-primary uppercase tracking-widest">Hand Picked</span>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900">Featured Creations</h2>
                    </div>
                    <Link to="/marketplace" className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors group">
                        Browse all premium listings
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-all" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="rounded-[40px] bg-white border border-gray-100 p-6 space-y-4 animate-pulse">
                                <div className="aspect-[4/5] rounded-[32px] bg-gray-100" />
                                <div className="h-4 w-1/2 bg-gray-100 rounded-full" />
                                <div className="h-8 w-full bg-gray-100 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredProducts.map((product) => (
                            <div key={product.id} className="group relative">
                                <Card className="border-none bg-white rounded-[40px] p-4 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden group-hover:-translate-y-2">
                                    <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden mb-6">
                                        <img 
                                            src={getProductImage(product)} 
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Badge className="bg-white/90 backdrop-blur-md text-gray-900 font-black text-[10px] uppercase border-none h-8 px-4 rounded-xl">Verified</Badge>
                                            <Button size="icon" className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md text-gray-400 hover:text-red-500 border-none">
                                                <Heart className="w-5 h-5" />
                                            </Button>
                                        </div>
                                        <div className="absolute bottom-4 left-4">
                                            <div className="bg-primary px-4 py-2 rounded-2xl text-white font-black shadow-lg shadow-primary/20">
                                                <PriceDisplay kesAmount={product.price} size="sm" className="text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <CardContent className="p-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-[10px] h-5 border-gray-100 font-bold uppercase text-gray-400">{product.category}</Badge>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                <span className="text-xs font-black text-gray-900">{getProductRating(product).toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <h3 className="font-black text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-50 overflow-hidden flex items-center justify-center">
                                                    {product.profiles?.avatar_url ? (
                                                        <img src={product.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users className="w-4 h-4 text-gray-300" />
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500 truncate max-w-[80px]">{product.profiles?.full_name || "Seller"}</span>
                                            </div>
                                            <Link to="/marketplace">
                                                <Button size="sm" className="bg-gray-50 hover:bg-primary hover:text-white text-gray-500 h-9 px-4 rounded-xl font-bold transition-all border-none">
                                                    Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>

        {/* Why Choose Us - Modern Gradient Cards */}
        <section className="py-24 bg-gray-900 overflow-hidden relative">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,#10b98120,transparent)]" />
            
            <div className="container mx-auto px-4">
                <div className="max-w-xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Why shop with us?</h2>
                    <p className="text-gray-400 font-medium">We've built the safest commerce bridge in Kenya</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { 
                            title: "Verified Sellers", 
                            desc: "Every seller goes through a multi-point identity verification process.",
                            icon: <Shield className="w-8 h-8" />,
                            color: "from-emerald-500 to-green-600"
                        },
                        { 
                            title: "Smart Tracking", 
                            desc: "Real-time AI insights helps you find the best deals at the best prices.",
                            icon: <Sparkles className="w-8 h-8" />,
                            color: "from-blue-500 to-indigo-600"
                        },
                        { 
                            title: "Direct Connect", 
                            desc: "Zero commission platform. Chat directly with sellers on WhatsApp.",
                            icon: <MessageCircle className="w-8 h-8" />,
                            color: "from-purple-500 to-pink-600"
                        }
                    ].map((feature, i) => (
                        <div key={i} className="relative group">
                            <div className={`absolute -inset-1 bg-gradient-to-r ${feature.color} rounded-[40px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200`} />
                            <div className="relative h-full bg-gray-800/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-10 flex flex-col items-center text-center">
                                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-8 shadow-2xl`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4">{feature.title}</h3>
                                <p className="text-gray-400 font-medium leading-relaxed">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Final CTA - Floating Dashboard Concept */}
        <section className="py-32 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="relative bg-gradient-to-br from-emerald-600 to-green-700 rounded-[60px] p-12 md:p-24 overflow-hidden shadow-2xl shadow-emerald-500/20">
                    <div className="absolute top-0 right-0 -m-20 w-[600px] h-[600px] bg-white opacity-5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 -m-20 w-[400px] h-[400px] bg-black opacity-5 rounded-full blur-[100px]" />
                    
                    <div className="relative z-10 max-w-3xl">
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Ready to boost your business in Kenya?</h2>
                        <p className="text-xl text-emerald-50/80 mb-12 font-medium">Join 5,000+ businesses already growing with SellHub. Start selling in less than 2 minutes.</p>
                        
                        <div className="flex flex-col sm:flex-row gap-6">
                            <Link to="/register">
                                <Button size="lg" className="h-16 px-12 rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 text-lg font-black shadow-xl w-full sm:w-auto transition-transform active:scale-95">
                                    Join for Free
                                </Button>
                            </Link>
                            <Link to="/pricing">
                                <Button size="lg" variant="outline" className="h-16 px-12 rounded-2xl border-2 border-emerald-400 text-white hover:bg-emerald-500 text-lg font-black w-full sm:w-auto transition-transform active:scale-95">
                                    View Premium Plans
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </main >
    </>
  );
};

export default Index;
