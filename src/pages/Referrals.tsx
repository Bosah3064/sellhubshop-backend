import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Copy,
  Share2,
  Gift,
  TrendingUp,
  Award,
  Loader2,
  CreditCard,
  Calendar,
  Zap,
  AlertCircle,
  Sparkles,
  Crown,
  Target,
  BarChart3,
  Rocket,
  Wallet,
  UserPlus,
  MessageCircle,
  Facebook,
  Twitter,
  Mail,
  Check,
  Star,
  Trophy,
  Coins,
  ArrowUpRight,
  RefreshCw,
  QrCode,
  Link as LinkIcon,
  FileText,
  Layout,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeGenerator } from "@/components/referrals/QRCodeGenerator";
import { UTMLinkBuilder } from "@/components/referrals/UTMLinkBuilder";
import { SocialTemplates } from "@/components/referrals/SocialTemplates";
import { ReferralLeaderboard } from "@/components/referrals/ReferralLeaderboard";
import { BannerGenerator } from "@/components/referrals/BannerGenerator";
import { GrowthHacks } from "@/components/referrals/GrowthHacks";

interface Referral {
  id: string;
  status: "pending" | "completed" | "expired";
  created_at: string;
  completed_at?: string;
  reward_amount: number;
  reward_type: string;
  referred_user_email?: string;
  referred_user_name?: string;
  referral_code?: string;
}

interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  total_earned: number;
  pending_referrals: number;
  pending_rewards: number;
  paid_rewards: number;
  potential_earnings: number;
  pending_withdrawals: number;
  successful_withdrawals: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

interface RewardTier {
  min_referrals: number;
  reward: number;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: any;
  gradient: string;
}

const generateUniqueCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateFallbackCode = (userId: string): string => {
  return `REF${userId.slice(-8).toUpperCase()}`;
};

