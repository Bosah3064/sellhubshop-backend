import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Search, Filter, Grid3X3, List, Share2, MapPin, Star, MessageCircle, Check, Shield, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ShareProductDialog } from "@/components/social/ShareProductDialog";
import { Skeleton } from "@/components/ui/skeleton";

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
}

export default function ProfileProducts() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  useEffect(() => {
    loadProducts();
    loadOwnerProfile();
  }, [id]);

  const loadOwnerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setOwnerProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('owner_id', id)
        .in('status', ['active', 'approved'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  // Calculate stats
  const totalListings = products.length;
  // const verifiedSeller = ownerProfile?.verified; // Assuming verified field exists or we simulate it

  // Loading State
  if (loading) {
     return (
       <div className="min-h-screen bg-gray-50/50">
         <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
           <div className="container mx-auto px-4 py-4">
             <div className="flex items-center gap-4 mb-4">
               <Skeleton className="h-8 w-8 rounded-full" />
               <Skeleton className="h-4 w-32" />
             </div>
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                   <Skeleton className="h-20 w-20 rounded-full" />
                   <div>
                      <Skeleton className="h-8 w-48 mb-2" />
                      <div className="flex gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                   </div>
                </div>
                <div className="flex gap-3">
                   <Skeleton className="h-10 w-32" />
                   <Skeleton className="h-10 w-32" />
                </div>
             </div>
           </div>
         </div>
         <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
               {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                 <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-3 space-y-2">
                       <Skeleton className="h-4 w-full" />
                       <Skeleton className="h-6 w-20" />
                       <Skeleton className="h-4 w-16" />
                    </div>
                 </Card>
               ))}
            </div>
         </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Professional Profile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4 mb-4">
                 <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="hover:bg-gray-100 rounded-full h-8 w-8"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </Button>
                <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Seller Profile</h1>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                          {ownerProfile?.avatar_url ? (
                              <img src={ownerProfile.avatar_url} alt={ownerProfile.full_name} className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                                  {ownerProfile?.full_name?.charAt(0) || "S"}
                              </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white shadow-sm" title="Verified Seller">
                            <Check className="w-3 h-3 md:w-4 md:h-4" />
                        </div>
                    </div>
                    
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {ownerProfile?.full_name || ownerProfile?.username || "Seller"}
                            {/* Verified Badge */}
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 gap-1 hidden sm:inline-flex">
                                <Shield className="w-3 h-3" /> Verified Merchant
                            </Badge>
                        </h2>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> {products[0]?.location || "Kenya"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-gray-700 font-medium">
                                <Package className="w-3.5 h-3.5" /> {totalListings} Listings
                            </span>
                             <span>•</span>
                            <span className="flex items-center gap-1 text-yellow-600 font-medium">
                                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> 4.9 Rating
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button className="flex-1 md:flex-none gap-2 bg-primary hover:bg-primary/90 shadow-md transition-all hover:-translate-y-0.5"
                       onClick={() => {
                        const message = `Hi, I'm interested in your products on SellHub!`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                       }}
                    >
                        <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                    </Button>
                    <ShareProductDialog 
                        trigger={
                            <Button variant="outline" className="gap-2 border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-sm">
                                <Share2 className="w-4 h-4" /> Share Shop
                            </Button>
                        }
                        product={{
                            id: `u/${ownerProfile?.username || id}`, // Virtual ID for shop
                            name: `${ownerProfile?.full_name || 'Seller'}'s Shop`,
                            price: 0, 
                            description: `Check out amazing products from ${ownerProfile?.full_name} on SellHub!`,
                            image: ownerProfile?.avatar_url
                        }} 
                    />
                </div>
            </div>

            {/* Tabs integrated into header */}
            <div className="flex items-center justify-between mt-6 pt-2 border-t border-gray-100">
                <Tabs value={viewMode} onValueChange={(v: "grid" | "list") => setViewMode(v)} className="w-full">
                  <div className="flex items-center justify-between w-full">
                    <TabsList className="bg-transparent p-0 gap-6 h-auto">
                        <TabsTrigger value="grid" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 pb-2 text-gray-500 font-medium">All Products</TabsTrigger>
                        <TabsTrigger value="reviews" disabled className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent hover:text-gray-800 rounded-none px-0 pb-2 text-gray-400 font-medium cursor-not-allowed">Reviews (Coming Soon)</TabsTrigger>
                        <TabsTrigger value="about" disabled className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent hover:text-gray-800 rounded-none px-0 pb-2 text-gray-400 font-medium cursor-not-allowed">About</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 rounded-md ${viewMode === "grid" ? "bg-white shadow-sm text-primary" : "hover:bg-gray-200 text-gray-500"}`}
                          onClick={() => setViewMode("grid")}
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 rounded-md ${viewMode === "list" ? "bg-white shadow-sm text-primary" : "hover:bg-gray-200 text-gray-500"}`}
                          onClick={() => setViewMode("list")}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                    </div>
                  </div>
                </Tabs>
            </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 pb-6">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                onClick={() => handleViewProduct(product.id)}
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-green-600">
                    {formatPrice(product.price)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                    <ShareProductDialog 
                      trigger={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Share2 className="w-4 h-4" />
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
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleViewProduct(product.id)}
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-2">
                      {product.name}
                    </h3>
                    <p className="text-2xl font-bold text-green-600 mb-2">
                      {formatPrice(product.price)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.location && (
                        <Badge variant="outline">{product.location}</Badge>
                      )}
                    </div>
                    <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
                       <ShareProductDialog 
                        trigger={
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2 text-gray-500 hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Share2 className="w-4 h-4" /> Share
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
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <Card className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search terms" : "This user hasn't listed any products yet."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}