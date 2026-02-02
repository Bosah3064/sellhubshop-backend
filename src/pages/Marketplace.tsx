import SEO from "@/components/SEO";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart,
  Search,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Shield,
  Star,
  Package,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  ThumbsUp,
  MessageSquare,
  Send,
  Filter,
  X,
  Sparkles,
  Zap,
  Eye,
  TrendingUp,
  Flag,
  ShieldAlert,
  Copy,
  Lock,
  Clock,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  EyeOff,
  Key,
  AlertTriangle,
  Info,
  Bell,
  Volume2,
  VolumeX,
  History,
  BarChart,
  Settings,
  RefreshCw,
  RotateCcw,
  ExternalLink,
  Battery,
  BatteryCharging,
  Wifi,
  WifiOff,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Users,
  Smartphone,
  ShoppingCart,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackProductView } from "@/utils/trackProductView";
import kenyanLocations from "@/data/kenyan-locations.json";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CompactPriceDisplay } from "@/components/PriceDisplay";
import { ContactSellerDialog } from "@/components/dialogs/ContactSellerDialog";

const categories = [
  "All",
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Books",
  "Sports",
  "Beauty",
  "Vehicles",
  "Toys",
  "Jewelry",
  "Health",
  "Food",
  "Pets",
  "Office",
  "Art & Crafts",
  "Music",
  "Baby & Kids",
  "Travel",
  "Industrial",
  "Collectibles",
];

interface Favorite {
  id: string;
  product_id: string;
  user_id: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  helpful_count: number;
  created_at: string;
  reviewer_profile_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
  is_helpful?: boolean;
}

interface Message {
  id: string;
  content: string;
  message_text: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  product_id: string;
  product_name?: string;
  product_price?: number;
  product_image?: string;
  product_category?: string;
  product_condition?: string;
  product_location?: string;
  message_type?: string;
  is_system_message?: boolean;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category_id: string | null;
  category: string | null;
  subcategory_id: string | null;
  subcategory: string | null;
  brand: string | null;
  condition: string;
  county: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  properties: any;
  status: string;
  views: number;
  featured: boolean;
  plan_type: string;
  is_negotiable: boolean;
  is_urgent: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  verified: boolean;
  verified_at: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  featured_at: string | null;
  user_id: string;
  owner_id: string;
  profiles?: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    whatsapp: string | null;
    location: string | null;
    avatar_url: string | null;
    rating: number | null;
    total_ratings: number | null;
    created_at: string;
    updated_at?: string | null;
  } | null;
}

interface ContactSession {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  contact_type: "phone" | "whatsapp" | "email";
  revealed_contact: string;
  expires_at: string;
  created_at: string;
}

import { FilterSidebar } from "@/components/marketplace/FilterSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";

