import { useEffect, useState, useRef, useCallback, memo, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  User as UserIcon,
  LogOut,
  Settings,
  Bell,
  MessageSquare,
  Heart,
  BarChart3,
  PlusCircle,
  Menu,
  Shield,
  Star,
  Users,
  Search,
  Home,
  TrendingUp,
  FileText,
  Package,
  Gift,
  Smartphone,
  Shirt,
  Car,
  Building,
  Store,
  RefreshCw,
  X,
  Zap,
  Crown,
  Sparkles,
  ShoppingCart,
  Tag,
  Globe,
  ChevronDown,
  MapPin,
  Truck,
  HeadphonesIcon,
  Award,
  Clock,
  CreditCard,
  Loader2,
} from "lucide-react";
const BannerCarousel = lazy(() => 
  import("@/pages/BannerCarousel").then(module => ({ default: module.BannerCarousel }))
);
import { useCart } from "@/hooks/useCart";
import { Wallet } from "lucide-react";
import { DarkModeToggle } from "./ui/dark-mode-toggle";

// Types
interface UnreadCounts {
  messages: number;
  notifications: number;
}

const isAdminUser = (user: User): boolean => {
  const adminEmails = ["admin@connect.com", "administrator@safaricom.com"];
  return adminEmails.includes(user.email?.toLowerCase() || "");
};

// useUnreadCounts hook
const useUnreadCounts = (userId: string | null) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    messages: 0,
    notifications: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchUnreadCounts = useCallback(async (): Promise<UnreadCounts> => {
    if (!userId) return { messages: 0, notifications: 0 };

    try {
      setIsLoading(true);

      const [messagesResult, notificationsResult] = await Promise.all([
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", userId)
          .eq("is_read", false),
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_read", false),
      ]);

      const counts = {
        messages: messagesResult.count || 0,
        notifications: notificationsResult.count || 0,
      };

      setUnreadCounts(counts);
      setLastUpdated(new Date());

      return counts;
    } catch (error) {
      console.error("Error fetching unread counts:", error);
      return { messages: 0, notifications: 0 };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const messagesSubscription = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    const notificationsSubscription = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    fetchUnreadCounts();

    return () => {
      messagesSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, [userId, fetchUnreadCounts]);

  return {
    unreadCounts,
    isLoading,
    lastUpdated,
    fetchUnreadCounts,
    refreshCounts: fetchUnreadCounts,
  };
};

// Enhanced Badge Components
const CountBadge = ({
  count,
  type,
}: {
  count: number;
  type: "messages" | "notifications";
}) => {
  if (count === 0) return null;

  const bgColor = type === "messages" ? "bg-blue-500" : "bg-amber-500";

  return (
    <Badge
      className={`absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs text-white border-2 border-white shadow-sm ${bgColor}`}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
};

// FIXED Scrollable Banner Component - NO CONFLICTS
const ScrollableBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Simple rule: Hide when scrolling up, show only at top
      if (currentScrollY < lastScrollY.current) {
        // Scrolling up - hide
        setIsVisible(false);
      } else if (currentScrollY === 0) {
        // At top - show
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${isVisible ? "max-h-24 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
    >
      <Suspense fallback={<div className="h-24 bg-gray-900 flex items-center justify-center"><Loader2 className="h-6 w-6 text-white animate-spin" /></div>}>
        <BannerCarousel />
      </Suspense>
    </div>
  );
};

// Professional Navigation - NO SHAKING
const NavigationLinks = ({
  mobile = false,
  onLinkClick,
}: {
  mobile?: boolean;
  onLinkClick?: () => void;
}) => {
  const location = useLocation();

  const isActiveRoute = (path: string) => location.pathname === path;

  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/marketplace", icon: Store, label: "Marketplace" },
    { to: "/referrals", icon: Gift, label: "Refer & Earn", premium: true },
    { to: "/compare", icon: TrendingUp, label: "Compare", premium: true },
    { to: "/blog", icon: FileText, label: "Insights" },
    { to: "/help-center", icon: HeadphonesIcon, label: "Help" },
  ];

  return (
    <div className={mobile ? "space-y-1" : "flex items-center gap-1"}>
      {links.map(({ to, icon: Icon, label, premium }) => (
        <Link
          key={to}
          to={to}
          className={`flex items-center gap-2 transition-colors duration-200 ${mobile
            ? "py-3 px-4 text-base rounded-lg"
            : "text-sm px-3 py-2 rounded-lg font-medium"
            } ${isActiveRoute(to)
              ? "text-green-600 bg-green-50 border border-green-100 shadow-sm"
              : "text-gray-700 hover:text-green-600 hover:bg-gray-50"
            }`}
          onClick={() => {
            console.log('[Navigation] Clicked link:', to);
            if (onLinkClick) onLinkClick();
          }}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="relative">
            {label}
            {isActiveRoute(to) && (
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-green-600 rounded-full"></span>
            )}
          </span>
          {premium && <Sparkles className="h-3 w-3 text-amber-500 ml-1" />}
        </Link>
      ))}
    </div>
  );
};

// Search Bar - RESPONSIVE
const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const cleanQuery = searchQuery.trim().replace(/\/+$/, "");
      navigate(`/marketplace?search=${encodeURIComponent(cleanQuery)}`);
    } else {
      navigate("/marketplace");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <div className="flex-1 w-full mx-0">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products, brands, and categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-20 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-colors duration-200 bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm text-sm"
          />
          <Button
            type="submit"
            className="absolute right-1 top-1 bottom-1 bg-green-600 hover:bg-green-700 text-white px-4 rounded-lg text-xs font-medium transition-colors duration-200 shadow-sm"
          >
            Search
          </Button>
        </div>
      </form>
    </div>
  );
};