const CalculatorSection = ({ rewardTiers, currentReferrals }: { rewardTiers: RewardTier[], currentReferrals: number }) => {
  const [inviteCount, setInviteCount] = useState(10);

  const calculateprojectedEarnings = (invites: number) => {
    let total = 0;
    let currentCount = currentReferrals;

    for (let i = 1; i <= invites; i++) {
      currentCount++;
      // Find eligible tiers for this new total count
      const eligibleTiers = rewardTiers.filter(t => currentCount >= t.min_referrals);
      // Use the highest eligible tier
      const tier = eligibleTiers[eligibleTiers.length - 1] || rewardTiers[0];
      total += tier.reward;
    }
    return total;
  };

  const projectedEarnings = calculateprojectedEarnings(inviteCount);

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <span className="text-base sm:text-lg font-medium text-gray-700">I plan to invite:</span>
          <span className="text-xl sm:text-2xl font-bold text-blue-600">{inviteCount} friends</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xs sm:text-sm text-gray-500">1</span>
          <input
            type="range"
            min="1"
            max="100"
            value={inviteCount}
            onChange={(e) => setInviteCount(parseInt(e.target.value))}
            className="w-full h-2 sm:h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-xs sm:text-sm text-gray-500">100</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -mr-8 sm:-mr-10 -mt-8 sm:-mt-10 blur-2xl group-hover:bg-white/20 transition-all"></div>
          <p className="text-green-100 font-medium mb-1 relative z-10 text-sm sm:text-base">Potential Earnings</p>
          <div className="flex flex-col gap-1 relative z-10">
            <span className="text-2xl sm:text-4xl md:text-5xl font-bold">KES {projectedEarnings.toLocaleString()}</span>
          </div>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-green-50 relative z-10 opacity-90">
            *Based on your current tier progression
          </p>
        </div>

        <div className="bg-white border-2 border-dashed border-gray-200 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-center items-center text-center">
          <Rocket className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500 mb-2" />
          <p className="text-sm sm:text-base text-gray-600 font-medium">
            Reach <span className="text-orange-600 font-bold">{Math.max(0, 20 - (currentReferrals + inviteCount))}</span> more referrals for Gold Tier!
          </p>
          <div className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-yellow-50 rounded-xl border border-yellow-100 inline-flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm text-yellow-700 font-semibold">Gold Tier:</span>
            <span className="text-xs sm:text-sm font-bold text-yellow-800">KES 150</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Referrals() {
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    completed_referrals: 0,
    total_earned: 0,
    pending_referrals: 0,
    pending_rewards: 0,
    paid_rewards: 0,
    potential_earnings: 0,
    pending_withdrawals: 0,
    successful_withdrawals: 0,
  });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const rewardTiers: RewardTier[] = [
    {
      min_referrals: 0,
      reward: 50,
      label: "Starter",
      description: "KES 50 per Silver/Gold subscription",
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      icon: Sparkles,
      gradient: "linear-gradient(135deg, #6B7280 0%, #374151 100%)",
    },
    {
      min_referrals: 5,
      reward: 75,
      label: "Bronze",
      description: "KES 75 per Silver/Gold subscription",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-100",
      textColor: "text-orange-700",
      icon: Award,
      gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    },
    {
      min_referrals: 10,
      reward: 100,
      label: "Silver",
      description: "KES 100 per Silver/Gold subscription",
      color: "from-gray-400 to-gray-500",
      bgColor: "bg-gray-100",
      textColor: "text-gray-700",
      icon: Crown,
      gradient: "linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)",
    },
    {
      min_referrals: 20,
      reward: 150,
      label: "Gold",
      description: "KES 150 per Silver/Gold subscription",
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
      icon: Trophy,
      gradient: "linear-gradient(135deg, #F59E0B 0%, #CA8A04 100%)",
    },
  ];

  useEffect(() => {
    initializeReferralSystem();
  }, []);

  const initializeReferralSystem = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Auth error:", userError);
        throw new Error("Please sign in to access referrals");
      }

      if (!user) {
        toast.error("Please sign in to access referrals");
        setError("Authentication required");
        return;
      }

      setCurrentUser(user);
      await generateReferralCode(user.id);
      await loadReferrals(user.id);
      await loadWithdrawals(user.id);
      await loadReferralStats(user.id);
      setupRealtimeSubscriptions(user.id);
    } catch (error: any) {
      console.error("Error initializing referral system:", error);
      const errorMessage = error.message || "Failed to load referral data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!currentUser) return;

    setRefreshing(true);
    try {
      await loadReferrals(currentUser.id);
      await loadWithdrawals(currentUser.id);
      await loadReferralStats(currentUser.id);
      toast.success("Data refreshed successfully!");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const generateReferralCode = async (userId: string) => {
    try {
      console.log("🔍 Checking for existing referral code...");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.log("⚠️ No active session, using fallback code");
        setReferralCode(generateFallbackCode(userId));
        return;
      }

      const { data: existingCode, error: fetchError } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (!fetchError && existingCode) {
        console.log("✅ Found existing referral code:", existingCode.code);
        setReferralCode(existingCode.code);
        return;
      }

      if (fetchError && fetchError.code !== "PGRST116") {
        console.warn("Error fetching referral code:", fetchError);
      }

      console.log("🔄 Generating new referral code...");
      const code = generateUniqueCode();

      const { error: insertError } = await supabase
        .from("referral_codes")
        .insert({
          user_id: userId,
          code: code,
          is_active: true,
        });

      if (insertError) {
        console.error("❌ Error inserting referral code:", insertError);
        if (insertError.code === "42501") {
          console.log("🛡️ RLS issue detected, using fallback code");
          setReferralCode(generateFallbackCode(userId));
          return;
        }
        throw insertError;
      }

      console.log("✅ Successfully created referral code:", code);
      setReferralCode(code);
    } catch (error) {
      console.error("💥 Error in generateReferralCode:", error);
      setReferralCode(generateFallbackCode(userId));
    }
  };

  const loadReferrals = async (userId: string) => {
    try {
      console.log("📊 Loading referrals for user:", userId);

      const { data: referralsData, error } = await supabase
        .from("referrals")
        .select(
          "id, status, reward_amount, created_at, referred_id, referral_code_used, updated_at"
        )
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading referrals:", error);
        setReferrals([]);
        return;
      }

      console.log("📋 Raw referrals from DB:", referralsData);

      const processedReferrals: Referral[] = [];

      if (referralsData && referralsData.length > 0) {
        // Batch get all referred users' profiles for better performance
        const referredIds = referralsData
          .map((r) => r.referred_id)
          .filter(Boolean);

        let profilesMap = new Map();
        if (referredIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .in("id", referredIds);

          if (!profilesError && profilesData) {
            profilesData.forEach((profile) => {
              profilesMap.set(profile.id, profile);
            });
          }
        }

        // Process each referral
        for (const referral of referralsData) {
          let userEmail = "New User";
          let userName = "New User";

          const userProfile = profilesMap.get(referral.referred_id);
          if (userProfile) {
            userEmail = userProfile.email || "No email";
            userName = userProfile.full_name || "New User";
          }

          // Get current tier for reward calculation
          const currentTier = getCurrentTierFromCount(
            referralsData.filter((r) => r.status === "completed").length
          );

          processedReferrals.push({
            id: referral.id,
            status: referral.status as "pending" | "completed" | "expired",
            created_at: referral.created_at,
            completed_at: referral.updated_at,
            reward_amount: referral.reward_amount || currentTier.reward,
            reward_type: "cash",
            referred_user_email: userEmail,
            referred_user_name: userName,
            referral_code: referral.referral_code_used,
          });
        }
      }

      console.log("✅ Processed referrals:", processedReferrals.length);
      setReferrals(processedReferrals);
    } catch (error: any) {
      console.error("Error loading referrals:", error);
      setReferrals([]);
    }
  };

  const loadReferralStats = async (userId: string) => {
    try {
      console.log("📈 Loading referral stats for user:", userId);

      const { data: referralsData, error: referralsError } = await supabase
        .from("referrals")
        .select("id, status, reward_amount, created_at, referred_id")
        .eq("referrer_id", userId);

      if (referralsError) {
        console.error("Error loading referral stats:", referralsError);
        setStats(prev => ({
          ...prev,
          total_referrals: 0,
          completed_referrals: 0,
          total_earned: 0,
          pending_referrals: 0,
          pending_rewards: 0,
          paid_rewards: 0,
          potential_earnings: 0,
        }));
        return;
      }

      // Categorize referrals
      const completedReferrals = referralsData?.filter((r) => r.status === "completed") || [];
      const pendingReferrals = referralsData?.filter((r) => r.status === "pending") || [];

      // Get current tier for reward calculations
      const currentTier = getCurrentTierFromCount(completedReferrals.length);

      // Calculate actual earned from completed referrals
      const totalEarned = completedReferrals.reduce(
        (sum, r) => sum + (r.reward_amount || currentTier.reward),
        0
      );

      // Calculate potential from pending referrals using current tier
      const potentialEarnings = pendingReferrals.length * currentTier.reward;

      setStats(prev => ({
        ...prev,
        total_referrals: referralsData?.length || 0,
        completed_referrals: completedReferrals.length,
        total_earned: totalEarned,
        pending_referrals: pendingReferrals.length,
        pending_rewards: pendingReferrals.length * currentTier.reward,
        paid_rewards: totalEarned,
        potential_earnings: potentialEarnings,
      }));
    } catch (error: any) {
      console.error("Error loading referral stats:", error);
      setStats(prev => ({
        ...prev,
        total_referrals: 0,
        completed_referrals: 0,
        total_earned: 0,
        pending_referrals: 0,
        pending_rewards: 0,
        paid_rewards: 0,
        potential_earnings: 0,
      }));
    }
  };

  const loadWithdrawals = async (userId: string) => {
    try {
      console.log("💰 Loading withdrawals for user:", userId);
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.warn("Withdrawals table not yet created");
          return;
        }
        throw error;
      };

      setWithdrawals(data || []);

      const pending = data?.filter(w => w.status === 'pending' || w.status === 'processing')
        .reduce((sum, w) => sum + w.amount, 0) || 0;
      const successful = data?.filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0) || 0;

      setStats(prev => ({
        ...prev,
        pending_withdrawals: pending,
        successful_withdrawals: successful
      }));
    } catch (error) {
      console.error("Error loading withdrawals:", error);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!currentUser) return;

    const availableBalance = stats.total_earned - stats.successful_withdrawals - stats.pending_withdrawals;

    if (availableBalance < 500) {
      toast.error("Minimum withdrawal amount is KES 500");
      return;
    }

    try {
      setRequestingWithdrawal(true);
      const { error } = await supabase
        .from("withdrawals")
        .insert({
          id: crypto.randomUUID(),
          user_id: currentUser.id,
          amount: availableBalance,
          status: "pending",
          payment_method: "mpesa",
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success("Withdrawal request sent! Our team will process it manually.");
      await loadWithdrawals(currentUser.id);
    } catch (error: any) {
      console.error("Error requesting withdrawal:", error);
      toast.error(error.message || "Failed to request withdrawal");
    } finally {
      setRequestingWithdrawal(false);
    }
  };

  const setupRealtimeSubscriptions = (userId: string) => {
    const referralsSub = supabase
      .channel('referrals-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'referrals', filter: `referrer_id=eq.${userId}` },
        () => {
          loadReferrals(userId);
          loadReferralStats(userId);
        }
      )
      .subscribe();

    const withdrawalsSub = supabase
      .channel('withdrawals-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals', filter: `user_id=eq.${userId}` },
        () => {
          loadWithdrawals(userId);
          loadReferralStats(userId);
        }
      )
      .subscribe();

    return () => {
      referralsSub.unsubscribe();
      withdrawalsSub.unsubscribe();
    };
  };

  const getCurrentTierFromCount = (completedCount: number) => {
    // Find the highest tier that matches the completed count
    const eligibleTiers = rewardTiers.filter(
      (tier) => completedCount >= tier.min_referrals
    );
    const tier = eligibleTiers[eligibleTiers.length - 1] || rewardTiers[0];

    console.log(
      `Current tier for ${completedCount} completed referrals:`,
      tier.label
    );
    return tier;
  };

  const getCurrentTier = () => {
    return getCurrentTierFromCount(stats.completed_referrals);
  };

  const getNextTier = () => {
    const currentTier = getCurrentTier();
    const currentIndex = rewardTiers.findIndex(
      (tier) => tier.min_referrals === currentTier.min_referrals
    );

    if (currentIndex < rewardTiers.length - 1) {
      return rewardTiers[currentIndex + 1];
    }
    return null;
  };

  const copyReferralLink = () => {
    if (!referralCode) {
      toast.error("Referral code not ready yet");
      return;
    }

    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true);
        toast.success("🎉 Referral link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy to clipboard:", err);
        toast.error("Failed to copy link");
      });
  };

  const shareOnSocial = (platform: string) => {
    if (!referralCode) {
      toast.error("Referral code not ready yet");
      return;
    }

    const link = `${window.location.origin}/register?ref=${referralCode}`;
    const text = `Join me on this amazing marketplace! Use my referral link to sign up and subscribe to Silver (KES 500) or Gold (KES 1,200) plans. We both earn rewards! 🚀 ${link}`;

    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          link
        )}&quote=${encodeURIComponent(text)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text
        )}&url=${encodeURIComponent(link)}`;
        break;
      case "email":
        url = `mailto:?subject=Join me on Marketplace&body=${encodeURIComponent(
          text
        )}`;
        break;
      default:
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    toast.success(`Shared on ${platform}!`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-gradient-to-r from-green-500 to-green-600";
      case "pending":
        return "bg-gradient-to-r from-blue-500 to-blue-600";
      case "expired":
        return "bg-gradient-to-r from-gray-500 to-gray-600";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Reward Earned 🎉";
      case "pending":
        return "JOINED";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const progress = nextTier
    ? Math.min(100, (stats.completed_referrals / nextTier.min_referrals) * 100)
    : 100;

  const statsData = [
    {
      label: "Total Referrals",
      value: `${stats.total_referrals.toLocaleString()}`,
      icon: UserPlus,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200",
      description: "People joined via your link",
      trend: stats.total_referrals > 0 ? "up" : ("flat" as const),
    },
    {
      label: "Withdrawable",
      value: `KES ${(stats.total_earned - stats.successful_withdrawals - stats.pending_withdrawals).toLocaleString()}`,
      icon: Wallet,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      borderColor: "border-emerald-200",
      description: "Available balance",
      trend: (stats.total_earned - stats.successful_withdrawals - stats.pending_withdrawals) > 0 ? "up" : ("flat" as const),
    },
    {
      label: "Total Earned",
      value: `KES ${stats.total_earned.toLocaleString()}`,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-200",
      description: "Lifetime rewards",
      trend: stats.total_earned > 0 ? "up" : ("flat" as const),
    },
    {
      label: "Commission Rate",
      value: `KES ${currentTier.reward}`,
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      borderColor: "border-amber-200",
      description: "Current reward per conversion",
      trend: "up" as const,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-3xl max-w-md w-full">
          <div className="w-20 h-20 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Loading Referrals
          </h2>
          <p className="text-muted-foreground text-lg">
            Preparing your earning dashboard...
          </p>
        </Card>
      </div>
    );
  }

  if (error && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-3xl max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold mb-3 text-gray-900">
            Sign In Required
          </h2>
          <p className="text-muted-foreground text-lg mb-6">{error}</p>
          <Button
            onClick={() => (window.location.href = "/signin")}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg text-lg px-8 py-3 rounded-2xl"
            size="lg"
          >
            Sign In to Continue
          </Button>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center shadow-lg backdrop-blur-sm">
            <AlertCircle className="w-6 h-6 text-red-500 mr-4 flex-shrink-0" />
            <span className="text-red-700 flex-1 text-lg">{error}</span>
            <Button
              variant="outline"
              size="lg"
              className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Enhanced Header - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-12">
          <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl">
              <Rocket className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-blue-600 text-white border-0 text-xs sm:text-lg py-2 sm:py-3 px-3 sm:px-6 rounded-xl sm:rounded-2xl shadow-lg">
              <Zap className="w-3 h-3 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Earn KES 50-150 per referral!
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-6 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent px-2">
            Referral Program
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-4 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
            Invite friends to join! Earn rewards when they subscribe to
            <span className="font-semibold text-green-600"> Silver (KES 500)</span> or
            <span className="font-semibold text-yellow-600"> Gold (KES 1,200)</span> plans.
          </p>
        </div>

        {/* Enhanced Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-12">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="p-3 sm:p-6 hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 border sm:border-2 backdrop-blur-sm bg-white/80 rounded-xl sm:rounded-3xl group hover:scale-[1.02] sm:hover:scale-105"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-4">
                  <div
                    className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md sm:shadow-lg`}
                  >
                    <Icon className={`w-5 h-5 sm:w-7 sm:h-7 ${stat.color}`} />
                  </div>
                  {stat.trend === "up" && (
                    <div className="hidden sm:flex items-center gap-1 bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                      <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      Active
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-lg text-muted-foreground mb-1 sm:mb-2 font-medium truncate">
                  {stat.label}
                </p>
                <p className="text-lg sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  {stat.description}
                </p>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Reward Tiers - Mobile Optimized */}
        <Card className="p-4 sm:p-8 mb-6 sm:mb-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-3xl">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-3 text-gray-900">
              Your Reward Tier
            </h2>
            <p className="text-sm sm:text-xl text-muted-foreground">
              Level up and earn more per referral
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-10">
            {rewardTiers.map((tier, index) => {
              const Icon = tier.icon;
              const isActive = tier.min_referrals <= stats.completed_referrals;
              const isCurrent =
                tier.min_referrals === currentTier.min_referrals;

              return (
                <Card
                  key={index}
                  className={`p-3 sm:p-6 text-center transition-all duration-500 border sm:border-3 backdrop-blur-sm ${isActive
                    ? "border-green-500 bg-gradient-to-br from-white to-green-50 shadow-lg sm:shadow-2xl scale-[1.02] sm:scale-105"
                    : "border-gray-200 opacity-80 hover:opacity-100"
                    } ${isCurrent ? "ring-2 sm:ring-4 ring-green-500/30" : ""
                    } rounded-xl sm:rounded-3xl group hover:scale-[1.02] sm:hover:scale-110`}
                >
                  <div
                    className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-3xl ${isActive
                      ? `bg-gradient-to-br ${tier.color} shadow-lg sm:shadow-2xl`
                      : "bg-gray-300"
                      } flex items-center justify-center mx-auto mb-3 sm:mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <h3 className="font-bold text-base sm:text-2xl mb-1 sm:mb-3 text-gray-900">
                    {tier.label}
                  </h3>
                  <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                    <Coins className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500" />
                    <p className="text-lg sm:text-3xl font-bold text-green-600">
                      KES {tier.reward}
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                    {tier.min_referrals === 0
                      ? "Start earning!"
                      : `${tier.min_referrals}+ refs`}
                  </p>
                  {isCurrent && (
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 rounded-lg sm:rounded-2xl shadow-md sm:shadow-lg">
                      Current 🎯
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>

          {nextTier && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-3xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-6 mb-6">
                <Target className="w-12 h-12 text-blue-600" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                      Progress to {nextTier.label} Tier
                    </span>
                    <span className="text-xl text-muted-foreground font-bold">
                      {stats.completed_referrals}/{nextTier.min_referrals}
                    </span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-4 bg-blue-200 rounded-full border-2 border-blue-300"
                  />
                </div>
              </div>
              <p className="text-center text-lg text-muted-foreground">
                Reach{" "}
                <strong className="text-blue-600">
                  {nextTier.min_referrals}
                </strong>{" "}
                completed referrals to unlock{" "}
                <strong className="text-green-600">
                  KES {nextTier.reward}
                </strong>{" "}
                per referral!
              </p>
            </Card>
          )}
        </Card>

        {/* Earnings Calculator */}
        <Card className="p-4 sm:p-10 mb-6 sm:mb-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-3xl">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-3 text-gray-900">
              Earnings Calculator 🧮
            </h2>
            <p className="text-sm sm:text-xl text-muted-foreground">
              See how much you could earn by referring friends
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <CalculatorSection rewardTiers={rewardTiers} currentReferrals={stats.completed_referrals} />
          </div>
        </Card>

        {/* Enhanced How It Works - Mobile Optimized */}
        <Card className="p-4 sm:p-10 mb-6 sm:mb-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-3xl">
          <h2 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-12 text-center text-gray-900">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
            {[
              {
                icon: Share2,
                title: "1. Share Link",
                description:
                  "Share your referral link via WhatsApp, Facebook, Twitter, or email",
                color: "from-green-500 to-green-600",
              },
              {
                icon: UserPlus,
                title: "2. They Subscribe",
                description:
                  "Friends register and subscribe to Silver or Gold plans",
                color: "from-blue-500 to-blue-600",
              },
              {
                icon: Gift,
                title: "3. Earn Rewards",
                description: `Get KES ${currentTier.reward} when they activate a paid plan!`,
                color: "from-purple-500 to-purple-600",
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="relative mb-4 sm:mb-8 inline-block">
                    <div
                      className={`w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br ${step.color} rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-lg sm:shadow-2xl group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-10 sm:h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-lg shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Enhanced Referral Link Section - Mobile Optimized */}
        <Card className="p-4 sm:p-10 mb-6 sm:mb-12 bg-gradient-to-br from-green-50 to-blue-50 border-0 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-3xl">
          <div className="text-center mb-4 sm:mb-8">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl sm:shadow-2xl">
              <Share2 className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-3 text-gray-900">
              Your Referral Code
            </h2>
            <p className="text-sm sm:text-xl text-muted-foreground">
              Share this link and start earning!
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex-1 relative">
              <Input
                value={
                  referralCode
                    ? `${window.location.origin}/register?ref=${referralCode}`
                    : "Generating your unique referral code..."
                }
                readOnly
                className="text-sm sm:text-lg font-mono border-2 border-green-300 focus:border-green-500 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-3 sm:px-6 pr-16 sm:pr-20 bg-white/80 backdrop-blur-sm"
              />
              {referralCode && (
                <Badge className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 bg-green-500 text-white border-0 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-xs sm:text-sm">
                  Active
                </Badge>
              )}
            </div>
            <Button
              onClick={copyReferralLink}
              size="lg"
              className="w-full sm:w-auto px-6 sm:px-10 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold shadow-xl sm:shadow-2xl border-0 rounded-xl sm:rounded-2xl py-3 sm:py-4"
              disabled={!referralCode}
            >
              {copied ? (
                <Check className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              ) : (
                <Copy className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <p className="text-sm sm:text-lg text-muted-foreground mb-3 sm:mb-4">
              Share on your favorite platforms:
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-2xl mx-auto">
              {[
                {
                  platform: "whatsapp",
                  icon: MessageCircle,
                  color: "bg-green-500 hover:bg-green-600",
                  label: "WhatsApp"
                },
                {
                  platform: "facebook",
                  icon: Facebook,
                  color: "bg-blue-600 hover:bg-blue-700",
                  label: "Facebook"
                },
                {
                  platform: "twitter",
                  icon: Twitter,
                  color: "bg-black hover:bg-gray-800",
                  label: "Twitter"
                },
                {
                  platform: "email",
                  icon: Mail,
                  color: "bg-purple-600 hover:bg-purple-700",
                  label: "Email"
                },
              ].map((social) => {
                const Icon = social.icon;
                return (
                  <Button
                    key={social.platform}
                    onClick={() => shareOnSocial(social.platform)}
                    className={`${social.color} text-white font-medium sm:font-bold shadow-md sm:shadow-lg border-0 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 h-auto text-sm sm:text-lg transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105`}
                    size="lg"
                    disabled={!referralCode}
                  >
                    <Icon className="w-4 h-4 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                    {social.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Marketing Tools Section - Mobile Optimized */}
        <Card className="p-4 sm:p-10 mb-6 sm:mb-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-3xl">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-3 text-gray-900">
              🚀 Marketing Tools
            </h2>
            <p className="text-sm sm:text-xl text-muted-foreground">
              Tools to supercharge your referral marketing
            </p>
          </div>

          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1 mb-4 sm:mb-8 bg-gray-100 p-1 rounded-xl sm:rounded-2xl h-auto">
              <TabsTrigger
                value="qr"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg sm:rounded-xl py-2 sm:py-3 text-xs sm:text-sm"
              >
                <QrCode className="w-4 h-4" />
                <span>QR</span>
              </TabsTrigger>
              <TabsTrigger
                value="utm"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg sm:rounded-xl py-2 sm:py-3 text-xs sm:text-sm"
              >
                <LinkIcon className="w-4 h-4" />
                <span>UTM</span>
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg sm:rounded-xl py-2 sm:py-3 text-xs sm:text-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Text</span>
              </TabsTrigger>
              <TabsTrigger
                value="growth"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg sm:rounded-xl py-2 sm:py-3 text-xs sm:text-sm"
              >
                <Rocket className="w-4 h-4" />
                <span>Tips</span>
              </TabsTrigger>
              <TabsTrigger
                value="banner"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg sm:rounded-xl py-2 sm:py-3 text-xs sm:text-sm"
              >
                <Layout className="w-4 h-4" />
                <span>Banner</span>
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg sm:rounded-xl py-2 sm:py-3 text-xs sm:text-sm"
              >
                <Trophy className="w-4 h-4" />
                <span>Top</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="mt-4 sm:mt-6">
              <QRCodeGenerator
                referralCode={referralCode}
                userName={currentUser?.user_metadata?.full_name}
              />
            </TabsContent>

            <TabsContent value="utm" className="mt-4 sm:mt-6">
              <UTMLinkBuilder referralCode={referralCode} />
            </TabsContent>

            <TabsContent value="banner" className="mt-4 sm:mt-6">
              <BannerGenerator
                referralCode={referralCode}
                userName={currentUser?.user_metadata?.full_name}
              />
            </TabsContent>

            <TabsContent value="templates" className="mt-4 sm:mt-6">
              <SocialTemplates
                referralCode={referralCode}
                userName={currentUser?.user_metadata?.full_name}
              />
            </TabsContent>

            <TabsContent value="growth" className="mt-4 sm:mt-6">
              <GrowthHacks referralCode={referralCode} />
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-4 sm:mt-6">
              <ReferralLeaderboard />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Enhanced Referral History - Mobile Optimized */}
        <Card className="p-4 sm:p-10 bg-white/80 backdrop-blur-sm border-0 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-3xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-3 sm:gap-4">
            <div>
              <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-3">
                Referral History
              </h2>
              <p className="text-sm sm:text-xl text-muted-foreground">
                Track your referrals in real-time
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={refreshData}
                variant="outline"
                size="default"
                disabled={refreshing}
                className="border-green-300 text-green-600 hover:bg-green-50 rounded-xl sm:rounded-2xl px-3 sm:px-6 flex-1 sm:flex-none"
              >
                <RefreshCw
                  className={`w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
                <span className="sm:hidden">{refreshing ? "..." : "Refresh"}</span>
              </Button>
              <Button
                onClick={copyReferralLink}
                disabled={!referralCode}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg rounded-xl sm:rounded-2xl px-3 sm:px-6 flex-1 sm:flex-none"
                size="default"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                Share
              </Button>
            </div>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-8 sm:py-16">
              <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-8 shadow-lg sm:shadow-2xl">
                <Users className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400" />
              </div>
              <h3 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4 text-gray-900">
                No Referrals Yet
              </h3>
              <p className="text-sm sm:text-xl text-muted-foreground mb-6 sm:mb-10 max-w-md mx-auto leading-relaxed px-2">
                Share your link to start earning! When someone subscribes, they'll appear here.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 justify-center px-4">
                <Button
                  onClick={copyReferralLink}
                  disabled={!referralCode}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl sm:shadow-2xl rounded-xl sm:rounded-2xl px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg"
                  size="lg"
                >
                  <Share2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Copy Referral Link
                </Button>
                <Button
                  onClick={() => shareOnSocial("whatsapp")}
                  disabled={!referralCode}
                  className="bg-green-500 hover:bg-green-600 text-white shadow-xl sm:shadow-2xl rounded-xl sm:rounded-2xl px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg border-0"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  Share on WhatsApp
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-hidden rounded-2xl border-2 border-gray-200 shadow-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-500 to-blue-600">
                      <th className="text-left py-6 px-8 text-lg font-bold text-white">
                        Referred User
                      </th>
                      <th className="text-left py-6 px-8 text-lg font-bold text-white">
                        Date Referred
                      </th>
                      <th className="text-left py-6 px-8 text-lg font-bold text-white">
                        Status
                      </th>
                      <th className="text-left py-6 px-8 text-lg font-bold text-white">
                        Reward
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((referral) => (
                      <tr
                        key={referral.id}
                        className="border-b border-gray-100 hover:bg-green-50/50 transition-colors duration-200 even:bg-gray-50/50"
                      >
                        <td className="py-5 px-8">
                          <div>
                            <p className="font-semibold text-lg text-gray-900">
                              {referral.referred_user_name || "New User"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {referral.referred_user_email || "No email provided"}
                            </p>
                          </div>
                        </td>
                        <td className="py-5 px-8 text-lg text-gray-700">
                          {new Date(referral.created_at).toLocaleDateString("en-KE", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-5 px-8">
                          <Badge
                            className={`${getStatusColor(referral.status)} text-white border-0 capitalize text-base py-2 px-4 rounded-2xl font-semibold shadow-lg`}
                          >
                            {getStatusText(referral.status)}
                          </Badge>
                        </td>
                        <td className="py-5 px-8">
                          <div className="flex items-center gap-2">
                            {referral.status === "completed" ? (
                              <>
                                <Coins className="w-5 h-5 text-yellow-500" />
                                <span className="text-lg font-bold text-green-600">
                                  KES {referral.reward_amount?.toLocaleString() || currentTier.reward}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg text-muted-foreground">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="sm:hidden space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="p-4 rounded-xl border border-gray-200 bg-white shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {referral.referred_user_name || "New User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {referral.referred_user_email || "No email provided"}
                        </p>
                      </div>
                      <Badge
                        className={`${getStatusColor(referral.status)} text-white border-0 capitalize text-xs py-1 px-2 rounded-lg font-medium shadow`}
                      >
                        {getStatusText(referral.status)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString("en-KE", {
                          month: "short",
                          day: "numeric",
                          year: "2-digit",
                        })}
                      </span>
                      {referral.status === "completed" ? (
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="font-bold text-green-600">
                            KES {referral.reward_amount?.toLocaleString() || currentTier.reward}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Real-time Withdrawal Management - Mobile Optimized */}
        <Card className="p-4 sm:p-10 mt-6 sm:mt-12 bg-white/80 backdrop-blur-sm border-0 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-3xl">
          <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-3">
                Withdrawals
              </h2>
              <p className="text-sm sm:text-xl text-muted-foreground">
                Request payouts and track status
              </p>
            </div>
            {(stats.total_earned - stats.successful_withdrawals - stats.pending_withdrawals) >= 500 && (
              <Button
                onClick={handleRequestWithdrawal}
                disabled={requestingWithdrawal}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-6 text-sm sm:text-lg"
              >
                {requestingWithdrawal ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                )}
                Request KES {(stats.total_earned - stats.successful_withdrawals - stats.pending_withdrawals).toLocaleString()}
              </Button>
            )}
          </div>

          {withdrawals.length === 0 ? (
            <div className="text-center py-8 sm:py-16 bg-gray-50/50 rounded-2xl sm:rounded-3xl border-2 border-dashed border-gray-200">
              <Wallet className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No Withdrawals Yet</h3>
              <p className="text-sm sm:text-lg text-muted-foreground px-4">
                Reach KES 500 to request your first payout.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-hidden rounded-2xl border-2 border-gray-200 shadow-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-500 to-blue-600">
                      <th className="text-left py-6 px-8 text-lg font-bold text-white">Amount</th>
                      <th className="text-left py-6 px-8 text-lg font-bold text-white">Date</th>
                      <th className="text-left py-6 px-8 text-lg font-bold text-white">Status</th>
                      <th className="text-left py-6 px-8 text-lg font-bold text-white">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="border-b border-gray-100 hover:bg-emerald-50/50 transition-colors duration-200">
                        <td className="py-5 px-8 font-bold text-emerald-600 text-lg">
                          KES {w.amount.toLocaleString()}
                        </td>
                        <td className="py-5 px-8 text-gray-700">
                          {new Date(w.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-5 px-8">
                          <Badge className={`${w.status === 'completed' ? 'bg-green-500' :
                            w.status === 'cancelled' ? 'bg-red-500' :
                              w.status === 'processing' ? 'bg-blue-500' : 'bg-yellow-500'
                            } text-white px-4 py-2 rounded-xl`}>
                            {w.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-5 px-8 text-muted-foreground">
                          {w.admin_notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="sm:hidden space-y-3">
                {withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-xl border border-gray-200 bg-white shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-emerald-600 text-lg">
                        KES {w.amount.toLocaleString()}
                      </span>
                      <Badge className={`${w.status === 'completed' ? 'bg-green-500' :
                        w.status === 'cancelled' ? 'bg-red-500' :
                          w.status === 'processing' ? 'bg-blue-500' : 'bg-yellow-500'
                        } text-white px-2 py-1 text-xs rounded-lg`}>
                        {w.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{new Date(w.created_at).toLocaleDateString()}</span>
                      {w.admin_notes && (
                        <span className="text-xs truncate max-w-[120px]">{w.admin_notes}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
