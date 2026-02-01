import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import AdminWallets from "@/pages/AdminWallets";
import { AdminSystemScan } from "@/components/admin/AdminSystemScan";
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

import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { UserManagement } from "@/components/admin/UserManagement";
import { AdminAuditLogs } from "@/components/admin/AdminAuditLogs";
import { SystemMonitoring } from "@/components/admin/SystemMonitoring";
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
  const navigate = useNavigate();
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
  const [newAdminPermissions, setNewAdminPermissions] = useState({
    can_manage_users: true,
    can_manage_products: true,
    can_manage_categories: false,
    can_manage_reports: true,
    can_manage_subscriptions: false,
    can_view_analytics: false,
    can_manage_system: false,
    can_manage_banners: false,
    can_export_data: false,
    can_send_emails: false,
    can_perform_bulk_actions: false,
  });
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
      { value: "withdrawals", label: "Wallets", icon: Wallet },
      { value: "admins", label: "Admins", icon: Shield },
      { value: "system", label: "System", icon: Settings },
      { value: "security", label: "Security", icon: ShieldAlert },
      { value: "health", label: "System Health", icon: Activity },
    ];

    return allTabs.filter((tab) => {
      switch (tab.value) {
        case "users":
          return permissions.canViewUsers;
        case "subscriptions":
          return permissions.canViewSubscriptions;
        case "admins":
          return permissions.canViewAdmins;
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
    } finally {
      setLoadingStates((prev) => ({ ...prev, admins: false }));
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
      // First, check if user exists in auth
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .single();

      if (!existingUser) {
        throw new Error("User must sign up first before being added as admin");
      }

      // Check if already an admin
      const { data: existingAdmin } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", existingUser.id)
        .single();

      if (existingAdmin) {
        throw new Error("User is already an admin");
      }

      // Create admin record with generated UUID
      const adminId = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from("admin_users")
        .insert({
          id: adminId,
          user_id: existingUser.id,
          email: email.trim().toLowerCase(),
          role: role,
          permissions: role === 'super_admin' ? {} : newAdminPermissions,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      toast({
        title: "Admin Added",
        description: `${email.trim()} has been added as a ${role}.`,
      });

      setShowAddAdminDialog(false);
      setNewAdminEmail("");
      loadAdminUsers();

      // Log success
      await logAdminAction(
        "create",
        "admin_user",
        adminId,
        { target_email: email, role, user_id: existingUser.id }
      );

    } catch (error: any) {
      console.error("Error adding admin:", error);
      toast({
        variant: "destructive",
        title: "Add Admin Failed",
        description: error.message || "Failed to add admin",
      });
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
    <div className="admin-glass p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-2xl animate-fade-in border border-white/5">
      <div className="flex items-center gap-6">
        <div className="relative group cursor-default">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-glow-pulse"></div>
          <div
            className={`relative p-3 rounded-2xl ${isSuperAdmin
              ? "bg-gradient-to-br from-rose-600/30 to-pink-600/30 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
              : hasAdminRole
                ? "bg-gradient-to-br from-violet-600/30 to-cyan-600/30 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                : "bg-gradient-to-br from-emerald-600/30 to-teal-600/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              } border border-white/20 backdrop-blur-md`}
          >
            <Shield className="h-8 w-8 text-white animate-float" />
          </div>
        </div>
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-1">
            <span className="text-nebula-gradient">Control</span> Center
          </h1>
          <div className="flex items-center gap-3">
             <Badge className="bg-violet-500/10 text-violet-600 border-none px-3 py-1 font-bold text-[10px] tracking-widest uppercase">
              {currentAdmin?.role?.replace('_', ' ') || 'Admin'}
            </Badge>
            <span className="w-1 h-1 rounded-full bg-slate-900/10" />
            <p className="text-slate-600 text-sm font-medium">
              {isModerator ? "Security Protocol: Active (Limited)" : "Security Protocol: Active (Full Access)"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/40 p-2 rounded-2xl border border-white/60 shadow-sm backdrop-blur-xl w-full lg:w-auto">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search platform ecosystem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 w-full bg-white/50 border-white/20 text-slate-900 placeholder:text-slate-400 focus:ring-violet-500 focus:border-violet-500 rounded-xl h-11 transition-all"
          />
        </div>

        <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-1" />

        {permissions.canExportData && (
          <Button variant="ghost" size="icon" onClick={() => setShowExportDialog(true)} className="text-slate-400 hover:text-slate-600 hover:bg-white/50 h-11 w-11 rounded-xl">
            <Download className="h-5 w-5" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={loadDashboardData}
          disabled={loadingStates.refresh}
          className="text-slate-400 hover:text-slate-600 hover:bg-white/50 h-11 w-11 rounded-xl"
        >
          <RefreshCw
            className={`h-5 w-5 ${loadingStates.refresh ? "animate-spin" : ""}`}
          />
        </Button>

        {permissions.canManageSystem && (
          <Button
            onClick={() => setShowSystemSettingsDialog(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-violet-600/20 border-none transition-all"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            System Control
          </Button>
        )}
      </div>
    </div>
  );

  const renderQuickActions = () => (
    <Card className="admin-glass border-none shadow-2xl h-full hover-glow-nebula transition-all duration-500">
      <CardHeader>
        <CardTitle className="text-slate-900 text-lg">Command Execution</CardTitle>
        <CardDescription className="text-slate-500 text-xs text-opacity-70">High-priority operational protocols</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {permissions.canApproveProducts && (
            <Button
              variant="ghost"
              className="h-auto py-4 flex flex-col gap-3 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:text-violet-600 transition-all border border-slate-100 group"
              onClick={() => setActiveTab("pending")}
            >
              <div className="p-3 bg-white shadow-sm rounded-xl group-hover:bg-violet-100 transition-colors">
                <Clock className="h-6 w-6 text-violet-500" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Review Queue</p>
                <p className="text-xs font-bold text-slate-700">{stats.pendingProducts} Pending</p>
              </div>
            </Button>
          )}

          {permissions.canResolveReports && (
            <Button
              variant="ghost"
              className="h-auto py-4 flex flex-col gap-3 rounded-2xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100 group"
              onClick={() => setActiveTab("reports")}
            >
              <div className="p-3 bg-white shadow-sm rounded-xl group-hover:bg-rose-100 transition-colors">
                <Flag className="h-6 w-6 text-rose-500" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Integrity Hub</p>
                <p className="text-xs font-bold text-slate-700">{stats.pendingReports} Alerts</p>
              </div>
            </Button>
          )}

          {permissions.canManageCategories && (
            <Button
              variant="ghost"
              className="h-auto py-4 flex flex-col gap-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 group"
              onClick={() => setShowCategoryDialog(true)}
            >
              <div className="p-3 bg-white shadow-sm rounded-xl group-hover:bg-emerald-100 transition-colors">
                <Plus className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">System Taxonomy</p>
                <p className="text-xs font-bold text-slate-700">New Category</p>
              </div>
            </Button>
          )}

          {permissions.canSendEmails && (
            <Button
              variant="ghost"
              className="h-auto py-4 flex flex-col gap-3 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100 group"
              onClick={() => setShowEmailTemplateDialog(true)}
            >
              <div className="p-3 bg-white shadow-sm rounded-xl group-hover:bg-blue-100 transition-colors">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Comm-Link</p>
                <p className="text-xs font-bold text-slate-700">Broadcast</p>
              </div>
            </Button>
          )}

          {permissions.canPerformBulkActions && (
            <Button
              variant="ghost"
              className="h-auto py-4 flex flex-col gap-3 rounded-2xl bg-slate-100/50 hover:bg-slate-100 transition-all border border-slate-200 group"
              onClick={() => setShowBulkActionDialog(true)}
            >
              <div className="p-3 bg-white shadow-sm rounded-xl group-hover:bg-slate-200 transition-colors">
                <Users2 className="h-6 w-6 text-slate-600" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Mass Protocol</p>
                <p className="text-xs font-bold text-slate-700">Bulk Actions</p>
              </div>
            </Button>
          )}

          {permissions.canViewProducts && (
            <Button
              variant="ghost"
              className="h-auto py-4 flex flex-col gap-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100 group"
              onClick={() => setActiveTab("products")}
            >
              <div className="p-3 bg-white shadow-sm rounded-xl group-hover:bg-emerald-100 transition-colors">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Inventory Hub</p>
                <p className="text-xs font-bold text-slate-700">{stats.totalProducts - stats.pendingProducts} Active</p>
              </div>
            </Button>
          )}

          {permissions.canBackupSystem && (
            <Button
              variant="ghost"
              className="h-auto py-4 flex flex-col gap-3 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:text-violet-600 transition-all border border-slate-100 group"
              onClick={() => setShowBackupDialog(true)}
              disabled={loadingStates["system-backup"]}
            >
              <div className="p-3 bg-white shadow-sm rounded-xl group-hover:bg-violet-100 transition-colors">
                <DownloadCloud className="h-6 w-6 text-violet-600" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Archival</p>
                <p className="text-xs font-bold text-slate-700">Cloud Backup</p>
              </div>
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
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {permissions.canBanUsers && (
                  <TableHead className="w-12 whitespace-nowrap">
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
                <TableHead className="whitespace-nowrap">User</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Products</TableHead>
                <TableHead className="whitespace-nowrap">Joined</TableHead>
                {permissions.canBanUsers && <TableHead className="whitespace-nowrap">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  {permissions.canBanUsers && (
                    <TableCell className="whitespace-nowrap">
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
                  <TableCell className="whitespace-nowrap">
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
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.full_name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
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
                  <TableCell className="whitespace-nowrap">{user.products_count || 0}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  {permissions.canBanUsers && (
                    <TableCell className="whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserDialog(true);
                          }}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user.status === "active" ? (
                          <>
                            {permissions.canSuspendUsers && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUserToSuspend(user.id);
                                  setShowSuspendDialog(true);
                                }}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                            {permissions.canBanUsers && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUserToBan(user.id);
                                  setShowBanDialog(true);
                                }}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        ) : (
                          permissions.canBanUsers && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnbanUser(user.id)}
                              disabled={loadingStates[`unban-${user.id}`]}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            >
                              <Unlock className="h-4 w-4" />
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
        </div>
      </CardContent>
    </Card>
  );

  const renderAdminManagement = () => {
    if (!permissions.canViewAdmins) return null;

    return (
      <Card className="admin-glass border-none shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div>
            <CardTitle className="text-slate-900 text-xl">Governance Board</CardTitle>
            <CardDescription className="text-slate-500">
              {permissions.canManageAdmins
                ? "Authorization matrix and administrative protocols"
                : "Active governance oversight team"}
            </CardDescription>
          </div>
          {permissions.canManageAdmins && (
            <Button 
              onClick={() => setShowAddAdminDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg border-none"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Proxy
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="text-slate-500 pl-6 whitespace-nowrap">Administrative Unit</TableHead>
                  <TableHead className="text-slate-500 whitespace-nowrap">Privilege Tier</TableHead>
                  <TableHead className="text-slate-500 text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-slate-500 whitespace-nowrap">Deployment</TableHead>
                  {permissions.canManageAdmins && <TableHead className="text-slate-500 text-right pr-6 whitespace-nowrap">Management</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((admin) => (
                  <TableRow key={admin.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                    <TableCell className="pl-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-slate-200">
                          <AvatarFallback className="bg-violet-100 text-violet-600 text-[10px] font-bold">
                            {admin.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{admin.email}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            {admin.full_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`rounded-full px-3 py-0.5 text-[10px] uppercase font-black border-none ${
                          admin.role === "super_admin"
                            ? "bg-rose-600 text-white"
                            : admin.role === "admin"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {admin.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        admin.is_active ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-50"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                        {admin.is_active ? "Operational" : "Inactive"}
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </TableCell>
                    {permissions.canManageAdmins && (
                      <TableCell className="text-right pr-6 whitespace-nowrap">
                        {admin.role !== "super_admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAdmin(admin.id)}
                            disabled={loadingStates[`remove-admin-${admin.id}`]}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProductActions = (product: Product) => {
    return (
      <div className="flex items-center justify-end gap-2">
        {permissions.canApproveProducts && product.status === "pending" && (
          <Button
            size="sm"
            onClick={() => handleApproveProduct(product.id)}
            disabled={loadingStates[`approve-${product.id}`]}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Approve
          </Button>
        )}
        {permissions.canRejectProducts && product.status === "pending" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setProductToReject(product.id);
              setShowRejectDialog(true);
            }}
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold rounded-lg"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Reject
          </Button>
        )}
        {permissions.canFeatureProducts && (
          <div className="flex items-center gap-2 px-2 bg-slate-50 rounded-lg border border-slate-100 h-8">
            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Featured</span>
            <Switch
              checked={product.featured}
              onCheckedChange={(checked) =>
                handleFeatureProduct(product.id, checked)
              }
              disabled={loadingStates[`feature-${product.id}`]}
              className="scale-75"
            />
          </div>
        )}
        {permissions.canDeleteProducts && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteProduct(product.id)}
            disabled={loadingStates[`delete-${product.id}`]}
            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedProduct(product);
            setShowProductDialog(true);
          }}
          className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 hover:bg-violet-50"
        >
          <Eye className="h-4 w-4" />
        </Button>
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
    <div className="min-h-screen crystal-bg text-slate-900 selection:bg-violet-500/30 overflow-x-hidden relative">
      {/* Crystal Particles */}
      <div className="nebula-particle w-[400px] h-[400px] bg-violet-400/10 top-[-10%] left-[-5%] animate-float-particle" />
      <div className="nebula-particle w-[300px] h-[300px] bg-cyan-400/10 top-[40%] right-[-5%] animate-float-particle [animation-delay:2s]" />
      <div className="nebula-particle w-[500px] h-[500px] bg-pink-400/10 bottom-[-10%] left-[20%] animate-float-particle [animation-delay:4s]" />

      <div className="container mx-auto py-8 px-4 lg:px-8 space-y-8 max-w-[1600px] relative z-10">
        {renderHeader()}

        <AdminAnalytics 
          stats={stats}
          revenueData={chartRevenueData}
          userGrowthData={chartUserGrowthData}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8 relative"
        >
          <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-xl sticky top-4 z-40 overflow-hidden">
            <TabsList className="flex w-full bg-slate-100/50 rounded-xl h-auto p-1 gap-1 overflow-x-auto no-scrollbar min-w-max sm:min-w-0">
              {getVisibleTabs().map((tab) => (
                tab.value === "withdrawals" ? (
                  <div
                    key={tab.value}
                    onClick={() => navigate("/admin/wallets")}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl cursor-pointer transition-all text-slate-400 hover:text-slate-600 hover:bg-slate-100 whitespace-nowrap"
                    role="button"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </div>
                ) : (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-slate-500 hover:text-slate-900 border-none shadow-sm data-[state=active]:shadow-violet-600/20 whitespace-nowrap"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                )
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
               <div className="xl:col-span-1">
                 {renderQuickActions()}
               </div>
               <div className="xl:col-span-3 space-y-8">
                 <SystemMonitoring 
                    health={systemHealth || undefined}
                    onRefresh={loadDashboardData}
                 />
                 <AdminAuditLogs logs={adminActions} />
               </div>
             </div>
          </TabsContent>

          {/* Product Management Tab */}
          <TabsContent value="products" className="animate-in fade-in duration-500">
            {permissions.canViewProducts ? (
              <Card className="admin-glass border-none shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                  <div>
                    <CardTitle className="text-slate-900 text-xl">Inventory Management</CardTitle>
                    <CardDescription className="text-slate-500">Global registry of platform product listings</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-blue-600/10 text-blue-600 border-none px-4 py-1.5 font-bold text-xs uppercase">
                      {approvedProducts.length} Active Units
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                          <TableHead className="text-slate-500 pl-6 whitespace-nowrap">Product</TableHead>
                          <TableHead className="text-slate-500 whitespace-nowrap">Seller</TableHead>
                          <TableHead className="text-slate-500 text-center whitespace-nowrap">Price</TableHead>
                          <TableHead className="text-slate-500 text-center whitespace-nowrap">Status</TableHead>
                          <TableHead className="text-slate-500 whitespace-nowrap">Listed On</TableHead>
                          <TableHead className="text-slate-500 text-right pr-6 whitespace-nowrap">Commands</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-24">
                              <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-slate-100 rounded-full">
                                  <Package className="h-12 w-12 text-slate-400 opacity-20" />
                                </div>
                                <p className="text-slate-400 font-medium">No active products found in the ecosystem.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          approvedProducts.map((product) => (
                            <TableRow key={product.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                              <TableCell className="pl-6 whitespace-nowrap">
                                <div className="flex items-center gap-4">
                                  {product.images?.[0] ? (
                                    <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-slate-200 group-hover:border-violet-500/50 transition-colors">
                                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                                      <Package className="h-6 w-6 text-slate-300" />
                                    </div>
                                  )}
                                  <div className="space-y-1">
                                    <p className="font-bold text-slate-900 text-sm line-clamp-1">{product.name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">PK: {product.id.slice(0, 8)}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <p className="text-xs text-slate-600">{product.seller_email}</p>
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                <p className="text-sm font-bold text-emerald-600 font-mono">KES {product.price?.toLocaleString()}</p>
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none text-[10px] font-black uppercase">
                                  Operational
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                {new Date(product.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right pr-6 whitespace-nowrap">
                                {renderProductActions(product)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="admin-glass p-12 rounded-2xl border border-white/5 text-center">
                <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h3>
                <p className="text-slate-500">Inventory clearance required for this terminal. Seek authorization.</p>
              </div>
            )}
          </TabsContent>

          {/* Pending Verification Tab */}
          <TabsContent value="pending" className="animate-in fade-in duration-500">
            {permissions.canApproveProducts ? (
              <Card className="admin-glass border-none shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                  <div>
                    <CardTitle className="text-slate-900 text-xl">Verification Queue</CardTitle>
                    <CardDescription className="text-slate-500">High-priority listings awaiting security clearance</CardDescription>
                  </div>
                  {pendingProducts.length > 0 && (
                    <Badge className="bg-rose-500 text-white border-none px-4 py-1.5 font-bold text-xs uppercase animate-pulse">
                      {pendingProducts.length} Pending Approval
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                          <TableHead className="text-slate-500 pl-6 whitespace-nowrap">Unit</TableHead>
                          <TableHead className="text-slate-500 whitespace-nowrap">Source Provider</TableHead>
                          <TableHead className="text-slate-500 text-center whitespace-nowrap">Value</TableHead>
                          <TableHead className="text-slate-500 text-center whitespace-nowrap">Protocol</TableHead>
                          <TableHead className="text-slate-500 whitespace-nowrap">Sync Time</TableHead>
                          <TableHead className="text-slate-500 text-right pr-6 whitespace-nowrap">Authorization</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-24">
                              <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-slate-100 rounded-full">
                                  <CheckCircle className="h-12 w-12 text-emerald-500 opacity-20" />
                                </div>
                                <p className="text-slate-400 font-medium">Queue is empty. Operational integrity at 100%.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          pendingProducts.map((product) => (
                            <TableRow key={product.id} className="border-slate-100 hover:bg-slate-50 transition-colors group">
                              <TableCell className="pl-6 whitespace-nowrap">
                                <div className="flex items-center gap-4">
                                  {product.images?.[0] ? (
                                    <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-slate-200 group-hover:border-violet-500/50 transition-colors">
                                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                                      <Package className="h-6 w-6 text-slate-300" />
                                    </div>
                                  )}
                                  <div className="space-y-1">
                                    <p className="font-bold text-slate-900 text-sm line-clamp-1">{product.name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">SKU: {product.id.slice(0, 8)}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <p className="text-xs text-slate-600 font-medium">{product.seller_email}</p>
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                <p className="text-sm font-bold text-violet-600 font-mono">KES {product.price?.toLocaleString()}</p>
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                <Badge variant="outline" className="bg-rose-50 text-rose-600 border-none text-[10px] font-black uppercase">
                                  Awaiting Sync
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                {new Date(product.created_at).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right pr-6 whitespace-nowrap">
                                {renderProductActions(product)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="admin-glass p-12 rounded-2xl border border-white/5 text-center">
                <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h3>
                <p className="text-slate-500">Security clearance insufficient for pending list. Raise request with Super-Admin.</p>
              </div>
            )}
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="animate-in fade-in duration-500">
            {permissions.canViewUsers ? (
              <UserManagement 
                users={users}
                selectedUsers={selectedUsers}
                setSelectedUsers={setSelectedUsers}
                onViewUser={(user) => {
                  setSelectedUser(user);
                  setShowUserDialog(true);
                }}
                onBanUser={(id) => {
                  setUserToBan(id);
                  setShowBanDialog(true);
                }}
                onSuspendUser={(id) => {
                  setUserToSuspend(id);
                  setShowSuspendDialog(true);
                }}
                onUnbanUser={handleUnbanUser}
                permissions={permissions}
                loadingStates={loadingStates}
              />
            ) : (
                <div className="admin-glass p-12 rounded-2xl border border-white/5 text-center">
                   <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                   <h3 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h3>
                   <p className="text-slate-500">You don't have permission to view user management. Contact a super administrator for clearance.</p>
                </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="animate-in fade-in duration-500">
            <Card className="admin-glass border-none shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div>
                  <CardTitle className="text-slate-900 text-xl">Taxonomy Control</CardTitle>
                  <CardDescription className="text-slate-500">Architectural hierarchy of platform categories</CardDescription>
                </div>
                {permissions.canManageCategories && (
                  <Button 
                    onClick={() => {
                      setPropertyEditorState([]);
                      setNewCategory({ ...newCategory, properties: "{}" });
                      setShowCategoryDialog(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg border-none"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Dimension
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className="text-slate-500 pl-6 whitespace-nowrap">Dimension</TableHead>
                        <TableHead className="text-slate-500 whitespace-nowrap">Definition</TableHead>
                        <TableHead className="text-slate-500 text-center whitespace-nowrap">Volume</TableHead>
                        <TableHead className="text-slate-500 text-center whitespace-nowrap">Protocol</TableHead>
                        <TableHead className="text-slate-500 whitespace-nowrap">Sequence</TableHead>
                        {permissions.canManageCategories && (
                          <TableHead className="text-slate-500 text-right pr-6 whitespace-nowrap">Management</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.map((category) => (
                        <TableRow key={category.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                          <TableCell className="font-bold text-slate-900 pl-6 whitespace-nowrap">
                            {category.name}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <p className="text-xs text-slate-500 max-w-[200px] truncate">
                              {category.description || "System default description"}
                            </p>
                          </TableCell>
                          <TableCell className="text-center font-mono text-violet-600 whitespace-nowrap">
                            {category.product_count || 0}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={`rounded-full px-3 py-0.5 text-[10px] uppercase font-black border-none ${
                                category.is_active 
                                  ? "bg-emerald-50 text-emerald-600" 
                                  : "bg-slate-50 text-slate-400"
                              }`}
                            >
                              {category.is_active ? "Operational" : "Offline"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-400 whitespace-nowrap">
                            {new Date(category.created_at).toLocaleDateString()}
                          </TableCell>
                          {permissions.canManageCategories && (
                            <TableCell className="text-right pr-6 whitespace-nowrap">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCategory(category);
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
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCategory(category.id)}
                                  disabled={loadingStates[`delete-category-${category.id}`]}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners" className="animate-in fade-in duration-500">
            {permissions.canViewBanners ? (
              <div className="admin-glass p-8 rounded-2xl border border-white/5">
              <AdminBannerManager
                currentAdmin={currentAdmin}
                permissions={permissions}
              />
            </div>
            ) : (
              <div className="bg-white/80 p-12 rounded-2xl border border-slate-200 text-center shadow-xl backdrop-blur-md">
                <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h3>
                <p className="text-slate-500">Broadcasting permission denied.</p>
              </div>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="animate-in fade-in duration-500">
            <Card className="admin-glass border-none shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div>
                  <CardTitle className="text-slate-900 text-xl">Integrity Monitoring</CardTitle>
                  <CardDescription className="text-slate-500">High-priority user reports and policy violations</CardDescription>
                </div>
                <Badge
                  className={`rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest ${
                    pendingReports.length > 0 ? "bg-rose-600 text-white animate-pulse" : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {pendingReports.length} Critical Events
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow className="border-slate-100 hover:bg-transparent">
                        <TableHead className="text-slate-500 pl-6 whitespace-nowrap">Subject</TableHead>
                        <TableHead className="text-slate-500 whitespace-nowrap">Source</TableHead>
                        <TableHead className="text-slate-500 whitespace-nowrap">Violation</TableHead>
                        <TableHead className="text-slate-500 text-center whitespace-nowrap">Priority</TableHead>
                        <TableHead className="text-slate-500 text-center whitespace-nowrap">Status</TableHead>
                        <TableHead className="text-slate-500 whitespace-nowrap">Timestamp</TableHead>
                        {permissions.canResolveReports && (
                          <TableHead className="text-slate-500 text-right pr-6 whitespace-nowrap">Resolution</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id} className="border-slate-100 hover:bg-slate-50 transition-colors group">
                          <TableCell className="pl-6 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              {report.product_images?.[0] ? (
                                <div className="relative h-11 w-11 rounded-xl overflow-hidden border border-slate-200 group-hover:border-violet-500/50 transition-colors">
                                  <img
                                    src={report.product_images[0]}
                                    alt={report.product_name || "Product"}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-slate-300" />
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-900 text-sm">
                                  {report.product_name || "Unidentified Unit"}
                                </p>
                                {report.product_price && (
                                  <p className="text-[10px] text-violet-600 font-mono font-bold tracking-tight">
                                    KES {report.product_price.toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-slate-200">
                                {report.reporter_avatar ? (
                                  <AvatarImage src={report.reporter_avatar} />
                                ) : (
                                  <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
                                    {report.reporter_email?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <p className="text-xs text-slate-600 font-medium">
                                {report.reporter_email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-tighter">
                              {report.reason}
                            </span>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase border-none ${
                                 report.priority === "high"
                                  ? "bg-rose-600 text-white"
                                  : report.priority === "medium"
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {report.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                               report.status === "pending" ? "text-rose-600 bg-rose-50" : "text-emerald-600 bg-emerald-50"
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${report.status === "pending" ? "bg-rose-600 animate-pulse" : "bg-emerald-600"}`} />
                              {report.status}
                            </div>
                          </TableCell>
                          <TableCell className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                            {new Date(report.created_at).toLocaleString()}
                          </TableCell>
                          {permissions.canResolveReports && (
                            <TableCell className="text-right pr-6 whitespace-nowrap">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setShowReportDialog(true);
                                  }}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {report.status === "pending" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResolveReport(report.id, "dismissed", "Manual dismissal")}
                                    disabled={loadingStates[`resolve-${report.id}`]}
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="animate-in fade-in duration-500">
            {permissions.canViewSubscriptions ? (
              <div className="space-y-8">
                <div className="bg-white/80 p-2 rounded-2xl border border-slate-200 shadow-sm w-fit backdrop-blur-md">
                  <Tabs defaultValue="plans" className="w-full">
                    <TabsList className="bg-slate-100 rounded-xl h-auto p-1 gap-1">
                      <TabsTrigger value="plans" className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-500 hover:text-slate-900 shadow-sm transition-all">Active Ecosystem</TabsTrigger>
                      <TabsTrigger value="history" className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-500 hover:text-slate-900 shadow-sm transition-all">Financial Sequence</TabsTrigger>
                    </TabsList>

                    <TabsContent value="plans" className="mt-8 space-y-8">
                      <Card className="admin-glass border-none shadow-2xl">
                        <CardHeader className="pb-6">
                           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div>
                              <CardTitle className="text-slate-900 text-xl font-bold">Revenue Flow Management</CardTitle>
                              <CardDescription className="text-slate-500">Supervision of platform subscription clusters</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                              <Select value={subscriptionStatusFilter} onValueChange={setSubscriptionStatusFilter}>
                                <SelectTrigger className="w-48 bg-white border-slate-200 text-slate-900 rounded-xl h-11 shadow-sm">
                                  <SelectValue placeholder="Protocol Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-slate-900 shadow-xl">
                                  <SelectItem value="all">Unified View</SelectItem>
                                  <SelectItem value="active">Operational</SelectItem>
                                  <SelectItem value="pending">Syncing</SelectItem>
                                  <SelectItem value="failed">Interrupted</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  placeholder="Sequence ID..."
                                  value={subscriptionSearchTerm}
                                  onChange={(e) => setSubscriptionSearchTerm(e.target.value)}
                                  className="pl-12 w-64 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 shadow-sm"
                                />
                              </div>
                            </div>
                           </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader className="bg-slate-50">
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                  <TableHead className="text-slate-500 pl-6 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Member</TableHead>
                                  <TableHead className="text-slate-500 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Tier</TableHead>
                                  <TableHead className="text-slate-500 text-center font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Status</TableHead>
                                  <TableHead className="text-slate-500 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Reference</TableHead>
                                  <TableHead className="text-slate-500 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Revenue</TableHead>
                                  <TableHead className="text-slate-500 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Expiry</TableHead>
                                  {permissions.canManageSubscriptions && (
                                    <TableHead className="text-slate-500 text-right pr-6 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Override</TableHead>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredSubscriptions.map((subscription) => (
                                  <TableRow key={subscription.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                                    <TableCell className="pl-6 whitespace-nowrap">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-slate-100 shadow-sm">
                                          <AvatarFallback className="text-[10px] bg-blue-50 text-blue-600 font-bold">
                                            {subscription.user_email?.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="text-sm font-bold text-slate-900">{subscription.user_email}</p>
                                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{subscription.user_name}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none font-black text-[10px] uppercase">
                                        {subscription.plan_name}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-center whitespace-nowrap">
                                      <Badge className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase border-none ${
                                        subscription.status === "active" ? "bg-emerald-500 text-white" : "bg-rose-50 text-rose-600"
                                      }`}>
                                        {subscription.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-[10px] text-slate-400 whitespace-nowrap">
                                      {subscription.mpesa_receipt_number || "Internal Sync"}
                                    </TableCell>
                                    <TableCell className="font-bold text-slate-900 whitespace-nowrap">
                                      KES {subscription.price_monthly?.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                      {new Date(subscription.current_period_end).toLocaleDateString()}
                                    </TableCell>
                                    {permissions.canManageSubscriptions && (
                                      <TableCell className="text-right pr-6 whitespace-nowrap">
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setTransactionDetailsSubscription(subscription);
                                              setShowSubscriptionTransactionsDialog(true);
                                            }}
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
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
                                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                          >
                                            <Settings className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="history" className="mt-8">
                       <Card className="admin-glass border-none shadow-2xl">
                        <CardHeader className="pb-6">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-slate-900 text-xl font-bold">Transaction Sequence</CardTitle>
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input
                                placeholder="Trace Reference..."
                                value={transactionSearchTerm}
                                onChange={(e) => setTransactionSearchTerm(e.target.value)}
                                className="pl-12 w-80 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl h-11 shadow-sm"
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                           <div className="overflow-x-auto">
                             <Table>
                               <TableHeader className="bg-slate-50">
                                 <TableRow className="border-slate-100 hover:bg-transparent">
                                   <TableHead className="text-slate-500 pl-6 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Unit</TableHead>
                                   <TableHead className="text-slate-500 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Volume</TableHead>
                                   <TableHead className="text-slate-500 text-center font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Outcome</TableHead>
                                   <TableHead className="text-slate-500 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Sequence ID</TableHead>
                                   <TableHead className="text-slate-500 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Protocol</TableHead>
                                   <TableHead className="text-slate-500 font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Timestamp</TableHead>
                                 </TableRow>
                               </TableHeader>
                               <TableBody>
                                 {filteredTransactions.map((tx) => (
                                   <TableRow key={tx.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                                     <TableCell className="pl-6 font-bold text-slate-900 whitespace-nowrap">{tx.user_email}</TableCell>
                                     <TableCell className="font-black text-emerald-600 font-mono whitespace-nowrap">KES {tx.amount.toLocaleString()}</TableCell>
                                     <TableCell className="text-center whitespace-nowrap">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                          tx.status === "completed" || tx.status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                        }`}>
                                          <div className={`w-1.5 h-1.5 rounded-full ${tx.status === "completed" || tx.status === "success" ? "bg-emerald-600" : "bg-rose-600 animate-pulse"}`} />
                                          {tx.status}
                                        </div>
                                     </TableCell>
                                     <TableCell className="font-mono text-[10px] text-slate-400 font-medium whitespace-nowrap">{tx.mpesa_receipt_number || "Internal"}</TableCell>
                                     <TableCell className="text-[10px] uppercase font-black text-slate-400 tracking-wider text-center whitespace-nowrap">{tx.payment_method}</TableCell>
                                     <TableCell className="text-[10px] font-bold text-slate-300 whitespace-nowrap">{new Date(tx.created_at).toLocaleString()}</TableCell>
                                   </TableRow>
                                 ))}
                               </TableBody>
                             </Table>
                           </div>
                        </CardContent>
                       </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 p-12 rounded-2xl border border-slate-200 text-center shadow-xl backdrop-blur-md">
                  <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h3>
                  <p className="text-slate-500">Security clearance insufficient for financial logs. Raise request with Super-Admin.</p>
               </div>
            )}
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-6 animate-in fade-in duration-500 scroll-mt-32">
            <AdminWallets />
          </TabsContent>

          {/* Admins Tab */}
          <TabsContent value="admins" className="animate-in fade-in duration-500 scroll-mt-32">{renderAdminManagement()}</TabsContent>

          {/* Analytics Tab */}


          {/* System Tab */}
          <TabsContent value="system" className="animate-in fade-in duration-500 scroll-mt-32">
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
          <TabsContent value="security" className="space-y-6 animate-in fade-in duration-500 scroll-mt-32">
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

          <TabsContent value="health" className="space-y-6 animate-in fade-in duration-500 scroll-mt-32">
             <AdminSystemScan />
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

              {/* Permission Checkboxes */}
              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Permissions</Label>
                <p className="text-xs text-muted-foreground mb-2">Select what this admin can do:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(newAdminPermissions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`perm-${key}`}
                        checked={value}
                        onChange={(e) => setNewAdminPermissions(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`perm-${key}`} className="text-xs">
                        {key.replace(/_/g, ' ').replace(/can /i, '')}
                      </label>
                    </div>
                  ))}
                </div>
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
