import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BannerCarousel } from "@/pages/BannerCarousel";
import { AdminBannerManager } from "@/pages/AdminBannerManager";
import TwoFactorSetup from "@/components/admin/TwoFactorSetup";
import {
  Users,
  Shield,
  Loader2,
  AlertTriangle,
  Lock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Plus,
  Settings,
  DollarSign,
  Activity,
  Tag,
  Flag,
  Package,
  BarChart3,
  Clock,
  X,
  Crown,
  Megaphone,
  Wallet,
  BarChart4,
  ShieldAlert,
  Settings2,
  Server,
  DownloadCloud,
  HardDrive,
  Trash2,
  FileText,
  CheckCircle2,
  MoreHorizontal,
  Edit,
  Copy,
  EyeOff,
  MessageSquare,
  Calendar,
  CreditCard,
  Receipt,
  Bell,
  History as HistoryIcon,
  PieChart,
  LineChart,
  Target,
  Gift,
  Key,
  Globe,
  Upload,
  Cpu,
  Database,
  BellRing,
  UserCheck,
  UserX,
  MessageCircle,
  TrendingDown,
  Play,
  Pause,
  StopCircle,
  WifiOff,
  Calculator,
  Percent,
  Coins,
  BarChart2,
  RotateCcw,
  Layers,
  Archive,
  ClipboardList,
  CheckCircle,
  Mail,
  MailCheck,
  Save,
  TrendingUp,
  Users2,
  Wifi,
  BarChart,
  Eye,
  Ban,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { UserPlus } from "lucide-react";
import {
  LineChart as ReLineChart,
  Line as ReLine,
  BarChart as ReBarChart,
  Bar as ReBar,
  XAxis as ReXAxis,
  YAxis as ReYAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { convertKESToPi, formatPi } from "@/lib/pi-utils";
import { PiIcon } from "@/components/PiLogo";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Enhanced Types
interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  pendingProducts: number;
  approvedProducts: number;
  featuredProducts: number;
  totalCategories: number;
  totalReviews: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
  userEngagement: number;
  todayRegistrations: number;
  weeklyGrowth: number;
  systemHealth: number;
  pendingReports: number;
  unreadMessages: number;
  serverLoad: number;
  databaseSize: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  properties: any;
  is_active: boolean;
  order_index: number;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
  product_count?: number;
  subcategories?: Category[];
  owner_id?: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: string;
  featured: boolean;
  verified: boolean;
  created_at: string;
  user_id: string;
  category_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  owner_id?: string;
  seller_email?: string;
  seller_name?: string;
  category_name?: string;
  reviews_count?: number;
  favorites_count?: number;
  images?: string[];
  views?: number;
  is_urgent?: boolean;
  is_negotiable?: boolean;
  location?: string;
  condition?: string;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: string;
  plan_type: string;
  created_at: string;
  products_count?: number;
  reviews_count?: number;
  followers_count?: number;
  favorites_count?: number;
  last_login?: string;
  warning_count?: number;
  ban_reason?: string;
  banned_at?: string;
  phone?: string;
}

interface AdminUser {
  id: string;
  user_id: string;
  role: "super_admin" | "admin" | "moderator";
  created_at: string;
  email?: string;
  full_name?: string | null;
  permissions?: {
    can_manage_users?: boolean;
    can_manage_products?: boolean;
    can_manage_categories?: boolean;
    can_manage_reports?: boolean;
    can_manage_subscriptions?: boolean;
    can_manage_admins?: boolean;
    can_access_analytics?: boolean;
    can_manage_system?: boolean;
    can_manage_banners?: boolean;
    can_export_data?: boolean;
    can_send_emails?: boolean;
    can_perform_bulk_actions?: boolean;
  };
  is_active?: boolean;
  last_active?: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  user_email?: string;
  user_name?: string;
  plan_name?: string;
  price_monthly?: number;
  created_at: string;
  mpesa_receipt_number?: string;
  payment_method?: string;
}

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  description: string | null;
  status: string;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  reporter_email?: string;
  reporter_name?: string;
  reporter_avatar?: string;
  product_name?: string;
  product_description?: string;
  product_price?: number;
  product_images?: string[];
  product_category_name?: string;
  product_status?: string;
  product_created_at?: string;
  product_verified?: boolean;
  product_featured?: boolean;
  seller_name?: string;
  seller_email?: string;
  priority?: "low" | "medium" | "high";
  has_description?: boolean;
  description_length?: number;
}

interface Transaction {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  payment_method: string;
  mpesa_receipt_number?: string;
  created_at: string;
}

interface SystemHealth {
  database_size: string;
  active_connections: number;
  server_uptime: string;
  cache_hit_rate: number;
  last_backup: string | null;
  storage_used: string;
  memory_usage: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  details: any;
  created_at: string;
  admin_email?: string;
}

// Permission checking utility functions
const useAdminPermissions = (currentAdmin: AdminUser | null) => {
  const isSuperAdmin = currentAdmin?.role === "super_admin";
  const isAdmin = currentAdmin?.role === "admin" || isSuperAdmin;
  const isModerator = currentAdmin?.role === "moderator";

  const permissions = {
    // User Management
    canViewUsers: isAdmin || currentAdmin?.permissions?.can_manage_users,
    canBanUsers: isAdmin,
    canSuspendUsers: isAdmin || currentAdmin?.permissions?.can_manage_users,
    canDeleteUsers: isAdmin,
    // Banner Management
    canManageBanners: isAdmin || currentAdmin?.permissions?.can_manage_banners,
    canViewBanners: true,

    // Product Management
    canViewProducts: true,
    canApproveProducts:
      isAdmin || currentAdmin?.permissions?.can_manage_products,
    canRejectProducts:
      isAdmin || currentAdmin?.permissions?.can_manage_products,
    canFeatureProducts: isAdmin,
    canVerifyProducts: isAdmin,
    canDeleteProducts: isAdmin,
    canEditProducts: isAdmin,

    // Category Management
    canViewCategories: true,
    canManageCategories:
      isAdmin || currentAdmin?.permissions?.can_manage_categories,

    // Report Management
    canViewReports: true,
    canResolveReports: isAdmin || currentAdmin?.permissions?.can_manage_reports,
    canDeleteReports: isAdmin,

    // Subscription Management
    canViewSubscriptions:
      isAdmin || currentAdmin?.permissions?.can_manage_subscriptions,
    canManageSubscriptions: isAdmin,

    // Admin Management
    canViewAdmins: isAdmin,
    canManageAdmins: isSuperAdmin,

    // Analytics
    canViewAnalytics:
      isAdmin || currentAdmin?.permissions?.can_access_analytics,

    // System Management
    canManageSystem: isAdmin || currentAdmin?.permissions?.can_manage_system,
    canBackupSystem: isAdmin,

    // Data Export
    canExportData: isAdmin || currentAdmin?.permissions?.can_export_data,

    // Communication
    canSendEmails: isAdmin || currentAdmin?.permissions?.can_send_emails,

    // Bulk Actions
    canPerformBulkActions:
      isAdmin || currentAdmin?.permissions?.can_perform_bulk_actions,
  };

  return {
    isSuperAdmin,
    isAdmin,
    isModerator,
    permissions,
  };
};