export default function Marketplace() {
  console.log("🔍 Marketplace component rendering...");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Dynamic SEO Data
  const getSEOData = () => {
    if (selectedCategory === "All") {
      return {
        title: "Browse All Products | SellHub Marketplace",
        description: "Explore the best deals in Kenya. Electronics, Fashion, Vehicles, Property and more. Verified sellers, secure payments.",
        keywords: "marketplace kenya, buy online, sell online, shopping deals, classifieds kenya"
      };
    }
    return {
      title: `Buy & Sell ${selectedCategory} in Kenya | SellHub`,
      description: `Find the best deals on ${selectedCategory} in Kenya. Shop from verified sellers on SellHub's premium marketplace.`,
      keywords: `${selectedCategory.toLowerCase()} kenya, buy ${selectedCategory.toLowerCase()}, sell ${selectedCategory.toLowerCase()}, ${selectedCategory.toLowerCase()} prices kenya, best ${selectedCategory.toLowerCase()} deals`
    };
  };

  const seoData = getSEOData();

  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const { addToCart } = useCart();

  // New Filter State
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [countyFilter, setCountyFilter] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userFavorites, setUserFavorites] = useState<Favorite[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeContactSession, setActiveContactSession] =
    useState<ContactSession | null>(null);
  const [isRevealingNumber, setIsRevealingNumber] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [counties, setCounties] = useState<{ id: string, name: string }[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);  

  // Simple contact tracking
  const [contactHistory, setContactHistory] = useState<ContactSession[]>([]);
  const [showContactHistory, setShowContactHistory] = useState(false);

  // Network status
  const [networkSecurity, setNetworkSecurity] = useState<
    "secure" | "warning" | "danger"
  >("secure");
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);

  // Product Detail Modal State
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
  
  // Helper to check online status (active within 10 minutes)
  const isUserOnline = (updatedAt: string | null) => {
    if (!updatedAt) return false;
    const diffInMinutes = (new Date().getTime() - new Date(updatedAt).getTime()) / 60000;
    return diffInMinutes < 10;
  };

  const getLastSeenText = (updatedAt: string | null) => {
    if (!updatedAt) return "Offline";
    const diffInMinutes = Math.floor((new Date().getTime() - new Date(updatedAt).getTime()) / 60000);
    
    if (diffInMinutes < 1) return "Online now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };
  /* Logic exists below */
  // Smart Search logic
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const addRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const newSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newSearches);
    localStorage.setItem("recentSearches", JSON.stringify(newSearches));
  };
  
  const handleSearch = (term: string) => {
    setSearchQuery(term);
    addRecentSearch(term);
    setShowRecentSearches(false);
  };

  // Smart Search State
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const trendingSearches = ["iPhone 15", "Toyota Hilux", "Gaming Laptop", "Sneakers", "Apartments"];

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const securityCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Sync with URL params
  useEffect(() => {
    const category = searchParams.get("category");
    const search = searchParams.get("search"); // Footer uses ?search=...
    const q = searchParams.get("q"); // Common alternative

    if (category) {
      setSelectedCategory(category);
    }

    if (search || q) {
      setSearchQuery(search || q || "");
    }
  }, [searchParams]);

  // Initialize
  useEffect(() => {
    document.title = "Marketplace - Browse Products | SellHub";
    initializeBasicSecurity();
    loadCurrentUserProfile();
    fetchCounties();
    // loadProducts(); -> Moved to filter effect
    loadUserFavorites();

    // Initial sync from URL (redundant due to above useEffect, but ensures clean start if needed)
    const category = searchParams.get("category");
    const search = searchParams.get("search") || searchParams.get("q");
    if (category) setSelectedCategory(category);
    if (search) setSearchQuery(search);

    loadRecentlyViewed();
    return () => {
      if (securityCheckInterval.current)
        clearInterval(securityCheckInterval.current);
    };
  }, []);

  const initializeBasicSecurity = () => {
    // Start basic network checks
    securityCheckInterval.current = setInterval(() => {
      checkNetworkSecurity();
    }, 30000);

    // Initial check
    checkNetworkSecurity();
  };

  const checkNetworkSecurity = () => {
    if (!navigator.onLine) {
      setIsOfflineMode(true);
      setNetworkSecurity("danger");
      setShowNetworkWarning(true);
      return;
    }

    setIsOfflineMode(false);

    // Check for insecure connections
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      setNetworkSecurity("danger");
      setShowNetworkWarning(true);
      return;
    }

    // Check network type
    const connection = (navigator as any).connection;
    if (connection) {
      if (
        connection.effectiveType === "slow-2g" ||
        connection.effectiveType === "2g"
      ) {
        setNetworkSecurity("warning");
        setShowNetworkWarning(true);
      } else {
        setNetworkSecurity("secure");
        setShowNetworkWarning(false);
      }
    }
  };

  const loadCurrentUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCurrentUserProfile(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setCurrentUserProfile(profile);
      loadContactHistory(user.id);
    } catch (error: any) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadContactHistory = async (userId: string) => {
    try {
      const { data: history, error } = await (supabase
        .from("contact_sessions") as any)
        .select("*")
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setContactHistory(history || []);
    } catch (error) {
      console.error("Error loading contact history:", error);
    }
  };

  const fetchCounties = async () => {
    // We now use local JSON data for consistency with product upload
    const countiesData = (kenyanLocations as any).counties.map((c: any) => ({
      id: c.id,
      name: c.name
    }));
    setCounties(countiesData);
  };
  
  const getNeighborhoodsForCounty = (countyIdOrName: string) => {
    const county = (kenyanLocations as any).counties.find(
      (c: any) => c.id === countyIdOrName || c.name === countyIdOrName
    );
    return county?.locations || [];
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from("products")
        .select(
          `
        *,
        phone,
        whatsapp,
        email,
        profiles:user_id(
          id,
          full_name,
          avatar_url,
          rating,
          total_ratings,
          created_at,
          phone,
          whatsapp,
          username,
          updated_at
        )
        )
      `
        )

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%,county.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      // Apply Filters
      if (selectedCategory && selectedCategory !== "All") {
        query = query.ilike("category", selectedCategory);
      }

      // Price Range - Ensure we handle 0 correctly
      if (priceRange[0] > 0) {
        query = query.gte("price", priceRange[0]);
      }
      if (priceRange[1] < 1000000) {
        query = query.lte("price", priceRange[1]);
      }

      // Location filters
      if (countyFilter) {
        query = query.ilike("county", `%${countyFilter}%`);
      }
      
      if (neighborhoodFilter) {
        query = query.ilike("location", `%${neighborhoodFilter}%`);
      }

      // Conditions
      if (conditionFilter.length > 0) {
        query = query.in("condition", conditionFilter);
      }

      // Verified
      if (verifiedOnly) {
        query = query.eq("verified", true);
      }

      // Apply Smart Sorting
      switch (sortBy) {
        case "lowest-price":
          query = query.order("price", { ascending: true });
          break;
        case "highest-price":
          query = query.order("price", { ascending: false });
          break;
        case "trending":
          query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      query = query
        .in("status", ["active", "approved"])
        .limit(100);

      const { data: productsData, error } = await query;

      if (error) throw error;

      if (productsData && productsData.length > 0) {
        // We handle verified prioritization via Sort usually, but existing logic does it via JS sort
        // Let's keep existing prioritization OR improve it. 
        // Existing logic:
        const verifiedProducts = productsData.filter((p) => p.verified);
        const nonVerifiedProducts = productsData.filter((p) => !p.verified);
        const prioritizedProducts = [
          ...verifiedProducts,
          ...nonVerifiedProducts,
        ];

        // No need to re-filter by category/search here since DB did it (mostly)
        // But the previous implementation filtered by category in JS 'filteredProducts' instead of DB. 
        // We are moving filtering to DB for performance.
        setProducts(prioritizedProducts);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error("Error loading products:", error);
      handleDatabaseError(error, "loading products");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce effect for filters
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, priceRange, countyFilter, neighborhoodFilter, conditionFilter, verifiedOnly]);

  // Effect for Search Suggestions
  useEffect(() => {
    if (searchQuery.length > 1) {
      const suggestions = categories
        .filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()) && c !== "All")
        .slice(0, 5);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery]);


  const loadUserFavorites = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favoritesData, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      const favoriteIds = new Set(
        favoritesData?.map((fav) => fav.product_id) || []
      );
      setFavorites(favoriteIds);
      setUserFavorites(favoritesData || []);
    } catch (error: any) {
      console.error("Error loading favorites:", error);
    }
  };

  const checkActiveContactSession = async (
    productId: string,
    contactType: "phone" | "whatsapp"
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: session, error } = await (supabase
        .from("contact_sessions") as any)
        .select("*")
        .eq("product_id", productId)
        .eq("buyer_id", user.id)
        .eq("contact_type", contactType)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error) throw error;

      return session;
    } catch (error) {
      console.error("Error checking contact session:", error);
      return null;
    }
  };

  const revealContactNumber = async (contactType: "phone" | "whatsapp") => {
    if (!selectedProduct) return;

    try {
      setIsRevealingNumber(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: "destructive",
          title: "Sign in required",
          description: "Please sign in to view contact details",
        });
        return;
      }

      // Check network security
      if (networkSecurity === "danger") {
        toast({
          variant: "destructive",
          title: "Insecure Network",
          description: "Please connect to a secure network to reveal contacts",
        });
        return;
      }

      // Check if session already exists
      const existingSession = await checkActiveContactSession(
        selectedProduct.id,
        contactType
      );

      if (existingSession) {
        setActiveContactSession(existingSession);
        toast({ title: "Contact already revealed" });
        return;
      }

      // Create contact session
      await createNewContactSession(user.id, contactType);
    } catch (error: any) {
      console.error("Error revealing contact:", error);
      handleDatabaseError(error, "revealing contact");
    } finally {
      setIsRevealingNumber(false);
    }
  };

  const createNewContactSession = async (
    userId: string,
    contactType: "phone" | "whatsapp"
  ) => {
    try {
      // Get contact info - FIRST check product, then profile
      let contactInfo =
        contactType === "phone"
          ? selectedProduct!.phone
          : selectedProduct!.whatsapp;

      // If product doesn't have it, check seller's profile
      if (!contactInfo && selectedProduct!.profiles) {
        contactInfo =
          contactType === "phone"
            ? selectedProduct!.profiles.phone
            : selectedProduct!.profiles.whatsapp;
      }

      if (!contactInfo) {
        toast({
          variant: "destructive",
          title: "Contact not available",
          description: "This seller has not provided contact information",
        });
        return;
      }

      // Create contact session
      const { data: session, error: createError } = await (supabase
        .from("contact_sessions") as any)
        .insert({
          product_id: selectedProduct!.id,
          buyer_id: userId,
          seller_id: selectedProduct!.user_id,
          contact_type: contactType,
          revealed_contact: contactInfo,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          is_verified: true,
          verification_method: "none",
        })
        .select()
        .single();

      if (createError) throw createError;

      setActiveContactSession(session);

      // Add to history
      setContactHistory((prev) => [session, ...prev.slice(0, 19)]);

      toast({
        title: "Contact revealed",
        description:
          contactType === "phone"
            ? "You can now call the seller"
            : "You can now chat on WhatsApp",
        duration: 3000,
      });
    } catch (error) {
      throw error;
    }
  };
  const formatMaskedNumber = (number: string) => {
    if (!number) return "Not available";

    const cleaned = number.replace(/\D/g, "");

    if (cleaned.length === 12 && cleaned.startsWith("254")) {
      const localNumber = "0" + cleaned.substring(3);
      return localNumber.substring(0, 4) + " XXX " + localNumber.substring(7);
    }

    if (cleaned.length === 10 && cleaned.startsWith("0")) {
      return cleaned.substring(0, 4) + " XXX " + cleaned.substring(7);
    }

    if (cleaned.length >= 6) {
      const firstPart = cleaned.substring(0, 4);
      const lastPart = cleaned.substring(cleaned.length - 3);
      return `${firstPart}****${lastPart}`;
    }

    return number;
  };

  const formatExpiryTime = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `Expires in ${diffHours}h ${diffMinutes}m`;
    }
    return `Expires in ${diffMinutes}m`;
  };

  /* filteredProducts logic removed - now handled by DB query */

  const loadRecentlyViewed = async () => {
    try {
      const recentlyViewedIdsStr = localStorage.getItem("recently_viewed") || "[]";
      const recentlyViewedIds = JSON.parse(recentlyViewedIdsStr);

      if (recentlyViewedIds.length === 0) {
        setRecentlyViewed([]);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          profiles:user_id(
            id,
            full_name,
            avatar_url,
            rating,
            total_ratings
          )
        `)
        .in("id", recentlyViewedIds)
        .in("status", ["active", "approved"]);

      if (error) throw error;

      // Sort according to the order in recentlyViewedIds
      const sortedData = recentlyViewedIds
        .map((id: string) => data?.find((p) => p.id === id))
        .filter(Boolean) as Product[];

      setRecentlyViewed(sortedData);
    } catch (error) {
      console.error("Error loading recently viewed products:", error);
    }
  };

  const toggleFavorite = async (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Sign in required",
          description: "Please sign in to add favorites",
        });
        return;
      }

      const existingFavorite = userFavorites.find(
        (fav) => fav.product_id === productId
      );

      if (existingFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("id", existingFavorite.id);

        if (error) throw error;

        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });

        setUserFavorites((prev) =>
          prev.filter((fav) => fav.product_id !== productId)
        );

        toast({ title: "Removed from favorites" });
      } else {
        const { data, error } = await supabase
          .from("favorites")
          .insert({
            product_id: productId,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        setFavorites((prev) => new Set(prev).add(productId));
        setUserFavorites((prev) => [...prev, data]);

        toast({ title: "Added to favorites" });
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      handleDatabaseError(error, "updating favorites");
    }
  };

  const submitReview = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !selectedProduct) {
        toast({
          variant: "destructive",
          title: "Sign in required",
          description: "Please sign in to submit a review",
        });
        return;
      }

      if (!newReview.comment.trim()) {
        toast({
          variant: "destructive",
          title: "Comment required",
          description: "Please write a review comment",
        });
        return;
      }

      setIsSubmittingReview(true);

      const { error } = await supabase.from("reviews").insert({
        reviewer_profile_id: user.id,
        product_id: selectedProduct.id,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
      });

      if (error) throw error;

      toast({ title: "Review submitted successfully" });
      setNewReview({ rating: 5, comment: "" });
      loadReviews(selectedProduct.id);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      handleDatabaseError(error, "submitting review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const markReviewHelpful = async (reviewId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Sign in required",
          description: "Please sign in to mark reviews as helpful",
        });
        return;
      }

      const { error } = await supabase.from("review_helpful").insert({
        review_id: reviewId,
        user_id: user.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already marked as helpful" });
          return;
        }
        throw error;
      }

      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
              ...review,
              helpful_count: review.helpful_count + 1,
              is_helpful: true,
            }
            : review
        )
      );

      toast({ title: "Marked as helpful" });
    } catch (error: any) {
      console.error("Error marking review helpful:", error);
      handleDatabaseError(error, "marking review helpful");
    }
  };

  const loadReviews = async (productId: string) => {
    try {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          profiles:reviewer_id (
            full_name,
            avatar_url
          )
        `
        )
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      let helpfulReviewIds = new Set<string>();

      if (user && reviewsData) {
        const { data: helpfulReviews, error: helpfulError } = await supabase
          .from("review_helpful")
          .select("review_id")
          .eq("user_id", user.id);

        if (!helpfulError && helpfulReviews) {
          helpfulReviewIds = new Set(helpfulReviews.map((hr) => hr.review_id));
        }
      }

      const reviewsWithHelpful =
        reviewsData?.map((review) => ({
          ...review,
          is_helpful: helpfulReviewIds.has(review.id),
        })) || [];

      setReviews(reviewsWithHelpful);
    } catch (error: any) {
      console.error("Error loading reviews:", error);
      handleDatabaseError(error, "loading reviews");
    }
  };

  const sendMessage = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !selectedProduct) return;

      if (!newMessage.trim()) {
        toast({
          variant: "destructive",
          title: "Message cannot be empty",
        });
        return;
      }

      setIsSubmittingMessage(true);

      const { data: conversation, error: convError } = await supabase.rpc(
        "get_or_create_conversation",
        {
          p_user1_id: user.id,
          p_user2_id: selectedProduct.user_id,
          p_product_id: selectedProduct.id,
        }
      );

      if (convError) {
        console.error("Error creating conversation:", convError);
        throw convError;
      }

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversation,
        message_text: newMessage.trim(),
        content: newMessage.trim(),
        sender_id: user.id,
        receiver_id: selectedProduct.user_id,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        product_price: selectedProduct.price,
        product_image: selectedProduct.images?.[0] || null,
        product_category: selectedProduct.category,
        product_condition: selectedProduct.condition,
        product_location: selectedProduct.location,
        message_type: "text",
        is_system_message: false,
      });

      if (error) throw error;

      setNewMessage("");
      loadMessages(selectedProduct.id);

      toast({ title: "Message sent successfully" });
    } catch (error: any) {
      console.error("Error sending message:", error);
      handleDatabaseError(error, "sending message");
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const loadMessages = async (productId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Sign in required",
          description: "Please sign in to view messages",
        });
        return;
      }

      const { data: messagesData, error } = await supabase
        .from("messages")
        .select(
          `
        *,
        profiles:sender_id(
          full_name,
          avatar_url
        )
      `
        )
        .eq("product_id", productId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        throw error;
      }

      setMessages(messagesData || []);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      handleDatabaseError(error, "loading messages");
    }
  };

  const submitReport = async () => {
    if (!selectedProduct || !reportReason.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a reason for reporting",
      });
      return;
    }

    try {
      setIsSubmittingReport(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          variant: "destructive",
          title: "Sign in required",
          description: "Please sign in to submit a report",
        });
        return;
      }

      // FIRST: Check if the user has a profile
      const { data: reporterProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profileError || !reporterProfile) {
        toast({
          variant: "destructive",
          title: "Profile Not Found",
          description: "Please complete your profile before submitting reports",
        });
        return;
      }

      // SECOND: Check if the seller has a profile
      const { data: reportedProfile, error: reportedProfileError } =
        await supabase
          .from("profiles")
          .select("id")
          .eq("id", selectedProduct.user_id)
          .single();

      if (reportedProfileError || !reportedProfile) {
        toast({
          variant: "destructive",
          title: "Seller Profile Not Found",
          description: "Cannot report seller with incomplete profile",
        });
        return;
      }

      // THIRD: Submit the report WITHOUT resolved_by
      const reportData: any = {
        reporter_id: user.id,
        reported_id: selectedProduct.user_id,
        reason: reportReason,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      // Add details if provided
      if (reportDetails.trim()) {
        reportData.details = reportDetails;
      }

      // Add product_id if you want to track which product
      reportData.product_id = selectedProduct.id;

      // IMPORTANT: Do NOT include resolved_by here - it should only be set when an admin resolves the report
      const { error } = await supabase.from("reports").insert(reportData);

      if (error) {
        console.error("Error submitting report:", error);

        // If error is about missing columns, try simplified version
        if (error.code === "42703" || error.message.includes("column")) {
          const fallbackData = {
            reporter_id: user.id,
            reported_id: selectedProduct.user_id,
            reason: `${reportReason}${reportDetails ? ` - ${reportDetails}` : ""
              }`,
            status: "pending",
            created_at: new Date().toISOString(),
          };

          const { error: fallbackError } = await supabase
            .from("reports")
            .insert(fallbackData);
          if (fallbackError) throw fallbackError;
        } else {
          throw error;
        }
      }

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe",
      });

      setShowReportModal(false);
      setReportReason("");
      setReportDetails("");
    } catch (error: any) {
      console.error("Error submitting report:", error);

      // Handle specific foreign key constraint error
      if (error.code === "23503") {
        if (error.message.includes("reports_resolved_by_fkey")) {
          toast({
            variant: "destructive",
            title: "System Configuration Error",
            description:
              "The reporting system is temporarily unavailable. Please try again later.",
          });
        } else if (error.message.includes("reports_reporter_id_fkey")) {
          toast({
            variant: "destructive",
            title: "Profile Error",
            description:
              "Your profile is not properly set up. Please update your profile and try again.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Data Error",
            description: "Could not submit report. Please contact support.",
          });
        }
      } else {
        handleDatabaseError(error, "submitting report");
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const blockSeller = async () => {
    if (!selectedProduct || !currentUserProfile) return;

    try {
      const { error } = await (supabase.from("blocked_users") as any).insert({
        blocker_id: currentUserProfile.id,
        blocked_id: selectedProduct.user_id,
        reason: "manual_block",
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Seller already blocked" });
          return;
        }
        throw error;
      }

      toast({
        title: "Seller blocked",
        description: "You won't see this seller's listings anymore",
      });

      loadProducts();
    } catch (error: any) {
      console.error("Error blocking seller:", error);
      handleDatabaseError(error, "blocking seller");
    }
  };

  const handleDatabaseError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);

    if (error.code === "42501") {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to perform this action",
      });
    } else if (error.code === "23503") {
      toast({
        variant: "destructive",
        title: "Reference Error",
        description: "Related data not found. Please try again.",
      });
    } else if (error.code === "23505") {
      toast({
        variant: "destructive",
        title: "Duplicate Entry",
        description: "This item already exists",
      });
    } else if (error.code === "23502") {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields",
      });
    } else {
      toast({
        variant: "destructive",
        title: `Error in ${context}`,
        description: error.message || "An unexpected error occurred",
      });
    }
  };

  /* Restored Helper Functions */




  const getSellerRating = (profile: any) => {
    if (!profile?.rating || !profile?.total_ratings) return null;
    return {
      rating: profile.rating,
      totalRatings: profile.total_ratings,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  const openContact = async (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProduct(product);
    setActiveContactSession(null);

    if (currentUserProfile) {
      await checkActiveContactSession(product.id, "phone");
    }

    setContactModalOpen(true);
  };

  /* Open Product Details Modal (Logic moved to restored functions section) */

  const openReviews = async (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProduct(product);
    setReviewsModalOpen(true);
    await loadReviews(product.id);
  };

  const openMessages = async (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in to send messages",
      });
      return;
    }
    setSelectedProduct(product);
    setMessagesModalOpen(true);
    await loadMessages(product.id);
  };



  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setActiveContactSession(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);



  /* Restored Helper Functions */

  // Product Detail Modal Functions (MISSING - was causing crash)
  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
    setIsSlideshowPlaying(false);
    setProductDetailModalOpen(true);
    trackProductView(product.id);
    loadSimilarProducts(product);
    // Reset scroll to top
    setTimeout(() => {
      modalContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleCloseProductModal = () => {
    setProductDetailModalOpen(false);
    setIsSlideshowPlaying(false);
    setCurrentImageIndex(0);
  };

  const prevImage = () => {
    if (!selectedProduct?.images) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? selectedProduct.images.length - 1 : prev - 1
    );
  };

  const nextImage = () => {
    if (!selectedProduct?.images) return;
    setCurrentImageIndex((prev) =>
      prev === selectedProduct.images.length - 1 ? 0 : prev + 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
    setIsSlideshowPlaying(false);
  };

  const toggleSlideshow = () => {
    setIsSlideshowPlaying((prev) => !prev);
  };

  const loadSimilarProducts = async (currentProduct: Product) => {
    try {
      // AI Logic: Match category AND try to match partial name words
      const words = currentProduct.name.split(" ").filter(w => w.length > 3).slice(0, 2);

      let query = supabase
        .from("products")
        .select(`
          *,
          profiles:user_id(
            id,
            full_name,
            avatar_url,
            rating,
            total_ratings
          )
        `)
        .neq("id", currentProduct.id)
        .in("status", ["active", "approved"]);

      // Construct a smart query
      if (words.length > 0) {
        const wordFilters = words.map(w => `name.ilike.%${w}%`).join(",");
        query = query.or(`category.eq."${currentProduct.category}",${wordFilters}`);
      } else {
        query = query.eq("category", currentProduct.category);
      }

      let { data, error } = await query
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;

      // Fallback: If no smart matches, just get anything from the same category
      if (!data || data.length === 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("products")
          .select(`
            *,
            profiles:user_id(
              id,
              full_name,
              avatar_url,
              rating,
              total_ratings
            )
          `)
          .neq("id", currentProduct.id)
          .eq("category", currentProduct.category)
          .in("status", ["active", "approved"])
          .order("created_at", { ascending: false })
          .limit(4);

        if (fallbackError) throw fallbackError;
        data = fallbackData;
      }

      setSimilarProducts(data || []);
    } catch (error) {
      console.error("Error loading AI similar products:", error);
    }
  };

  // Slideshow effect
  useEffect(() => {
    if (!isSlideshowPlaying || !selectedProduct?.images) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === selectedProduct.images.length - 1 ? 0 : prev + 1
      );
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [isSlideshowPlaying, selectedProduct]);














  /* Restored getSignalIcon */
  const getSignalIcon = () => {
    if (isOfflineMode) return <WifiOff className="h-4 w-4" />;
    if (networkSecurity === "danger")
      return <SignalLow className="h-4 w-4 text-red-500" />;
    if (networkSecurity === "warning")
      return <SignalMedium className="h-4 w-4 text-amber-500" />;
    return <SignalHigh className="h-4 w-4 text-green-500" />;
  };

  if (isLoading) {
    return (
      <main className="container mx-auto py-4 sm:py-8 px-3 sm:px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm sm:text-base">Loading marketplace...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <SEO
        title="Marketplace - Browse Thousands of Products in Kenya"
        description="Explore Kenya's largest online marketplace. Buy electronics, fashion, vehicles, and more with secure direct contact."
        keywords="Kenya marketplace, buy online Kenya, electronics Kenya, fashion Kenya"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Secure Marketplace",
          description: "Safe online marketplace for buying and selling",
        }}
      />

      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
      />
      <div className="min-h-screen bg-slate-50 relative pb-20">
        {/* Simplified Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <span className="text-sm font-medium">Secure Marketplace</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Network Status */}
                <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-md">
                  {getSignalIcon()}
                  <span className="text-xs">
                    {networkSecurity === "secure" ? "Secure" : "Check Network"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-6 px-4">
          {/* Simplified Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
              Marketplace
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover amazing products from trusted sellers across Kenya
            </p>
          </div>

          {/* Search and Filter Section - REDESIGNED */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-8 mb-12 sticky top-4 z-40">
            <div className="flex flex-col gap-6">
              {/* Main Search Row */}
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/60 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="What are you looking for today?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchActive(true)}
                      onBlur={() => setTimeout(() => setIsSearchActive(false), 200)}
                      className="pl-12 pr-4 py-6 text-lg border-2 border-gray-100/80 bg-gray-50/50 rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/30 shadow-inner group-focus-within:border-primary/50 transition-all"
                    />
                  </div>
     {/* Smart Search Suggestions */}
     {isSearchActive && (
       <div className="absolute top-full left-0 right-0 mt-4 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
         
         {/* Recent Searches */}
         {recentSearches.length > 0 && !searchQuery && (
            <div className="p-4 border-b border-gray-100/50">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Recent Searches</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[10px] text-gray-400 hover:text-red-500"
                  onClick={(e) => {
                    e.preventDefault();
                    localStorage.removeItem("recentSearches");
                    setRecentSearches([]);
                  }}
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((term, i) => (
                   <button
                      key={i}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-colors"
                      onClick={() => handleSearch(term)}
                   >
                      <div className="flex items-center gap-3">
                         <History className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                         <span className="text-sm font-medium text-gray-700">{term}</span>
                      </div>
                      <X
                        className="h-4 w-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newSearches = recentSearches.filter(s => s !== term);
                          setRecentSearches(newSearches);
                          localStorage.setItem("recentSearches", JSON.stringify(newSearches));
                        }}
                      />
                   </button>
                ))}
              </div>
            </div>
         )}

                        {searchQuery.length > 0 && searchSuggestions.length > 0 && (
                          <div className="p-4 border-b border-gray-100/50">
                            <p className="text-[10px] font-black text-gray-400 px-3 py-2 uppercase tracking-[0.2em]">Suggested Categories</p>
                            {searchSuggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                className="w-full text-left px-4 py-3 hover:bg-primary/5 rounded-xl flex items-center gap-4 transition-all group"
                                onClick={() => {
                                  setSelectedCategory(suggestion);
                                  setSearchQuery("");
                                  setIsSearchActive(false);
                                }}
                              >
                                <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-bold text-gray-700">{suggestion}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="p-4">
                          <p className="text-[10px] font-black text-gray-400 px-3 py-2 uppercase tracking-[0.2em]">Trending Now</p>
                          <div className="flex flex-wrap gap-2 p-2">
                            {trendingSearches.map((term) => (
                              <Button
                                key={term}
                                variant="outline"
                                size="sm"
                                className="rounded-full border-gray-100 hover:border-primary hover:bg-primary/5 text-gray-600 px-4 font-bold text-xs"
                                onClick={() => {
                                  setSearchQuery(term);
                                  loadProducts();
                                  setIsSearchActive(false);
                                }}
                              >
                                <TrendingUp className="h-3 w-3 mr-2 text-primary" />
                                {term}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                
                <div className="flex gap-2 w-full lg:w-auto">
                  <Button
                    onClick={loadProducts}
                    className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 px-8 flex items-center justify-center transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Search
                  </Button>
                  <Button
                    variant="outline"
                    className="lg:hidden rounded-2xl h-14 w-14 p-0 border-2"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                  >
                    <Filter className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Integrated Filters Row */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* Category Dropdown */}
                <div className="space-y-1.5 sm:space-y-2 col-span-1">
                  <Label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase ml-1">Category</Label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-10 sm:h-12 px-3 sm:px-4 rounded-xl bg-gray-50/50 border-2 border-gray-100/50 focus:border-primary/50 transition-all appearance-none outline-none text-xs sm:text-sm font-medium shadow-sm hover:border-primary/30"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* County/Region Dropdown */}
                <div className="space-y-1.5 sm:space-y-2 col-span-1">
                  <Label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase ml-1">County</Label>
                  <div className="relative group">
                    <select
                      value={countyFilter}
                      onChange={(e) => {
                        setCountyFilter(e.target.value);
                        setNeighborhoodFilter("");
                      }}
                      className="w-full h-10 sm:h-12 px-3 sm:px-8 rounded-xl bg-gray-50/50 border-2 border-gray-100/50 focus:border-primary/50 transition-all appearance-none outline-none text-xs sm:text-sm font-medium shadow-sm hover:border-primary/30"
                    >
                      <option value="">All Counties</option>
                      {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <MapPin className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 pointer-events-none hidden sm:block group-focus-within:text-primary transition-colors" />
                  </div>
                </div>

                {/* Neighborhood / Specific Area Dropdown */}
                <div className="space-y-1.5 sm:space-y-2 col-span-2 lg:col-span-1">
                  <Label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase ml-1">Specific Area</Label>
                  <div className="relative group">
                    <select
                      value={neighborhoodFilter}
                      onChange={(e) => setNeighborhoodFilter(e.target.value)}
                      disabled={!countyFilter}
                      className="w-full h-10 sm:h-12 px-3 sm:px-8 rounded-xl bg-gray-50/50 border-2 border-gray-100/50 focus:border-primary/50 transition-all appearance-none outline-none text-xs sm:text-sm font-medium shadow-sm hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">{countyFilter ? "All Areas" : "Select County first"}</option>
                      {countyFilter && getNeighborhoodsForCounty(countyFilter).map((loc: string) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <Search className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400 pointer-events-none hidden sm:block group-focus-within:text-primary transition-colors" />
                  </div>
                </div>

                {/* Sort By Dropdown */}
                <div className="space-y-1.5 sm:space-y-2 col-span-1">
                  <Label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase ml-1">Sort</Label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-10 sm:h-12 px-3 sm:px-4 rounded-xl bg-gray-50/50 border-2 border-gray-100/50 focus:border-primary/50 transition-all appearance-none outline-none text-xs sm:text-sm font-medium shadow-sm hover:border-primary/30"
                  >
                    <option value="newest">Newest</option>
                    <option value="lowest-price">Price: Low</option>
                    <option value="highest-price">Price: High</option>
                    <option value="trending">Trending</option>
                  </select>
                </div>

                {/* Price Display / Toggle Row */}
                <div className="flex items-end gap-2 col-span-1 lg:col-span-1">
                  <Button 
                    variant="outline" 
                    className="h-10 sm:h-12 w-full rounded-xl border-2 p-0 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase"
                    onClick={() => {
                        setPriceRange([0, 1000000]);
                        setCountyFilter("");
                        setNeighborhoodFilter("");
                        setConditionFilter([]);
                        setVerifiedOnly(false);
                        setSelectedCategory("All");
                        setSearchQuery("");
                    }}
                    title="Reset All"
                  >
                    <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
              </div>
            </div>
          </div>

          {/* Recently Viewed Section */}
          {recentlyViewed.length > 0 && (
            <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <History className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recently Viewed</h2>
                    <p className="text-gray-500 text-sm font-medium">Items you've explored recently</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold"
                  onClick={() => {
                    localStorage.removeItem("recently_viewed");
                    setRecentlyViewed([]);
                  }}
                >
                  Clear History
                </Button>
              </div>
              <ScrollArea className="w-full whitespace-nowrap rounded-2xl pb-4">
                <div className="flex gap-6">
                  {recentlyViewed.map((product) => (
                    <div
                      key={`recent-${product.id}`}
                      className="w-72 shrink-0 group cursor-pointer"
                      onClick={() => openProductDetails(product)}
                    >
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-all duration-300">
                        <img
                          src={product.images?.[0] || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                          <Badge className="bg-white/90 text-gray-900 border-0 backdrop-blur-md">View Now</Badge>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900 truncate mb-1 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-indigo-600 font-black text-lg">
                        KES {product.price?.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator className="mt-8" />
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <FilterSidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                conditions={conditionFilter}
                onConditionChange={(c) => {
                  if (conditionFilter.includes(c)) {
                    setConditionFilter(conditionFilter.filter(x => x !== c));
                  } else {
                    setConditionFilter([...conditionFilter, c]);
                  }
                }}
                verifiedOnly={verifiedOnly}
                onVerifiedChange={setVerifiedOnly}
                selectedCounty={countyFilter}
                onCountyChange={setCountyFilter}
                selectedNeighborhood={neighborhoodFilter}
                onNeighborhoodChange={setNeighborhoodFilter}
              />
            </div>

            {/* Main Products Area */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden border-0 shadow-lg rounded-2xl bg-white/50 backdrop-blur-sm animate-pulse">
                      <Skeleton className="h-64 w-full rounded-t-2xl" />
                      <CardHeader className="pb-3 px-6 pt-6">
                        <Skeleton className="h-7 w-3/4 mb-2" />
                        <div className="flex justify-between">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4 px-6">
                        <Skeleton className="h-8 w-1/2 mb-3" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                      <CardFooter className="gap-3 pt-0 px-6 pb-6">
                        <Skeleton className="h-10 flex-1 rounded-xl" />
                        <Skeleton className="h-10 flex-1 rounded-xl" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                  <Package className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-4 text-gray-700">
                    {products.length === 0
                      ? "Marketplace is Empty"
                      : "No Products Found"}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {searchQuery || selectedCategory !== "All"
                      ? "Try adjusting your search terms or browse different categories"
                      : "Be the first to list a product and start selling today!"}
                  </p>
                  {products.length === 0 && (
                    <Link to="/products/upload">
                      <Button
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        List Your First Product
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                  {products.map((product) => {
                    const sellerRating = getSellerRating(product.profiles);
                    const isFavorite = favorites.has(product.id);

                    return (
                      <Card
                        key={product.id}
                        className="group relative overflow-hidden bg-white hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] transition-all duration-700 border-none rounded-[2rem] h-full flex flex-col"
                        onClick={() => openProductDetails(product)}
                      >
                        {/* Improved Image Container */}
                        <div className="relative aspect-[4/5] overflow-hidden m-2 rounded-[1.5rem] shadow-sm">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-300" />
                            </div>
                          )}

                          {/* Gradient Overlays */}
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:h-full transition-all duration-700" />
                          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                          {/* Top Badges */}
                          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                            <div className="flex flex-col gap-2">
                              {product.verified && (
                                <Badge className="bg-white/90 backdrop-blur-md text-primary shadow-xl border-none font-bold py-1.5 px-3 rounded-full animate-in slide-in-from-left duration-500">
                                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                                  Verified
                                </Badge>
                              )}
                              {product.featured && (
                                <Badge className="bg-amber-400 text-white border-none font-bold py-1.5 px-3 rounded-full shadow-lg">
                                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                  Elite
                                </Badge>
                              )}
                              {product.original_price && product.original_price > product.price && (
                                <Badge className="bg-orange-500 text-white border-none font-bold py-1.5 px-3 rounded-full shadow-lg animate-pulse">
                                  <TrendingDown className="h-3.5 w-3.5 mr-1.5" />
                                  Price Drop
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className={`h-11 w-11 rounded-full backdrop-blur-md pointer-events-auto transition-all duration-300 ${
                                isFavorite ? "bg-red-500 text-white" : "bg-white/20 text-white hover:bg-white/40"
                              }`}
                              onClick={(e) => toggleFavorite(product.id, e)}
                            >
                              <Heart className={`h-5 w-5 ${isFavorite ? "fill-white" : ""}`} />
                            </Button>
                          </div>

                          {/* Bottom Info Overlay */}
                          <div className="absolute bottom-6 left-6 right-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 h-12 flex gap-2">
                             <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl h-full font-bold shadow-xl shadow-black/20" onClick={(e) => openContact(product, e)}>
                               <Phone className="w-4 h-4 mr-2" />
                               Contact Seller
                             </Button>
                             <Button size="icon" className="w-12 h-full bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30" onClick={() => openProductDetails(product)}>
                               <Eye className="h-5 w-5" />
                             </Button>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-6 flex-1 flex flex-col gap-3">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 block">{product.category}</span>
                                {product.condition === 'new' && <Badge className="bg-primary/10 text-primary border-none text-[10px] h-5">NEW</Badge>}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                                {product.description}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-4 mt-auto">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Price</span>
                                    {product.original_price && product.original_price > product.price && (
                                        <span className="text-[10px] text-gray-400 line-through font-medium">
                                            KES {product.original_price.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <CompactPriceDisplay
                                    kesAmount={product.price || 0}
                                    className="text-2xl font-black text-gray-900"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                <div className="flex items-center gap-2">
                                  {product.profiles?.avatar_url ? (
                                    <div className="relative">
                                      <Avatar className="h-6 w-6 border border-gray-100">
                                        <AvatarImage src={product.profiles.avatar_url} alt={product.profiles.full_name || "Seller"} />
                                        <AvatarFallback>{(product.profiles.full_name || "S").charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${isUserOnline(product.profiles.updated_at) ? "bg-green-500" : "bg-gray-300"}`}></span>
                                    </div>
                                  ) : (
                                    <div className="relative">
                                      <div className="h-6 w-6 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center border border-gray-100">
                                        <User className="h-3.5 w-3.5 text-gray-500" />
                                      </div>
                                       <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${isUserOnline(product.profiles?.updated_at) ? "bg-green-500" : "bg-gray-300"}`}></span>
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-medium text-gray-700 max-w-[100px] truncate">
                                      {product.profiles?.full_name || "Seller"}
                                    </span>
                                    <span className="text-[8px] text-gray-400">
                                      {getLastSeenText(product.profiles?.updated_at)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center text-gray-500 text-[10px] font-bold bg-gray-50 px-2 py-1 rounded-lg">
                                    <MapPin className="h-3 w-3 mr-1 text-secondary" />
                                    {product.location?.split(',')[0]}
                                </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 w-full mt-4">
                            <Button 
                              variant="outline"
                              className="flex-1 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary rounded-2xl h-12 font-bold transition-all active:scale-95"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  openProductDetails(product);
                              }}
                            >
                               <Eye className="h-4 w-4 mr-2" />
                               View
                            </Button>
                            <Button 
                              className="flex-1 bg-secondary hover:bg-secondary/90 text-white rounded-2xl h-12 font-bold transition-all hover:shadow-[0_8px_20px_-6px_rgba(255,102,0,0.4)] active:scale-95"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                              }}
                            >
                               <ShoppingCart className="h-4 w-4 mr-2" />
                               Quick Add
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <ContactSellerDialog
          open={contactModalOpen}
          onOpenChange={setContactModalOpen}
          sellerProfile={activeContactSession ? {
            full_name: selectedProduct?.profiles?.full_name || "Seller",
            username: "Seller",
            phone: activeContactSession.revealed_contact,
            profile_image: selectedProduct?.profiles?.avatar_url || ""
          } : {
            // Fallback if no active session, but dialog handles "null" gracefully?
            // Actually, Marketplace flow forces "reveal" before showing details?
            // User wants "View details then contact seller".
            // If I use my new dialog, it shows the number directly if available.
            // In Marketplace, `Product` has `phone`.
            // I should pass available info.
            full_name: selectedProduct?.profiles?.full_name || "Seller",
            username: "Seller",
            phone: selectedProduct?.phone || selectedProduct?.profiles?.phone || "",
            whatsapp: selectedProduct?.whatsapp || selectedProduct?.profiles?.whatsapp || "",
            profile_image: selectedProduct?.profiles?.avatar_url || ""
          }}
          product={{
            name: selectedProduct?.name || "",
            price: selectedProduct?.price || 0,
            currency: "KES"
          }}
        />

        {/* Report Modal */}
        <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Report Seller</DialogTitle>
              <DialogDescription>
                Help us keep the marketplace safe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Reason for reporting</Label>
                <select
                  className="w-full p-2 border rounded-lg mt-1"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option value="">Select a reason</option>
                  <option value="fake_product">Fake product</option>
                  <option value="suspicious">Suspicious activity</option>
                  <option value="harassment">Harassment</option>
                  <option value="spam">Spam</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Details (optional)</Label>
                <Textarea
                  placeholder="Please provide more details..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowReportModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitReport} disabled={isSubmittingReport}>
                Submit Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Details Modal */}
        <Dialog
          open={productDetailModalOpen}
          onOpenChange={handleCloseProductModal}
        >
          <DialogContent 
            className="max-w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl p-0 border-none bg-white dark:bg-gray-900 rounded-3xl shadow-2xl h-[90vh] overflow-y-auto"
            ref={modalContentRef}
          >
            {selectedProduct && (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                {/* Header Section - Modern Hierarchy */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-6 sm:px-8 sm:py-8 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold tracking-wider uppercase py-1.5 px-3 rounded-full">
                        {selectedProduct.category}
                      </Badge>
                      {selectedProduct.profiles?.verified && (
                        <Badge className="bg-emerald-500 text-white border-none text-[10px] font-bold tracking-wider uppercase py-1.5 px-3 rounded-full shadow-lg shadow-emerald-500/20">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                       <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">{selectedProduct.location || "Nairobi"}</span>
                       </div>
                       <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">{formatDate(selectedProduct.created_at)}</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    
                    {/* Media Column (LHS) */}
                    <div className="lg:col-span-7 bg-gray-50/50 p-6 sm:p-12">
                      <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl bg-white group">
                        {selectedProduct.images && selectedProduct.images.length > 0 ? (
                          <>
                            <img
                              src={selectedProduct.images[currentImageIndex]}
                              alt={selectedProduct.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                            />
                            
                            {/* Navigation Overlays */}
                            {selectedProduct.images.length > 1 && (
                              <>
                                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pl-6">
                                  <Button size="icon" variant="ghost" className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40" onClick={prevImage}>
                                    <ChevronLeft className="h-6 w-6" />
                                  </Button>
                                </div>
                                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-6">
                                  <Button size="icon" variant="ghost" className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40" onClick={nextImage}>
                                    <ChevronRight className="h-6 w-6" />
                                  </Button>
                                </div>
                                
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 backdrop-blur-md p-1.5 rounded-full">
                                  {selectedProduct.images.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-20 w-20 text-gray-200" />
                          </div>
                        )}
                      </div>

                      {/* thumbnails */}
                      {selectedProduct.images && selectedProduct.images.length > 1 && (
                        <div className="grid grid-cols-5 gap-3 mt-6">
                           {selectedProduct.images.map((img, i) => (
                             <button 
                                key={i} 
                                onClick={() => goToImage(i)}
                                className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${i === currentImageIndex ? "border-primary scale-95 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"}`}
                             >
                               <img src={img} className="w-full h-full object-cover" alt="thumb" />
                             </button>
                           ))}
                        </div>
                      )}
                    </div>

                    {/* Content Column (RHS) */}
                    <div className="lg:col-span-5 p-6 sm:p-12 space-y-10">
                      
                      {/* Price Card */}
                      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 block">Premium Listing</span>
                        <div className="flex items-baseline gap-2 mb-2">
                           <span className="text-4xl sm:text-5xl font-black">KES {selectedProduct.price?.toLocaleString()}</span>
                        </div>
                        {selectedProduct.original_price && selectedProduct.original_price > selectedProduct.price && (
                           <div className="flex items-center gap-3">
                              <span className="text-gray-400 line-through font-medium">KES {selectedProduct.original_price.toLocaleString()}</span>
                              <Badge className="bg-emerald-500 text-[10px] font-black border-none px-2 h-5">-{Math.round((1 - selectedProduct.price/selectedProduct.original_price) * 100)}% OFF</Badge>
                           </div>
                        )}
                        <div className="mt-6 flex flex-wrap gap-2">
                           {selectedProduct.is_negotiable && <Badge className="bg-white/10 text-white border-white/20 text-[10px] uppercase font-black">Negotiable</Badge>}
                           <Badge className="bg-white/10 text-white border-white/20 text-[10px] uppercase font-black">{selectedProduct.condition?.replace(/-/g, ' ')}</Badge>
                        </div>
                      </div>

                      {/* Action Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <Button className="h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20" onClick={() => { setProductDetailModalOpen(false); openContact(selectedProduct); }}>
                            <Phone className="w-6 h-6 mr-3" />
                            Contact Now
                         </Button>
                         <Button variant="outline" className="h-16 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-black text-lg" onClick={() => addToCart(selectedProduct)}>
                            <ShoppingCart className="w-6 h-6 mr-3 text-secondary" />
                            To Cart
                         </Button>
                      </div>

                      {/* Seller Trust Card */}
                      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative group hover:shadow-xl transition-all duration-500">
                        <div className="flex items-center gap-6">
                           <div className="relative">
                              <Avatar className="h-20 w-20 border-4 border-white shadow-2xl">
                                <AvatarImage src={selectedProduct.profiles?.avatar_url || ""} />
                                <AvatarFallback className="bg-primary text-white text-2xl font-black">{selectedProduct.profiles?.full_name?.charAt(0) || "S"}</AvatarFallback>
                              </Avatar>
                              <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white ${isUserOnline(selectedProduct.profiles?.updated_at) ? "bg-emerald-500" : "bg-gray-300"}`} />
                           </div>
                           <div className="flex-1">
                              <h4 className="text-xl font-black text-gray-900 leading-tight mb-1">{selectedProduct.profiles?.full_name || "Premium Seller"}</h4>
                              <div className="flex items-center gap-2 mb-2">
                                 <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                 <span className="text-sm font-black">{selectedProduct.profiles?.rating?.toFixed(1) || "5.0"}</span>
                                 <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">({getSellerRating(selectedProduct.profiles)?.totalRatings || "12"} Reviews)</span>
                              </div>
                              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Elite Trust Badge • Joined {selectedProduct.profiles?.created_at ? new Date(selectedProduct.profiles.created_at).getFullYear() : "2023"}
                              </p>
                           </div>
                        </div>
                        <Button variant="ghost" className="w-full mt-6 h-12 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 font-black text-xs uppercase tracking-widest" onClick={() => openReviews(selectedProduct)}>
                           <Users className="w-4 h-4 mr-2" />
                           Seller Portfolio
                        </Button>
                      </div>

                      {/* Description & Specs */}
                      <div className="space-y-6">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Product Details</h3>
                        <p className="text-gray-600 leading-loose text-base">
                           {selectedProduct.description || "The seller has not provided a detailed description for this premium listing yet."}
                        </p>
                        
                        {selectedProduct.properties && Object.keys(selectedProduct.properties).length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                            {Object.entries(selectedProduct.properties).map(([key, val]) => (
                               <div key={key} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                     <Package className="w-5 h-5 text-primary/60" />
                                  </div>
                                  <div>
                                     <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{key}</p>
                                     <p className="text-sm font-black text-gray-900">{String(val)}</p>
                                  </div>
                               </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Smart Recommendations Section */}
                      {similarProducts.length > 0 && (
                        <div className="pt-10 border-t border-gray-100">
                           <div className="flex items-center justify-between mb-8">
                             <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                               <div className="bg-primary/10 p-2 rounded-xl">
                                  <Sparkles className="h-6 w-6 text-primary" />
                               </div>
                               People Also Loved
                             </h3>
                           </div>
                           <ScrollArea className="w-full whitespace-nowrap rounded-2xl pb-4">
                              <div className="flex gap-6">
                                 {similarProducts.map((similar) => (
                                   <div 
                                      key={similar.id} 
                                      className="w-48 shrink-0 cursor-pointer group"
                                      onClick={() => {
                                        setSelectedProduct(similar);
                                        setCurrentImageIndex(0);
                                        loadSimilarProducts(similar);
                                        if (modalContentRef.current) {
                                          modalContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
                                        }
                                      }}
                                    >
                                     <div className="aspect-square rounded-[1.5rem] overflow-hidden mb-3 relative shadow-md group-hover:shadow-xl transition-all">
                                        <img src={similar.images?.[0] || ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="similar" />
                                        <div className="absolute top-2 right-2">
                                           <Badge className="bg-white/90 backdrop-blur-md text-gray-900 border-none font-black text-[10px]">KES {similar.price?.toLocaleString()}</Badge>
                                        </div>
                                     </div>
                                     <h4 className="font-bold text-gray-900 truncate text-sm">{similar.name}</h4>
                                     <p className="text-[10px] text-gray-400 font-bold uppercase">{similar.category}</p>
                                   </div>
                                 ))}
                              </div>
                           </ScrollArea>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reviews Modal */}
        <Dialog open={reviewsModalOpen} onOpenChange={setReviewsModalOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Product Reviews
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {selectedProduct?.name} - Customer Reviews & Ratings
              </DialogDescription>
            </DialogHeader>

            {selectedProduct && (
              <div className="space-y-4 sm:space-y-6">
                {/* Add Review Form */}
                <div className="border rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                    Add Your Review
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <label className="text-xs sm:text-sm font-medium">
                        Rating
                      </label>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Button
                            key={star}
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setNewReview((prev) => ({
                                ...prev,
                                rating: star,
                              }))
                            }
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Star
                              className={`h-4 w-4 sm:h-5 sm:w-5 ${star <= newReview.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                                }`}
                            />
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium">
                        Review
                      </label>
                      <Textarea
                        placeholder="Share your experience with this product..."
                        value={newReview.comment}
                        onChange={(e) =>
                          setNewReview((prev) => ({
                            ...prev,
                            comment: e.target.value,
                          }))
                        }
                        className="mt-1 text-sm"
                        rows={3}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={submitReview}
                      disabled={isSubmittingReview || !newReview.comment.trim()}
                      className="w-full text-xs sm:text-sm h-9 sm:h-10"
                    >
                      {isSubmittingReview ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-sm sm:text-base">
                    Customer Reviews ({reviews.length})
                  </h3>

                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                      No reviews yet. Be the first to review this product!
                    </p>
                  ) : (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                              <AvatarImage src={review.profiles.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {review.profiles.full_name?.[0]?.toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-xs sm:text-sm">
                                {review.profiles.full_name || "Anonymous"}
                              </p>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-2 w-2 sm:h-3 sm:w-3 ${star <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                      }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(review.created_at)}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm mb-2 sm:mb-3">
                          {review.comment}
                        </p>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markReviewHelpful(review.id)}
                          disabled={review.is_helpful}
                          className="h-7 px-2 text-xs"
                        >
                          <ThumbsUp
                            className={`h-3 w-3 mr-1 ${review.is_helpful
                              ? "fill-blue-500 text-blue-500"
                              : ""
                              }`}
                          />
                          Helpful ({review.helpful_count})
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Messages Modal */}
        <Dialog open={messagesModalOpen} onOpenChange={setMessagesModalOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Chat with Seller
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {selectedProduct?.name} - {selectedProduct?.profiles?.full_name}
              </DialogDescription>

              {/* Product Info Header in Messages */}
              {selectedProduct && (
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg bg-muted/50">
                  {selectedProduct.images &&
                    selectedProduct.images.length > 0 && (
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-md object-cover"
                      />
                    )}
                  <div className="flex-1">
                    <p className="font-medium text-xs sm:text-sm">
                      {selectedProduct.name}
                    </p>
                    <p className="text-xs sm:text-sm text-primary font-semibold">
                      KES {selectedProduct.price?.toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      <span className="capitalize">
                        {selectedProduct.category}
                      </span>
                      {selectedProduct.condition && (
                        <>
                          <span>•</span>
                          <span className="capitalize">
                            {selectedProduct.condition.replace(/-/g, " ")}
                          </span>
                        </>
                      )}
                      {selectedProduct.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {selectedProduct.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DialogHeader>

            {selectedProduct && (
              <div className="flex-1 flex flex-col">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 mb-3 sm:mb-4 p-3 sm:p-4 border rounded-lg">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-6 sm:py-8">
                      <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        No messages yet. Start a conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isCurrentUser =
                        message.sender_id === currentUserProfile?.id;

                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2 sm:gap-3 ${isCurrentUser ? "flex-row-reverse" : ""
                            }`}
                        >
                          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                            <AvatarImage src={message.profiles.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {message.profiles.full_name?.[0]?.toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`flex-1 ${isCurrentUser ? "text-right" : ""
                              }`}
                          >
                            <div
                              className={`inline-block px-3 py-2 rounded-lg max-w-[85%] text-xs sm:text-sm ${isCurrentUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                                }`}
                            >
                              <p>{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="text-sm"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isSubmittingMessage || !newMessage.trim()}
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </>
  );
}
