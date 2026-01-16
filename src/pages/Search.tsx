import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X, MapPin, Star, Heart, Shield, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
  condition: string;
  location: string;
  images: string[];
  featured: boolean;
  verified: boolean;
  is_negotiable: boolean;
  created_at: string;
  profiles?: {
    full_name: string | null;
    rating: number | null;
    total_ratings: number | null;
  } | null;
}

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 100000000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const conditions = ["new", "like-new", "excellent", "good", "fair"];

  // Price ranges for better UX with high-value items
  const priceRanges = [
    { label: "Under KES 10K", min: 0, max: 10000 },
    { label: "KES 10K - 50K", min: 10000, max: 50000 },
    { label: "KES 50K - 100K", min: 50000, max: 100000 },
    { label: "KES 100K - 500K", min: 100000, max: 500000 },
    { label: "KES 500K - 1M", min: 500000, max: 1000000 },
    { label: "KES 1M - 5M", min: 1000000, max: 5000000 },
    { label: "KES 5M - 10M", min: 5000000, max: 10000000 },
    { label: "KES 10M - 50M", min: 10000000, max: 50000000 },
    { label: "Over KES 50M", min: 50000000, max: 100000000 }
  ];

  // Load real products and categories from database
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadUserFavorites();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      
      // Load products without problematic joins
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          original_price,
          category,
          condition,
          location,
          images,
          featured,
          verified,
          is_negotiable,
          created_at,
          user_id
        `)
        .in('status', ['active', 'approved']) 
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (productsData && productsData.length > 0) {
        // Load profiles separately
        const userIds = productsData.map(p => p.user_id).filter(Boolean);
        const uniqueUserIds = [...new Set(userIds)] as string[];

        let profilesMap: { [key: string]: any } = {};

        if (uniqueUserIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, rating, total_ratings')
            .in('id', uniqueUserIds);

          if (!profilesError && profilesData) {
            profilesData.forEach(profile => {
              profilesMap[profile.id] = profile;
            });
          }
        }

        // Combine products with profiles
        const productsWithProfiles = productsData.map(product => ({
          ...product,
          profiles: product.user_id ? profilesMap[product.user_id] : null
        }));

        setProducts(productsWithProfiles);
        setFilteredProducts(productsWithProfiles);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
      
    } catch (error: any) {
      console.error('Error loading products:', error);
      toast({
        variant: "destructive",
        title: "Error loading products",
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data: categoriesData, error } = await supabase
        .from('products')
        .select('category')
        .eq('status', 'active')
        .not('category', 'is', null);

      if (error) throw error;

      const uniqueCategories = [...new Set(categoriesData?.map(p => p.category).filter(Boolean))] as string[];
      setCategories(uniqueCategories.sort());
      
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  const loadUserFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favoritesData, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading favorites:', error);
        return;
      }

      const favoriteIds = new Set(favoritesData?.map(fav => fav.product_id) || []);
      setFavorites(favoriteIds);
      
    } catch (error: any) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Sign in required",
          description: "Please sign in to add favorites"
        });
        return;
      }

      if (favorites.has(productId)) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('product_id', productId)
          .eq('user_id', user.id);

        if (error) throw error;

        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        
        toast({ title: "Removed from favorites" });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            product_id: productId,
            user_id: user.id
          });

        if (error) throw error;

        setFavorites(prev => new Set(prev).add(productId));
        toast({ title: "Added to favorites" });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: "destructive",
        title: "Error updating favorites",
        description: error.message
      });
    }
  };

  // Apply filters in real-time
  useEffect(() => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price filter
    filtered = filtered.filter(product =>
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        product.category && selectedCategories.includes(product.category)
      );
    }

    // Condition filter
    if (selectedConditions.length > 0) {
      filtered = filtered.filter(product =>
        selectedConditions.includes(product.condition)
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, priceRange, selectedCategories, selectedConditions, products]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]
    );
  };

  const selectPriceRange = (min: number, max: number) => {
    setPriceRange([min, max]);
  };

  const formatPrice = (price: number) => {
    if (price >= 100000000) {
      return `KES ${(price / 100000000).toFixed(1)}B`;
    } else if (price >= 1000000) {
      return `KES ${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `KES ${(price / 1000).toFixed(0)}K`;
    }
    return `KES ${price}`;
  };

  const formatCondition = (condition: string) => {
    return condition.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getSellerRating = (profile: any) => {
    if (!profile?.rating) return null;
    return {
      rating: profile.rating,
      totalRatings: profile.total_ratings || 0
    };
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedConditions([]);
    setPriceRange([0, 100000000]);
    setSearchQuery("");
  };

  const activeFilterCount = selectedCategories.length + selectedConditions.length + (priceRange[0] > 0 || priceRange[1] < 100000000 ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Discover Amazing Deals
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find exactly what you're looking for with our advanced search and filters
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search products, categories, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <SlidersHorizontal className="mr-2 h-5 w-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <Card className="lg:col-span-1 h-fit sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">Filters</h3>
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                </div>

                <div className="space-y-8">
                  {/* Price Range */}
                  <div>
                    <h4 className="font-medium mb-4 flex items-center justify-between">
                      <span>Price Range</span>
                      <Badge variant="secondary" className="text-xs">
                        {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                      </Badge>
                    </h4>
                    
                    {/* Quick Price Range Selectors */}
                    <div className="space-y-2 mb-4">
                      {priceRanges.map((range, index) => (
                        <Button
                          key={index}
                          variant={priceRange[0] === range.min && priceRange[1] === range.max ? "default" : "outline"}
                          size="sm"
                          className="w-full justify-start text-xs h-8"
                          onClick={() => selectPriceRange(range.min, range.max)}
                        >
                          {range.label}
                        </Button>
                      ))}
                    </div>

                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={100000000}
                      step={100000}
                      className="mb-3"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatPrice(0)}</span>
                      <span>{formatPrice(100000000)}+</span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <h4 className="font-medium mb-3">Categories</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {categories.map(category => (
                        <div key={category} className="flex items-center space-x-3">
                          <Checkbox
                            id={`cat-${category}`}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => toggleCategory(category)}
                          />
                          <Label 
                            htmlFor={`cat-${category}`} 
                            className="cursor-pointer flex-1 flex justify-between items-center"
                          >
                            <span className="capitalize">{category}</span>
                            <Badge variant="outline" className="text-xs">
                              {products.filter(p => p.category === category).length}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Condition */}
                  <div>
                    <h4 className="font-medium mb-3">Condition</h4>
                    <div className="space-y-3">
                      {conditions.map(condition => (
                        <div key={condition} className="flex items-center space-x-3">
                          <Checkbox
                            id={`cond-${condition}`}
                            checked={selectedConditions.includes(condition)}
                            onCheckedChange={() => toggleCondition(condition)}
                          />
                          <Label 
                            htmlFor={`cond-${condition}`}
                            className="cursor-pointer flex-1 flex justify-between items-center"
                          >
                            <span>{formatCondition(condition)}</span>
                            <Badge variant="outline" className="text-xs">
                              {products.filter(p => p.condition === condition).length}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Grid */}
          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            {/* Active Filters */}
            <div className="mb-6 flex flex-wrap gap-2">
              {selectedCategories.map(category => (
                <Badge key={category} variant="secondary" className="gap-2 py-1.5">
                  {category}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:scale-110 transition-transform" 
                    onClick={() => toggleCategory(category)} 
                  />
                </Badge>
              ))}
              {selectedConditions.map(condition => (
                <Badge key={condition} variant="secondary" className="gap-2 py-1.5">
                  {formatCondition(condition)}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:scale-110 transition-transform" 
                    onClick={() => toggleCondition(condition)} 
                  />
                </Badge>
              ))}
              {(priceRange[0] > 0 || priceRange[1] < 100000000) && (
                <Badge variant="secondary" className="gap-2 py-1.5">
                  Price: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:scale-110 transition-transform" 
                    onClick={() => setPriceRange([0, 100000000])} 
                  />
                </Badge>
              )}
            </div>

            {/* Results Summary */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-muted-foreground">
                Showing {filteredProducts.length} of {products.length} products
              </p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  Results for &quot;<span className="font-medium text-foreground">{searchQuery}</span>&quot;
                </p>
              )}
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <Skeleton className="w-full h-48" />
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedCategories.length > 0 || selectedConditions.length > 0 || priceRange[0] > 0 || priceRange[1] < 100000000
                    ? "Try adjusting your search criteria or filters"
                    : "No products available at the moment"
                  }
                </p>
                {(searchQuery || selectedCategories.length > 0 || selectedConditions.length > 0 || priceRange[0] > 0 || priceRange[1] < 100000000) && (
                  <Button onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => {
                  const sellerRating = getSellerRating(product.profiles);
                  const isFavorite = favorites.has(product.id);
                  
                  return (
                    <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border-0 shadow-md">
                      <div className="relative">
                        {product.images?.[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-1">
                          {product.featured && (
                            <Badge className="bg-yellow-500 hover:bg-yellow-600">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Featured
                            </Badge>
                          )}
                          {product.verified && (
                            <Badge variant="secondary" className="bg-green-500 hover:bg-green-600">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        {product.is_negotiable && (
                          <Badge variant="secondary" className="absolute top-3 right-3 bg-blue-500">
                            Negotiable
                          </Badge>
                        )}
                        <Button
                          size="icon"
                          variant="secondary"
                          className={`absolute top-12 right-3 backdrop-blur-sm transition-all duration-200 ${
                            isFavorite 
                              ? 'bg-red-50 hover:bg-red-100 border-red-200' 
                              : 'bg-background/80 hover:bg-background'
                          }`}
                          onClick={(e) => toggleFavorite(product.id, e)}
                        >
                          <Heart 
                            className={`h-4 w-4 transition-all duration-200 ${
                              isFavorite 
                                ? "fill-red-500 text-red-500 scale-110" 
                                : "text-gray-600 hover:text-red-500"
                            }`} 
                          />
                        </Button>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg leading-tight line-clamp-2 flex-1 mr-2">
                            {product.name}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <p className="text-2xl font-bold text-primary">
                            {formatPrice(product.price)}
                          </p>
                          {product.original_price && product.original_price > product.price && (
                            <p className="text-sm text-muted-foreground line-through">
                              {formatPrice(product.original_price)}
                            </p>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="capitalize">
                            {product.category}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {formatCondition(product.condition)}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{product.location}</span>
                          </div>
                          
                          {sellerRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{sellerRating.rating.toFixed(1)}</span>
                              <span className="text-muted-foreground">({sellerRating.totalRatings})</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-4 pt-0">
                        <Button className="w-full" size="sm">
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}