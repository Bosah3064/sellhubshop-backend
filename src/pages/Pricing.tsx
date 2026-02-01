import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Smartphone,
  CheckCircle2,
  Star,
  Shield,
  Zap,
  Users,
  BarChart3,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import SEO from "@/components/SEO";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// Services & Hooks
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { paymentService } from "@/service/paymentService";

// -----------------------------
// Validation Schema
// -----------------------------
const paymentSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name cannot exceed 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^07[0-9]{8}$/,
      "Please enter a valid Safaricom number (e.g., 0712345678)"
    ),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// -----------------------------
// Plans
// -----------------------------
type PlanId = "free" | "silver" | "gold" | "test";

interface Plan {
  id: PlanId;
  uuid: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limit: string;
  popular?: boolean;
  description: string;
  icon: React.ComponentType<any>;
  cta: string;
}

const plans: Plan[] = [

  {
    id: "free",
    uuid: "ceb71ae1-caaa-44df-8b1a-62daa6a2938e",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    limit: "5 Products",
    description: "Perfect for testing the waters",
    icon: Users,
    cta: "Get Started",
    features: [
      "List up to 5 products",
      "Basic seller profile",
      "3 product images per listing",
      "Email support",
      "Community forum access",
    ],
  },
  {
    id: "silver",
    uuid: "0b922be5-91b7-46c7-8ac9-2c0a95e32593",
    name: "Silver",
    priceMonthly: 500,
    priceYearly: 5000,
    limit: "50 Products",
    popular: true,
    description: "Ideal for growing businesses",
    icon: BarChart3,
    cta: "Upgrade Now",
    features: [
      "List up to 50 products",
      "Priority search placement",
      "10 product images per listing",
      "Advanced sales analytics",
      "Promotional badges",
      "Priority email support",
    ],
  },
  {
    id: "gold",
    uuid: "f34c0928-7494-46a6-9ff9-c4d498818297",
    name: "Gold",
    priceMonthly: 1200,
    priceYearly: 12000,
    limit: "Unlimited Products",
    description: "For established brands & power sellers",
    icon: Zap,
    cta: "Go Premium",
    features: [
      "Unlimited product listings",
      "Featured homepage placement",
      "Unlimited product images",
      "Advanced analytics & insights",
      "Dedicated account manager",
      "24/7 priority support",
    ],
  },
];

// -----------------------------
// Utility Functions
// -----------------------------
const formatCurrency = (amount: number, currency: string = "KES") =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const calculateSavings = (monthly: number, yearly: number) =>
  monthly === 0 ? 0 : Math.round((1 - yearly / (monthly * 12)) * 100);

// -----------------------------
// Main Pricing Component
// -----------------------------
export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const { isAuthenticated, user, isLoading } = useAuth();

  console.log("Pricing Component Rendering", { isLoading, isAuthenticated, billingCycle });

  useEffect(() => {
    console.log("Pricing Component Mounted");
  }, []);

  if (isLoading) {
    console.log("Pricing Page: Loading authentication...");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black text-slate-100 overflow-hidden">
      <SEO 
        title="Pricing Plans | SellHub Marketplace"
        description="Choose your perfect marketplace plan. Flexible pricing for sellers at all levels. Scale your business with our Silver and Gold packages."
        keywords="marketplace pricing, KES payment, subscription plans, seller plans, sellhub premium"
      />
      {/* Ambient Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <main className="relative container mx-auto py-20 px-4 z-10">
        {/* Header */}
        <header className="mb-20 text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-white/5 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/10 flex items-center gap-2 shadow-2xl">
              <span className="text-sm font-medium text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-current" />
                Featured Seller Plans
              </span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-100">
              Unlock Your Potential
            </span>
          </h1>

          <p className="text-xl text-slate-400 leading-relaxed mb-12 max-w-2xl mx-auto">
            Choose the perfect plan to scale your business. Join thousands of sellers growing with SaleStream.
          </p>

          {/* Modern Billing Toggle */}
          <div className="inline-flex items-center p-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-xl relative">
            <Button
              variant="ghost"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-8 py-6 text-base font-medium transition-all duration-300 ${billingCycle === "monthly"
                ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                : "text-slate-400 hover:text-white"
                }`}
            >
              Monthly
            </Button>
            <Button
              variant="ghost"
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-full px-8 py-6 text-base font-medium transition-all duration-300 ${billingCycle === "yearly"
                ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                : "text-slate-400 hover:text-white"
                }`}
            >
              Yearly
              <span className="ml-2 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">
                -20%
              </span>
            </Button>
          </div>
        </header>

        {/* Pricing Cards */}
        <section className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto mb-24 items-center">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              isAuthenticated={isAuthenticated}
              user={user}
            />
          ))}
        </section>
      </main>
    </div>
  );
}