// Categories Dropdown - STABLE
const CategoriesDropdown = () => {
  const navigate = useNavigate();
  const categories = [
    {
      icon: Smartphone,
      label: "Electronics",
      color: "text-purple-600",
      description: "Phones, Laptops, Accessories",
    },
    {
      icon: Shirt,
      label: "Fashion",
      color: "text-pink-600",
      description: "Clothing, Shoes, Accessories",
    },
    {
      icon: Car,
      label: "Vehicles",
      color: "text-blue-600",
      description: "Cars, Motorcycles, Parts",
    },
    {
      icon: Building,
      label: "Property",
      color: "text-green-600",
      description: "Houses, Apartments, Land",
    },
    {
      icon: Home,
      label: "Home & Garden",
      color: "text-orange-600",
      description: "Furniture, Appliances, Decor",
    },
  ];

  const handleCategoryClick = (category: string) => {
    navigate(`/marketplace?category=${category.toLowerCase()}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-1 text-gray-700 hover:text-green-600 hover:bg-green-50 px-2 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
        >
          <Tag className="h-4 w-4" />
          <span className="hidden sm:inline">Categories</span>
          <ChevronDown className="h-3 w-3 transition-colors duration-200" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 lg:w-64 p-2 rounded-xl shadow-xl border border-gray-100"
      >
        <div className="space-y-1">
          {categories.map(({ icon: Icon, label, color, description }) => (
            <DropdownMenuItem
              key={label}
              className="flex items-center gap-2 p-2 cursor-pointer rounded-lg hover:bg-green-50 transition-colors duration-200"
              onClick={() => handleCategoryClick(label)}
            >
              <div className={`p-1.5 rounded-lg bg-gray-50 ${color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 text-sm">{label}</div>
                <div className="text-xs text-gray-500 truncate">
                  {description}
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Ultra Compact User Actions for mobile
const CompactUserActions = ({
  user,
  unreadCounts,
  onSignOut,
  avatarUrl,
}: {
  user: User;
  unreadCounts: UnreadCounts;
  onSignOut: () => void;
  avatarUrl?: string | null;
}) => {
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  return (
    <div className="flex items-center gap-1">
      {/* Quick Actions */}
      <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg p-0.5">
        <Link to="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 relative text-gray-600 hover:text-green-600 hover:bg-white rounded-lg transition-colors duration-200"
          >
            <Bell className="h-3.5 w-3.5" />
            <CountBadge
              count={unreadCounts.notifications}
              type="notifications"
            />
          </Button>
        </Link>
        <Link to="/messages">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 relative text-gray-600 hover:text-green-600 hover:bg-white rounded-lg transition-colors duration-200"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <CountBadge count={unreadCounts.messages} type="messages" />
          </Button>
        </Link>
        <Link to="/cart">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 relative text-gray-600 hover:text-green-600 hover:bg-white rounded-lg transition-colors duration-200"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] text-white bg-green-600 border border-white">
                {cartCount}
              </Badge>
            )}
          </Button>
        </Link>
        <DarkModeToggle />
      </div>

      {/* User Dropdown - Better Touch Target */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center p-1 hover:bg-green-50 rounded-lg transition-colors duration-200 border border-transparent hover:border-green-200 h-9 sm:h-10"
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center overflow-hidden ${avatarUrl ? '' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 rounded-xl shadow-xl border border-gray-100 p-1"
        >
          <DropdownMenuLabel className="pb-1">
            <div className="flex flex-col space-y-0.5">
              <p className="font-semibold text-gray-800 text-xs truncate">
                {user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  "Welcome!"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium mt-0.5"
              >
                <Crown className="h-2.5 w-2.5 mr-0.5" />
                Premium
              </Badge>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 cursor-pointer py-1.5 rounded-lg hover:bg-green-50 transition-colors text-xs"
          >
            <BarChart3 className="h-3.5 w-3.5 text-green-600" />
            Dashboard
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate(`/u/${user.id}`)}
            className="flex items-center gap-2 cursor-pointer py-1.5 rounded-lg hover:bg-green-50 transition-colors text-xs"
          >
            <UserIcon className="h-3.5 w-3.5 text-green-600" />
            My Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/wallet")}
            className="flex items-center gap-2 cursor-pointer py-1.5 rounded-lg hover:bg-green-50 transition-colors text-xs"
          >
            <Wallet className="h-3.5 w-3.5 text-green-600" />
            My Wallet
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2 cursor-pointer py-1.5 rounded-lg hover:bg-green-50 transition-colors text-xs"
          >
            <Settings className="h-3.5 w-3.5 text-green-600" />
            Settings
          </DropdownMenuItem>

          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            <DropdownMenuItem
              onClick={() => navigate("/wishlist")}
              className="flex-col items-center text-xs p-1.5 cursor-pointer rounded-lg hover:bg-green-50 transition-colors"
            >
              <Heart className="h-3 w-3 mb-0.5 text-pink-500" />
              Wishlist
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/analytics")}
              className="flex-col items-center text-xs p-1.5 cursor-pointer rounded-lg hover:bg-green-50 transition-colors"
            >
              <TrendingUp className="h-3 w-3 mb-0.5 text-blue-500" />
              Analytics
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/referrals")}
              className="flex-col items-center text-xs p-1.5 cursor-pointer rounded-lg hover:bg-green-50 transition-colors"
            >
              <Gift className="h-3 w-3 mb-0.5 text-green-500" />
              Referrals
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-2 cursor-pointer py-1.5 rounded-lg hover:bg-amber-50 transition-colors text-xs"
          >
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            Upgrade Plan
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onSignOut}
            className="flex items-center gap-2 cursor-pointer py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Optimized User Actions for desktop
const UserActions = ({
  user,
  unreadCounts,
  isLoading,
  onRefreshCounts,
  onSignOut,
  avatarUrl,
}: {
  user: User;
  unreadCounts: UnreadCounts;
  isLoading: boolean;
  onRefreshCounts: () => void;
  onSignOut: () => void;
  avatarUrl?: string | null;
}) => {
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  const actionButtons = [
    {
      component: "button" as const,
      icon: RefreshCw,
      onClick: onRefreshCounts,
      title: "Refresh counts",
      disabled: isLoading,
    },
    {
      component: "link" as const,
      to: "/notifications",
      icon: Bell,
      count: unreadCounts.notifications,
      type: "notifications" as const,
    },
    {
      component: "link" as const,
      to: "/messages",
      icon: MessageSquare,
      count: unreadCounts.messages,
      type: "messages" as const,
    },
    {
      component: "link" as const,
      to: "/wishlist",
      icon: Heart,
    },
    {
      component: "link" as const,
      to: "/cart",
      icon: ShoppingCart,
      count: cartCount,
      type: "notifications" as const, // Reusing badge style
    },
  ];

  return (
    <div className="hidden md:flex items-center gap-2">
      {/* Quick Actions */}
      <div className="flex items-center gap-0.5 bg-gray-50 rounded-xl p-0.5">
        {actionButtons.map((action, index) => {
          if (action.component === "button") {
            const { icon: Icon, ...props } = action;
            return (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                className="h-8 w-8 relative text-gray-600 hover:text-green-600 hover:bg-white rounded-lg transition-colors duration-200"
                {...props}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            );
          } else {
            const { to, icon: Icon, count, type } = action;
            return (
              <Link key={to} to={to}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 relative text-gray-600 hover:text-green-600 hover:bg-white rounded-lg transition-colors duration-200"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {count !== undefined && (
                    <CountBadge count={count} type={type!} />
                  )}
                </Button>
              </Link>
            );
          }
        })}
        <DarkModeToggle />
      </div>

      {/* List Item Button */}
      <Link to="/products/upload">
        <Button className="flex items-center gap-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-2 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-colors duration-200 font-medium text-xs h-8">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">List Item</span>
        </Button>
      </Link>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-1 p-1 hover:bg-green-50 rounded-lg transition-colors duration-200 border border-transparent hover:border-green-200"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden ${avatarUrl ? '' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                 <UserIcon className="h-3.5 w-3.5 text-white" />
              )}
            </div>
            <div className="hidden lg:flex flex-col items-start">
              <span className="text-xs font-medium text-gray-800 max-w-20 truncate">
                {user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  "Account"}
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-0.5">
                <Crown className="h-2.5 w-2.5 text-amber-500" />
                Premium
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-xl shadow-xl border border-gray-100 p-1"
        >
          <DropdownMenuLabel className="pb-2">
            <div className="flex flex-col space-y-1">
              <p className="font-semibold text-gray-800 text-sm truncate">
                {user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  "Welcome!"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <div className="flex gap-1">
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium"
                >
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  Premium Member
                </Badge>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 cursor-pointer py-2 rounded-lg hover:bg-green-50 transition-colors text-sm"
          >
            <BarChart3 className="h-3.5 w-3.5 text-green-600" />
            <span className="font-medium">Dashboard</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate(`/u/${user.id}`)}
            className="flex items-center gap-2 cursor-pointer py-2 rounded-lg hover:bg-green-50 transition-colors text-sm"
          >
            <UserIcon className="h-3.5 w-3.5 text-green-600" />
            <span className="font-medium">My Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/wallet")}
            className="flex items-center gap-2 cursor-pointer py-2 rounded-lg hover:bg-green-50 transition-colors text-sm"
          >
            <Wallet className="h-3.5 w-3.5 text-green-600" />
            <span className="font-medium">My Wallet</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2 cursor-pointer py-2 rounded-lg hover:bg-green-50 transition-colors text-sm"
          >
            <Settings className="h-3.5 w-3.5 text-green-600" />
            <span className="font-medium">Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="grid grid-cols-2 gap-1 p-0.5">
            <DropdownMenuItem
              onClick={() => navigate("/wishlist")}
              className="flex-col items-center text-xs p-2 cursor-pointer rounded-lg hover:bg-green-50 transition-colors"
            >
              <Heart className="h-3.5 w-3.5 mb-1 text-pink-500" />
              Wishlist
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/analytics")}
              className="flex-col items-center text-xs p-2 cursor-pointer rounded-lg hover:bg-green-50 transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5 mb-1 text-blue-500" />
              Analytics
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/referrals")}
              className="flex-col items-center text-xs p-2 cursor-pointer rounded-lg hover:bg-green-50 transition-colors"
            >
              <Gift className="h-3.5 w-3.5 mb-1 text-green-500" />
              Referrals
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/reviews")}
              className="flex-col items-center text-xs p-2 cursor-pointer rounded-lg hover:bg-green-50 transition-colors"
            >
              <Star className="h-3.5 w-3.5 mb-1 text-amber-500" />
              Reviews
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-2 cursor-pointer py-2 rounded-lg hover:bg-amber-50 transition-colors text-sm"
          >
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-medium">Upgrade Plan</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onSignOut}
            className="flex items-center gap-2 cursor-pointer py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="font-medium">Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Compact Guest Actions
const GuestActions = () => {
  const { getItemCount } = useCart();
  const cartCount = getItemCount();
  
  return (
    <div className="hidden md:flex items-center gap-2">
      <Link to="/pricing">
        <Button
          variant="ghost"
          className="text-gray-600 hover:text-green-600 text-xs font-medium items-center gap-1 transition-colors px-2 py-1 h-7"
        >
          <Crown className="h-3.5 w-3.5 text-amber-500" />
          Pricing
        </Button>
      </Link>
      <Link to="/cart">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ShoppingCart className="h-4 w-4" />
          {cartCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] text-white bg-green-600 border border-white">
              {cartCount}
            </Badge>
          )}
        </Button>
      </Link>
    <Link to="/signin">
      <Button
        variant="outline"
        className="border-green-600 text-green-600 hover:bg-green-50 text-xs h-7 font-medium transition-colors duration-200 px-2"
      >
        Sign In
      </Button>
    </Link>
    <Link to="/register">
      <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs h-7 font-medium shadow-sm hover:shadow-md transition-colors duration-200 px-2">
        Get Started
      </Button>
    </Link>
      <DarkModeToggle />
    </div>
  );
};

// Mobile Search Component
const MobileSearch = ({ onLinkClick }: { onLinkClick?: () => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const cleanQuery = searchQuery.trim().replace(/\/+$/, "");
      navigate(`/marketplace?search=${encodeURIComponent(cleanQuery)}`);
      onLinkClick?.();
    } else {
      navigate("/marketplace");
      onLinkClick?.();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <form onSubmit={handleSearch} className="px-3 mb-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search products, categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 text-sm"
        />
      </div>
    </form>
  );
};

// Optimized Mobile Menu
const MobileMenu = ({
  isOpen,
  onOpenChange,
  user,
  unreadCounts,
  isLoading,
  onRefreshCounts,
  onSignOut,
  avatarUrl,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  unreadCounts: UnreadCounts;
  isLoading: boolean;
  onRefreshCounts: () => void;
  onSignOut: () => void;
  avatarUrl?: string | null;
}) => {
  const navigate = useNavigate();
  const handleLinkClick = () => onOpenChange(false);

  const handleCategoryClick = (category: string) => {
    navigate(`/marketplace?category=${category.toLowerCase()}`);
    handleLinkClick();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0 border-l border-gray-100">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="SellHubShop Logo"
                className="w-7 h-7 rounded-lg"
              />
              <span className="font-bold text-base text-gray-900">
                SellHubShop
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="hover:bg-gray-100 rounded-lg h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Content */}
          <div className="flex-1 py-3 overflow-y-auto">
            <MobileSearch onLinkClick={handleLinkClick} />

            <div className="px-3 mb-3">
              <NavigationLinks mobile onLinkClick={handleLinkClick} />
            </div>

            <div className="px-3 mb-3">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                Categories
              </h3>
              <div className="space-y-0.5">
                {[
                  { icon: Smartphone, label: "Electronics" },
                  { icon: Shirt, label: "Fashion" },
                  { icon: Car, label: "Vehicles" },
                  { icon: Building, label: "Property" },
                  { icon: Home, label: "Home & Garden" },
                ].map(({ icon: Icon, label }) => (
                  <Button
                    key={label}
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:text-green-600 hover:bg-green-50 text-xs py-1.5 transition-colors"
                    onClick={() => handleCategoryClick(label)}
                  >
                    <Icon className="h-3.5 w-3.5 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {user ? (
              <div className="px-3 space-y-2">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${avatarUrl ? '' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {user.user_metadata?.full_name || "Account"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <Link to="/notifications" onClick={handleLinkClick}>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-gray-600 border-gray-200 text-xs h-7 transition-colors"
                    >
                      <Bell className="h-3.5 w-3.5 mr-1" />
                      Notifications
                      {unreadCounts.notifications > 0 && (
                        <Badge className="ml-1 bg-amber-500 text-white text-xs">
                          {unreadCounts.notifications}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Link to="/messages" onClick={handleLinkClick}>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-gray-600 border-gray-200 text-xs h-7 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      Messages
                      {unreadCounts.messages > 0 && (
                        <Badge className="ml-1 bg-blue-500 text-white text-xs">
                          {unreadCounts.messages}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </div>

                <Link to="/settings" onClick={handleLinkClick}>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-gray-600 border-gray-200 text-xs h-7 transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 mr-1" />
                    Settings
                  </Button>
                </Link>

                <Link to="/products/upload" onClick={handleLinkClick}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-7 transition-colors">
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    List New Item
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="px-3 space-y-2">
                <Link to="/pricing" onClick={handleLinkClick}>
                  <Button
                    variant="outline"
                    className="w-full border-amber-400 text-amber-700 hover:bg-amber-50 text-xs h-7 transition-colors"
                  >
                    <Crown className="h-3.5 w-3.5 mr-1" />
                    View Pricing
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/signin">
                    <Button
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50 text-xs h-7 transition-colors"
                      onClick={handleLinkClick}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-7 transition-colors"
                      onClick={handleLinkClick}
                    >
                      Join Free
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};


// Compact Promotional Bar - Hidden on mobile for better UX
const PromotionalBar = memo(() => (
  <div className="hidden sm:block bg-gradient-to-r from-green-600 to-green-700 text-white py-1.5">
    <div className="max-w-7xl mx-auto px-3">
      <div className="flex items-center justify-center text-xs">
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-yellow-300" />
          <span className="font-medium mr-1">Exclusive Deals - Premium Marketplace for Everyone!</span>
        </div>
      </div>
    </div>
  </div>
));

// Compact Trust Indicators - Optimized for mobile
const TrustIndicators = memo(() => (
  <div className="border-b border-gray-100 bg-white">
    <div className="max-w-7xl mx-auto px-2 sm:px-3 py-1 sm:py-1.5">
      <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600">
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto flex-1 scrollbar-hide">
          <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
            <Shield className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-green-600" />
            <span className="hidden xs:inline">Secure Payments</span>
            <span className="xs:hidden">Secure</span>
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
            <Award className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-green-600" />
            <span className="hidden xs:inline">Trusted Sellers</span>
            <span className="xs:hidden">Trusted</span>
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
            <Clock className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-green-600" />
            <span className="hidden xs:inline">Fast Delivery</span>
            <span className="xs:hidden">Fast</span>
          </span>
        </div>
      </div>
    </div>
  </div>
));



export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { unreadCounts, isLoading, refreshCounts } = useUnreadCounts(
    user?.id || null
  );

  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  const initializeUser = useCallback(async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(user);
    } catch (error) {
      console.error("Auth error:", error);
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    initializeUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
    });

    return () => subscription.unsubscribe();
  }, [initializeUser]);

  useEffect(() => {
    async function getProfile() {
      if (!user) {
        setAvatarUrl(null);
        return;
      }
      try {
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
        if (data) setAvatarUrl(data.avatar_url);
      } catch (error) {
        console.error("Error loading avatar:", error);
      }
    }
    getProfile();
  }, [user]);

  return (
    <header className="bg-white/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <PromotionalBar />
      <TrustIndicators />
      <ScrollableBanner />

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">

        {/* ROW 1: Logo and Actions */}
        <div className="flex items-center justify-between gap-4 mb-3">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-1.5 group flex-shrink-0"
          >
            <img
              src={logo}
              alt="SellHubShop Logo"
              loading="eager"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg transition-all shadow-md ring-1 ring-primary/20 hover:scale-105 duration-300"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-primary to-emerald-700 bg-clip-text text-transparent truncate">
                SellHubShop
              </span>
              <span className="text-[10px] text-gray-500 font-medium hidden sm:block">
                Premium Marketplace
              </span>
            </div>
          </Link>

          {/* Actions (Desktop & Mobile) */}
          <div className="flex items-center gap-2">

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <UserActions
                  user={user}
                  unreadCounts={unreadCounts}
                  isLoading={isLoading}
                  onRefreshCounts={refreshCounts}
                  onSignOut={handleSignOut}
                  avatarUrl={avatarUrl}
                />
              ) : (
                <GuestActions />
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-1.5">
              {user && (
                <CompactUserActions
                  user={user}
                  unreadCounts={unreadCounts}
                  onSignOut={handleSignOut}
                  avatarUrl={avatarUrl}
                />
              )}
              {!user && (
                <Link to="/signin">
                  <Button variant="outline" size="sm" className="h-8 text-xs px-3 border-green-600 text-green-600">
                    Sign In
                  </Button>
                </Link>
              )}
              {!user && (
                <Link to="/cart">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 relative text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] text-white bg-green-600 border border-white">
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}
              <MobileMenu
                isOpen={isMobileMenuOpen}
                onOpenChange={setIsMobileMenuOpen}
                user={user}
                unreadCounts={unreadCounts}
                isLoading={isLoading}
                onRefreshCounts={refreshCounts}
                onSignOut={handleSignOut}
                avatarUrl={avatarUrl}
              />
            </div>
          </div>
        </div>

        {/* ROW 2: Navigation / Titles (Scrollable on mobile) */}
        <div className="mb-3 overflow-x-auto -mx-3 px-3 scrollbar-hide">
          <div className="flex items-center gap-2 sm:gap-4 min-w-max">
            <CategoriesDropdown />
            <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
            <NavigationLinks />

            <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
            {/* Location/Info Badge */}
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
              <MapPin className="h-3 w-3 text-green-600" />
              <span>Nairobi</span>
            </div>
          </div>
        </div>

        {/* ROW 3: Search Bar (Full Width) */}
        <div className="w-full">
          <SearchBar />
        </div>

      </div>
    </header>
  );
}
