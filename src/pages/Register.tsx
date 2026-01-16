import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  UserPlus,
  Gift,
  Users,
  Sparkles,
  Shield,
  Zap,
  Mail,
  Lock,
  User,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
    acceptTOS: z.literal(true, {
      errorMap: () => ({
        message: "You must accept the Terms of Service and Privacy Policy",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterData = z.infer<typeof registerSchema>;

export default function Register() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<{
    name: string;
    isValid: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    trigger,
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const password = watch("password");
  const email = watch("email");
  const name = watch("name");

  // Update progress based on form completion
  useEffect(() => {
    let completed = 0;
    if (name?.length >= 2) completed += 25;
    if (email?.includes("@") && email?.includes(".")) completed += 25;
    if (password?.length >= 8) completed += 25;
    if (watch("acceptTOS")) completed += 25;
    setProgress(completed);
  }, [name, email, password, watch("acceptTOS")]);

  // Fetch referrer information when component loads
  useEffect(() => {
    if (referralCode) {
      checkReferralCode(referralCode);
    }
  }, [referralCode]);

  const checkReferralCode = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from("referral_codes")
        .select(
          `
          user_id,
          profiles:user_id (
            full_name
          )
        `
        )
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Referral code error:", error);
        setReferrerInfo({ name: "", isValid: false });
        return;
      }

      if (data) {
        setReferrerInfo({
          name: data.profiles?.full_name || "a friend",
          isValid: true,
        });
        toast({
          title: "🎉 Referral Bonus Activated!",
          description: `You're joining through ${data.profiles?.full_name || "a friend"
            }'s network`,
        });
      }
    } catch (error) {
      console.error("Error checking referral code:", error);
      setReferrerInfo({ name: "", isValid: false });
    }
  };

  // Simplified function - just checks for existing code, doesn't create one
  const getUserReferralCode = async (
    userId: string
  ): Promise<string | null> => {
    try {
      console.log("🔍 Checking for user's referral code...");

      const { data: existingCode, error: fetchError } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (!fetchError && existingCode) {
        console.log("✅ Found user's referral code:", existingCode.code);
        return existingCode.code;
      }

      console.log(
        "ℹ️ No referral code found yet - database triggers will create one automatically"
      );
      return null;
    } catch (error) {
      console.error("💥 Error checking user referral code:", error);
      return null;
    }
  };

  const passwordRequirements = [
    { label: "At least 8 characters", met: password?.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);

  const onSubmit = async (data: RegisterData) => {
    try {
      console.log("🚀 Starting professional registration process...");
      setIsLoading(true);

      // Update progress
      setProgress(100);

      const userMetadata: any = {
        name: data.name,
      };

      // Only add referral_code if it's valid
      if (referralCode && referrerInfo?.isValid) {
        userMetadata.referral_code = referralCode;
        console.log("🎯 Using referral code:", referralCode);
      }

      console.log("🔐 Creating secure account...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.toLowerCase(),
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        console.error("❌ Authentication error:", authError);

        if (
          authError.message
            ?.toLowerCase()
            .includes("user already registered") ||
          authError.message?.toLowerCase().includes("already exists") ||
          authError.status === 422
        ) {
          throw new Error(
            "An account with this email already exists. Please sign in or use a different email address."
          );
        }

        throw new Error(
          authError.message || "Registration failed. Please try again."
        );
      }

      if (!authData.user) {
        throw new Error("Account creation failed. Please try again.");
      }

      console.log("✅ Account created successfully");

      // 🔥 CRITICAL FIX: Create or update profile with referral_code_used
      console.log("📝 Creating/updating profile with referral tracking...");

      // 🔥 ROBUST PROFILE CREATION: Use upsert to handle race conditions
      console.log("📝 Creating/updating profile with referral tracking...");

      const profileData = {
        id: authData.user.id,
        email: data.email.toLowerCase(),
        full_name: data.name,
        referral_code_used: referralCode && referrerInfo?.isValid ? referralCode : null,
        updated_at: new Date().toISOString(),
      };

      // Perform upsert (insert or update)
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: 'id' });

      if (upsertError) {
        console.error("❌ Profile upsert error:", upsertError);
      } else {
        console.log("✅ Profile created/updated successfully");

        // 🔥 CREATE PENDING REFERRAL RECORD via Backend API
        if (referralCode && referrerInfo?.isValid) {
          try {
            console.log("📝 Creating pending referral record via API...");

            // Find the referrer ID from the code
            const { data: codeData } = await supabase
              .from("referral_codes")
              .select("user_id")
              .eq("code", referralCode)
              .eq("is_active", true)
              .single();

            if (codeData?.user_id) {
              // Call backend API to create referral (bypasses RLS)
              // Use VITE_BACKEND_URL for production, fallback to localhost for dev
              const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
              const response = await fetch(`${apiUrl}/referrals/create`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  referrer_id: codeData.user_id,
                  referred_id: authData.user.id,
                  referral_code_used: referralCode,
                }),
              });

              const result = await response.json();

              if (!response.ok || !result.success) {
                console.error("❌ Error creating referral record:", result.error);
              } else {
                console.log("✅ Pending referral record created:", result.data.id);
              }
            }
          } catch (refError) {
            console.error("💥 Failed to process referral registration:", refError);
          }
        }
      }

      // Wait a moment for database triggers to create referral code
      console.log("⏳ Waiting for automatic processes...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Try to get the user's referral code (optional - just for display)
      const userReferralCode = await getUserReferralCode(authData.user.id);

      toast({
        title: "🎉 Welcome to Our Marketplace!",
        description: (
          <div className="space-y-2">
            <p>Your account has been created successfully.</p>
            {referralCode && referrerInfo?.isValid && (
              <p className="font-semibold text-green-600">
                <Gift className="w-4 h-4 inline mr-1" />
                Referral recorded! You'll earn rewards when you become an active
                seller.
              </p>
            )}
            {userReferralCode && (
              <p className="text-sm text-blue-600">
                Your personal referral code: <strong>{userReferralCode}</strong>
              </p>
            )}
            <p>Check your email to verify your account.</p>
          </div>
        ),
      });

      // Navigate to signin page
      setTimeout(() => {
        navigate("/signin", {
          state: {
            message:
              "Account created successfully! Please check your email to verify your account.",
          },
        });
      }, 2000);
    } catch (err: unknown) {
      console.error("💥 Registration error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";

      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const userMetadata: any = {};
      if (referralCode && referrerInfo?.isValid) {
        userMetadata.referral_code = referralCode;
        console.log("🎯 Google signup with referral code:", referralCode);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: `${window.location.origin}/auth/callback?ref=${referralCode || ""
            }`,
        },
      });

      if (error) throw error;

      // Note: For OAuth, the referral will be handled in the auth callback
      console.log("✅ Google OAuth initiated with referral tracking");
    } catch (err: unknown) {
      console.error("Google sign up error:", err);
      toast({
        variant: "destructive",
        title: "Google Sign Up Failed",
        description: "Unable to sign up with Google. Please try again.",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Benefits */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Enterprise Security
                </h3>
                <p className="text-sm text-slate-600">
                  Bank-level encryption & protection
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Instant Setup</h3>
                <p className="text-sm text-slate-600">
                  Start selling in minutes
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  10,000+ Sellers
                </h3>
                <p className="text-sm text-slate-600">
                  Join our growing community
                </p>
              </div>
            </div>
          </div>

          {referralCode && referrerInfo?.isValid && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">
                      Referral Bonus Active
                    </h4>
                    <p className="text-sm text-green-700">
                      You're joining through {referrerInfo.name}'s network
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Eligible for special rewards when you become an active
                      seller
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!referralCode && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800">
                      Join Our Community
                    </h4>
                    <p className="text-sm text-blue-700">
                      Start your selling journey today
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      No invitation needed - everyone is welcome!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side - Registration Form */}
        <Card className="w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Create Professional Account
              </CardTitle>
              <CardDescription className="text-slate-600">
                Join Kenya's fastest-growing marketplace platform
              </CardDescription>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Profile Completion</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-slate-300 hover:bg-slate-50 transition-all duration-200"
              onClick={handleGoogleSignUp}
              disabled={isLoading || isGoogleLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isGoogleLoading
                ? "Connecting to Google..."
                : "Continue with Google"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-500 font-medium">
                  Or register with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-3">
                <Label
                  htmlFor="name"
                  className="text-sm font-semibold text-slate-700"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    {...register("name")}
                    className={`h-12 pl-10 ${errors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:ring-blue-500"
                      }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    {...register("email")}
                    className={`h-12 pl-10 ${errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:ring-blue-500"
                      }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    {...register("password")}
                    className={`h-12 pl-10 pr-10 ${errors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:ring-blue-500"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {password && (
                  <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        Password Strength
                      </span>
                      {allRequirementsMet && (
                        <BadgeCheck className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center text-sm">
                        {req.met ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-400 mr-2" />
                        )}
                        <span
                          className={
                            req.met
                              ? "text-green-600 font-medium"
                              : "text-slate-600"
                          }
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {errors.password && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-slate-700"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    className={`h-12 pl-10 pr-10 ${errors.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:ring-blue-500"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="acceptTOS"
                  {...register("acceptTOS")}
                  className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <Label
                  htmlFor="acceptTOS"
                  className="text-sm font-normal leading-5 text-slate-700"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Privacy Policy
                  </Link>
                  . I understand that my data will be processed securely.
                </Label>
              </div>
              {errors.acceptTOS && (
                <p className="text-sm text-red-600 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  {errors.acceptTOS.message}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading || progress < 100}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Create Professional Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                )}
              </Button>

              <p className="text-sm text-center text-slate-600">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-blue-600 hover:underline font-semibold transition-colors"
                >
                  Sign in to your account
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
