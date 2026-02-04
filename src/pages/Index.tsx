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
  Camera,
  Building2,
  Armchair,
  Briefcase,
  Wrench,
  Monitor
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackProductView } from "@/utils/trackProductView";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart } from "lucide-react";
import { HomeStats } from "@/components/home/HomeStats";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price?: number | null;
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
    avatar_url?: string | null;
    updated_at?: string | null;
  } | null;
}

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [businessCount, setBusinessCount] = useState<number>(5000);
  const [businessAvatars, setBusinessAvatars] = useState<string[]>([]);
  const { toast } = useToast();
  const { addToCart } = useCart();

  const categories = [
    { name: "Electronics", icon: "Smartphone", color: "bg-emerald-500", text: "text-emerald-500" },
    { name: "Vehicles", icon: "Car", color: "bg-emerald-500", text: "text-emerald-500" },
    { name: "Property", icon: "Building2", color: "bg-emerald-500", text: "text-emerald-500" },
    { name: "Fashion", icon: "Shirt", color: "bg-emerald-500", text: "text-emerald-500" },
    { name: "Home & Garden", icon: "Armchair", color: "bg-emerald-500", text: "text-emerald-500" },
    { name: "Jobs", icon: "Briefcase", color: "bg-emerald-500", text: "text-emerald-500" },
    { name: "Services", icon: "Wrench", color: "bg-emerald-500", text: "text-emerald-500" },
    { name: "Health & Beauty", icon: "Heart", color: "bg-emerald-500", text: "text-emerald-500" }
  ];

  const getCategoryIcon = (iconName: string) => {
    const iconProps = { className: "w-6 h-6" };
    switch (iconName) {
      case "Smartphone": return <Smartphone {...iconProps} />;
      case "Car": return <Car {...iconProps} />;
      case "Building2": return <Building2 {...iconProps} />;
      case "Shirt": return <Shirt {...iconProps} />;
      case "Armchair": return <Armchair {...iconProps} />;
      case "Briefcase": return <Briefcase {...iconProps} />;
      case "Wrench": return <Wrench {...iconProps} />;
      case "Heart": return <Heart {...iconProps} />;
      default: return <Package {...iconProps} />;
    }
  };

  useEffect(() => {
    loadFeaturedProducts();
    loadLatestProducts();
    fetchBusinessStats();
  }, []);

  const loadLatestProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, description, price, original_price, category, images, featured, verified, location, user_id,
          profiles:user_id (id, full_name, rating, total_ratings, avatar_url, updated_at)
        `)
        .in("status", ["active", "approved"])
        .order("created_at", { ascending: false })
        .limit(12);

      if (!error && data) {
        setLatestProducts(data as unknown as Product[]);
      }
    } catch (error) {
      console.error("Error loading latest products:", error);
    }
  };

  const fetchBusinessStats = async () => {
    try {
      // Fetch total profiles count
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (!countError && count !== null) {
        setBusinessCount(count);
      }

      // Fetch sample avatars
      const { data: avatarData, error: avatarError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .not('avatar_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!avatarError && avatarData) {
        setBusinessAvatars(avatarData.map(p => p.avatar_url).filter(Boolean) as string[]);
      }
    } catch (error) {
      console.error("Error fetching business stats:", error);
    }
  };

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
          original_price,
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
            .select("id, full_name, rating, total_ratings, avatar_url, updated_at")
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

  return (
    <>
      <SEO
        title="Kenya's #1 Premium Marketplace | Buy & Sell Online"
        description="Join the fastest growing marketplace in Kenya. Buy and sell electronics, cars, fashion, property, and services securely. M-Pesa integrated, verified sellers."
        keywords="online marketplace kenya, buy sell kenya, e-commerce kenya, electronics nairobi, cars for sale kenya, property listings kenya, jobs kenya, fashion deals, smartphones price in kenya, verified sellers, m-pesa payment"
      />

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-x-hidden">
        {/* Modern Split Hero Section */}
        <section className="relative pt-16 pb-12 md:pt-20 md:pb-24 overflow-hidden z-10">
          {/* Mesh Gradient Background */}
          <div className="absolute inset-0 -z-10 bg-[#FAFAFA]">
            <div className="absolute top-0 right-0 w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] bg-emerald-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] bg-blue-100/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
          </div>

          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Text & CTA */}
              <div className="text-left space-y-8 animate-slide-in-up md:pr-8">
                 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-emerald-100 shadow-sm text-emerald-800 text-xs font-bold mb-4 hover:shadow-md transition-shadow cursor-default">
                   <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none px-2 py-0.5 h-auto text-[10px] rounded-md">NEW</Badge>
                   <span>Kenya's Premier Commerce Hub</span>
                 </div>

                 <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 leading-[1.1] font-heading">
                   Buy & Sell <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Everything</span> <br/>
                   <span className="relative inline-block">
                     Securely.
                     <svg className="absolute w-full h-3 -bottom-1 left-0 text-emerald-400/30 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                       <path d="M0 5 Q 50 10 100 5 L 100 10 L 0 10 Z" fill="currentColor" />
                     </svg>
                   </span>
                 </h1>

                 <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
                   The safest marketplace to discover verified local sellers, browse premium products, and transact with M-Pesa integration.
                 </p>

                 <div className="flex flex-wrap gap-4 pt-2">
                    <Link to="/marketplace">
                      <Button size="lg" className="h-14 px-8 rounded-2xl bg-gray-900 hover:bg-black text-white text-base font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                        Start Exploration
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                    <Link to="/products/upload">
                      <Button size="lg" variant="outline" className="h-14 px-8 rounded-2xl border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 text-gray-900 text-base font-bold transition-all duration-300">
                        <Zap className="mr-2 w-5 h-5 text-emerald-600" />
                        Start Selling
                      </Button>
                    </Link>
                 </div>

                 <div className="flex items-center gap-6 pt-4 text-sm font-medium text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span>Verified Sellers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span>M-Pesa Secured</span>
                    </div>
                 </div>
              </div>

              {/* Right Column: Visual Composition */}
              <div className="relative hidden lg:block animate-fade-in perspective-1000">
                  <div className="relative z-10 mr-12">
                     {/* Main Hero Card - Floating */}
                     <Card className="border-0 shadow-2xl rounded-[40px] overflow-hidden bg-white/80 backdrop-blur-xl animate-float">
                        <div className="relative h-[500px] w-full bg-gray-100 group">
                           <img 
                              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=95&w=1200"
                              alt="Marketplace features" 
                              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/800x600/f3f4f6/1f2937?text=Shop+Now";
                              }}
                           />
                           {/* Overlay UI Elements */}
                           <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                              <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                   <Shield className="w-5 h-5" />
                                 </div>
                                 <div className="pr-2">
                                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                                   <p className="text-xs font-black text-gray-900">Payment Escrow</p>
                                 </div>
                              </div>
                           </div>

                           <div className="absolute bottom-6 left-6 right-6">
                              <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-xl flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="flex -space-x-3">
                                      {(businessAvatars.length > 0 ? businessAvatars.slice(0, 3) : [
                                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=95&w=400&h=400",
                                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=95&w=400&h=400",
                                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=95&w=400&h=400"
                                      ]).map((avatar, i) => (
                                        <div key={i} className={`w-14 h-14 rounded-full border-4 border-white bg-white overflow-hidden shadow-xl relative z-[${10-i}] transition-transform hover:scale-110 hover:z-50`}>
                                          <img 
                                            src={typeof avatar === 'string' ? avatar : `https://ui-avatars.com/api/?name=User&background=10b981&color=fff&size=200`} 
                                            alt="User" 
                                            className="w-full h-full object-cover rounded-full"
                                            loading="eager"
                                            onError={(e) => {
                                              e.currentTarget.src = `https://ui-avatars.com/api/?name=User&background=10b981&color=fff&size=200`;
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                    <div>
                                       <p className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">
                                         {businessCount.toLocaleString()}+ Active
                                       </p>
                                       <p className="text-sm font-medium text-gray-400">Verified Sellers</p>
                                    </div>
                                  </div>
                                  <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center text-white">
                                     <ArrowRight className="w-5 h-5 -rotate-45" />
                                  </div>
                              </div>
                           </div>
                        </div>
                     </Card>

                     {/* Floating Decorative Elements */}
                     <div className="absolute -top-10 -right-10 bg-white p-4 rounded-3xl shadow-xl z-20 animate-bounce-soft delay-100">
                        <div className="flex items-center gap-3">
                           <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                              <TrendingUp className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-xs text-gray-400 font-bold uppercase">Trending</p>
                              <p className="text-sm font-black text-gray-900">+24% Sales</p>
                           </div>
                        </div>
                     </div>

                     <div className="absolute top-1/2 -right-16 bg-white p-4 rounded-3xl shadow-xl z-20 animate-float delay-300">
                        <div className="flex items-center gap-3">
                           <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                              <Star className="w-6 h-6 fill-blue-600" />
                           </div>
                           <div>
                              <p className="text-xs text-gray-400 font-bold uppercase">Rating</p>
                              <p className="text-sm font-black text-gray-900">4.9/5.0</p>
                           </div>
                        </div>
                     </div>

                  </div>
              </div>
            </div>
            
            {/* Stats Mobile Only */}
            <div className="mt-12 lg:hidden">
                <HomeStats />
            </div>
          </div>
        </section>

        {/* Brand New Visual Category Navigator */}
        <section className="py-16 bg-white relative animate-slide-in-up">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                   <div>
                      <h2 className="text-3xl font-black text-gray-900 mb-2">Discovery Center</h2>
                      <p className="text-gray-500 font-medium">Browse through our curated departments</p>
                   </div>
                   <Link to="/marketplace">
                      <Button variant="ghost" className="font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                        View All Categories <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                   </Link>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {categories.map((cat) => (
                        <Link 
                            to={`/marketplace?category=${encodeURIComponent(cat.name)}`}
                            key={cat.name} 
                            className="group flex flex-col items-center p-4 rounded-3xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                {getCategoryIcon(cat.icon)}
                            </div>
                            <span className="text-xs font-bold text-gray-600 group-hover:text-primary text-center leading-tight">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>

        {/* Product Showcase */}
        <section className="py-24 animate-fade-in bg-white">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-[2px] w-12 bg-emerald-500 rounded-full" />
                            <span className="text-sm font-bold text-emerald-600 uppercase tracking-[0.2em]">Our Selection</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Featured Collections</h2>
                    </div>
                    <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-emerald-600 transition-all group px-6 py-3 bg-gray-50 rounded-2xl">
                        View Premium Marketplace
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </section>

        {/* More Products for You Section */}
        {latestProducts.length > 0 && (
          <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 mb-2">More Products for You</h2>
                  <p className="text-gray-500 font-medium">Discover the latest arrivals from our verified shop owners</p>
                </div>
                <Link to="/marketplace">
                  <Button variant="outline" className="rounded-2xl border-2 font-bold hover:bg-gray-50">
                    See All Products
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {latestProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Why Choose Us - Modern Gradient Cards */}
        <section className="py-24 bg-gray-900 overflow-hidden relative animate-slide-in-up">
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
                        <p className="text-xl text-emerald-50/80 mb-12 font-medium">Join {businessCount.toLocaleString()}+ businesses already growing with SellHub. Start selling in less than 2 minutes.</p>
                        
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

const ProductCard = ({ product }: { product: Product }) => {
  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) return product.images[0];
    return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=90";
  };

  const getRating = (product: Product) => {
    return product.profiles?.rating || 4.5;
  };

  return (
    <div className="group relative">
        <Card className="border-none bg-white rounded-[40px] p-4 shadow-elevated hover:shadow-floating transition-smooth duration-500 overflow-hidden group-hover:-translate-y-2 hover-lift">
            <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden mb-6">
                <img 
                    src={getProductImage(product)} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/600x800/f3f4f6/1f2937?text=Product+Image";
                    }}
                />
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Badge className="bg-white/90 backdrop-blur-md text-gray-900 font-black text-[10px] uppercase border-none h-8 px-4 rounded-xl">Verified</Badge>
                    <Button size="icon" className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md text-gray-400 hover:text-red-500 border-none">
                        <Heart className="w-5 h-5" />
                    </Button>
                </div>
                <div className="absolute bottom-4 left-4">
                    <div className="bg-primary px-4 py-2 rounded-2xl text-white font-black shadow-lg shadow-primary/20">
                        <PriceDisplay kesAmount={product.price} originalAmount={product.original_price} size="sm" className="text-white" />
                    </div>
                </div>
            </div>
            
            <CardContent className="p-2">
                <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] h-5 border-emerald-100 bg-emerald-50/50 font-bold uppercase text-emerald-700">{product.category}</Badge>
                    <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-gray-900">{getRating(product).toFixed(1)}</span>
                    </div>
                </div>
                <h3 className="font-black text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-100 overflow-hidden flex items-center justify-center shadow-inner">
                            {product.profiles?.avatar_url ? (
                                <img 
                                    src={product.profiles.avatar_url} 
                                    alt="avatar" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.profiles?.full_name || 'U')}&background=f3f4f6&color=94a3b8&size=100`;
                                    }}
                                />
                            ) : (
                                <Users className="w-5 h-5 text-gray-300" />
                            )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-900 truncate max-w-[80px] leading-tight">{product.profiles?.full_name || "Seller"}</span>
                          <span className="text-[8px] font-bold text-emerald-600">Verified Seller</span>
                        </div>
                    </div>
                    <Link to={`/marketplace?product=${product.id}`}>
                        <Button size="sm" className="bg-gray-100/80 hover:bg-primary hover:text-white text-gray-700 h-9 px-4 rounded-xl font-black transition-all border-none">
                            Details
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  );
};

export default Index;
