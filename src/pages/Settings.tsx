import SEO from "@/components/SEO";
import { useState, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Save,
  Camera,
  X,
  Plus,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Store,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";

interface PaymentMethod {
  id: string;
  type: string;
  last_four: string;
  is_default: boolean;
  created_at: string;
  metadata?: any;
}

interface BillingHistory {
  id: string;
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed";
  description: string;
  created_at: string;
  invoice_url?: string;
}

interface Subscription {
  id: string;
  plan_type: "free" | "premium" | "business";
  status: "active" | "canceled" | "past_due";
  current_period_end: string;
  price: number;
}

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    location: "",
    bio: "",
    avatar_url: "",
    local_delivery_fee: 200,
    outside_delivery_fee: 350,
    business_location: "",
    payment_preference: "wallet",
    mpesa_phone: "",
  });

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: false,
    two_factor_auth: false,
    dark_mode: false,
    language: "en",
    currency: "ksh",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: "mpesa",
    phone: "",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }

      if (!session) {
        console.log("No active session");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("🔍 Debug - User ID:", user?.id);

      if (user) {
        await loadProfileData(user);
        await loadPreferences(user.id);
        await loadBillingData(user.id);
      }
    } catch (error: any) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error loading settings",
        description: "Failed to load your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfileData = async (user: any) => {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          username: "",
          full_name: user.user_metadata?.full_name || "",
          phone: "",
          whatsapp: "",
          location: "",
          bio: "",
          avatar_url: "",
          updated_at: null,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError);
        throw createError;
      }

      if (newProfile) {
        setProfile({
          username: newProfile.username || "",
          full_name: newProfile.full_name || "",
          email: newProfile.email || user.email || "",
          phone: newProfile.phone || "",
          whatsapp: newProfile.whatsapp || "",
          location: newProfile.location || "",
          bio: newProfile.bio || "",
          avatar_url: newProfile.avatar_url || "",
          local_delivery_fee: newProfile.local_delivery_fee ?? 200,
          outside_delivery_fee: newProfile.outside_delivery_fee ?? 350,
          business_location: newProfile.business_location || "",
          payment_preference: newProfile.payment_preference || "wallet",
          mpesa_phone: newProfile.mpesa_phone || "",
        });
      }
    } else if (profileData) {
      setProfile({
        username: profileData.username || "",
        full_name: profileData.full_name || "",
        email: profileData.email || user.email || "",
        phone: profileData.phone || "",
        whatsapp: profileData.whatsapp || "",
        location: profileData.location || "",
        bio: profileData.bio || "",
        avatar_url: profileData.avatar_url || "",
        local_delivery_fee: profileData.local_delivery_fee ?? 200,
        outside_delivery_fee: profileData.outside_delivery_fee ?? 350,
        business_location: profileData.business_location || "",
        payment_preference: profileData.payment_preference || "wallet",
        mpesa_phone: profileData.mpesa_phone || "",
      });
    }
  };

  const loadPreferences = async (userId: string) => {
    try {
      const { data: preferencesData, error: preferencesError } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (preferencesError && preferencesError.code !== "PGRST116") {
        console.warn("Error loading preferences:", preferencesError);
      } else if (preferencesData) {
        setPreferences(preferencesData);
      }
    } catch (error) {
      console.log("Preferences load failed, using defaults:", error);
    }
  };

  const loadBillingData = async (userId: string) => {
    try {
      const { data: paymentMethodsData, error: paymentError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (paymentError) {
        console.warn("Error loading payment methods:", paymentError);
      } else {
        setPaymentMethods(paymentMethodsData || []);
      }

      const { data: billingData, error: billingError } = await supabase
        .from("billing_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (billingError) {
        console.warn("Error loading billing history:", billingError);
      } else {
        setBillingHistory(billingData || []);
      }

      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle();

      if (subscriptionError && subscriptionError.code !== "PGRST116") {
        console.warn("Error loading subscription:", subscriptionError);
      } else {
        setSubscription(subscriptionData);
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload images",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()
        .toString(36)
        .substring(2, 15)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Profile image updated!",
        description: "Your profile picture has been updated successfully.",
      });

      checkAndRedirectAfterProfileUpdate();
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description:
          error.message || "There was an error uploading your image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveImage = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => ({ ...prev, avatar_url: "" }));

      toast({
        title: "Profile image removed",
        description: "Your profile picture has been removed.",
      });

      checkAndRedirectAfterProfileUpdate();
    } catch (error: any) {
      console.error("Error removing image:", error);
      toast({
        title: "Failed to remove image",
        description: error.message || "There was an error removing your image.",
        variant: "destructive",
      });
    }
  };

  const checkAndRedirectAfterProfileUpdate = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("full_name, updated_at")
        .eq("id", user.id)
        .single();

      const isProfileComplete =
        updatedProfile &&
        updatedProfile.full_name &&
        updatedProfile.full_name.trim() !== "" &&
        updatedProfile.full_name !== "User" &&
        updatedProfile.updated_at !== null;

      if (isProfileComplete && location.state?.fromAuth) {
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error("Error checking profile completion:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to update your profile.",
          variant: "destructive",
        });
        return;
      }

      if (!profile.full_name.trim()) {
        toast({
          title: "Full name required",
          description: "Please enter your full name to complete your profile.",
          variant: "destructive",
        });
        return;
      }

      if (profile.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", profile.username)
          .neq("id", user.id)
          .single();

        if (existingUser && !checkError) {
          toast({
            title: "Username taken",
            description:
              "This username is already taken. Please choose another one.",
            variant: "destructive",
          });
          return;
        }
      }

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("email, avatar_url")
        .eq("id", user.id)
        .single();

      const updateData: any = {
        id: user.id,
        username: profile.username || null,
        full_name: profile.full_name.trim(),
        phone: profile.phone,
        whatsapp: profile.whatsapp,
        location: profile.location,
        bio: profile.bio,
        avatar_url: profile.avatar_url || null,
        local_delivery_fee: Number(profile.local_delivery_fee),
        outside_delivery_fee: Number(profile.outside_delivery_fee),
        business_location: profile.business_location,
        payment_preference: profile.payment_preference,
        mpesa_phone: profile.mpesa_phone,
        updated_at: new Date().toISOString(),
      };

      if (currentProfile?.email) {
        updateData.email = currentProfile.email;
      } else {
        updateData.email = user.email;
      }

      const { error } = await supabase.from("profiles").upsert(updateData);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved successfully.",
      });

      checkAndRedirectAfterProfileUpdate();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Failed to save",
        description: error.message || "There was an error saving your profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save preferences.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) throw error;

      toast({
        title: "Preferences saved!",
        description: "Your settings have been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Failed to save preferences",
        description:
          error.message || "There was an error saving your preferences.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation password must match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated!",
        description: "Your password has been changed successfully.",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "Failed to update password",
        description:
          error.message || "There was an error changing your password.",
        variant: "destructive",
      });
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to add payment methods.",
          variant: "destructive",
        });
        return;
      }

      if (!newPaymentMethod.phone.trim()) {
        toast({
          title: "Phone number required",
          description: "Please enter a valid phone number.",
          variant: "destructive",
        });
        return;
      }

      const { data: newPaymentMethodData, error } = await supabase
        .from("payment_methods")
        .insert({
          user_id: user.id,
          type: "mpesa",
          last_four: newPaymentMethod.phone.slice(-4),
          is_default: paymentMethods.length === 0,
          metadata: {
            phone: newPaymentMethod.phone,
            provider: "M-Pesa",
          },
        })
        .select()
        .single();

      if (error) throw error;

      setPaymentMethods((prev) => [newPaymentMethodData, ...prev]);
      setNewPaymentMethod({ type: "mpesa", phone: "" });

      toast({
        title: "Payment method added!",
        description: "M-Pesa number has been added successfully.",
      });
    } catch (error: any) {
      console.error("Error adding payment method:", error);
      toast({
        title: "Failed to add payment method",
        description:
          error.message || "There was an error adding your payment method.",
        variant: "destructive",
      });
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", paymentMethodId);

      if (error) throw error;

      setPaymentMethods((prev) =>
        prev.filter((pm) => pm.id !== paymentMethodId)
      );

      toast({
        title: "Payment method removed",
        description: "Payment method has been removed successfully.",
      });
    } catch (error: any) {
      console.error("Error removing payment method:", error);
      toast({
        title: "Failed to remove payment method",
        description:
          error.message || "There was an error removing your payment method.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefaultPayment = async (paymentMethodId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", user.id);

      const { error } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", paymentMethodId);

      if (error) throw error;

      setPaymentMethods((prev) =>
        prev.map((pm) => ({
          ...pm,
          is_default: pm.id === paymentMethodId,
        }))
      );

      toast({
        title: "Default payment updated!",
        description: "Your default payment method has been updated.",
      });
    } catch (error: any) {
      console.error("Error setting default payment:", error);
      toast({
        title: "Failed to update default payment",
        description:
          error.message ||
          "There was an error updating your default payment method.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: "default" as const, label: "Completed" },
      pending: { variant: "secondary" as const, label: "Pending" },
      failed: { variant: "destructive" as const, label: "Failed" },
      active: { variant: "default" as const, label: "Active" },
      canceled: { variant: "secondary" as const, label: "Canceled" },
      past_due: { variant: "destructive" as const, label: "Past Due" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Account Settings"
        description="Manage your account settings, notifications, security preferences, billing information, and app preferences. Customize your marketplace experience."
        keywords="account settings, profile settings, notification preferences, security settings"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Settings
          </h1>

          {location.state?.fromAuth && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-blue-800 font-semibold mb-2">
                👋 Welcome to Connect!
              </h3>
              <p className="text-blue-700 text-sm">
                Please complete your profile setup to get started. You'll be
                redirected to the home page automatically once your profile is
                complete.
              </p>
            </div>
          )}

          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
              <TabsTrigger value="account">
                <User className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="billing">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Globe className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="shop">
                <Store className="h-4 w-4 mr-2" />
                Shop Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Update your account details and profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-2 border-border">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-2xl bg-muted">
                          {profile.full_name?.charAt(0) ||
                            profile.username?.charAt(0) ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar-upload" className="cursor-pointer">
                        <Button
                          variant="outline"
                          type="button"
                          disabled={uploading}
                          asChild
                        >
                          <span>
                            <Camera className="h-4 w-4 mr-2" />
                            {uploading ? "Uploading..." : "Change Photo"}
                          </span>
                        </Button>
                      </Label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />

                      {profile.avatar_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveImage}
                          disabled={uploading}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove Photo
                        </Button>
                      )}

                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or WebP. Max 5MB.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profile.username}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                        placeholder="johndoe"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your profile URL: connect.com/u/
                        {profile.username || "username"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            full_name: e.target.value,
                          }))
                        }
                        placeholder="John Doe"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Required to complete your profile
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Contact support to change your email
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="+254 700 000 000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={profile.whatsapp}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            whatsapp: e.target.value,
                          }))
                        }
                        placeholder="+254 700 000 000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      placeholder="Nairobi, Kenya"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, bio: e.target.value }))
                      }
                      placeholder="Tell us about yourself..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>

                  {location.state?.fromAuth && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ After saving your profile, you'll be redirected to the
                      home page
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          email_notifications: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications on your device
                      </p>
                    </div>
                    <Switch
                      checked={preferences.push_notifications}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          push_notifications: checked,
                        }))
                      }
                    />
                  </div>

                  <Button onClick={handleSavePreferences} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Preferences"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security
                      </p>
                    </div>
                    <Switch
                      checked={preferences.two_factor_auth}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          two_factor_auth: checked,
                        }))
                      }
                    />
                  </div>

                  <Button onClick={handlePasswordChange} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Updating..." : "Update Password"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Plan</CardTitle>
                    <CardDescription>
                      Your current subscription status and details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subscription ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold capitalize">
                              {subscription.plan_type} Plan
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(
                                subscription.price,
                                subscription.currency
                              )}{" "}
                              per month
                            </p>
                          </div>
                          {getStatusBadge(subscription.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Renews on{" "}
                          {formatDate(subscription.current_period_end)}
                        </div>
                        <Button variant="outline">Manage Subscription</Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">
                          No active subscription
                        </p>
                        <Button>Upgrade to Premium</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>
                      Manage your payment methods and billing preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {paymentMethods.length > 0 ? (
                      paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium capitalize">
                                {method.type} •••• {method.last_four}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Added {formatDate(method.created_at)}
                                {method.is_default && (
                                  <Badge variant="secondary" className="ml-2">
                                    Default
                                  </Badge>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!method.is_default && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleSetDefaultPayment(method.id)
                                }
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemovePaymentMethod(method.id)
                              }
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-4">
                          No payment methods added
                        </p>
                      </div>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Payment Method
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Payment Method</DialogTitle>
                          <DialogDescription>
                            Add a new payment method to your account
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Payment Type</Label>
                            <Select
                              value={newPaymentMethod.type}
                              onValueChange={(value) =>
                                setNewPaymentMethod((prev) => ({
                                  ...prev,
                                  type: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mpesa">M-Pesa</SelectItem>
                                <SelectItem value="card">
                                  Credit/Debit Card
                                </SelectItem>
                                <SelectItem value="bank">
                                  Bank Transfer
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                              placeholder="+254 700 000 000"
                              value={newPaymentMethod.phone}
                              onChange={(e) =>
                                setNewPaymentMethod((prev) => ({
                                  ...prev,
                                  phone: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <Button
                            onClick={handleAddPaymentMethod}
                            className="w-full"
                          >
                            Add Payment Method
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>
                      Your recent transactions and invoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {billingHistory.length > 0 ? (
                      <div className="space-y-4">
                        {billingHistory.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium">
                                  {invoice.description}
                                </p>
                                {getStatusBadge(invoice.status)}
                              </div>
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{formatDate(invoice.created_at)}</span>
                                <span className="font-semibold">
                                  {formatCurrency(
                                    invoice.amount,
                                    invoice.currency
                                  )}
                                </span>
                              </div>
                            </div>
                            {invoice.invoice_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a
                                  href={invoice.invoice_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          No billing history available
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>App Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) =>
                        setPreferences((prev) => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={preferences.currency}
                      onValueChange={(value) =>
                        setPreferences((prev) => ({ ...prev, currency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ksh">
                          KSh (Kenyan Shilling)
                        </SelectItem>
                        <SelectItem value="usd">USD (US Dollar)</SelectItem>
                        <SelectItem value="eur">EUR (Euro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle dark mode theme
                      </p>
                    </div>
                    <Switch
                      checked={preferences.dark_mode}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          dark_mode: checked,
                        }))
                      }
                    />
                  </div>

                  <Button onClick={handleSavePreferences} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Preferences"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="shop">
              <Card>
                <CardHeader>
                  <CardTitle>Shop & Delivery Settings</CardTitle>
                  <CardDescription>
                    Manage your business location and delivery fees for customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="business_location">Business Base Location (e.g., Nairobi)</Label>
                    <Input
                      id="business_location"
                      value={profile.business_location}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          business_location: e.target.value,
                        }))
                      }
                      placeholder="e.g. Nairobi"
                    />
                    <p className="text-xs text-muted-foreground">
                      The city or region where your business is primarily located.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="local_fee">Local Delivery Fee (KES)</Label>
                      <Input
                        id="local_fee"
                        type="number"
                        value={profile.local_delivery_fee}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            local_delivery_fee: Number(e.target.value),
                          }))
                        }
                        placeholder="200"
                      />
                      <p className="text-xs text-muted-foreground">
                        Fee charged for deliveries within your base location.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="outside_fee">Outside Delivery Fee (KES)</Label>
                      <Input
                        id="outside_fee"
                        type="number"
                        value={profile.outside_delivery_fee}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            outside_delivery_fee: Number(e.target.value),
                          }))
                        }
                        placeholder="350"
                      />
                      <p className="text-xs text-muted-foreground">
                        Fee charged for deliveries outside your base location.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-lg">Payment Preferences</h3>
                    <p className="text-sm text-muted-foreground">Choose how you want to receive payments from sales.</p>
                    
                    <div className="space-y-2">
                       <Label htmlFor="payment_pref">Preferred Payment Method</Label>
                       <Select
                          value={profile.payment_preference}
                          onValueChange={(value) =>
                            setProfile((prev) => ({ ...prev, payment_preference: value }))
                          }
                        >
                          <SelectTrigger id="payment_pref">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wallet">SellHub Wallet (Recommended)</SelectItem>
                            <SelectItem value="mpesa">M-Pesa (Direct to Phone)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          "Wallet" keeps funds in your dashboard. "M-Pesa" attempts to send directly if supported, otherwise defaults to Wallet.
                        </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mpesa_phone">M-Pesa Phone Number</Label>
                      <Input
                        id="mpesa_phone"
                        value={profile.mpesa_phone}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            mpesa_phone: e.target.value,
                          }))
                        }
                        placeholder="2547..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Required if you select M-Pesa as your preferred payment method.
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Shop Settings"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