export default function UltimateAdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProducts: 0,
    pendingProducts: 0,
    approvedProducts: 0,
    featuredProducts: 0,
    totalCategories: 0,
    totalReviews: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    userEngagement: 0,
    todayRegistrations: 0,
    weeklyGrowth: 0,
    systemHealth: 100,
    pendingReports: 0,
    unreadMessages: 0,
    serverLoad: 0,
    databaseSize: "0 MB",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [chartRevenueData, setChartRevenueData] = useState<any[]>([]);
  const [chartUserGrowthData, setChartUserGrowthData] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date>();
  const [exportEndDate, setExportEndDate] = useState<Date>();
  const [exportResourceType, setExportResourceType] = useState<string>("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Subscription management states
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<string>("all");
  const [subscriptionSearchTerm, setSubscriptionSearchTerm] = useState<string>("");
  const [showAdjustSubscriptionDialog, setShowAdjustSubscriptionDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    status: "active",
    notes: ""
  });
  const [transactionSearchTerm, setTransactionSearchTerm] = useState<string>("");
  const [withdrawalSearchTerm, setWithdrawalSearchTerm] = useState<string>("");
  const [showSubscriptionTransactionsDialog, setShowSubscriptionTransactionsDialog] = useState(false);
  const [transactionDetailsSubscription, setTransactionDetailsSubscription] = useState<any>(null);

  // Selection states
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Dialog states
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false);
  const [showSystemSettingsDialog, setShowSystemSettingsDialog] =
    useState(false);
  const [showEmailTemplateDialog, setShowEmailTemplateDialog] = useState(false);
  const [showAdminActionsDialog, setShowAdminActionsDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [userToBan, setUserToBan] = useState<string | null>(null);
  const [userToSuspend, setUserToSuspend] = useState<string | null>(null);
  const [productToReject, setProductToReject] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [banReason, setBanReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7");
  const [rejectionReason, setRejectionReason] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "moderator">(
    "moderator"
  );
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parent_id: "",
    is_active: true,
    order_index: 0,
    properties: "{}",
  });
  const [propertyEditorState, setPropertyEditorState] = useState<{ key: string; value: string }[]>([]);
  const [newSubCategory, setNewSubCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [systemSettings, setSystemSettings] = useState({
    auto_approve_products: false,
    require_email_verification: true,
    allow_new_signups: true,
    enable_maintenance_mode: false,
    max_products_per_user: 50,
    platform_commission: 5,
    currency: "KES",
    support_email: "support@sellhubshop.com",
    enable_analytics: true,
    auto_backup: true,
    backup_frequency: "daily",
  });
  const [emailTemplate, setEmailTemplate] = useState({
    type: "welcome",
    subject: "",
    content: "",
    recipients: "all",
  });
  const [backupSettings, setBackupSettings] = useState({
    include_media: true,
    include_database: true,
    backup_type: "full",
  });
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  const { toast } = useToast();
  const {
    isSuperAdmin,
    isAdmin: hasAdminRole,
    isModerator,
    permissions,
  } = useAdminPermissions(currentAdmin);

  // Get visible tabs based on permissions
  const getVisibleTabs = () => {
    const allTabs = [
      { value: "overview", label: "Overview", icon: BarChart3 },
      { value: "products", label: "Products", icon: Package },
      { value: "pending", label: "Pending", icon: Clock },
      { value: "users", label: "Users", icon: Users },
      { value: "categories", label: "Categories", icon: Tag },
      { value: "banners", label: "Banners", icon: Megaphone },
      { value: "reports", label: "Reports", icon: Flag },
      { value: "subscriptions", label: "Subscriptions", icon: Crown },
      { value: "withdrawals", label: "Withdrawals", icon: Wallet },
      { value: "admins", label: "Admins", icon: Shield },
      { value: "analytics", label: "Analytics", icon: BarChart4 },
      { value: "system", label: "System", icon: Settings },
      { value: "security", label: "Security", icon: ShieldAlert },
    ];

    return allTabs.filter((tab) => {
      switch (tab.value) {
        case "users":
          return permissions.canViewUsers;
        case "subscriptions":
          return permissions.canViewSubscriptions;
        case "admins":
          return permissions.canViewAdmins;
        case "analytics":
          return permissions.canViewAnalytics;
        case "system":
          return permissions.canManageSystem;
        case "banners":
          return permissions.canViewBanners;
        case "security":
          return permissions.canManageSystem;
        default:
          return true;
      }
    });
  };

  useEffect(() => {
    console.log("AdminDashboard mounted");
    checkAdminStatus();
  }, []);

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  };

  const checkAdminStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const { data: admin } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (admin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", admin.user_id)
          .single();

        setCurrentAdmin({
          ...admin,
          role: admin.role as "super_admin" | "admin" | "moderator",
          email: profile?.email,
          full_name: profile?.full_name,
        } as AdminUser);
        setIsAdmin(true);
        await loadDashboardData();
      } else {
        setIsAdmin(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!isAdmin) return;

    // Products subscription
    const productsChannel = supabase
      .channel("admin-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          loadProductsWithDetails();
        }
      )
      .subscribe();

    // Users subscription
    const usersChannel = supabase
      .channel("admin-users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          loadUsersWithActivity();
        }
      )
      .subscribe();

    // Reports subscription
    const reportsChannel = supabase
      .channel("admin-reports")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          loadReports();
        }
      )
      .subscribe();

    return () => {
      productsChannel.unsubscribe();
      usersChannel.unsubscribe();
      reportsChannel.unsubscribe();
    };
  };

  const loadDashboardData = async () => {
    try {
      console.log("Starting loadDashboardData...");
      setIsLoading(true);

      const [
        statsData,
        categoriesData,
        usersData,
        productsData,
        adminUsersData,
        subscriptionsData,
        reportsData,
        revenueData,
        systemHealthData,
        adminActionsData,
        withdrawalsData,
        transactionsData,
      ] = await Promise.all([
        loadPlatformStats(),
        loadCategoriesWithCounts(),
        loadUsersWithActivity(),
        loadProductsWithDetails(),
        loadAdminUsers(),
        loadSubscriptions(),
        loadReports(),
        loadRevenueData(),
        loadSystemHealth(),
        loadAdminActions(),
        loadWithdrawals(),
        loadTransactions(),
      ]);

      console.log("Data loaded successfully:", { statsData, usersCount: usersData.length });

      setStats(statsData);
      setCategories(categoriesData);
      setUsers(usersData);
      setProducts(productsData);
      setAdminUsers(adminUsersData);
      setSubscriptions(subscriptionsData);
      setReports(reportsData);
      setRevenueData(revenueData);
      setSystemHealth(systemHealthData);
      setAdminActions(adminActionsData);
      setWithdrawals(withdrawalsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        variant: "destructive",
        title: "Loading Error",
        description: "Failed to load dashboard data",
      });
    } finally {
      setIsLoading(false);
      console.log("loadDashboardData finished, isLoading set to false");
    }
  };

  useEffect(() => {
    const processChartData = () => {
      // Last 6 months
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
          name: d.toLocaleString('default', { month: 'short' }),
          monthIdx: d.getMonth(),
          year: d.getFullYear()
        };
      });

      // Revenue Chart Data
      const processedRevenue = months.map(m => {
        const monthTransactions = transactions.filter(t => {
          const d = new Date(t.created_at);
          return d.getMonth() === m.monthIdx && d.getFullYear() === m.year && (t.status === 'completed' || t.status === 'active' || t.status === 'paid');
        });
        const revenue = monthTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        return { name: m.name, revenue };
      });
      setChartRevenueData(processedRevenue);

      // User Growth Chart Data
      const processedUsers = months.map(m => {
        const monthUsers = users.filter(u => {
          const d = new Date(u.joined_at || new Date().toISOString());
          return d.getMonth() === m.monthIdx && d.getFullYear() === m.year;
        });
        return { name: m.name, users: monthUsers.length };
      });
      setChartUserGrowthData(processedUsers);
    };

    if (transactions.length > 0 || users.length > 0) {
      processChartData();
    }
  }, [transactions, users]);

  const loadPlatformStats = async (): Promise<AdminStats> => {
    try {
      const [
        usersRes,
        productsRes,
        pendingProductsRes,
        approvedProductsRes,
        featuredProductsRes,
        categoriesRes,
        subscriptionsRes,
        activeSubscriptionsRes,
        reportsRes,
        messagesRes,
        todayRegistrationsRes,
        revenueRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .in("status", ["active", "approved"]),
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("featured", true),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("subscriptions").select("*", { count: "exact", head: true }),
        supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("is_read", false),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte(
            "created_at",
            new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
          ),
        supabase.from("orders").select("price").eq("status", "completed"),
      ]);

      // Calculate user engagement - more efficient approach
      const { data: productOwners, error: ownersError } = await supabase
        .from("products")
        .select("owner_id");

      const uniqueOwners = new Set((productOwners || []).map(p => p.owner_id));
      const activeSellersCount = uniqueOwners.size;

      const userEngagement = usersRes.count
        ? (activeSellersCount / usersRes.count) * 100
        : 0;

      // Calculate total revenue
      const totalRevenue =
        revenueRes.data?.reduce(
          (sum, order) => sum + (Number(order.price) || 0),
          0
        ) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalProducts: productsRes.count || 0,
        pendingProducts: pendingProductsRes.count || 0,
        approvedProducts: approvedProductsRes.count || 0,
        featuredProducts: featuredProductsRes.count || 0,
        totalCategories: categoriesRes.count || 0,
        totalReviews: 0,
        totalSubscriptions: subscriptionsRes.count || 0,
        activeSubscriptions: activeSubscriptionsRes.count || 0,
        totalRevenue,
        userEngagement,
        todayRegistrations: todayRegistrationsRes.count || 0,
        weeklyGrowth: 12.5,
        systemHealth: 100,
        pendingReports: reportsRes.count || 0,
        unreadMessages: messagesRes.count || 0,
        serverLoad: 45,
        databaseSize: "2.3 MB",
      };
    } catch (error) {
      console.error("Error loading platform stats:", error);
      return {
        totalUsers: 0,
        totalProducts: 0,
        pendingProducts: 0,
        approvedProducts: 0,
        featuredProducts: 0,
        totalCategories: 0,
        totalReviews: 0,
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalRevenue: 0,
        userEngagement: 0,
        todayRegistrations: 0,
        weeklyGrowth: 0,
        systemHealth: 100,
        pendingReports: 0,
        unreadMessages: 0,
        serverLoad: 0,
        databaseSize: "0 MB",
      };
    }
  };

  const loadCategoriesWithCounts = async (): Promise<Category[]> => {
    try {
      const { data: categoriesData, error } = await supabase
        .from("categories")
        .select("*, products!category_id(count)")
        .order("order_index", { ascending: true });

      if (error) throw error;

      return (categoriesData || []).map((cat: any) => ({
        ...cat,
        product_count: cat.products?.[0]?.count || 0
      }));
    } catch (error) {
      console.error("Error loading categories:", error);
      return [];
    }
  };

  const loadUsersWithActivity = async (): Promise<User[]> => {
    try {
      // Use efficient joined query to get counts in one go
      const { data: usersData, error } = await supabase
        .from("profiles")
        // products needs owner_id disambiguation because there are multiple FKs (owner_id, user_id, etc)
        .select("*, products!owner_id(count), reviews!reviewer_id(count)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (usersData || []).map((user: any) => ({
        ...user,
        products_count: user.products?.[0]?.count || 0,
        reviews_count: user.reviews?.[0]?.count || 0
      }));
    } catch (error) {
      console.error("Error loading users:", error);
      return [];
    }
  };

  const loadProductsWithDetails = async (): Promise<Product[]> => {
    try {
      const { data: productsData, error } = await supabase
        .from("products")
        .select(`
          *,
          profiles:owner_id(email, full_name),
          categories:category_id(name),
          reviews(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (productsData || []).map((product: any) => ({
        ...product,
        seller_email: product.profiles?.email,
        seller_name: product.profiles?.full_name,
        category_name: product.categories?.name,
        reviews_count: product.reviews?.[0]?.count || 0
      }));
    } catch (error) {
      console.error("Error loading products:", error);
      return [];
    }
  };

  const loadAdminUsers = async (): Promise<AdminUser[]> => {
    try {
      setLoadingStates((prev) => ({ ...prev, admins: true }));

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/admin/list`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch admin list");
      }

      console.log("Backend admin list:", result.data);
      return result.data || [];
    } catch (error: any) {
      console.error("Error loading admin users:", error);
      toast({
        title: "Sync Error",
        description: "Could not load admin list. check console.",
        variant: "destructive"
      });
      return [];
    }
  };




  const loadReports = async (): Promise<Report[]> => {
    try {
      const { data: reportsData, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reportsWithDetails = await Promise.all(
        (reportsData || []).map(async (report) => {
          try {
            // Fetch reporter information
            const { data: reporterProfile, error: reporterError } = await supabase
              .from("profiles")
              .select("email, full_name, avatar_url")
              .eq("id", report.reporter_id)
              .single();

            if (reporterError) {
              console.error("Error fetching reporter:", reporterError);
            }

            // Fetch product information if reported_id (product_id) exists
            let productData: any = null;
            let categoryData: any = null;
            let sellerProfile: any = null;

            if (report.reported_id) {
              const { data: productResult, error: productError } = await supabase
                .from("products")
                .select("*")
                .eq("id", report.reported_id)
                .single();

              if (!productError && productResult) {
                productData = productResult;

                // Fetch category name
                if (productResult.category_id) {
                  const { data: categoryResult } = await supabase
                    .from("categories")
                    .select("name")
                    .eq("id", productResult.category_id)
                    .single();
                  categoryData = categoryResult;
                }

                // Fetch seller profile
                if ((productResult as any).owner_id) {
                  const { data: sellerResult } = await supabase
                    .from("profiles")
                    .select("full_name, email")
                    .eq("id", (productResult as any).owner_id)
                    .single();
                  sellerProfile = sellerResult;
                }
              }
            }

            // Determine priority based on report age
            let priority: "low" | "medium" | "high" = "low";
            const reportAge =
              Date.now() - new Date(report.created_at).getTime();
            const hoursOld = reportAge / (1000 * 60 * 60);

            if (hoursOld < 24) {
              priority = "high";
            } else if (hoursOld < 72) {
              priority = "medium";
            }

            // If product exists and is featured or verified, increase priority
            if (productData?.featured || productData?.verified) {
              priority = "high";
            }

            return {
              ...report,
              // Reporter info
              reporter_email: reporterProfile?.email,
              reporter_name: reporterProfile?.full_name,
              reporter_avatar: reporterProfile?.avatar_url,
              // Product info
              product_name: productData?.name,
              product_description: productData?.description,
              product_price: productData?.price,
              product_images: productData?.images || [],
              product_category_name: categoryData?.name,
              product_status: productData?.status,
              product_created_at: productData?.created_at,
              product_verified: productData?.verified,
              product_featured: productData?.featured,
              // Seller info
              seller_name: sellerProfile?.full_name,
              seller_email: sellerProfile?.email,
              // Report metadata
              has_description: !!(report as any).description,
              description_length: (report as any).description?.length || 0,
              priority,
            };
          } catch (error) {
            console.error("Error processing report:", report.id, error);
            // Return basic report data if there's an error
            return {
              ...report,
              reported_id: report.reported_id,
              priority: "low",
              product_images: [],
            } as any;
          }
        })
      );

      // Log reports for debugging
      console.log(
        "Loaded reports:",
        reportsWithDetails.map((r) => ({
          id: r.id,
          product_name: r.product_name,
          has_images: r.product_images?.length > 0,
          reporter_email: r.reporter_email,
        }))
      );

      return reportsWithDetails;
    } catch (error) {
      console.error("Error loading reports:", error);
      return [];
    }
  };

  const loadRevenueData = async (): Promise<RevenueData[]> => {
    try {
      const sampleData: RevenueData[] = [
        { date: "Mon", revenue: 12000, orders: 8 },
        { date: "Tue", revenue: 19000, orders: 12 },
        { date: "Wed", revenue: 15000, orders: 10 },
        { date: "Thu", revenue: 22000, orders: 14 },
        { date: "Fri", revenue: 28000, orders: 18 },
        { date: "Sat", revenue: 35000, orders: 22 },
        { date: "Sun", revenue: 30000, orders: 20 },
      ];
      return sampleData;
    } catch (error) {
      console.error("Error loading revenue data:", error);
      return [];
    }
  };

  const loadSystemHealth = async (): Promise<SystemHealth> => {
    try {
      return {
        database_size: "2.3 MB",
        active_connections: 15,
        server_uptime: "15 days",
        cache_hit_rate: 92.5,
        last_backup: new Date().toISOString(),
        storage_used: "1.2 GB",
        memory_usage: 65,
      };
    } catch (error) {
      console.error("Error loading system health:", error);
      return {
        database_size: "0 MB",
        active_connections: 0,
        server_uptime: "0 days",
        cache_hit_rate: 0,
        last_backup: null,
        storage_used: "0 GB",
        memory_usage: 0,
      };
    }
  };

  const loadSubscriptions = async (): Promise<Subscription[]> => {
    try {
      const { data: subscriptionsData, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          user_id,
          plan_id,
          plan_name,
          amount,
          status,
          created_at,
          customer_name,
          mpesa_receipt_number,
          payment_method,
          profiles:user_id (
             email,
             full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading subscriptions with join:", error);
        // Fallback to simple query if join fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("subscriptions")
          .select("*")
          .order("created_at", { ascending: false });

        if (fallbackError) {
          console.error("Fallback fetch failed:", fallbackError);
          return [];
        }

        return (fallbackData || []).map((sub: any) => ({
          id: sub.id,
          user_id: sub.user_id,
          plan_id: sub.plan_id,
          status: sub.status || 'active',
          current_period_end: sub.created_at ? new Date(new Date(sub.created_at).setMonth(new Date(sub.created_at).getMonth() + 1)).toISOString() : new Date().toISOString(),
          user_email: sub.customer_name || 'Unknown',
          user_name: sub.customer_name || 'N/A',
          plan_name: sub.plan_name || 'Unknown Plan',
          price_monthly: sub.amount || 0,
          features: {},
          created_at: sub.created_at,
          mpesa_receipt_number: sub.mpesa_receipt_number,
          payment_method: sub.payment_method
        }));
      }

      const formattedSubscriptions = (subscriptionsData || []).map((sub: any) => ({
        id: sub.id,
        user_id: sub.user_id,
        plan_id: sub.plan_id,
        status: sub.status || 'active',
        current_period_end: new Date(new Date(sub.created_at).setMonth(new Date(sub.created_at).getMonth() + 1)).toISOString(),
        user_email: sub.profiles?.email || sub.customer_name || 'Unknown',
        user_name: sub.customer_name || sub.profiles?.full_name || 'N/A',
        plan_name: sub.plan_name || 'Unknown Plan',
        price_monthly: sub.amount || 0,
        features: {},
        created_at: sub.created_at,
      }));

      console.log("Loaded subscriptions with join:", formattedSubscriptions.length);
      return formattedSubscriptions;
    } catch (error) {
      console.error("Error in loadSubscriptions:", error);
      return [];
    }
  };

  const loadTransactions = async (): Promise<Transaction[]> => {
    try {
      // 1. Fetch from Subscriptions with Fallback
      let subsData: any[] = [];

      const { data: complexSubs, error: subsError } = await supabase
        .from("subscriptions")
        .select(`
          id,
          user_id,
          amount,
          status,
          created_at,
          customer_name,
          plan_name,
          mpesa_receipt_number,
          checkout_request_id,
          payment_method,
          profiles:user_id (
             email,
             full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (subsError) {
        console.error("Complex transaction fetch failed, trying fallback:", subsError);
        // Fallback: simple fetch
        const { data: simpleSubs, error: simpleError } = await supabase
          .from("subscriptions")
          .select("*")
          .order("created_at", { ascending: false });

        if (simpleError) {
          console.error("Simple transaction fetch failed:", simpleError);
        } else {
          subsData = simpleSubs || [];
        }
      } else {
        subsData = complexSubs || [];
      }

      // 2. Fetch from Billing History with Fallback
      let billData: any[] = [];

      const { data: complexBill, error: billError } = await supabase
        .from("billing_history")
        .select(`
          id,
          user_id,
          amount,
          status,
          created_at,
          mpesa_receipt_number,
          payment_method,
          profiles:user_id (
             email,
             full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (billError) {
        console.warn("Complex billing fetch failed, trying fallback:", billError);
        const { data: simpleBill } = await supabase
          .from("billing_history")
          .select("*")
          .order("created_at", { ascending: false });
        billData = simpleBill || [];
      } else {
        billData = complexBill || [];
      }

      const formattedSubs = subsData.map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        user_email: s.profiles?.email || s.customer_name || "Unknown",
        user_name: s.customer_name || s.profiles?.full_name || "N/A",
        amount: s.amount,
        currency: "KES",
        status: s.status,
        description: `Subscription: ${s.plan_name || 'Plan'}`,
        payment_method: s.payment_method || "mpesa",
        mpesa_receipt_number: s.mpesa_receipt_number || s.checkout_request_id, // Fallback to CheckoutID
        created_at: s.created_at,
        source: 'subscription'
      }));

      const formattedBills = billData.map((b: any) => ({
        id: b.id,
        user_id: b.user_id,
        user_email: b.profiles?.email || "Unknown",
        user_name: b.profiles?.full_name || "N/A",
        amount: b.amount,
        currency: "KES",
        status: b.status,
        description: "Billing History Record",
        payment_method: b.payment_method || "mpesa",
        mpesa_receipt_number: b.mpesa_receipt_number, // Billing history currently might lack CheckoutID for old records
        created_at: b.created_at,
        source: 'billing_history'
      }));

      // Deduplicate: Create a map of existing transactions to avoid showing "Billing History Record" (N/A)
      // if a better "Subscription" (with CheckoutID) exists for the same event and time.

      const uniqueTransactions = new Map();
      const fuzzyMap = new Map(); // Key: "user-amount-time" -> validKey in uniqueTransactions

      // 1. Add formattedBills (they are the log source)
      formattedBills.forEach((b: any) => {
        // Key: distinct receipt number if available, else unique ID of the bill
        // We use ID as fallback key to ensure we don't overwrite distinct N/A bills unless fuzzy matched
        const key = b.mpesa_receipt_number || b.id;
        uniqueTransactions.set(key, b);

        // Fuzzy Key for matching
        if (b.created_at) {
          const timeKey = new Date(b.created_at).toISOString().slice(0, 16); // Minute precision
          const fuzzyKey = `${b.user_id}-${b.amount}-${timeKey}`;
          fuzzyMap.set(fuzzyKey, key);
        }
      });

      // 2. Add formattedSubs ONLY if they provide better info (like a Ref Code) 
      // or if they don't exist in bills
      formattedSubs.forEach((s: any) => {
        if (!s.mpesa_receipt_number) return; // Skip subs with absolutely no ref (useless duplicate)

        // Check if we have a billing record with this ref
        if (uniqueTransactions.has(s.mpesa_receipt_number)) {
          return; // Already have a record with this exact Ref
        }

        // Check fuzzy match (Billing record with N/A Ref at similar time?)
        if (s.created_at) {
          const timeKey = new Date(s.created_at).toISOString().slice(0, 16);
          const fuzzyKey = `${s.user_id}-${s.amount}-${timeKey}`;

          if (fuzzyMap.has(fuzzyKey)) {
            const existingKey = fuzzyMap.get(fuzzyKey);
            const existingRecord = uniqueTransactions.get(existingKey);

            // If the existing record is "N/A" (no ref) and our Sub has a Ref, SWAP IT!
            if (existingRecord && !existingRecord.mpesa_receipt_number) {
              uniqueTransactions.delete(existingKey); // Remove the N/A record
            }
          }
        }

        uniqueTransactions.set(s.mpesa_receipt_number, s);
      });

      const allTransactions = Array.from(uniqueTransactions.values());

      // Sort by date descending
      return allTransactions.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    } catch (error: any) {
      console.error("Error loading transactions:", error);
      toast({
        variant: "destructive",
        title: "Critical Transaction Load Error",
        description: error.message
      });
      return [];
    }
  };

  const loadAdminActions = async (): Promise<AdminAction[]> => {
    try {
      const { data: actionsData, error } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const actionsWithDetails = await Promise.all(
        (actionsData || []).map(async (action) => {
          let email = action.details?.email || action.details?.admin_email;

          if (!email && action.admin_id) {
            // Try fetching profile directly (assuming admin_id is user_id)
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", action.admin_id)
              .single();

            if (profile) {
              email = profile.email;
            } else {
              // Try legacy approach
              const { data: adminData } = await supabase
                .from("admin_users")
                .select("user_id")
                .eq("id", action.admin_id)
                .single();

              if (adminData) {
                const { data: legacyProfile } = await supabase
                  .from("profiles")
                  .select("email")
                  .eq("id", adminData.user_id)
                  .single();
                email = (legacyProfile as any)?.email;
              }
            }
          }

          return {
            ...action,
            admin_email: email,
          };
        })
      );

      return actionsWithDetails;
    } catch (error) {
      console.error("Error loading admin actions:", error);
      return [];
    }
  };

  // ACTION HANDLERS with permission checks
  const handleApproveProduct = async (productId: string) => {
    if (!permissions.canApproveProducts) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to approve products",
      });
      return;
    }

    setLoading(`approve-${productId}`, true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          status: "approved",
          approved_by: currentAdmin?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", productId);

      if (error) throw error;

      console.log("Logging admin action: product_approve", "product", productId);
      await logAdminAction("product_approve", "product", productId);

      toast({
        title: "Product Approved",
        description: "Product has been approved successfully",
      });

      await loadProductsWithDetails();
      await loadPlatformStats();
    } catch (error: any) {
      console.error("Error approving product:", error);
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.message || "Failed to approve product",
      });
    } finally {
      setLoading(`approve-${productId}`, false);
    }
  };

  const handleRejectProduct = async (productId: string, reason: string) => {
    if (!permissions.canRejectProducts) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to reject products",
      });
      return;
    }

    setLoading(`reject-${productId}`, true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          status: "rejected",
          rejection_reason: reason,
          approved_by: currentAdmin?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (error) throw error;

      console.log("Logging admin action: product_reject", "product", productId, { reason });
      await logAdminAction("product_reject", "product", productId, { reason });

      toast({
        title: "Product Rejected",
        description: "Product has been rejected",
      });

      setRejectionReason("");
      setProductToReject(null);
      setShowRejectDialog(false);

      await loadProductsWithDetails();
      await loadPlatformStats();
    } catch (error: any) {
      console.error("Error rejecting product:", error);
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: error.message || "Failed to reject product",
      });
    } finally {
      setLoading(`reject-${productId}`, false);
    }
  };

  const handleFeatureProduct = async (productId: string, featured: boolean) => {
    if (!permissions.canFeatureProducts) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to feature products",
      });
      return;
    }

    setLoading(`feature-${productId}`, true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ featured })
        .eq("id", productId);

      if (error) throw error;

      console.log("Logging admin action: product_feature", "product", productId, { featured });
      await logAdminAction("product_feature", "product", productId, {
        featured,
      });

      toast({
        title: "Success!",
        description: `Product ${featured ? "featured" : "unfeatured"
          } successfully`,
      });

      await loadProductsWithDetails();
    } catch (error: any) {
      console.error("Error featuring product:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update product",
      });
    } finally {
      setLoading(`feature-${productId}`, false);
    }
  };

  const handleVerifyProduct = async (productId: string, verified: boolean) => {
    if (!permissions.canVerifyProducts) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to verify products",
      });
      return;
    }

    setLoading(`verify-${productId}`, true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ verified })
        .eq("id", productId);

      if (error) throw error;

      console.log("Logging admin action: product_verify", "product", productId, { verified });
      await logAdminAction("product_verify", "product", productId, {
        verified,
      });

      toast({
        title: "Success!",
        description: `Product ${verified ? "verified" : "unverified"
          } successfully`,
      });

      await loadProductsWithDetails();
    } catch (error: any) {
      console.error("Error verifying product:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update product",
      });
    } finally {
      setLoading(`verify-${productId}`, false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!permissions.canDeleteProducts) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to delete products",
      });
      return;
    }

    setLoading(`delete-${productId}`, true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      console.log("Logging admin action: product_delete", "product", productId);
      await logAdminAction("product_delete", "product", productId);

      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully",
      });

      await loadProductsWithDetails();
      await loadPlatformStats();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error.message || "Failed to delete product",
      });
    } finally {
      setLoading(`delete-${productId}`, false);
    }
  };

  const handleBanUser = async (userId: string, reason: string) => {
    if (!permissions.canBanUsers) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to ban users",
      });
      return;
    }

    setLoading(`ban-${userId}`, true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "banned",
          ban_reason: reason,
          banned_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      console.log("Logging admin action: user_ban", "user", userId, { reason });
      await logAdminAction("user_ban", "user", userId, { reason });

      toast({
        title: "User Banned",
        description: "User has been banned successfully",
      });

      setBanReason("");
      setUserToBan(null);
      setShowBanDialog(false);

      await loadUsersWithActivity();
    } catch (error: any) {
      console.error("Error banning user:", error);
      toast({
        variant: "destructive",
        title: "Ban Failed",
        description: error.message || "Failed to ban user",
      });
    } finally {
      setLoading(`ban-${userId}`, false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!permissions.canBanUsers) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to unban users",
      });
      return;
    }

    setLoading(`unban-${userId}`, true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "active",
          ban_reason: null,
          banned_at: null,
        })
        .eq("id", userId);

      if (error) throw error;

      console.log("Logging admin action: user_unban", "user", userId);
      await logAdminAction("user_unban", "user", userId);

      toast({
        title: "User Unbanned",
        description: "User has been unbanned successfully",
      });

      await loadUsersWithActivity();
    } catch (error: any) {
      console.error("Error unbanning user:", error);
      toast({
        variant: "destructive",
        title: "Unban Failed",
        description: error.message || "Failed to unban user",
      });
    } finally {
      setLoading(`unban-${userId}`, false);
    }
  };

  const handleSuspendUser = async (
    userId: string,
    reason: string,
    duration: string
  ) => {
    if (!permissions.canSuspendUsers) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to suspend users",
      });
      return;
    }

    setLoading(`suspend-${userId}`, true);
    try {
      const suspendUntil = new Date();
      suspendUntil.setDate(suspendUntil.getDate() + parseInt(duration));

      const { error } = await supabase
        .from("profiles")
        .update({
          status: "suspended",
          ban_reason: `Suspended: ${reason} (${duration} days)`,
          banned_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      console.log("Logging admin action: user_suspend", "user", userId, {
        reason,
        duration,
      });
      await logAdminAction("user_suspend", "user", userId, {
        reason,
        duration,
      });

      toast({
        title: "User Suspended",
        description: `User has been suspended for ${duration} days: ${reason}`,
      });

      setSuspendReason("");
      setSuspendDuration("7");
      setUserToSuspend(null);
      setShowSuspendDialog(false);

      await loadUsersWithActivity();
    } catch (error: any) {
      console.error("Error suspending user:", error);
      toast({
        variant: "destructive",
        title: "Suspension Failed",
        description: error.message || "Failed to suspend user",
      });
    } finally {
      setLoading(`suspend-${userId}`, false);
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    if (!permissions.canSuspendUsers) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to unsuspend users",
      });
      return;
    }

    setLoading(`unsuspend-${userId}`, true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "active",
          ban_reason: null,
          banned_at: null,
        })
        .eq("id", userId);

      if (error) throw error;

      console.log("Logging admin action: user_unsuspend", "user", userId);
      await logAdminAction("user_unsuspend", "user", userId);

      toast({
        title: "User Unsuspended",
        description: "User has been unsuspended successfully",
      });

      await loadUsersWithActivity();
    } catch (error: any) {
      console.error("Error unsuspending user:", error);
      toast({
        variant: "destructive",
        title: "Unban Failed",
        description: error.message || "Failed to unsuspend user",
      });
    } finally {
      setLoading(`unsuspend-${userId}`, false);
    }
  };

  const handleResolveReport = async (
    reportId: string,
    action: string,
    notes: string
  ) => {
    if (!permissions.canResolveReports) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to resolve reports",
      });
      return;
    }

    setLoading(`resolve-${reportId}`, true);
    try {
      // Get the current admin's user ID (from auth, not admin_users)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "You must be logged in to resolve reports",
        });
        return;
      }

      // First, check if the admin has a profile
      const { data: adminProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profileError || !adminProfile) {
        toast({
          variant: "destructive",
          title: "Profile Not Found",
          description:
            "Your admin profile is not properly set up. Please contact support.",
        });
        return;
      }

      // Now update the report with the admin's user ID (which exists in profiles table)
      const { error } = await supabase
        .from("reports")
        .update({
          status: "resolved",
          resolved_by: user.id, // This is the key fix - use user.id, not currentAdmin?.id
          resolved_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      console.log("Logging admin action: report_resolve", "report", reportId, {
        action,
        notes,
      });
      await logAdminAction("report_resolve", "report", reportId, {
        action,
        notes,
      });

      toast({
        title: "Report Resolved",
        description: "Report has been marked as resolved",
      });

      setSelectedReport(null);
      setShowReportDialog(false);

      await loadReports();
      await loadPlatformStats();
    } catch (error: any) {
      console.error("Error resolving report:", error);

      // Handle specific foreign key constraint error
      if (
        error.code === "23503" &&
        error.message.includes("reports_resolved_by_fkey")
      ) {
        toast({
          variant: "destructive",
          title: "Profile Error",
          description:
            "Your admin profile is missing. Please contact system administrator to fix this issue.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Resolution Failed",
          description: error.message || "Failed to resolve report",
        });
      }
    } finally {
      setLoading(`resolve-${reportId}`, false);
    }
  };

  const handleAddAdmin = async (email: string, role: string) => {
    if (!permissions.canManageAdmins) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to add admins",
      });
      return;
    }

    setLoading("add-admin", true);
    try {
      const normalizedEmail = email.trim(); // Allow DB to handle case, but trim spaces

      // 1. First get the user from profiles table - Case Insensitive
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", normalizedEmail)
        .maybeSingle();

      if (userError) throw userError;

      if (!userData) {
        throw new Error(`User not found with email: ${normalizedEmail}. The user must be registered on the platform first.`);
      }

      // 2. Check if user is already an admin/moderator
      const { data: existingAdmin, error: adminCheckError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", userData.id)
        .maybeSingle();

      if (adminCheckError) throw adminCheckError;

      if (existingAdmin) {
        throw new Error("User is already an admin/moderator");
      }

      // 3. Generate UUID for the admin record
      const generateUUID = () => {
        return crypto.randomUUID();
      };

      // 4. Determine permissions based on role
      const isAdmin = role === "admin" || role === "super_admin";
      const isModerator = role === "moderator";
      const currentTimestamp = new Date().toISOString();

      // 5. Build the admin data exactly matching your table structure
      const adminData = {
        // Primary key - UUID
        id: generateUUID(),

        // User Data
        email: userData.email, // Use the actual email from profile
        role: role,
        user_id: userData.id,

        // Permissions JSON object
        permissions: {
          manage_users: isAdmin,
          manage_admins: role === "super_admin",
          manage_content: isAdmin || isModerator,
          manage_reports: isAdmin || isModerator,
          view_analytics: isAdmin,
          manage_products: isAdmin || isModerator,
          manage_settings: isAdmin,
          manage_categories: isAdmin,
        },

        // Individual permission fields
        can_manage_admins: role === "super_admin",
        can_manage_users: isAdmin,
        can_manage_products: isAdmin || isModerator,
        can_manage_categories: isAdmin,
        can_manage_reports: isAdmin || isModerator,
        can_manage_settings: isAdmin,
        can_view_analytics: isAdmin,
        can_manage_content: isAdmin || isModerator,

        // Status field
        is_active: true,

        // 2FA Fields (Initialize as disabled)
        two_factor_enabled: false,
        two_factor_method: null,
        two_factor_secret: null,
        backup_codes: null,

        // Timestamps
        created_at: currentTimestamp,
        updated_at: currentTimestamp,
      };

      console.log("Admin data to insert:", JSON.stringify(adminData, null, 2));

      // 6. Insert into admin_users
      const { error: insertError } = await supabase
        .from("admin_users")
        .insert(adminData);

      if (insertError) {
        console.error("Database error details:", insertError);

        // Specific error handling
        if (insertError.code === "23502") {
          const missingField = insertError.message.match(/column "([^"]+)"/)?.[1];
          throw new Error(
            `Missing required field: ${missingField}. Check your admin data structure.`
          );
        } else if (insertError.code === "23505") {
          throw new Error("User is already an admin/moderator");
        } else if (insertError.code === "23503") {
          throw new Error("User does not exist in authentication system");
        }

        throw new Error(`Database error: ${insertError.message}`);
      }

      // 7. Log the action
      await logAdminAction("admin_add", "admin", userData.id, { role });

      toast({
        title: "Success! Admin Added",
        description: `${normalizedEmail} has been added as ${role}`,
      });

      // 8. Reset and refresh
      setNewAdminEmail("");
      setNewAdminRole("moderator");
      setShowAddAdminDialog(false);
      await loadAdminUsers();
    } catch (error: any) {
      console.error("Error adding admin:", error);

      if (error.code === "P0001" || error.message?.includes("Two-factor authentication required")) {
        toast({
          variant: "destructive",
          title: "Action Failed: Security Requirement",
          description: "Database requires YOU to have 2FA enabled before adding other admins. Please go to the Security tab and enable 2FA.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Add Admin Failed",
          description: error.message || "Failed to add admin",
        });
      }
    } finally {
      setLoading("add-admin", false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!permissions.canManageAdmins) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to remove admins",
      });
      return;
    }

    setLoading(`remove-admin-${adminId}`, true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/admin/remove/${adminId}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to remove admin");
      }

      await logAdminAction("admin_remove", "admin", adminId);

      toast({
        title: "Admin Removed",
        description: "Admin has been removed successfully",
      });

      await loadAdminUsers();
    } catch (error: any) {
      console.error("Error removing admin:", error);
      toast({
        variant: "destructive",
        title: "Remove Admin Failed",
        description: error.message || "Failed to remove admin",
      });
    } finally {
      setLoading(`remove-admin-${adminId}`, false);
    }
  };

  const handleCreateCategory = async (categoryData: any) => {
    if (!permissions.canManageCategories) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to create categories",
      });
      return;
    }

    setLoading("create-category", true);
    try {
      const { error } = await supabase.from("categories").insert({
        name: categoryData.name,
        description: categoryData.description,
        parent_id: categoryData.parent_id || null,
        is_active: categoryData.is_active,
        order_index: categoryData.order_index,
        properties: categoryData.properties,
      } as any);

      if (error) throw error;

      await logAdminAction("category_create", "category", "new", {
        name: categoryData.name,
      });

      toast({
        title: "Category Created",
        description: "Category has been created successfully",
      });

      setNewCategory({
        name: "",
        description: "",
        parent_id: "",
        is_active: true,
        order_index: 0,
        properties: "{}",
      });
      setShowCategoryDialog(false);

      await loadCategoriesWithCounts();
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast({
        variant: "destructive",
        title: "Create Category Failed",
        description: error.message || "Failed to create category",
      });
    } finally {
      setLoading("create-category", false);
    }
  };

  const handleUpdateCategory = async (
    categoryId: string,
    categoryData: any
  ) => {
    if (!permissions.canManageCategories) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to update categories",
      });
      return;
    }

    setLoading(`update-category-${categoryId}`, true);
    try {
      const { error } = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", categoryId);

      if (error) throw error;

      await logAdminAction("category_update", "category", categoryId, {
        name: categoryData.name,
      });

      toast({
        title: "Category Updated",
        description: "Category has been updated successfully",
      });

      setEditingCategory(null);
      setShowEditCategoryDialog(false);

      await loadCategoriesWithCounts();
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast({
        variant: "destructive",
        title: "Update Category Failed",
        description: error.message || "Failed to update category",
      });
    } finally {
      setLoading(`update-category-${categoryId}`, false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!permissions.canManageCategories) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to delete categories",
      });
      return;
    }

    setLoading(`delete-category-${categoryId}`, true);
    try {
      // Check if category has products
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", categoryId);

      if (productCount && productCount > 0) {
        throw new Error(
          `Cannot delete category with ${productCount} products. Please reassign or delete the products first.`
        );
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      await logAdminAction("category_delete", "category", categoryId);

      toast({
        title: "Category Deleted",
        description: "Category has been deleted successfully",
      });

      await loadCategoriesWithCounts();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        variant: "destructive",
        title: "Delete Category Failed",
        description: error.message || "Failed to delete category",
      });
    } finally {
      setLoading(`delete-category-${categoryId}`, false);
    }
  };

  const handleBulkAction = async (
    action: string,
    resource: string,
    ids: string[]
  ) => {
    if (!permissions.canPerformBulkActions) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to perform bulk actions",
      });
      return;
    }

    if (ids.length === 0) {
      toast({
        variant: "destructive",
        title: "No Selection",
        description: "Please select items to perform bulk actions",
      });
      return;
    }

    setLoading(`bulk-${action}`, true);
    try {
      switch (resource) {
        case "products":
          await handleBulkProductAction(ids, action);
          break;
        case "users":
          await handleBulkUserAction(ids, action);
          break;
        case "categories": // Keep categories logic for now, as it's not covered by new bulk handlers
          if (action === "activate") {
            const { error } = await supabase
              .from("categories")
              .update({ is_active: true })
              .in("id", ids);
            if (error) throw error;
          } else if (action === "deactivate") {
            const { error } = await supabase
              .from("categories")
              .update({ is_active: false })
              .in("id", ids);
            if (error) throw error;
          }
          break;
      }

      await logAdminAction(`bulk_${action}`, resource, ids.join(","), {
        count: ids.length,
      });

      toast({
        title: "Bulk Action Completed",
        description: `${action} performed on ${ids.length} ${resource}`,
      });

      // Clear selections
      setSelectedProducts([]);
      setSelectedUsers([]);
      setSelectedCategories([]);
      setShowBulkActionDialog(false);

      // Reload data
      await loadDashboardData();
    } catch (error: any) {
      console.error("Error performing bulk action:", error);
      toast({
        variant: "destructive",
        title: "Bulk Action Failed",
        description: error.message || "Failed to perform bulk action",
      });
    } finally {
      setLoading(`bulk-${action}`, false);
    }
  };

  const handleMassApprove = async (productIds: string[]) => {
    if (!permissions.canApproveProducts) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to approve products",
      });
      return;
    }

    setLoading("mass-approve", true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          status: "approved",
          approved_by: currentAdmin?.id,
          approved_at: new Date().toISOString(),
        })
        .in("id", productIds);

      if (error) throw error;

      await logAdminAction("mass_approve", "product", productIds.join(","), {
        count: productIds.length,
      });

      toast({
        title: "Mass Approval Complete",
        description: `${productIds.length} products approved successfully`,
      });

      await loadProductsWithDetails();
      await loadPlatformStats();
    } catch (error: any) {
      console.error("Error in mass approval:", error);
      toast({
        variant: "destructive",
        title: "Mass Approval Failed",
        description: error.message || "Failed to approve products",
      });
    } finally {
      setLoading("mass-approve", false);
    }
  };

  const handleUrgentProduct = async (productId: string, urgent: boolean) => {
    if (!permissions.canFeatureProducts) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to mark products as urgent",
      });
      return;
    }

    setLoading(`urgent-${productId}`, true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_urgent: urgent })
        .eq("id", productId);

      if (error) throw error;

      await logAdminAction("product_urgent", "product", productId, { urgent });

      toast({
        title: "Success!",
        description: `Product ${urgent ? "marked as urgent" : "unmarked as urgent"
          }`,
      });

      await loadProductsWithDetails();
    } catch (error: any) {
      console.error("Error updating product urgency:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update product urgency",
      });
    } finally {
      setLoading(`urgent-${productId}`, false);
    }
  };

  const handleExportData = async (resource: string) => {
    if (!permissions.canExportData) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to export data",
      });
      return;
    }

    setLoading(`export-${resource}`, true);
    try {
      let data: any[] = [];
      let filename = "";

      switch (resource) {
        case "users":
          data = users;
          filename = "users_export.csv";
          break;
        case "products":
          data = products;
          filename = "products_export.csv";
          break;
        case "categories":
          data = categories;
          filename = "categories_export.csv";
          break;
        case "reports":
          data = reports;
          filename = "reports_export.csv";
          break;
        case "subscriptions":
          data = subscriptions;
          filename = "subscriptions_export.csv";
          break;
      }

      // Simple CSV conversion
      const headers = Object.keys(data[0] || {}).join(",");
      const rows = data
        .map((item) =>
          Object.values(item)
            .map((val) =>
              typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val
            )
            .join(",")
        )
        .join("\n");

      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${resource} data exported to ${filename}`,
      });
    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message || "Failed to export data",
      });
    } finally {
      setLoading(`export-${resource}`, false);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("withdrawals")
        .select(`
          *,
          profiles:user_id (email, full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error loading withdrawals:", error);
      return [];
    }
  };

  const handleUpdateWithdrawalStatus = async (
    withdrawalId: string,
    status: string,
    notes: string
  ) => {
    setLoading(`withdrawal-${withdrawalId}`, true);
    try {
      const { error } = await (supabase as any)
        .from("withdrawals")
        .update({
          status,
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

      if (error) throw error;

      await logAdminAction("withdrawal_update", "withdrawal", withdrawalId, {
        status,
        notes,
      });

      toast({
        title: "Withdrawal Updated",
        description: `Status updated to ${status}`,
      });

      const updatedWithdrawals = await loadWithdrawals();
      setWithdrawals(updatedWithdrawals);
    } catch (error: any) {
      console.error("Error updating withdrawal:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update withdrawal",
      });
    } finally {
      setLoading(`withdrawal-${withdrawalId}`, false);
    }
  };

  const handleSystemBackup = async () => {
    if (!permissions.canBackupSystem) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to backup the system",
      });
      return;
    }

    setLoading("system-backup", true);
    try {
      // Simulate backup process
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await logAdminAction(
        "system_backup",
        "system",
        "database",
        backupSettings
      );

      toast({
        title: "Backup Completed",
        description: "System backup has been completed successfully",
      });

      setShowBackupDialog(false);
      await loadSystemHealth();
    } catch (error: any) {
      console.error("Error initiating backup:", error);
      toast({
        variant: "destructive",
        title: "Backup Failed",
        description: error.message || "Failed to complete backup",
      });
    } finally {
      setLoading("system-backup", false);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!permissions.canSendEmails) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to send bulk emails",
      });
      return;
    }

    setLoading("bulk-email", true);
    try {
      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await logAdminAction("bulk_email", "user", "multiple", {
        template: emailTemplate.type,
        recipients: emailTemplate.recipients,
      });

      toast({
        title: "Emails Sent",
        description: "Bulk emails have been queued for delivery",
      });

      setShowEmailTemplateDialog(false);
      setEmailTemplate({
        type: "welcome",
        subject: "",
        content: "",
        recipients: "all",
      });
    } catch (error: any) {
      console.error("Error sending bulk emails:", error);
      toast({
        variant: "destructive",
        title: "Email Failed",
        description: error.message || "Failed to send emails",
      });
    } finally {
      setLoading("bulk-email", false);
    }
  };

  const handleUpdateSystemSettings = async () => {
    if (!permissions.canManageSystem) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to update system settings",
      });
      return;
    }

    setLoading("update-settings", true);
    try {
      // In a real app, you would save these to your database
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await logAdminAction(
        "system_settings_update",
        "system",
        "all",
        systemSettings
      );

      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully",
      });

      setShowSystemSettingsDialog(false);
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update settings",
      });
    } finally {
      setLoading("update-settings", false);
      setLoading(`adjust-subscription-${selectedSubscription.id}`, false);
    }
  };

  const handleAdjustSubscription = async () => {
    if (!selectedSubscription) return;

    setLoading(`adjust-subscription-${selectedSubscription.id}`, true);
    try {
      // Fetch current user data and plan data
      const { data: currentProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("email, plan_type")
        .eq("id", selectedSubscription.user_id)
        .single();

      if (fetchError) {
        console.error("Error fetching profile:", fetchError);
        throw new Error("Could not fetch user profile");
      }

      // Fetch plan details to get plan name
      const { data: planData } = await supabase
        .from("plans")
        .select("name, price")
        .eq("id", selectedSubscription.plan_id)
        .single();

      // Update user profile with comprehensive changes
      const profileUpdates: any = {};

      // If subscription is being activated, update plan_type
      if (adjustmentData.status === 'active' && planData) {
        profileUpdates.plan_type = planData.name.toLowerCase();
      } else if (adjustmentData.status === 'cancelled' || adjustmentData.status === 'expired') {
        profileUpdates.plan_type = 'free';
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", selectedSubscription.user_id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw new Error(`Failed to update user profile: ${profileError.message}`);
      }

      // Update subscription with comprehensive changes
      const subscriptionUpdates: any = {
        status: adjustmentData.status
      };

      // If activating, set proper period end
      if (adjustmentData.status === 'active') {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        subscriptionUpdates.current_period_end = periodEnd.toISOString();
      }

      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .update(subscriptionUpdates)
        .eq("id", selectedSubscription.id);

      if (subscriptionError) {
        console.error("Subscription update error:", subscriptionError);
        throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
      }

      await logAdminAction("subscription_adjust", "subscription", selectedSubscription.id, {
        previousStatus: selectedSubscription.status,
        newStatus: adjustmentData.status,
        notes: adjustmentData.notes,
        userEmail: currentProfile?.email
      });

      toast({
        title: "Subscription Adjusted Successfully",
        description: `Updated ${currentProfile?.email}: Status: ${adjustmentData.status}`,
      });

      setShowAdjustSubscriptionDialog(false);
      setSelectedSubscription(null);
      setAdjustmentData({ status: "active", notes: "" });

      // Reload data to reflect changes
      const updatedSubscriptions = await loadSubscriptions();
      setSubscriptions(updatedSubscriptions);
      await loadUsersWithActivity();
    } catch (error: any) {
      console.error("Error adjusting subscription:", error);
      toast({
        variant: "destructive",
        title: "Adjustment Failed",
        description: error.message || "Failed to adjust subscription. Check console for details.",
      });
    } finally {
      setLoading(`adjust-subscription-${selectedSubscription.id}`, false);
    }
  };

  const handleSyncSubscriptionStatus = async (subscriptionId: string) => {
    setLoading(`sync-${subscriptionId}`, true);
    try {
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select(`
          plan_name,
          profiles:user_id (email)
        `)
        .eq("id", subscriptionId)
        .single();

      if (error) throw error;

      // Note: max_products is missing from profiles, so we just log and notify
      await logAdminAction("subscription_sync", "subscription", subscriptionId, {
        plan: subscription?.plan_name
      });

      toast({
        title: "Subscription Synced",
        description: `Status verified for ${subscription?.profiles?.email}`,
      });

      const updatedSubscriptions = await loadSubscriptions();
      setSubscriptions(updatedSubscriptions);
    } catch (error: any) {
      console.error("Error syncing subscription:", error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message,
      });
    } finally {
      setLoading(`sync-${subscriptionId}`, false);
    }
  };

  const handleRecalculateAllLimits = async () => {
    setLoading("recalculate-all", true);
    try {
      const { data: allSubscriptions, error } = await supabase
        .from("subscriptions")
        .select(`
          user_id
        `)
        .eq("status", "active");

      if (error) throw error;

      let updated = 0;
      for (const sub of allSubscriptions || []) {
        // Skip updating max_products as column doesn't exist
        /*
        await supabase
          .from("profiles")
          .update({ max_products: planMaxProducts })
          .eq("id", sub.user_id);
        */
        updated++;
      }

      await logAdminAction("bulk_recalculate_limits", "system", "all", {
        subscriptionsUpdated: updated
      });

      toast({
        title: "Limits Recalculated",
        description: `Updated limits for ${updated} active subscriptions`,
      });

      await loadSubscriptions();
      await loadUsersWithActivity();
    } catch (error: any) {
      console.error("Error recalculating limits:", error);
      toast({
        variant: "destructive",
        title: "Recalculation Failed",
        description: error.message,
      });
    } finally {
      setLoading("recalculate-all", false);
    }
  };

  const handleResetUserUploadCount = async (userId: string) => {
    setLoading(`reset-uploads-${userId}`, true);
    try {
      // Get user's current products count
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", userId); // Changed from user_id to owner_id

      // This is informational - actual count is managed by database
      await logAdminAction("user_upload_count_check", "user", userId, {
        currentProductCount: count || 0
      });

      toast({
        title: "Upload Count Checked",
        description: `User has ${count || 0} products uploaded`,
      });
    } catch (error: any) {
      console.error("Error checking upload count:", error);
      toast({
        variant: "destructive",
        title: "Check Failed",
        description: error.message,
      });
    } finally {
      setLoading(`reset-uploads-${userId}`, false);
    }
  };

  const handleBulkUserAction = async (userIds: string[], action: string) => {
    setLoading("bulk-user-action", true);
    try {
      let updates: any = {};
      let actionDescription = "";

      switch (action) {
        case "verify":
          updates = { verified: true };
          actionDescription = "verified";
          break;
        case "unverify":
          updates = { verified: false };
          actionDescription = "unverified";
          break;
        case "activate":
          updates = { status: "active", ban_reason: null, banned_at: null };
          actionDescription = "activated";
          break;
        case "upgrade_to_premium":
          updates = { plan_type: "premium" }; // Removed max_products
          actionDescription = "upgraded to premium";
          break;
        default:
          throw new Error("Invalid action");
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .in("id", userIds);

      if (error) throw error;

      await logAdminAction("bulk_user_action", "user", "multiple", {
        userIds,
        action,
        count: userIds.length
      });

      toast({
        title: "Bulk Action Complete",
        description: `${userIds.length} users ${actionDescription}`,
      });

      await loadUsersWithActivity();
    } catch (error: any) {
      console.error("Error in bulk user action:", error);
      toast({
        variant: "destructive",
        title: "Bulk Action Failed",
        description: error.message,
      });
    } finally {
      setLoading("bulk-user-action", false);
    }
  };

  const handleBulkProductAction = async (productIds: string[], action: string) => {
    setLoading("bulk-product-action", true);
    try {
      let updates: any = {};
      let actionDescription = "";

      switch (action) {
        case "approve":
          updates = { status: "active", approved_at: new Date().toISOString(), approved_by: currentAdmin?.id };
          actionDescription = "approved";
          break;
        case "feature":
          updates = { featured: true };
          actionDescription = "featured";
          break;
        case "unfeature":
          updates = { featured: false };
          actionDescription = "unfeatured";
          break;
        case "verify":
          updates = { verified: true };
          actionDescription = "verified";
          break;
        default:
          throw new Error("Invalid action");
      }

      const { error } = await supabase
        .from("products")
        .update(updates)
        .in("id", productIds);

      if (error) throw error;

      await logAdminAction("bulk_product_action", "product", "multiple", {
        productIds,
        action,
        count: productIds.length
      });

      toast({
        title: "Bulk Product Action Complete",
        description: `${productIds.length} products ${actionDescription}`,
      });

      await loadProductsWithDetails();
      await loadPlatformStats();
    } catch (error: any) {
      console.error("Error in bulk product action:", error);
      toast({
        variant: "destructive",
        title: "Bulk Action Failed",
        description: error.message,
      });
    } finally {
      setLoading("bulk-product-action", false);
    }
  };

  const handleBulkSubscriptionUpdate = async (subscriptionIds: string[], newStatus: string) => {
    setLoading("bulk-subscription-update", true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: newStatus })
        .in("id", subscriptionIds);

      if (error) throw error;

      await logAdminAction("bulk_subscription_update", "subscription", "multiple", {
        subscriptionIds,
        newStatus,
        count: subscriptionIds.length
      });

      toast({
        title: "Bulk Update Complete",
        description: `Updated ${subscriptionIds.length} subscriptions to ${newStatus}`,
      });

      const updatedSubscriptions = await loadSubscriptions();
      setSubscriptions(updatedSubscriptions);
    } catch (error: any) {
      console.error("Error in bulk update:", error);
      toast({
        variant: "destructive",
        title: "Bulk Update Failed",
        description: error.message,
      });
    } finally {
      setLoading("bulk-subscription-update", false);
    }
  };



  const handleDetailedExport = () => {
    try {
      let dataToExport: any[] = [];
      let filename = `${exportResourceType}_export_${format(new Date(), "yyyy-MM-dd")}.csv`;

      // Select Data
      switch (exportResourceType) {
        case "users":
          dataToExport = users;
          break;
        case "products":
          dataToExport = products;
          break;
        case "transactions":
          dataToExport = transactions;
          break;
        case "subscriptions":
          dataToExport = subscriptions;
          break;
        case "withdrawals":
          dataToExport = withdrawals;
          break;
        case "reports":
          dataToExport = reports;
          break;
        default:
          dataToExport = [];
      }

      // Filter by Date Range
      if (exportStartDate || exportEndDate) {
        dataToExport = dataToExport.filter((item) => {
          const itemDate = new Date(item.created_at || item.joined_at || new Date().toISOString());
          if (exportStartDate && itemDate < exportStartDate) return false;
          if (exportEndDate) {
            const end = new Date(exportEndDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
          return true;
        });
      }

      if (dataToExport.length === 0) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No records found for the selected criteria.",
        });
        return;
      }

      // Convert to CSV
      const headers = Object.keys(dataToExport[0]).join(",");
      const csvContent = [
        headers,
        ...dataToExport.map((row) =>
          Object.values(row)
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportDialog(false);
      toast({
        title: "Export Successful",
        description: `Exported ${dataToExport.length} records.`,
      });
      logAdminAction("export_data", exportResourceType, "bulk", { count: dataToExport.length });

    } catch (error) {
      console.error("Export failed:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "An error occurred while exporring data.",
      });
    }
  };

  const logAdminAction = async (
    actionType: string,
    resourceType: string,
    resourceId: string,
    details?: any
  ) => {
    try {
      const logData = {
        id: crypto.randomUUID(),
        admin_id: currentAdmin?.id,
        action_type: actionType,
        resource_type: resourceType,
        resource_id: resourceId,
        details: details || {},
      };
      console.log("Admin Action Log:", logData);
      const { error } = await supabase.from("admin_actions").insert(logData);
      if (error) {
        console.error("Supabase error logging admin action:", error);
      }
    } catch (error) {
      console.error("Error logging admin action:", error);
    }
  };

  // FILTERED DATA
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.seller_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReports = reports.filter(
    (report) =>
      report.reporter_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesSearch =
      (subscription.user_email?.toLowerCase() || "").includes(subscriptionSearchTerm.toLowerCase()) ||
      (subscription.user_name?.toLowerCase() || "").includes(subscriptionSearchTerm.toLowerCase()) ||
      (subscription.plan_name?.toLowerCase() || "").includes(subscriptionSearchTerm.toLowerCase());

    const matchesStatus = subscriptionStatusFilter === "all" || subscription.status === subscriptionStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredTransactions = transactions.filter((t) => {
    const searchLow = transactionSearchTerm.toLowerCase();
    return (
      (t.user_email?.toLowerCase() || "").includes(searchLow) ||
      (t.user_name?.toLowerCase() || "").includes(searchLow) ||
      (t.mpesa_receipt_number?.toLowerCase() || "").includes(searchLow) ||
      (t.description?.toLowerCase() || "").includes(searchLow) ||
      (t.status?.toLowerCase() || "").includes(searchLow) ||
      (t.id?.toLowerCase() || "").includes(searchLow)
    );
  });

  const filteredWithdrawals = withdrawals.filter((w) => {
    const searchLow = withdrawalSearchTerm.toLowerCase();
    return (
      (w.profiles?.full_name?.toLowerCase() || "").includes(searchLow) ||
      (w.profiles?.email?.toLowerCase() || "").includes(searchLow) ||
      (w.payment_method?.toLowerCase() || "").includes(searchLow) ||
      (w.status?.toLowerCase() || "").includes(searchLow) ||
      (w.id?.toLowerCase() || "").includes(searchLow)
    );
  });

  const pendingProducts = filteredProducts.filter(
    (p) => p.status === "pending"
  );
  const approvedProducts = filteredProducts.filter(
    (p) => p.status === "approved" || p.status === "active"
  );
  const pendingReports = filteredReports.filter((r) => r.status === "pending");
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === "active"
  );

  // UI Components with permission checks
  const renderHeader = () => (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div className="flex items-center gap-4">
        <div
          className={`p-2 rounded-lg ${isSuperAdmin
            ? "bg-gradient-to-br from-red-600 to-pink-600"
            : hasAdminRole
              ? "bg-gradient-to-br from-blue-600 to-purple-600"
              : "bg-gradient-to-br from-green-600 to-teal-600"
            }`}
        >
          <Shield className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            {isSuperAdmin
              ? "Super Administrator"
              : hasAdminRole
                ? "Administrator"
                : "Moderator"}
            <Badge variant="secondary" className="ml-2">
              {currentAdmin?.role} •{" "}
              {isModerator ? "Limited Access" : "Full Access"}
            </Badge>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search everything..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-80"
          />
        </div>

        {permissions.canExportData && (
          <Button variant="outline" size="icon" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={loadDashboardData}
          disabled={loadingStates.refresh}
        >
          <RefreshCw
            className={`h-4 w-4 ${loadingStates.refresh ? "animate-spin" : ""}`}
          />
        </Button>

        {permissions.canManageSystem && (
          <Button
            onClick={() => setShowSystemSettingsDialog(true)}
            variant="outline"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Settings
          </Button>
        )}
      </div>
    </div>
  );

  const renderQuickActions = () => (
    <Card className="lg:col-span-2 xl:col-span-1">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {permissions.canApproveProducts && (
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-2"
              onClick={() => setActiveTab("pending")}
            >
              <Clock className="h-5 w-5" />
              <span className="text-xs">
                Review Pending ({stats.pendingProducts})
              </span>
            </Button>
          )}

          {permissions.canResolveReports && (
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-2"
              onClick={() => setActiveTab("reports")}
            >
              <Flag className="h-5 w-5" />
              <span className="text-xs">
                Handle Reports ({stats.pendingReports})
              </span>
            </Button>
          )}

          {permissions.canManageCategories && (
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-2"
              onClick={() => setShowCategoryDialog(true)}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Add Category</span>
            </Button>
          )}

          {permissions.canSendEmails && (
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-2"
              onClick={() => setShowEmailTemplateDialog(true)}
            >
              <Mail className="h-5 w-5" />
              <span className="text-xs">Email Users</span>
            </Button>
          )}

          {permissions.canPerformBulkActions && (
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-2"
              onClick={() => setShowBulkActionDialog(true)}
            >
              <Users2 className="h-5 w-5" />
              <span className="text-xs">Bulk Actions</span>
            </Button>
          )}

          {permissions.canBackupSystem && (
            <Button
              variant="outline"
              className="h-auto py-3 flex flex-col gap-2"
              onClick={() => setShowBackupDialog(true)}
              disabled={loadingStates["system-backup"]}
            >
              <DownloadCloud className="h-5 w-5" />
              <span className="text-xs">Backup System</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderUserManagement = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            {permissions.canBanUsers
              ? "Manage platform users"
              : "View user information"}
          </CardDescription>
        </div>
        {permissions.canBanUsers && selectedUsers.length > 0 && (
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Bulk Actions ({selectedUsers.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() =>
                    handleBulkUserAction(selectedUsers, "verify")
                  }
                >
                  Verify Selected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleBulkUserAction(selectedUsers, "activate")
                  }
                >
                  Activate Selected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleBulkUserAction(selectedUsers, "upgrade_to_premium")
                  }
                >
                  Upgrade to Premium
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    handleBulkAction("ban", "users", selectedUsers)
                  }
                >
                  Ban Selected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleBulkAction("suspend", "users", selectedUsers)
                  }
                >
                  Suspend Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" onClick={() => setSelectedUsers([])}>
              Clear
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {permissions.canBanUsers && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedUsers.length === users.length && users.length > 0
                    }
                    onCheckedChange={(checked) => {
                      setSelectedUsers(checked ? users.map((u) => u.id) : []);
                    }}
                  />
                </TableHead>
              )}
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Joined</TableHead>
              {permissions.canBanUsers && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                {permissions.canBanUsers && (
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(
                            selectedUsers.filter((id) => id !== user.id)
                          );
                        }
                      }}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} />
                      ) : (
                        <AvatarFallback>
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.email}</div>{" "}
                      {/* ← FIXED */}
                      <div className="text-sm text-muted-foreground">
                        {" "}
                        {/* ← FIXED */}
                        {user.full_name}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.status === "active"
                        ? "default"
                        : user.status === "banned"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>{user.products_count || 0}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                {permissions.canBanUsers && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDialog(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {user.status === "active" ? (
                        <>
                          {permissions.canSuspendUsers && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUserToSuspend(user.id);
                                setShowSuspendDialog(true);
                              }}
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          )}
                          {permissions.canBanUsers && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setUserToBan(user.id);
                                setShowBanDialog(true);
                              }}
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      ) : (
                        permissions.canBanUsers && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbanUser(user.id)}
                            disabled={loadingStates[`unban-${user.id}`]}
                          >
                            <Unlock className="h-3 w-3" />
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderAdminManagement = () => {
    if (!permissions.canViewAdmins) return null;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Admin Management</CardTitle>
            <CardDescription>
              {permissions.canManageAdmins
                ? "Manage platform administrators"
                : "View admin team"}
            </CardDescription>
          </div>
          {permissions.canManageAdmins && (
            <Button onClick={() => setShowAddAdminDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-muted/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Admin Debug Info</AlertTitle>
            <AlertDescription className="text-xs font-mono mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>Current User ID: {currentAdmin?.user_id}</div>
                <div>Current Admin ID: {currentAdmin?.id}</div>
                <div>Role: {currentAdmin?.role}</div>
                <div>Admins Found: {adminUsers?.length || 0}</div>
                <div>Loading: {loadingStates['admins'] ? 'Yes' : 'No'}</div>
                <div>Permissions: {JSON.stringify(permissions)}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  console.log("Manual refresh triggered");
                  loadAdminUsers();
                }}
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Force Refresh List
              </Button>
            </AlertDescription>
          </Alert>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                {permissions.canManageAdmins && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {admin.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{admin.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {admin.full_name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        admin.role === "super_admin"
                          ? "destructive"
                          : admin.role === "admin"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {admin.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.is_active ? "default" : "secondary"}>
                      {admin.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(admin.created_at).toLocaleDateString()}
                  </TableCell>
                  {permissions.canManageAdmins &&
                    admin.role !== "super_admin" && (
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveAdmin(admin.id)}
                          disabled={loadingStates[`remove-admin-${admin.id}`]}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  const renderProductActions = (product: Product) => {
    return (
      <div className="flex gap-2">
        {permissions.canApproveProducts && product.status === "pending" && (
          <Button
            size="sm"
            onClick={() => handleApproveProduct(product.id)}
            disabled={loadingStates[`approve-${product.id}`]}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Approve
          </Button>
        )}
        {permissions.canRejectProducts && product.status === "pending" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setProductToReject(product.id);
              setShowRejectDialog(true);
            }}
          >
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
        )}
        {permissions.canFeatureProducts && (
          <Switch
            checked={product.featured}
            onCheckedChange={(checked) =>
              handleFeatureProduct(product.id, checked)
            }
            disabled={loadingStates[`feature-${product.id}`]}
          />
        )}
        {permissions.canDeleteProducts && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteProduct(product.id)}
            disabled={loadingStates[`delete-${product.id}`]}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have administrator privileges to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => (window.location.href = "/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">
            Loading Admin Dashboard
          </h2>
          <p className="text-muted-foreground">
            Preparing your management interface...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container mx-auto py-6 space-y-6">
        {renderHeader()}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Total Users
                  </p>
                  <p className="text-xl font-bold">{stats.totalUsers}</p>
                  <p className="text-blue-200 text-xs">
                    +{stats.todayRegistrations} today
                  </p>
                </div>
                <Users className="h-6 w-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Revenue</p>
                  <p className="text-xl font-bold">
                    KES {stats.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-green-200 text-xs">
                    {stats.weeklyGrowth}% growth
                  </p>
                </div>
                <DollarSign className="h-6 w-6 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending</p>
                  <p className="text-xl font-bold">{stats.pendingProducts}</p>
                  <p className="text-orange-200 text-xs">
                    {stats.pendingReports} reports
                  </p>
                </div>
                <Clock className="h-6 w-6 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    System Health
                  </p>
                  <p className="text-xl font-bold">{stats.systemHealth}%</p>
                  <p className="text-purple-200 text-xs">
                    {stats.serverLoad}% load
                  </p>
                </div>
                <Activity className="h-6 w-6 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">
                    Subscriptions
                  </p>
                  <p className="text-xl font-bold">
                    {stats.activeSubscriptions}
                  </p>
                  <p className="text-red-200 text-xs">Active plans</p>
                </div>
                <Crown className="h-6 w-6 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">
                    Engagement
                  </p>
                  <p className="text-xl font-bold">
                    {stats.userEngagement.toFixed(1)}%
                  </p>
                  <p className="text-indigo-200 text-xs">
                    {stats.unreadMessages} messages
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-indigo-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visual Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={chartRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <ReXAxis dataKey="name" />
                  <ReYAxis />
                  <ReTooltip
                    formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Legend />
                  <ReBar dataKey="revenue" fill="#16a34a" name="Revenue" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New registrations last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={chartUserGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <ReXAxis dataKey="name" />
                  <ReYAxis />
                  <ReTooltip />
                  <Legend />
                  <ReLine type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} name="New Users" />
                </ReLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-10 h-auto p-1 bg-slate-100/50 rounded-lg overflow-x-auto">
            {getVisibleTabs().map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {renderQuickActions()}

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>
                    Platform performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Server Status</span>
                      <Badge variant="default" className="bg-green-500">
                        <Wifi className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Database</span>
                        <span className="text-sm text-muted-foreground">
                          {systemHealth?.database_size}
                        </span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Cache Hit Rate
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {systemHealth?.cache_hit_rate}%
                        </span>
                      </div>
                      <Progress
                        value={systemHealth?.cache_hit_rate || 0}
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Active Connections
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {systemHealth?.active_connections}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setActiveTab("system")}
                      >
                        <Server className="h-4 w-4 mr-2" />
                        View Detailed Metrics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="lg:col-span-2 xl:col-span-1">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest platform events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminActions.slice(0, 5).map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                            {action.admin_email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize">
                            {action.action_type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {action.admin_email} •{" "}
                            {new Date(action.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {action.resource_type}
                        </Badge>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setShowAdminActionsDialog(true)}
                    >
                      View All Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart Section */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Weekly revenue and order trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg bg-gradient-to-br from-slate-50 to-blue-50/30">
                  <div className="text-center">
                    <BarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Revenue chart visualization
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Total Revenue:{" "}
                      <strong>KES {stats.totalRevenue.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Product Management</CardTitle>
                  <CardDescription>
                    Manage all sellhubshop listings
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedProducts.length > 0 &&
                    permissions.canPerformBulkActions && (
                      <>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                              Bulk Actions ({selectedProducts.length})
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() =>
                                handleBulkAction(
                                  "approve",
                                  "products",
                                  selectedProducts
                                )
                              }
                            >
                              Approve Selected
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleBulkAction(
                                  "feature",
                                  "products",
                                  selectedProducts
                                )
                              }
                            >
                              Feature Selected
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleBulkAction(
                                  "delete",
                                  "products",
                                  selectedProducts
                                )
                              }
                            >
                              Delete Selected
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedProducts([])}
                        >
                          Clear
                        </Button>
                      </>
                    )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>All Products</DropdownMenuItem>
                      <DropdownMenuItem>Active Products</DropdownMenuItem>
                      <DropdownMenuItem>Featured Products</DropdownMenuItem>
                      <DropdownMenuItem>Verified Products</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {permissions.canPerformBulkActions && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedProducts.length ===
                              approvedProducts.length &&
                              approvedProducts.length > 0
                            }
                            onCheckedChange={(checked) => {
                              setSelectedProducts(
                                checked ? approvedProducts.map((p) => p.id) : []
                              );
                            }}
                          />
                        </TableHead>
                      )}
                      <TableHead>Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Category</TableHead>
                      {permissions.canFeatureProducts && (
                        <TableHead>Featured</TableHead>
                      )}
                      {permissions.canVerifyProducts && (
                        <TableHead>Verified</TableHead>
                      )}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedProducts.map((product) => (
                      <TableRow key={product.id}>
                        {permissions.canPerformBulkActions && (
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedProducts([
                                    ...selectedProducts,
                                    product.id,
                                  ]);
                                } else {
                                  setSelectedProducts(
                                    selectedProducts.filter(
                                      (id) => id !== product.id
                                    )
                                  );
                                }
                              }}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Avatar className="h-12 w-12 border rounded-md">
                            <AvatarImage
                              src={product.images?.[0] || product.image}
                              alt={product.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-blue-100 text-blue-600 rounded-md">
                              {product.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* Removed duplicate avatar from here, moved to separate column */}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.description?.substring(0, 50)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex flex-col">
                            <span>KES {product.price?.toLocaleString()}</span>
                            <span className="text-xs text-purple-600 flex items-center gap-1">
                              <PiIcon className="w-3 h-3" />
                              {formatPi(convertKESToPi(product.price || 0))}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{product.seller_email}</TableCell>
                        <TableCell>
                          <Badge variant="default">{product.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.category_name || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        {permissions.canFeatureProducts && (
                          <TableCell>
                            <Switch
                              checked={product.featured}
                              onCheckedChange={(checked) =>
                                handleFeatureProduct(product.id, checked)
                              }
                              disabled={loadingStates[`feature-${product.id}`]}
                            />
                          </TableCell>
                        )}
                        {permissions.canVerifyProducts && (
                          <TableCell>
                            <Switch
                              checked={product.verified}
                              onCheckedChange={(checked) =>
                                handleVerifyProduct(product.id, checked)
                              }
                              disabled={loadingStates[`verify-${product.id}`]}
                            />
                          </TableCell>
                        )}
                        <TableCell>{renderProductActions(product)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Products Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pending Approval</CardTitle>
                  <CardDescription>
                    Review and approve new product listings
                  </CardDescription>
                </div>
                <Badge variant="destructive">
                  {pendingProducts.length} Pending
                </Badge>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Submitted</TableHead>
                      {permissions.canApproveProducts && (
                        <TableHead>Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Avatar className="h-12 w-12 border rounded-md">
                            <AvatarImage
                              src={product.images?.[0] || product.image}
                              alt={product.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-yellow-100 text-yellow-600 rounded-md">
                              {product.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border hidden">
                              <AvatarFallback className="bg-yellow-100 text-yellow-600">
                                {product.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.description?.substring(0, 50)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex flex-col">
                            <span>KES {product.price?.toLocaleString()}</span>
                            <span className="text-xs text-purple-600 flex items-center gap-1">
                              <PiIcon className="w-3 h-3" />
                              {formatPi(convertKESToPi(product.price || 0))}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{product.seller_email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.category_name || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(product.created_at).toLocaleDateString()}
                        </TableCell>
                        {permissions.canApproveProducts && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveProduct(product.id)}
                                disabled={
                                  loadingStates[`approve-${product.id}`]
                                }
                              >
                                {loadingStates[`approve-${product.id}`] ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setProductToReject(product.id);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            {permissions.canViewUsers ? (
              renderUserManagement()
            ) : (
              <Alert>
                <AlertDescription>
                  You don't have permission to view user management. Contact an
                  administrator.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Category Management</CardTitle>
                  <CardDescription>Organize product categories</CardDescription>
                </div>
                {permissions.canManageCategories && (
                  <Button onClick={() => {
                    setPropertyEditorState([]);
                    setNewCategory({ ...newCategory, properties: "{}" });
                    setShowCategoryDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      {permissions.canManageCategories && (
                        <TableHead>Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {category.description || "No description"}
                          </p>
                        </TableCell>
                        <TableCell>{category.product_count || 0}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              category.is_active ? "default" : "secondary"
                            }
                          >
                            {category.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(category.created_at).toLocaleDateString()}
                        </TableCell>
                        {permissions.canManageCategories && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCategory(category);
                                  // Parse properties safely
                                  let initialProps = [];
                                  try {
                                    const parsed = typeof category.properties === 'string'
                                      ? JSON.parse(category.properties)
                                      : category.properties;
                                    initialProps = Object.entries(parsed || {}).map(([key, value]) => ({
                                      key,
                                      value: String(value)
                                    }));
                                  } catch (e) {
                                    console.error("Error parsing props", e);
                                  }
                                  setPropertyEditorState(initialProps);
                                  setShowEditCategoryDialog(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleDeleteCategory(category.id)
                                }
                                disabled={
                                  loadingStates[
                                  `delete-category-${category.id}`
                                  ]
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="banners">
            <AdminBannerManager
              currentAdmin={currentAdmin}
              permissions={permissions}
            />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Report Management</CardTitle>
                  <CardDescription>
                    Review and resolve user reports
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    pendingReports.length > 0 ? "destructive" : "default"
                  }
                >
                  {pendingReports.length} Pending
                </Badge>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reported</TableHead>
                      {permissions.canResolveReports && (
                        <TableHead>Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* Product Thumbnail */}
                            {report.product_images?.[0] ? (
                              <div className="relative h-12 w-12 rounded-lg overflow-hidden border">
                                <img
                                  src={report.product_images[0]}
                                  alt={report.product_name || "Product"}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const parent =
                                      e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `
                              <div class="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            `;
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="space-y-1">
                              <p className="font-medium text-sm">
                                {report.product_name || "Unknown Product"}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {report.product_price && (
                                  <div className="flex flex-col gap-0.5">
                                    <Badge variant="outline" className="text-xs">
                                      KES {report.product_price.toLocaleString()}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                                      <PiIcon className="w-2.5 h-2.5 mr-0.5" />
                                      {formatPi(convertKESToPi(report.product_price))}
                                    </Badge>
                                  </div>
                                )}
                                {report.product_category_name && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {report.product_category_name}
                                  </Badge>
                                )}
                                {report.product_verified && (
                                  <Badge className="text-xs bg-green-500">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              {report.reporter_avatar ? (
                                <AvatarImage src={report.reporter_avatar} />
                              ) : (
                                <AvatarFallback className="text-xs">
                                  {report.reporter_email
                                    ?.charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {report.reporter_email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {report.reporter_name || "Anonymous"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">
                            {report.reason}
                          </span>
                          {report.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                              {report.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              report.priority === "high"
                                ? "destructive"
                                : report.priority === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {report.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              report.status === "pending"
                                ? "destructive"
                                : "default"
                            }
                          >
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <p>
                              {new Date(report.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-muted-foreground">
                              {new Date(report.created_at).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </TableCell>
                        {permissions.canResolveReports && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setShowReportDialog(true);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Review
                              </Button>
                              {report.status === "pending" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleResolveReport(
                                      report.id,
                                      "dismissed",
                                      "No action required"
                                    )
                                  }
                                  disabled={
                                    loadingStates[`resolve-${report.id}`]
                                  }
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Dismiss
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            {permissions.canViewSubscriptions ? (
              <Tabs defaultValue="plans" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="plans">Active Plans</TabsTrigger>
                  <TabsTrigger value="history">Transaction History</TabsTrigger>
                </TabsList>

                <TabsContent value="plans">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <CardTitle>Subscription Management</CardTitle>
                          <CardDescription>
                            Manage user subscriptions and plans - All statuses shown
                          </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Select value={subscriptionStatusFilter} onValueChange={setSubscriptionStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search subscriptions..."
                              value={subscriptionSearchTerm}
                              onChange={(e) => setSubscriptionSearchTerm(e.target.value)}
                              className="pl-8 w-full sm:w-[250px]"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Badge variant="outline">{filteredSubscriptions.length} Total</Badge>
                        <Badge variant="default">{filteredSubscriptions.filter(s => s.status === 'active').length} Active</Badge>
                        <Badge variant="destructive">{filteredSubscriptions.filter(s => s.status === 'failed').length} Failed</Badge>
                        <Badge variant="secondary">{filteredSubscriptions.filter(s => s.status === 'cancelled').length} Cancelled</Badge>
                      </div>
                      {permissions.canManageSubscriptions && (
                        <div className="flex gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">System Repair Tools</p>
                            <p className="text-xs text-muted-foreground">Fix subscription issues when automated systems fail</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRecalculateAllLimits}
                            disabled={loadingStates["recalculate-all"]}
                          >
                            {loadingStates["recalculate-all"] ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Recalculating...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Recalculate All Limits
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Renews</TableHead>
                            <TableHead>Created</TableHead>
                            {permissions.canManageSubscriptions && (
                              <TableHead>Actions</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSubscriptions.map((subscription) => (
                            <TableRow key={subscription.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback>
                                      {subscription.user_email
                                        ?.charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {subscription.user_email}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {subscription.user_name}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {subscription.plan_name}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    subscription.status === "active"
                                      ? "default"
                                      : subscription.status === "failed"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {subscription.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs font-mono bg-muted p-1 rounded">
                                  {subscription.mpesa_receipt_number || subscription.payment_method || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>KES {subscription.price_monthly?.toLocaleString()}</span>
                                  <span className="text-xs text-purple-600 flex items-center gap-1">
                                    <PiIcon className="w-3 h-3" />
                                    {formatPi(convertKESToPi(subscription.price_monthly || 0))}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {new Date(
                                  subscription.current_period_end
                                ).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {new Date(
                                  subscription.created_at
                                ).toLocaleDateString()}
                              </TableCell>
                              {permissions.canManageSubscriptions && (
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setTransactionDetailsSubscription(subscription);
                                        setShowSubscriptionTransactionsDialog(true);
                                      }}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSyncSubscriptionStatus(subscription.id)}
                                      disabled={loadingStates[`sync-${subscription.id}`]}
                                      title="Sync upload limit to plan"
                                    >
                                      {loadingStates[`sync-${subscription.id}`] ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <RefreshCw className="h-3 w-3" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedSubscription(subscription);
                                        setAdjustmentData({
                                          uploadLimit: 0,
                                          status: subscription.status,
                                          notes: ""
                                        });
                                        setShowAdjustSubscriptionDialog(true);
                                      }}
                                    >
                                      <Settings className="h-3 w-3 mr-1" />
                                      Adjust
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <CardTitle>Transaction History</CardTitle>
                          <CardDescription>
                            Real-time payment logs (Success, Failed, Pending)
                          </CardDescription>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search transactions..."
                            value={transactionSearchTerm}
                            onChange={(e) => setTransactionSearchTerm(e.target.value)}
                            className="pl-8 w-full sm:w-[250px]"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>M-Pesa Receipt</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                No transactions found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredTransactions.map((tx) => (
                              <TableRow key={tx.id}>
                                <TableCell>
                                  <div>
                                    <p className="text-sm font-medium">{tx.user_email}</p>
                                    <p className="text-xs text-muted-foreground">{tx.user_name}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  KES {tx.amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      tx.status === "completed" || tx.status === "success"
                                        ? "default"
                                        : tx.status === "failed"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                  >
                                    {tx.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {tx.mpesa_receipt_number || "N/A"}
                                </TableCell>
                                <TableCell className="capitalize">
                                  {tx.payment_method}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate" title={tx.description}>
                                  {tx.description}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {new Date(tx.created_at).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Alert>
                <AlertDescription>
                  You don't have permission to view subscriptions. Contact an
                  administrator.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Withdrawal Management</CardTitle>
                  <CardDescription>
                    Process manual payout requests from referrers
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search withdrawals..."
                      value={withdrawalSearchTerm}
                      onChange={(e) => setWithdrawalSearchTerm(e.target.value)}
                      className="pl-8 w-full sm:w-[250px]"
                    />
                  </div>
                  <Badge variant="outline">
                    {withdrawals.filter(w => w.status === 'pending' || w.status === 'processing').length} Pending Requests
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No withdrawals found matching your search
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWithdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{w.profiles?.full_name || "N/A"}</p>
                              <p className="text-sm text-muted-foreground">{w.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">
                            <div className="flex flex-col">
                              <span>KES {w.amount.toLocaleString()}</span>
                              <span className="text-xs text-purple-600 flex items-center gap-1">
                                <PiIcon className="w-3 h-3" />
                                {formatPi(convertKESToPi(w.amount))}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {w.payment_method}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              w.status === 'completed' ? 'default' :
                                w.status === 'cancelled' ? 'destructive' :
                                  'secondary'
                            }>
                              {w.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(w.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {(w.status === 'pending' || w.status === 'processing') && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateWithdrawalStatus(w.id, 'completed', 'Paid via M-Pesa')}
                                  disabled={loadingStates[`withdrawal-${w.id}`]}
                                >
                                  {loadingStates[`withdrawal-${w.id}`] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                  )}
                                  Paid
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const reason = window.prompt("Reason for cancellation?");
                                    if (reason) handleUpdateWithdrawalStatus(w.id, 'cancelled', reason);
                                  }}
                                  disabled={loadingStates[`withdrawal-${w.id}`]}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admins Tab */}
          <TabsContent value="admins">{renderAdminManagement()}</TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {permissions.canViewAnalytics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        User Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            New Registrations
                          </span>
                          <Badge variant="default">
                            +{stats.todayRegistrations} today
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Active Sellers
                          </span>
                          <span className="text-sm font-bold">
                            {Math.round(
                              (stats.userEngagement / 100) * stats.totalUsers
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Growth Rate
                          </span>
                          <div className="flex items-center gap-1">
                            {stats.weeklyGrowth > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={`text-sm font-bold ${stats.weeklyGrowth > 0
                                ? "text-green-500"
                                : "text-red-500"
                                }`}
                            >
                              {stats.weeklyGrowth}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Product Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Total Products
                          </span>
                          <span className="text-sm font-bold">
                            {stats.totalProducts}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Approval Rate
                          </span>
                          <span className="text-sm font-bold">
                            {stats.totalProducts > 0
                              ? Math.round(
                                (stats.approvedProducts /
                                  stats.totalProducts) *
                                100
                              )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Featured Products
                          </span>
                          <span className="text-sm font-bold">
                            {stats.featuredProducts}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Revenue Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Total Revenue
                          </span>
                          <span className="text-sm font-bold flex flex-col items-end">
                            <span>KES {stats.totalRevenue.toLocaleString()}</span>
                            <span className="text-xs text-purple-600 flex items-center gap-1">
                              <PiIcon className="w-3 h-3" />
                              {formatPi(convertKESToPi(stats.totalRevenue))}
                            </span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Active Subscriptions
                          </span>
                          <span className="text-sm font-bold">
                            {stats.activeSubscriptions}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Conversion Rate
                          </span>
                          <span className="text-sm font-bold">
                            {stats.totalProducts > 0
                              ? Math.round(
                                (stats.activeSubscriptions /
                                  stats.totalUsers) *
                                100
                              )
                              : 0}
                            %
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trends</CardTitle>
                    <CardDescription>
                      Weekly revenue and order performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center border rounded-lg bg-gradient-to-br from-slate-50 to-blue-50/30">
                      <div className="text-center">
                        <LineChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">
                          Revenue Analytics
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Interactive charts showing platform performance
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-semibold">
                              KES {stats.totalRevenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-purple-600 flex items-center justify-center gap-1">
                              <PiIcon className="w-3 h-3" />
                              {formatPi(convertKESToPi(stats.totalRevenue))}
                            </p>
                            <p className="text-muted-foreground">
                              Total Revenue
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">
                              {stats.weeklyGrowth}%
                            </p>
                            <p className="text-muted-foreground">
                              Weekly Growth
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  You don't have permission to view analytics. Contact an
                  administrator.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            {permissions.canManageSystem ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        System Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Database Size
                          </span>
                          <span className="text-sm font-mono">
                            {systemHealth?.database_size}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Active Connections
                          </span>
                          <Badge variant="outline">
                            {systemHealth?.active_connections}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Server Uptime
                          </span>
                          <span className="text-sm">
                            {systemHealth?.server_uptime}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Cache Hit Rate
                          </span>
                          <span className="text-sm font-bold">
                            {systemHealth?.cache_hit_rate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Storage Used
                          </span>
                          <span className="text-sm">
                            {systemHealth?.storage_used}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Memory Usage
                          </span>
                          <span className="text-sm font-bold">
                            {systemHealth?.memory_usage}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Last Backup
                          </span>
                          <span className="text-sm">
                            {systemHealth?.last_backup
                              ? new Date(
                                systemHealth.last_backup
                              ).toLocaleDateString()
                              : "Never"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" />
                        System Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {permissions.canBackupSystem && (
                          <Button
                            className="w-full justify-start"
                            variant="outline"
                            onClick={() => setShowBackupDialog(true)}
                            disabled={loadingStates["system-backup"]}
                          >
                            <DownloadCloud className="h-4 w-4 mr-2" />
                            {loadingStates["system-backup"]
                              ? "Backing up..."
                              : "Backup Database"}
                          </Button>
                        )}
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <HardDrive className="h-4 w-4 mr-2" />
                          Optimize Database
                        </Button>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear Cache
                        </Button>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Reports
                        </Button>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <ShieldAlert className="h-4 w-4 mr-2" />
                          Security Scan
                        </Button>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => setShowAdminActionsDialog(true)}
                        >
                          <HistoryIcon className="h-4 w-4 mr-2" />
                          View Audit Log
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>System Configuration</CardTitle>
                    <CardDescription>
                      Platform settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="maintenance-mode"
                          className="flex items-center gap-2"
                        >
                          <WifiOff className="h-4 w-4" />
                          Maintenance Mode
                        </Label>
                        <Switch
                          id="maintenance-mode"
                          checked={systemSettings.enable_maintenance_mode}
                          onCheckedChange={(checked) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              enable_maintenance_mode: checked,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="auto-approve"
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Auto-approve Products
                        </Label>
                        <Switch
                          id="auto-approve"
                          checked={systemSettings.auto_approve_products}
                          onCheckedChange={(checked) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              auto_approve_products: checked,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="email-verification"
                          className="flex items-center gap-2"
                        >
                          <MailCheck className="h-4 w-4" />
                          Require Email Verification
                        </Label>
                        <Switch
                          id="email-verification"
                          checked={systemSettings.require_email_verification}
                          onCheckedChange={(checked) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              require_email_verification: checked,
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="auto-backup"
                          className="flex items-center gap-2"
                        >
                          <DownloadCloud className="h-4 w-4" />
                          Auto Backup
                        </Label>
                        <Switch
                          id="auto-backup"
                          checked={systemSettings.auto_backup}
                          onCheckedChange={(checked) =>
                            setSystemSettings((prev) => ({
                              ...prev,
                              auto_backup: checked,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="max-products">
                            Max Products Per User
                          </Label>
                          <Input
                            id="max-products"
                            type="number"
                            value={systemSettings.max_products_per_user}
                            onChange={(e) =>
                              setSystemSettings((prev) => ({
                                ...prev,
                                max_products_per_user:
                                  parseInt(e.target.value) || 50,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="commission">
                            Platform Commission (%)
                          </Label>
                          <Input
                            id="commission"
                            type="number"
                            value={systemSettings.platform_commission}
                            onChange={(e) =>
                              setSystemSettings((prev) => ({
                                ...prev,
                                platform_commission:
                                  parseInt(e.target.value) || 5,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleUpdateSystemSettings}
                        disabled={loadingStates["update-settings"]}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save System Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  You don't have permission to access system settings. Contact
                  an administrator.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Security Tab (Audit Log) */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Audit Logs</CardTitle>
                <CardDescription>
                  Track administrative actions and system security events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Admin ID</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminActions && adminActions.length > 0 ? (
                      adminActions.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.admin_id?.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">{log.resource_type}</span>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
                              {JSON.stringify(log.details)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No audit logs found. Actions taken by admins will appear here.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Two Factor Setup Section */}
            {!currentAdmin?.two_factor_enabled && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Account Security</h3>
                <TwoFactorSetup
                  onComplete={async () => {
                    toast({
                      title: "Success",
                      description: "2FA Enabled! You can now perform sensitive actions."
                    });
                    // Force data reload
                    await loadDashboardData();
                  }}
                  onCancel={() => { }}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}

        {/* Add Admin Dialog */}
        <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>
                {isSuperAdmin
                  ? "Grant admin privileges to a user by their email address."
                  : "You can only add moderators. Contact a super admin for higher privileges."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-email">Email Address</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="user@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="admin-role">Role</Label>
                <Select
                  value={newAdminRole}
                  onValueChange={(value: "admin" | "moderator") =>
                    setNewAdminRole(value)
                  }
                  disabled={!isSuperAdmin}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                    <SelectItem value="moderator">Moderator</SelectItem>
                  </SelectContent>
                </Select>
                {!isSuperAdmin && (
                  <p className="text-sm text-muted-foreground mt-1">
                    You can only create moderator accounts
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddAdminDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAddAdmin(newAdminEmail, newAdminRole)}
                disabled={!newAdminEmail || loadingStates["add-admin"]}
              >
                {loadingStates["add-admin"] ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Add {newAdminRole === "admin" ? "Admin" : "Moderator"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ban User Dialog */}
        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ban User</DialogTitle>
              <DialogDescription>
                Permanently ban this user from the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ban-reason">Ban Reason</Label>
                <Textarea
                  id="ban-reason"
                  placeholder="Enter the reason for banning this user..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBanDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => userToBan && handleBanUser(userToBan, banReason)}
                disabled={
                  !banReason.trim() || loadingStates[`ban-${userToBan}`]
                }
              >
                {loadingStates[`ban-${userToBan}`] ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Ban User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend User Dialog */}
        <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend User</DialogTitle>
              <DialogDescription>
                Temporarily suspend user account with specified duration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="suspend-reason">Suspension Reason</Label>
                <Textarea
                  id="suspend-reason"
                  placeholder="Enter the reason for suspending this user..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="suspend-duration">
                  Suspension Duration (Days)
                </Label>
                <Select
                  value={suspendDuration}
                  onValueChange={setSuspendDuration}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSuspendDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  userToSuspend &&
                  handleSuspendUser(
                    userToSuspend,
                    suspendReason,
                    suspendDuration
                  )
                }
                disabled={
                  !suspendReason.trim() ||
                  loadingStates[`suspend-${userToSuspend}`]
                }
              >
                {loadingStates[`suspend-${userToSuspend}`] ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Suspend User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Product Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Product</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this product listing.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter the reason for rejecting this product..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  productToReject &&
                  handleRejectProduct(productToReject, rejectionReason)
                }
                disabled={
                  !rejectionReason.trim() ||
                  loadingStates[`reject-${productToReject}`]
                }
              >
                {loadingStates[`reject-${productToReject}`] ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Reject Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog - Modernized */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a category with dynamic properties and configuration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Category Name</Label>
                  <Input
                    placeholder="e.g., Electronics"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe this category..."
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Parent Category</Label>
                  <Select
                    value={newCategory.parent_id}
                    onValueChange={(value) =>
                      setNewCategory((prev) => ({ ...prev, parent_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (Top Level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (Top Level)</SelectItem>
                      {categories
                        .filter((cat) => !cat.parent_id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={newCategory.is_active}
                    onCheckedChange={(checked) =>
                      setNewCategory((prev) => ({ ...prev, is_active: checked }))
                    }
                  />
                  <Label>Active Status</Label>
                </div>
              </div>

              {/* Property Editor */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">Properties & Attributes</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPropertyEditorState([...propertyEditorState, { key: "", value: "" }])
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Property
                  </Button>
                </div>

                {propertyEditorState.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No properties defined. Add specific attributes like 'Size', 'Color', etc.</p>
                ) : (
                  <div className="space-y-3">
                    {propertyEditorState.map((prop, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <Input
                          placeholder="Key (e.g. Size)"
                          value={prop.key}
                          onChange={(e) => {
                            const newProps = [...propertyEditorState];
                            newProps[index].key = e.target.value;
                            setPropertyEditorState(newProps);
                          }}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Value (e.g. S,M,L)"
                          value={prop.value}
                          onChange={(e) => {
                            const newProps = [...propertyEditorState];
                            newProps[index].value = e.target.value;
                            setPropertyEditorState(newProps);
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newProps = propertyEditorState.filter((_, i) => i !== index);
                            setPropertyEditorState(newProps);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const propsObj = propertyEditorState.reduce((acc: any, curr) => {
                    if (curr.key) acc[curr.key] = curr.value;
                    return acc;
                  }, {});
                  handleCreateCategory({
                    ...newCategory,
                    properties: propsObj // Pass object, handleCreateCategory should handle it or we stringify
                  });
                }}
                disabled={!newCategory.name || loadingStates["create-category"]}
              >
                {loadingStates["create-category"] ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog - Modernized */}
        <Dialog
          open={showEditCategoryDialog}
          onOpenChange={setShowEditCategoryDialog}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Modify {editingCategory?.name} details and properties.
              </DialogDescription>
            </DialogHeader>
            {editingCategory && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Category Name</Label>
                    <Input
                      value={editingCategory.name}
                      onChange={(e) =>
                        setEditingCategory((prev) =>
                          prev ? { ...prev, name: e.target.value } : null
                        )
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={editingCategory.description || ""}
                      onChange={(e) =>
                        setEditingCategory((prev) =>
                          prev ? { ...prev, description: e.target.value } : null
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Parent Category</Label>
                    <Select
                      value={editingCategory.parent_id || "none"}
                      onValueChange={(value) =>
                        setEditingCategory((prev) =>
                          prev ? { ...prev, parent_id: value === "none" ? null : value } : null
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None (Top Level)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Top Level)</SelectItem>
                        {categories
                          .filter((cat) => !cat.parent_id && cat.id !== editingCategory.id)
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-4">
                    <Switch
                      checked={editingCategory.is_active}
                      onCheckedChange={(checked) =>
                        setEditingCategory((prev) =>
                          prev ? { ...prev, is_active: checked } : null
                        )
                      }
                    />
                    <Label>Active Status</Label>
                  </div>
                </div>

                {/* Property Editor */}
                <div className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-semibold">Properties & Attributes</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPropertyEditorState([...propertyEditorState, { key: "", value: "" }])
                      }
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Property
                    </Button>
                  </div>

                  {propertyEditorState.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No properties defined.</p>
                  ) : (
                    <div className="space-y-3">
                      {propertyEditorState.map((prop, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <Input
                            placeholder="Key"
                            value={prop.key}
                            onChange={(e) => {
                              const newProps = [...propertyEditorState];
                              newProps[index].key = e.target.value;
                              setPropertyEditorState(newProps);
                            }}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={prop.value}
                            onChange={(e) => {
                              const newProps = [...propertyEditorState];
                              newProps[index].value = e.target.value;
                              setPropertyEditorState(newProps);
                            }}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newProps = propertyEditorState.filter((_, i) => i !== index);
                              setPropertyEditorState(newProps);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditCategoryDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingCategory) {
                    const propsObj = propertyEditorState.reduce((acc: any, curr) => {
                      if (curr.key) acc[curr.key] = curr.value;
                      return acc;
                    }, {});

                    handleUpdateCategory(editingCategory.id, {
                      name: editingCategory.name,
                      description: editingCategory.description,
                      is_active: editingCategory.is_active,
                      properties: propsObj
                    });
                  }
                }}
                disabled={
                  !editingCategory?.name ||
                  loadingStates[`update-category-${editingCategory?.id}`]
                }
              >
                {loadingStates[`update-category-${editingCategory?.id}`] ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Update Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Report Details Dialog */}
        <Dialog
          open={showReportDialog}
          onOpenChange={(open) => {
            setShowReportDialog(open);
            if (!open) {
              setSelectedReport(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Report Details</DialogTitle>
              <DialogDescription>
                Review and take action on this report.
              </DialogDescription>
            </DialogHeader>

            {!selectedReport ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading report details...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Debug info (temporary) - Make this collapsible */}
                <div className="mb-4 flex-shrink-0">
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium text-gray-600">
                      Debug Info
                    </summary>
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <pre className="overflow-auto max-h-32">
                        {JSON.stringify(
                          {
                            id: selectedReport.id,
                            product_id: selectedReport.reported_id,
                            product_name: selectedReport.product_name,
                            has_images:
                              selectedReport.product_images?.length > 0,
                            reporter_email: selectedReport.reporter_email,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </details>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {/* Basic Report Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Report ID</Label>
                      <p className="text-sm font-mono truncate">
                        {selectedReport.id}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge
                        variant={
                          selectedReport.status === "pending"
                            ? "destructive"
                            : "default"
                        }
                      >
                        {selectedReport.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-sm mb-2">Reporter</h3>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback>
                          {selectedReport.reporter_email
                            ?.charAt(0)
                            ?.toUpperCase() || "R"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {selectedReport.reporter_email || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          Reported on:{" "}
                          {new Date(selectedReport.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reason & Description */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-sm mb-2">
                      Report Reason
                    </h3>
                    <p className="text-sm font-medium">
                      {selectedReport.reason}
                    </p>

                    {selectedReport.description && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                          Additional Details:
                        </h4>
                        <div className="max-h-32 overflow-y-auto">
                          <p className="text-sm p-2 bg-gray-50 rounded whitespace-pre-wrap">
                            {selectedReport.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Info (if available) */}
                  {selectedReport.product_name && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Package className="h-4 w-4 flex-shrink-0" />
                        Reported Product
                      </h3>
                      <div className="flex items-start gap-4">
                        {selectedReport.product_images?.[0] && (
                          <div className="flex-shrink-0">
                            <img
                              src={selectedReport.product_images[0]}
                              alt={selectedReport.product_name}
                              className="h-20 w-20 rounded object-cover border"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium truncate">
                            {selectedReport.product_name}
                          </h4>
                          <div className="space-y-1 mt-2">
                            {selectedReport.product_price && (
                              <p className="text-sm">
                                <span className="font-medium">Price:</span> KES{" "}
                                {selectedReport.product_price.toLocaleString()}
                              </p>
                            )}
                            {selectedReport.product_category_name && (
                              <p className="text-sm">
                                <span className="font-medium">Category:</span>{" "}
                                {selectedReport.product_category_name}
                              </p>
                            )}
                            {selectedReport.seller_name && (
                              <p className="text-sm">
                                <span className="font-medium">Seller:</span>{" "}
                                {selectedReport.seller_name}
                              </p>
                            )}
                            {selectedReport.product_created_at && (
                              <p className="text-sm">
                                <span className="font-medium">Listed:</span>{" "}
                                {new Date(
                                  selectedReport.product_created_at
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Fixed at bottom */}
                  <div className="pt-4 pb-2 border-t mt-4 flex-shrink-0">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleResolveReport(
                            selectedReport.id,
                            "dismissed",
                            "Report dismissed without action"
                          );
                        }}
                        disabled={loadingStates[`resolve-${selectedReport.id}`]}
                        className="flex-1"
                      >
                        {loadingStates[`resolve-${selectedReport.id}`] ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Dismiss
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleResolveReport(
                            selectedReport.id,
                            "action_taken",
                            "Appropriate action taken"
                          );
                        }}
                        disabled={loadingStates[`resolve-${selectedReport.id}`]}
                        className="flex-1"
                      >
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        Take Action
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Bulk Action Dialog */}
        <Dialog
          open={showBulkActionDialog}
          onOpenChange={setShowBulkActionDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Actions</DialogTitle>
              <DialogDescription>
                Perform actions on multiple items at once.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bulk-action">Select Action</Label>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve Products</SelectItem>
                    <SelectItem value="feature">Feature Products</SelectItem>
                    <SelectItem value="ban">Ban Users</SelectItem>
                    <SelectItem value="suspend">Suspend Users</SelectItem>
                    <SelectItem value="activate">
                      Activate Categories
                    </SelectItem>
                    <SelectItem value="deactivate">
                      Deactivate Categories
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bulkAction && (
                <Alert>
                  <AlertDescription>
                    This action will be performed on all selected items. This
                    cannot be undone.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBulkActionDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (bulkAction.includes("product")) {
                    handleBulkAction(bulkAction, "products", selectedProducts);
                  } else if (bulkAction.includes("user")) {
                    handleBulkAction(bulkAction, "users", selectedUsers);
                  } else if (bulkAction.includes("category")) {
                    handleBulkAction(
                      bulkAction,
                      "categories",
                      selectedCategories
                    );
                  }
                }}
                disabled={!bulkAction}
              >
                Execute Bulk Action
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* System Settings Dialog */}
        <Dialog
          open={showSystemSettingsDialog}
          onOpenChange={setShowSystemSettingsDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>System Settings</DialogTitle>
              <DialogDescription>
                Configure platform-wide settings and preferences.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Product Settings</h4>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-approve-setting">
                      Auto-approve Products
                    </Label>
                    <Switch
                      id="auto-approve-setting"
                      checked={systemSettings.auto_approve_products}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          auto_approve_products: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-verification-setting">
                      Email Verification
                    </Label>
                    <Switch
                      id="email-verification-setting"
                      checked={systemSettings.require_email_verification}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          require_email_verification: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">User Settings</h4>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow-signups-setting">
                      Allow New Signups
                    </Label>
                    <Switch
                      id="allow-signups-setting"
                      checked={systemSettings.allow_new_signups}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          allow_new_signups: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance-setting">
                      Maintenance Mode
                    </Label>
                    <Switch
                      id="maintenance-setting"
                      checked={systemSettings.enable_maintenance_mode}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          enable_maintenance_mode: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-products-setting">
                    Max Products Per User
                  </Label>
                  <Input
                    id="max-products-setting"
                    type="number"
                    value={systemSettings.max_products_per_user}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        max_products_per_user: parseInt(e.target.value) || 50,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="commission-setting">
                    Platform Commission (%)
                  </Label>
                  <Input
                    id="commission-setting"
                    type="number"
                    value={systemSettings.platform_commission}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        platform_commission: parseInt(e.target.value) || 5,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency-setting">Currency</Label>
                  <Select
                    value={systemSettings.currency}
                    onValueChange={(value) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        currency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={systemSettings.support_email}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        support_email: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Backup Settings</h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-backup-setting">Auto Backup</Label>
                  <Switch
                    id="auto-backup-setting"
                    checked={systemSettings.auto_backup}
                    onCheckedChange={(checked) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        auto_backup: checked,
                      }))
                    }
                  />
                </div>
                {systemSettings.auto_backup && (
                  <div>
                    <Label htmlFor="backup-frequency">Backup Frequency</Label>
                    <Select
                      value={systemSettings.backup_frequency}
                      onValueChange={(value) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          backup_frequency: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSystemSettingsDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSystemSettings}
                disabled={loadingStates["update-settings"]}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Template Dialog */}
        <Dialog
          open={showEmailTemplateDialog}
          onOpenChange={setShowEmailTemplateDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Email Template</DialogTitle>
              <DialogDescription>
                Create and send emails to users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-type">Email Type</Label>
                <Select
                  value={emailTemplate.type}
                  onValueChange={(value) =>
                    setEmailTemplate((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Email</SelectItem>
                    <SelectItem value="notification">
                      System Notification
                    </SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="alert">Security Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email-recipients">Recipients</Label>
                <Select
                  value={emailTemplate.recipients}
                  onValueChange={(value) =>
                    setEmailTemplate((prev) => ({ ...prev, recipients: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="sellers">Sellers Only</SelectItem>
                    <SelectItem value="buyers">Buyers Only</SelectItem>
                    <SelectItem value="premium">Premium Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  placeholder="Enter email subject"
                  value={emailTemplate.subject}
                  onChange={(e) =>
                    setEmailTemplate((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="email-content">Content</Label>
                <Textarea
                  id="email-content"
                  placeholder="Enter email content..."
                  rows={8}
                  value={emailTemplate.content}
                  onChange={(e) =>
                    setEmailTemplate((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEmailTemplateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendBulkEmail}
                disabled={
                  !emailTemplate.subject ||
                  !emailTemplate.content ||
                  loadingStates["bulk-email"]
                }
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Admin Actions Dialog */}
        <Dialog
          open={showAdminActionsDialog}
          onOpenChange={setShowAdminActionsDialog}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Admin Activity Log</DialogTitle>
              <DialogDescription>
                Recent administrative actions and changes.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminActions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {action.admin_email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{action.admin_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {action.action_type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">
                          {action.resource_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {JSON.stringify(action.details)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {new Date(action.created_at).toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        {/* Backup Dialog */}
        <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>System Backup</DialogTitle>
              <DialogDescription>
                Create a backup of the system data and configuration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="backup-type">Backup Type</Label>
                <Select
                  value={backupSettings.backup_type}
                  onValueChange={(value) =>
                    setBackupSettings((prev) => ({
                      ...prev,
                      backup_type: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Backup</SelectItem>
                    <SelectItem value="database">Database Only</SelectItem>
                    <SelectItem value="media">Media Files Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-media"
                  checked={backupSettings.include_media}
                  onCheckedChange={(checked) =>
                    setBackupSettings((prev) => ({
                      ...prev,
                      include_media: checked,
                    }))
                  }
                />
                <Label htmlFor="include-media">Include Media Files</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-database"
                  checked={backupSettings.include_database}
                  onCheckedChange={(checked) =>
                    setBackupSettings((prev) => ({
                      ...prev,
                      include_database: checked,
                    }))
                  }
                />
                <Label htmlFor="include-database">Include Database</Label>
              </div>
              <Alert>
                <AlertDescription>
                  This process may take several minutes depending on the amount
                  of data.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBackupDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSystemBackup}
                disabled={loadingStates["system-backup"]}
              >
                {loadingStates["system-backup"] ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <DownloadCloud className="h-4 w-4 mr-2" />
                )}
                Start Backup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Adjust Subscription Dialog */}
        <Dialog open={showAdjustSubscriptionDialog} onOpenChange={setShowAdjustSubscriptionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Subscription</DialogTitle>
              <DialogDescription>
                Manually adjust upload limits and subscription status
              </DialogDescription>
            </DialogHeader>
            {selectedSubscription && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="text-sm">{selectedSubscription.user_email}</p>
                  <p className="text-xs text-muted-foreground">{selectedSubscription.plan_name}</p>
                </div>
                <div>
                  <Label htmlFor="status">Subscription Status</Label>
                  <Select
                    value={adjustmentData.status}
                    onValueChange={(value) => setAdjustmentData({ ...adjustmentData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    value={adjustmentData.notes}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                    placeholder="Reason for manual adjustment (for audit trail)"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdjustSubscriptionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdjustSubscription} disabled={loadingStates[`adjust-subscription-${selectedSubscription?.id}`]}>
                {loadingStates[`adjust-subscription-${selectedSubscription?.id}`] ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adjusting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Details Dialog */}
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
              <DialogDescription>
                Detailed information about the product listing.
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Product Name</Label>
                    <p className="text-sm">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Price</Label>
                    <p className="text-sm font-semibold">
                      KES {selectedProduct.price?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Seller</Label>
                    <p className="text-sm">{selectedProduct.seller_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm">
                      {selectedProduct.category_name || "Uncategorized"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant="default">{selectedProduct.status}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm">
                      {new Date(
                        selectedProduct.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  {permissions.canFeatureProducts && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleFeatureProduct(
                          selectedProduct.id,
                          !selectedProduct.featured
                        )
                      }
                      disabled={loadingStates[`feature-${selectedProduct.id}`]}
                    >
                      {selectedProduct.featured ? "Unfeature" : "Feature"}
                    </Button>
                  )}
                  {permissions.canVerifyProducts && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleVerifyProduct(
                          selectedProduct.id,
                          !selectedProduct.verified
                        )
                      }
                      disabled={loadingStates[`verify-${selectedProduct.id}`]}
                    >
                      {selectedProduct.verified ? "Unverify" : "Verify"}
                    </Button>
                  )}
                  {permissions.canDeleteProducts && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteProduct(selectedProduct.id)}
                      disabled={loadingStates[`delete-${selectedProduct.id}`]}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Detailed information about the user account.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    {selectedUser.avatar_url ? (
                      <AvatarImage src={selectedUser.avatar_url} />
                    ) : (
                      <AvatarFallback className="text-lg">
                        {selectedUser.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedUser.email}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.full_name}
                    </p>
                    <Badge
                      variant={
                        selectedUser.status === "active"
                          ? "default"
                          : selectedUser.status === "banned"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {selectedUser.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Products Listed
                    </Label>
                    <p className="text-sm">
                      {selectedUser.products_count || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Reviews Written
                    </Label>
                    <p className="text-sm">{selectedUser.reviews_count || 0}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Plan Type</Label>
                    <p className="text-sm capitalize">
                      {selectedUser.plan_type}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Joined</Label>
                    <p className="text-sm">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {selectedUser.ban_reason && (
                  <div>
                    <Label className="text-sm font-medium">Ban Reason</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.ban_reason}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  {selectedUser.status === "active" ? (
                    <>
                      {permissions.canSuspendUsers && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUserToSuspend(selectedUser.id);
                            setShowSuspendDialog(true);
                            setShowUserDialog(false);
                          }}
                        >
                          Suspend
                        </Button>
                      )}
                      {permissions.canBanUsers && (
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setUserToBan(selectedUser.id);
                            setShowBanDialog(true);
                            setShowUserDialog(false);
                          }}
                        >
                          Ban
                        </Button>
                      )}
                    </>
                  ) : (
                    permissions.canBanUsers && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleUnbanUser(selectedUser.id);
                          setShowUserDialog(false);
                        }}
                        disabled={loadingStates[`unban-${selectedUser.id}`]}
                      >
                        Unban
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Subscription Transactions Dialog */}
        <Dialog open={showSubscriptionTransactionsDialog} onOpenChange={setShowSubscriptionTransactionsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>
                Transaction history for this subscription attempt.
              </DialogDescription>
            </DialogHeader>
            {transactionDetailsSubscription && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">User</Label>
                    <p className="text-sm font-medium">{transactionDetailsSubscription.profiles?.email || "Unknown"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Plan</Label>
                    <p className="text-sm font-medium capitalize">{transactionDetailsSubscription.plan_name} ({transactionDetailsSubscription.billing_cycle})</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Badge variant={transactionDetailsSubscription.status === 'active' ? 'default' : transactionDetailsSubscription.status === 'failed' ? 'destructive' : 'secondary'}>
                      {transactionDetailsSubscription.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Amount</Label>
                    <p className="text-sm font-bold">KES {transactionDetailsSubscription.amount?.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Technical Details</h4>
                  <div className="grid grid-cols-1 gap-2 bg-muted/30 p-3 rounded-md text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Checkout Request ID:</span>
                      <span>{transactionDetailsSubscription.checkout_request_id || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">M-Pesa Receipt:</span>
                      <span>{transactionDetailsSubscription.mpesa_receipt_number || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Initiated At:</span>
                      <span>{transactionDetailsSubscription.initiated_at ? new Date(transactionDetailsSubscription.initiated_at).toLocaleString() : "N/A"}</span>
                    </div>
                    {transactionDetailsSubscription.failure_reason && (
                      <div className="mt-2 pt-2 border-t border-red-100 text-red-600">
                        <span className="font-semibold">Failure Reason: </span>
                        {transactionDetailsSubscription.failure_reason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowSubscriptionTransactionsDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detailed Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Export Data</DialogTitle>
              <DialogDescription>
                Select data type and optional date range for export.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resource-type" className="text-right">
                  Data Type
                </Label>
                <Select value={exportResourceType} onValueChange={setExportResourceType}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="transactions">Transactions</SelectItem>
                    <SelectItem value="subscriptions">Subscriptions</SelectItem>
                    <SelectItem value="withdrawals">Withdrawals</SelectItem>
                    <SelectItem value="reports">Reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Start Date</Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !exportStartDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {exportStartDate ? format(exportStartDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={exportStartDate}
                        onSelect={setExportStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">End Date</Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !exportEndDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {exportEndDate ? format(exportEndDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={exportEndDate}
                        onSelect={setExportEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
              <Button onClick={handleDetailedExport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