// -----------------------------
// Plan Card Component
// -----------------------------
interface PlanCardProps {
  plan: Plan;
  billingCycle: "monthly" | "yearly";
  isAuthenticated: boolean;
  user: any;
}

function PlanCard({
  plan,
  billingCycle,
  isAuthenticated,
  user,
}: PlanCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const price =
    billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
  const isFree = plan.id === "free";
  const PlanIcon = plan.icon;

  const handleUpgradeClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade your plan.",
        variant: "destructive",
      });
      return;
    }
    setIsDialogOpen(true);
  };

  const activateFreePlan = async () => {
    try {
      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name,
        billing_cycle: "monthly",
        amount: 0,
        currency: "KES",
        status: "active",
        payment_method: "free",
        customer_name: user?.full_name || user?.email || "Free User",
        activated_at: new Date().toISOString(),
      });

      if (error) throw error;

      const freePlanRecord = {
        planId: plan.id,
        planName: plan.name,
        billingCycle: "monthly",
        paymentMethod: "free",
        customerName: user?.full_name || user?.email || "",
        currency: "KES",
        amount: 0,
        userId: user?.id,
        activatedAt: new Date().toISOString(),
        status: "active",
      };

      localStorage.setItem(
        "marketplace_current_plan",
        JSON.stringify(freePlanRecord)
      );

      toast({
        title: "🎉 Welcome!",
        description: "Your free plan has been activated successfully.",
      });

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error) {
      console.error("Error activating free plan:", error);
      toast({
        title: "Error",
        description: "Failed to activate free plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Dynamic Card Styles based on plan type
  const getCardStyles = () => {
    if (plan.id === "gold") {
      return "bg-gradient-to-b from-amber-900/20 to-black/40 border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.1)] hover:shadow-[0_0_60px_rgba(245,158,11,0.2)]";
    }
    if (plan.id === "silver") {
      return "bg-gradient-to-b from-slate-800/40 to-black/40 border-slate-400/20 hover:border-slate-400/40 shadow-[0_0_30px_rgba(148,163,184,0.05)]";
    }
    return "bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-800/40";
  };

  const getButtonStyles = () => {
    if (plan.id === "gold") {
      return "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-900/20 border-0";
    }
    return "bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm";
  };

  // Determine action for card click
  const handleCardClick = () => {
    if (isFree) {
      activateFreePlan();
    } else {
      handleUpgradeClick();
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`relative flex flex-col p-8 rounded-3xl backdrop-blur-xl transition-all duration-300 group border cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl ${getCardStyles()} ${plan.popular ? "lg:scale-110 z-10" : "hover:scale-[1.03]"}`}
      >

        {/* Popular Badge */}
        {plan.popular && (
          <div className="absolute top-0 right-0 p-4">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg tracking-wider">
              Popular
            </div>
          </div>
        )}

        {/* Glossy overlay effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex-grow">
          {/* Icon & Title */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan.id === 'gold' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
              <PlanIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="text-sm text-slate-400">{plan.id === 'gold' ? 'Ultimate Experience' : plan.id === 'silver' ? 'Pro Features' : 'Starter Pack'}</p>
            </div>
          </div>

          {/* Price */}
          <div className="mb-8">
            {isFree ? (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">Free</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white tracking-tight">
                    {formatCurrency(price)}
                  </span>
                  <span className="text-slate-400 font-medium">
                    /{billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {billingCycle === "yearly" && (
                    <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                      Save {formatCurrency(plan.priceMonthly * 12 - price)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-white/10 mb-8" />

          {/* Features */}
          <div className="space-y-5 mb-8">
            <p className="text-sm font-medium text-white/50 uppercase tracking-wider text-xs">Includes:</p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="font-semibold text-white">{plan.limit}</span>
              </li>
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 group-hover:bg-slate-400 transition-colors" />
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10 pt-4 mt-auto">
          <Button
            className={`w-full py-6 rounded-xl text-base font-semibold transition-all shadow-lg ${getButtonStyles()}`}
          >
            {isFree ? plan.cta : isAuthenticated ? plan.cta : "Sign In to Upgrade"}
          </Button>
        </div>
      </div>

      {/* Render Dialog Outside the Card Div to avoid nesting issues, controlled by state */}
      {!isFree && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          {isAuthenticated && (
            <PaymentDialog
              plan={plan}
              billingCycle={billingCycle}
              onClose={() => setIsDialogOpen(false)}
              user={user}
            />
          )}
        </Dialog>
      )}
    </>
  );
}

// -----------------------------
// Payment Dialog Component - PROFESSIONAL & SCROLLABLE
// -----------------------------
interface PaymentDialogProps {
  plan: Plan;
  billingCycle: "monthly" | "yearly";
  onClose: () => void;
  user: any;
}

function PaymentDialog({
  plan,
  billingCycle,
  onClose,
  user,
}: PaymentDialogProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const price =
    billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      fullName: user?.full_name || user?.email?.split("@")[0] || "",
      phoneNumber: "",
    },
  });

  const processPayment = async (data: PaymentFormData): Promise<void> => {
    setIsProcessing(true);
    let subscriptionId: string | null = null;

    try {
      const reference = `SUB_${plan.id}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .insert({
            user_id: user.id,
            plan_id: plan.uuid, // Pass UUID to trigger database logic
            plan_name: plan.id, // Keep the readable ID in plan_name for fallback
            billing_cycle: billingCycle,
            amount: price,
            currency: "KES",
            status: "pending",
            payment_method: "mpesa",
            reference: reference,
            customer_name: data.fullName,
            phone_number: data.phoneNumber,
            initiated_at: new Date().toISOString(),
          })
          .select()
          .single();

      if (subscriptionError) throw subscriptionError;

      if (subscriptionData) {
        subscriptionId = subscriptionData.id;
      }

      // Create initial billing history entry for immediate traceability
      const { data: billingHistoryData } = await supabase
        .from("billing_history")
        .insert({
          user_id: user.id,
          subscription_id: subscriptionData.id,
          amount: price,
          currency: "KES",
          status: "pending",
          description: `Subscription: ${plan.name} plan (Initiated)`,
          payment_method: "mpesa",
        })
        .select()
        .single();

      const billingHistoryId = billingHistoryData?.id;

      const paymentResult = await paymentService.initiateMpesaPayment(
        data.phoneNumber,
        {
          amount: price,
          currency: "KES",
          description: `${plan.name} Plan - ${billingCycle} subscription`,
          reference: reference,
          customer_name: data.fullName,
          metadata: {
            plan_id: plan.id,
            plan_name: plan.name,
            billing_cycle: billingCycle,
            user_id: user.id,
            user_email: user.email,
          },
        }
      );

      if (paymentResult.success && paymentResult.checkoutRequestID) {
        await supabase
          .from("subscriptions")
          .update({
            checkout_request_id: paymentResult.checkoutRequestID,
            merchant_request_id: paymentResult.merchantRequestID,
          })
          .eq("id", subscriptionData.id);

        const subscriptionRecord = {
          planId: plan.id,
          planName: plan.name,
          billingCycle,
          paymentMethod: "mpesa",
          customerName: data.fullName,
          currency: "KES",
          amount: price,
          checkoutRequestID: paymentResult.checkoutRequestID,
          reference: reference,
          initiatedAt: new Date().toISOString(),
          status: "pending",
          userId: user?.id,
        };

        localStorage.setItem(
          "marketplace_current_plan",
          JSON.stringify(subscriptionRecord)
        );

        toast({
          title: "📱 M-Pesa Prompt Sent!",
          description: "Check your phone to complete the payment.",
        });

        await pollSTKPushStatus(paymentResult.checkoutRequestID, subscriptionData.id, billingHistoryId);
      } else {
        throw new Error(paymentResult.error || "Failed to initiate M-Pesa payment");
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'error' in error
          ? (error as any).error
          : "Initialization failed";

      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });

      if (subscriptionId) {
        await supabase
          .from("subscriptions")
          .update({
            status: "failed",
            failure_reason: errorMessage,
          })
          .eq("id", subscriptionId);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const pollSTKPushStatus = async (
    checkoutRequestID: string,
    subscriptionId: string,
    billingHistoryId?: string,
    maxAttempts: number = 40
  ): Promise<void> => {
    console.log("Starting Hybrid Polling (DB + Safaricom Query) for Subscription:", subscriptionId);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Wait 3 seconds between checks
      await new Promise((resolve) => setTimeout(resolve, 3000));

      try {
        // ---------------------------------------------------------
        // 1. Check Database (Fast & Preferred)
        // ---------------------------------------------------------
        const { data: dbData, error: dbError } = await supabase
          .from("subscriptions")
          .select("status, mpesa_receipt_number, failure_reason")
          .eq("id", subscriptionId)
          .single();

        if (dbError) {
          console.error("Error polling DB:", dbError);
        } else {
          console.log(`Polling Attempt ${attempt + 1}: DB Status is '${dbData?.status}'`);

          if (dbData?.status === "active") {
            if (billingHistoryId) {
              await supabase.from("billing_history")
                .update({ status: "completed", mpesa_receipt_number: dbData.mpesa_receipt_number })
                .eq("id", billingHistoryId);
            }
            handleSuccess(dbData.mpesa_receipt_number);
            return;
          }

          if (dbData?.status === "failed") {
            if (billingHistoryId) {
              await supabase.from("billing_history")
                .update({ status: "failed", description: `Failed: ${dbData.failure_reason}` })
                .eq("id", billingHistoryId);
            }
            handleFailure(dbData.failure_reason);
            return;
          }
        }

        // ---------------------------------------------------------
        // 2. Fallback: Check Safaricom Query API (If DB is still pending)
        // ---------------------------------------------------------
        // Only query Safaricom every 2nd attempt to avoid rate limiting
        if (attempt % 2 === 0) {
          console.log("DB is pending. Querying Safaricom directly...");
          const safaricomResult = await paymentService.checkPaymentStatus(checkoutRequestID);

          if (safaricomResult.status === "completed" || safaricomResult.status === "active" || safaricomResult.status === "success") {
            console.log("Safaricom confirmed SUCCESS via Query!");
            // Update DB so we don't have to query again
            await supabase.from("subscriptions").update({
              status: "active",
              mpesa_receipt_number: safaricomResult.mpesaReceiptNumber,
              confirmed_at: new Date().toISOString(),
              activated_at: new Date().toISOString()
            }).eq("id", subscriptionId);

            if (billingHistoryId) {
              await supabase.from("billing_history")
                .update({ status: "completed", mpesa_receipt_number: safaricomResult.mpesaReceiptNumber })
                .eq("id", billingHistoryId);
            }

            handleSuccess(safaricomResult.mpesaReceiptNumber);
            return;

          } else if (safaricomResult.status === "failed") {
            console.log("Safaricom confirmed FAILURE via Query!");
            // Update DB
            await supabase.from("subscriptions").update({
              status: "failed",
              failure_reason: safaricomResult.error || "Payment failed"
            }).eq("id", subscriptionId);

            if (billingHistoryId) {
              await supabase.from("billing_history")
                .update({ status: "failed", description: `Failed: ${safaricomResult.error}` })
                .eq("id", billingHistoryId);
            }

            handleFailure(safaricomResult.error);
            return;
          }
        }

      } catch (error) {
        console.error("Polling error:", error);
      }
    }

    // Timeout
    toast({
      title: "Payment pending",
      description: "We haven't received confirmation yet. Please check your dashboard later.",
    });
    setIsProcessing(false);
  };

  const handleSuccess = async (receipt: string = "") => {
    // 1. Update Local Storage for UI
    const currentPlan = JSON.parse(localStorage.getItem("marketplace_current_plan") || "{}");
    currentPlan.status = "active";
    currentPlan.confirmedAt = new Date().toISOString();
    localStorage.setItem("marketplace_current_plan", JSON.stringify(currentPlan));

    // 2. CRITICAL: Force update Profile Plan Type to unlock limits immediately on Frontend Side
    if (user?.id && plan?.id) {
      console.log("Frontend: Forcing profile plan update to", plan.id);
      await supabase.from("profiles").update({ plan_type: plan.id }).eq("id", user.id);
    }

    // 3. Show Success
    toast({
      title: "Payment Confirmed!",
      description: `Your ${plan.name} plan is now active. Receipt: ${receipt}`,
    });

    onClose();
    setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
  };

  const handleFailure = (reason: string = "Payment failed") => {
    toast({
      title: "Payment Failed",
      description: reason,
      variant: "destructive",
    });
    setIsProcessing(false);
  };

  return (
    <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 text-white rounded-2xl">
      {/* Header */}
      <div className="relative p-6 pb-4 border-b border-white/10">
        <DialogClose asChild>
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-2 bg-green-500/20 text-green-400 border-green-500/30 text-xs font-semibold px-3 py-1 rounded-full border">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            M-PESA PAYMENT
          </div>
          <DialogTitle className="text-2xl font-bold text-white">{plan.name} Plan</DialogTitle>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-white">{formatCurrency(price)}</span>
            <span className="text-slate-400 text-sm">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
        </div>
      </div>

      {/* Form Content - Scrollable */}
      <div className="max-h-[50vh] overflow-y-auto p-6 space-y-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(processPayment)} className="space-y-5">


            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 text-sm font-medium">Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <Input
                        placeholder="John Doe"
                        {...field}
                        disabled={isProcessing}
                        className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-red-400" />
                </FormItem>
              )}
            />

            {/* M-Pesa Phone Number - Only show when M-Pesa selected */}
            {paymentMethod === 'mpesa' && (
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-sm font-medium">M-Pesa Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input
                          {...field}
                          placeholder="0712345678"
                          maxLength={10}
                          disabled={isProcessing}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                          className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-400" />
                  </FormItem>
                )}
              />
            )}



            {/* Security Badge */}
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-semibold text-white text-sm">Secure Payment</div>
                <div className="text-slate-400 text-xs">256-bit SSL Encryption</div>
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Footer */}
      <div className="p-6 pt-4 border-t border-white/10 bg-slate-950">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 h-12 rounded-xl bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isProcessing}
            onClick={form.handleSubmit(processPayment)}
            className="flex-1 h-12 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-900/30"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              `Pay ${formatCurrency(price)}`
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
