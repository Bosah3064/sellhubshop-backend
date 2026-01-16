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
  ExternalLink,
  Battery,
  BatteryCharging,
  Wifi,
  WifiOff,
  Signal,
  SignalLow,
  SignalMedium,
  SignalHigh,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackProductView } from "@/utils/trackProductView";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CompactPriceDisplay } from "@/components/PriceDisplay";
import { PiLogo } from "@/components/PiLogo";

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

export default function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false);
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userFavorites, setUserFavorites] = useState<Favorite[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);
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

  // Simple contact tracking
  const [contactHistory, setContactHistory] = useState<ContactSession[]>([]);
  const [showContactHistory, setShowContactHistory] = useState(false);

  // Network status
  const [networkSecurity, setNetworkSecurity] = useState<
    "secure" | "warning" | "danger"
  >("secure");
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);
  const securityCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize
  useEffect(() => {
    document.title = "Marketplace - Browse Products | Pi Network Accepted Soon";
    initializeBasicSecurity();
    loadCurrentUserProfile();
    loadProducts();
    loadUserFavorites();

    return () => {
      if (slideshowRef.current) clearInterval(slideshowRef.current);
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
      const { data: history, error } = await supabase
        .from("contact_sessions")
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
          whatsapp
        )
      `
        )
        .in("status", ["active", "approved"])
        .order("created_at", { ascending: false })
        .limit(100);

      const { data: productsData, error } = await query;

      if (error) throw error;

      if (productsData && productsData.length > 0) {
        const verifiedProducts = productsData.filter((p) => p.verified);
        const nonVerifiedProducts = productsData.filter((p) => !p.verified);
        const prioritizedProducts = [
          ...verifiedProducts,
          ...nonVerifiedProducts,
        ];
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

      const { data: session, error } = await supabase
        .from("contact_sessions")
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
      await createContactSession(user.id, contactType);
    } catch (error: any) {
      console.error("Error revealing contact:", error);
      handleDatabaseError(error, "revealing contact");
    } finally {
      setIsRevealingNumber(false);
    }
  };

  const createContactSession = async (
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
      const { data: session, error: createError } = await supabase
        .from("contact_sessions")
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

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

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
      const { error } = await supabase.from("blocked_users").insert({
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

  const nextImage = () => {
    if (!selectedProduct?.images) return;
    setCurrentImageIndex((prev) =>
      prev === selectedProduct.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!selectedProduct?.images) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? selectedProduct.images.length - 1 : prev - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const toggleSlideshow = () => {
    if (isSlideshowPlaying) {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
        slideshowRef.current = null;
      }
      setIsSlideshowPlaying(false);
    } else {
      if (selectedProduct?.images && selectedProduct.images.length > 1) {
        slideshowRef.current = setInterval(() => {
          setCurrentImageIndex((prev) =>
            prev === selectedProduct.images.length - 1 ? 0 : prev + 1
          );
        }, 3000);
        setIsSlideshowPlaying(true);
      }
    }
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

  const openProductDetails = async (product: Product) => {
    setSelectedProduct(product);
    setProductDetailModalOpen(true);
    setCurrentImageIndex(0);
    setIsSlideshowPlaying(false);

    if (slideshowRef.current) {
      clearInterval(slideshowRef.current);
      slideshowRef.current = null;
    }

    await trackProductView(product.id);
  };

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

  const handleCloseProductModal = () => {
    setProductDetailModalOpen(false);
    setIsSlideshowPlaying(false);
    if (slideshowRef.current) {
      clearInterval(slideshowRef.current);
      slideshowRef.current = null;
    }
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
    setActiveContactSession(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SIMPLIFIED Contact Modal - No verification
  const ContactModal = () => (
    <Dialog open={contactModalOpen} onOpenChange={handleCloseContactModal}>
      <DialogContent className="max-w-md p-0">
        <div className="flex flex-col max-h-[85vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Seller
            </DialogTitle>
            <DialogDescription className="truncate">
              {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="py-4 space-y-4">
              {/* Network Warning */}
              {showNetworkWarning && (
                <div
                  className={`p-3 rounded-lg ${networkSecurity === "danger"
                    ? "bg-red-50 border border-red-200"
                    : "bg-amber-50 border border-amber-200"
                    }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {networkSecurity === "danger"
                          ? "Insecure Connection"
                          : "Weak Connection"}
                      </p>
                      <p className="text-xs mt-1">
                        {networkSecurity === "danger"
                          ? "Connect to a secure network to contact sellers"
                          : "Your connection may be slow"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Seller Info */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedProduct?.profiles?.avatar_url} />
                    <AvatarFallback>
                      {selectedProduct?.profiles?.full_name?.[0] || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {selectedProduct?.profiles?.full_name || "Seller"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedProduct?.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Seller
                        </Badge>
                      )}
                      {getSellerRating(selectedProduct?.profiles) && (
                        <div className="flex items-center text-sm">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          {getSellerRating(
                            selectedProduct?.profiles
                          )?.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Options - SIMPLIFIED */}
              <div className="space-y-3">
                {/* Call Option */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Call Seller</p>
                        <p className="text-sm text-gray-600">
                          Direct phone call
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    {activeContactSession?.contact_type === "phone" ? (
                      <div className="space-y-3">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-2xl font-bold font-mono">
                            {formatMaskedNumber(
                              activeContactSession.revealed_contact
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatExpiryTime(activeContactSession.expires_at)}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              const cleanNumber =
                                activeContactSession.revealed_contact.replace(
                                  /\D/g,
                                  ""
                                );
                              window.location.href = `tel:${cleanNumber}`;
                            }}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                activeContactSession.revealed_contact
                              );
                              toast({ title: "Number copied to clipboard" });
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => revealContactNumber("phone")}
                        disabled={
                          isRevealingNumber || networkSecurity === "danger"
                        }
                      >
                        {isRevealingNumber
                          ? "Processing..."
                          : "Show Phone Number"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* WhatsApp Option */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Chat on WhatsApp</p>
                        <p className="text-sm text-gray-600">
                          Direct messaging
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <Button
                      className="w-full bg-[#25D366] hover:bg-[#1da851] text-white"
                      onClick={async () => {
                        if (activeContactSession?.contact_type === "whatsapp") {
                          const message = `Hi, I'm interested in your product "${selectedProduct?.name}"`;
                          const cleanNumber =
                            activeContactSession.revealed_contact.replace(
                              /\D/g,
                              ""
                            );
                          window.open(
                            `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
                              message
                            )}`,
                            "_blank"
                          );
                        } else {
                          await revealContactNumber("whatsapp");
                        }
                      }}
                      disabled={networkSecurity === "danger"}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      {activeContactSession?.contact_type === "whatsapp"
                        ? "Chat Now"
                        : "Show WhatsApp"}
                    </Button>
                  </div>
                </div>

                {/* In-App Message */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="p-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        handleCloseContactModal();
                        if (selectedProduct) openMessages(selectedProduct);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message in App
                    </Button>
                  </div>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Safety Tips
                    </p>
                    <ul className="text-xs text-amber-700 mt-1 space-y-1">
                      <li>• Meet in public places during daylight</li>
                      <li>• Inspect items before payment</li>
                      <li>• Report suspicious activity</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Report option */}
              {currentUserProfile && (
                <div>
                  <Button
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      handleCloseContactModal();
                      setShowReportModal(true);
                    }}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report Seller
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="px-6 pb-6 pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCloseContactModal}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

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

      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search for products, brands, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 text-lg border-2 border-gray-300 focus:border-green-500 rounded-xl transition-all"
                  />
                </div>
              </div>

              {/* Mobile Filter Toggle */}
              <div className="lg:hidden w-full">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <Filter className="h-5 w-5" />
                  {showMobileFilters ? "Hide Filters" : "Show Filters"}
                  {selectedCategory !== "All" && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-green-100 text-green-700"
                    >
                      {selectedCategory}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Favorites Badge */}
              {favorites.size > 0 && (
                <Badge className="bg-red-500 text-white px-4 py-2 text-sm rounded-lg">
                  <Heart className="h-4 w-4 mr-2 fill-current" />
                  {favorites.size} Favorites
                </Badge>
              )}
            </div>

            {/* Category Filters */}
            <div
              className={`
                mt-6 transition-all duration-300
                ${showMobileFilters ? "block" : "hidden"} 
                lg:block
              `}
            >
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className={`
                      rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200
                      ${selectedCategory === cat
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-white text-gray-700 border-2 hover:border-green-500 hover:text-green-700"
                      }
                    `}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowMobileFilters(false);
                    }}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Categories Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-4 text-gray-900">
                  Categories
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "ghost"}
                      className={`
                        w-full justify-start text-left py-3 px-4 rounded-xl transition-all
                        ${selectedCategory === cat
                          ? "bg-green-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                        }
                      `}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Products Area */}
            <section className="flex-1">
              {filteredProducts.length === 0 ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const sellerRating = getSellerRating(product.profiles);
                    const isFavorite = favorites.has(product.id);

                    return (
                      <Card
                        key={product.id}
                        className="overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer border-0 shadow-lg hover:scale-105"
                        onClick={() => openProductDetails(product)}
                      >
                        <article className="relative h-64 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={`${product.name} - ${product.category} for sale in Kenya`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.classList.remove(
                                  "hidden"
                                );
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center ${product.images && product.images.length > 0
                              ? "hidden"
                              : ""
                              }`}
                          >
                            <Package className="h-12 w-12 text-gray-400" />
                          </div>

                          {/* Overlay Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            {product.featured && (
                              <Badge className="bg-yellow-500 text-white border-0 shadow-lg">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            )}
                            {product.verified && (
                              <Badge className="bg-green-500 text-white border-0 shadow-lg">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {product.is_urgent && (
                              <Badge className="bg-red-500 text-white border-0 shadow-lg">
                                <Zap className="h-3 w-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                          </div>

                          {/* Favorite Button */}
                          <Button
                            size="icon"
                            variant="secondary"
                            className={`
                              absolute top-3 right-3 backdrop-blur-sm transition-all duration-300 h-9 w-9
                              ${isFavorite
                                ? "bg-red-500 hover:bg-red-600 text-white shadow-lg"
                                : "bg-white/90 hover:bg-white text-gray-700 shadow-md"
                              }
                            `}
                            onClick={(e) => toggleFavorite(product.id, e)}
                          >
                            <Heart
                              className={`h-4 w-4 transition-all duration-200 ${isFavorite
                                ? "fill-current scale-110"
                                : "group-hover:scale-110"
                                }`}
                            />
                          </Button>

                          {/* Quick Actions Overlay */}
                          <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button
                              size="sm"
                              className="flex-1 bg-white/90 backdrop-blur-sm text-gray-800 hover:bg-white font-medium"
                              onClick={(e) => openContact(product, e)}
                            >
                              <Phone className="w-4 h-4 mr-1" />
                              Contact
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-white/90 backdrop-blur-sm text-gray-800 hover:bg-white font-medium"
                              onClick={() => openProductDetails(product)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </article>

                        <CardHeader className="pb-3 px-6 pt-6">
                          <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-green-700 transition-colors">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 w-fit"
                            >
                              {product.category}
                            </Badge>
                            {product.location && (
                              <span className="flex items-center text-gray-600">
                                <MapPin className="h-4 w-4 mr-1" />
                                {product.location}
                              </span>
                            )}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="pb-4 px-6">
                          <CompactPriceDisplay
                            kesAmount={product.price || 0}
                            className="mb-2"
                          />
                          {product.original_price &&
                            product.original_price > product.price && (
                              <p className="text-sm text-gray-500 line-through mb-3">
                                KES {product.original_price.toLocaleString()}
                              </p>
                            )}
                          <p className="text-gray-600 line-clamp-2 text-sm leading-relaxed">
                            {product.description}
                          </p>
                          {sellerRating && (
                            <div className="flex items-center gap-2 mt-3">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold text-sm">
                                {sellerRating.rating.toFixed(1)}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({sellerRating.totalRatings} reviews)
                              </span>
                            </div>
                          )}
                        </CardContent>

                        <CardFooter className="gap-3 pt-0 px-6 pb-6">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2"
                            onClick={() => openProductDetails(product)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => openContact(product, e)}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Contact
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Modals */}
        <ContactModal />

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
          <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedProduct && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl">
                    {selectedProduct.name}
                  </DialogTitle>
                  <DialogDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm sm:text-base">
                    <span className="capitalize">
                      {selectedProduct.category}
                    </span>
                    {selectedProduct.subcategory && (
                      <span className="text-primary hidden sm:inline">
                        • {selectedProduct.subcategory}
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Product Images with Navigation */}
                  <div className="space-y-3 sm:space-y-4">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      {selectedProduct.images &&
                        selectedProduct.images.length > 0 ? (
                        <>
                          <img
                            src={selectedProduct.images[currentImageIndex]}
                            alt={selectedProduct.name}
                            className="w-full h-full object-cover"
                          />

                          {/* Navigation Arrows */}
                          {selectedProduct.images.length > 1 && (
                            <>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background h-8 w-8 sm:h-10 sm:w-10"
                                onClick={prevImage}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background h-8 w-8 sm:h-10 sm:w-10"
                                onClick={nextImage}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>

                              {/* Slideshow Control */}
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background h-8 w-8 sm:h-10 sm:w-10"
                                onClick={toggleSlideshow}
                              >
                                {isSlideshowPlaying ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>

                              {/* Image Counter */}
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                                {currentImageIndex + 1} /{" "}
                                {selectedProduct.images.length}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Navigation */}
                    {selectedProduct.images &&
                      selectedProduct.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {selectedProduct.images.map((image, index) => (
                            <div
                              key={index}
                              className={`aspect-square rounded-md overflow-hidden bg-muted cursor-pointer border-2 transition-all ${index === currentImageIndex
                                ? "border-primary"
                                : "border-transparent"
                                }`}
                              onClick={() => goToImage(index)}
                            >
                              <img
                                src={image}
                                alt={`${selectedProduct.name} view ${index + 1
                                  }`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-4 sm:space-y-6">
                    {/* Price Section */}
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-primary">
                        KES {selectedProduct.price?.toLocaleString()}
                      </p>
                      {selectedProduct.original_price &&
                        selectedProduct.original_price >
                        selectedProduct.price && (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-base sm:text-lg text-muted-foreground line-through">
                              KES{" "}
                              {selectedProduct.original_price.toLocaleString()}
                            </p>
                            <Badge variant="destructive" className="text-xs">
                              Save{" "}
                              {Math.round(
                                (1 -
                                  selectedProduct.price /
                                  selectedProduct.original_price) *
                                100
                              )}
                              %
                            </Badge>
                          </div>
                        )}
                      {selectedProduct.is_negotiable && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Price Negotiable
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="font-semibold mb-2 text-sm sm:text-base">
                        Description
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-line text-sm sm:text-base">
                        {selectedProduct.description ||
                          "No description provided."}
                      </p>
                    </div>

                    {/* Properties */}
                    {selectedProduct.properties &&
                      Object.keys(selectedProduct.properties).length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2 text-sm sm:text-base">
                            Specifications
                          </h3>
                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                            {Object.entries(selectedProduct.properties).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="flex justify-between border-b pb-1"
                                >
                                  <span className="text-xs sm:text-sm font-medium">
                                    {key}:
                                  </span>
                                  <span className="text-xs sm:text-sm text-muted-foreground capitalize">
                                    {String(value)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Condition & Location */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium mb-1">
                          Condition
                        </h4>
                        <Badge variant="outline" className="capitalize text-xs">
                          {selectedProduct.condition?.replace(/-/g, " ") ||
                            "Not specified"}
                        </Badge>
                      </div>
                      {selectedProduct.location && (
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium mb-1">
                            Location
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {selectedProduct.location}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Seller Information */}
                    {selectedProduct.profiles && (
                      <div className="border-t pt-3 sm:pt-4">
                        <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                          <User className="h-4 w-4" />
                          Seller Information
                        </h3>
                        <div className="space-y-1 sm:space-y-2">
                          <p className="font-medium text-sm sm:text-base">
                            {selectedProduct.profiles.full_name || "Seller"}
                          </p>
                          {getSellerRating(selectedProduct.profiles) && (
                            <div className="flex items-center gap-2">
                              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs sm:text-sm font-medium">
                                {getSellerRating(
                                  selectedProduct.profiles
                                )?.rating.toFixed(1)}
                              </span>
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                (
                                {
                                  getSellerRating(selectedProduct.profiles)
                                    ?.totalRatings
                                }{" "}
                                reviews)
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Listed {formatDate(selectedProduct.created_at)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                      <Button
                        size="sm"
                        className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                        onClick={() => {
                          setProductDetailModalOpen(false);
                          openContact(selectedProduct);
                        }}
                      >
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Contact Seller
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                        onClick={() => openMessages(selectedProduct)}
                      >
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Message
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 sm:h-10 sm:w-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(selectedProduct.id);
                        }}
                      >
                        <Heart
                          className={`h-4 w-4 ${favorites.has(selectedProduct.id)
                            ? "fill-red-500 text-red-500"
                            : ""
                            }`}
                        />
                      </Button>
                    </div>

                    {/* Reviews Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs sm:text-sm h-9 sm:h-10"
                      onClick={() => openReviews(selectedProduct)}
                    >
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      View Reviews
                    </Button>
                  </div>
                </div>
              </>
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
      </main>
    </>
  );
}
