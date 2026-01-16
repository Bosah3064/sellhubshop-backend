import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect, useState, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

// Lazy load pages for performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ProductUpload = lazy(() => import("./pages/ProductUpload"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Blog = lazy(() => import("./pages/Blog"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Search = lazy(() => import("./pages/Search"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Settings = lazy(() => import("./pages/Settings"));
const Compare = lazy(() => import("./pages/Compare"));
const SignIn = lazy(() => import("./pages/SignIn"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const EditProductPage = lazy(() => import("./pages/EditProductPage"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Following = lazy(() => import("./pages/Following"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Careers = lazy(() => import("./pages/Careers"));
const Discover = lazy(() => import("./pages/Discover"));
const AdminSecurityDashboard = lazy(() => import("./pages/AdminSecurityDashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ProfileProducts = lazy(() => import("./pages/ProfileProducts"));
const AdminBannerManager = lazy(() => import("./pages/AdminBannerManager"));

import { AdminSecurityGate as AdminSecurity } from "./components/admin/AdminSecurityGate";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Shield, Loader2 } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Hook to check if user profile is complete
const useProfileComplete = (user: User | null) => {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) {
        setIsProfileComplete(false);
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          setIsProfileComplete(false);
          setLoading(false);
          return;
        }

        const isComplete =
          profile &&
          profile.full_name &&
          profile.full_name.trim() !== "" &&
          profile.full_name !== "User" &&
          profile.updated_at !== null;

        setIsProfileComplete(!!isComplete);
      } catch (error) {
        console.error("Error checking profile completion:", error);
        setIsProfileComplete(false);
      } finally {
        setLoading(false);
      }
    };

    checkProfileCompletion();
  }, [user]);

  return { isProfileComplete, loading };
};

const ProtectedRoute = ({
  children,
  requireCompleteProfile = false,
}: {
  children: React.ReactNode;
  requireCompleteProfile?: boolean;
}) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { isProfileComplete, loading: profileLoading } = useProfileComplete(user);

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (requireCompleteProfile && !isProfileComplete && location.pathname !== "/settings") {
    return <Navigate to="/settings" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({
  children,
  minRole = "admin",
  require2FA = true,
  requiredPermissions = [],
}: {
  children: React.ReactNode;
  minRole?: "super_admin" | "admin" | "moderator";
  require2FA?: boolean;
  requiredPermissions?: string[];
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-900">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <Shield className="h-8 w-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <p className="text-white font-medium">Initializing Security</p>
            <p className="text-gray-400 text-sm">Loading admin privileges...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <AdminSecurity
      minRole={minRole}
      require2FA={require2FA}
      requiredPermissions={requiredPermissions}
    >
      {children}
    </AdminSecurity>
  );
};

const AdminLoginRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AuthCallbackWithRedirect = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const handleRedirect = async () => {
        // First check if this is a password recovery session
        const { data: { session } } = await supabase.auth.getSession();

        // Handle PASSWORD_RECOVERY session if it exists
        // Supabase often sets the session before the event triggers in some cases
        const isRecovery = session?.user?.recovery_sent_at || window.location.hash.includes('type=recovery') || window.location.href.includes('type=recovery');

        if (isRecovery) {
          console.log("Detected recovery state in callback, redirecting to reset-password");
          navigate("/reset-password", { replace: true });
          return;
        }

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, updated_at")
            .eq("id", user.id)
            .single();

          const isComplete =
            profile &&
            profile.full_name &&
            profile.full_name.trim() !== "" &&
            profile.full_name !== "User" &&
            profile.updated_at !== null;

          if (isComplete) {
            navigate("/", { replace: true });
          } else {
            navigate("/settings", { replace: true, state: { fromAuth: true } });
          }
        } else {
          navigate("/signin", { replace: true });
        }
      };
      handleRedirect();
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Completing sign in...</p>
      </div>
    </div>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="flex-grow">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center min-h-screen">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/careers" element={<Careers />} />
                    <Route path="/discover" element={<Discover />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/cookie-policy" element={<CookiePolicy />} />
                    <Route path="/help-center" element={<HelpCenter />} />

                    {/* Content & Info Aliases */}
                    <Route path="/news" element={<Navigate to="/blog" replace />} />
                    <Route path="/articles" element={<Navigate to="/blog" replace />} />
                    <Route path="/about-us" element={<Navigate to="/about" replace />} />
                    <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
                    <Route path="/get-in-touch" element={<Navigate to="/contact" replace />} />
                    <Route path="/support" element={<Navigate to="/help-center" replace />} />
                    <Route path="/help" element={<Navigate to="/help-center" replace />} />
                    <Route path="/faq" element={<Navigate to="/help-center" replace />} />
                    <Route path="/jobs" element={<Navigate to="/careers" replace />} />
                    <Route path="/work-with-us" element={<Navigate to="/careers" replace />} />
                    <Route path="/plans" element={<Navigate to="/pricing" replace />} />
                    <Route path="/packages" element={<Navigate to="/pricing" replace />} />
                    <Route path="/subscribe" element={<Navigate to="/pricing" replace />} />

                    {/* Legal Aliases */}
                    <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
                    <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
                    <Route path="/tos" element={<Navigate to="/terms" replace />} />
                    <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
                    <Route path="/cookies" element={<Navigate to="/cookie-policy" replace />} />

                    <Route path="/signin" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
                    <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<PublicOnlyRoute><VerifyEmail /></PublicOnlyRoute>} />
                    <Route path="/auth/login" element={<Navigate to="/admin/login" replace />} />
                    <Route path="/auth/callback" element={<AuthCallbackWithRedirect />} />

                    {/* Authentication Aliases & Redirects */}
                    <Route path="/login" element={<Navigate to="/signin" replace />} />
                    <Route path="/sign-in" element={<Navigate to="/signin" replace />} />
                    <Route path="/signup" element={<Navigate to="/register" replace />} />
                    <Route path="/sign-up" element={<Navigate to="/register" replace />} />
                    <Route path="/join" element={<Navigate to="/register" replace />} />
                    <Route path="/logout" element={<Navigate to="/" replace />} />
                    <Route path="/account" element={<Navigate to="/settings" replace />} />
                    <Route path="/my-account" element={<Navigate to="/settings" replace />} />
                    <Route path="/forgot-password" element={<Navigate to="/reset-password" replace />} />

                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/profile/:id" element={<Profile />} />
                    <Route path="/profile/:id/products" element={<ProfileProducts />} />
                    <Route path="/u/:id" element={<Profile />} />
                    <Route path="/u/:id/products" element={<ProfileProducts />} />
                    <Route path="/u" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                    {/* Profile Aliases */}
                    <Route path="/user/:id" element={<Profile />} />
                    <Route path="/users/:id" element={<Profile />} />
                    <Route path="/me" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/my-profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/account/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

                    {/* Communication Aliases */}
                    <Route path="/inbox" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/chat" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/chats" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    <Route path="/alerts" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                    <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                    <Route path="/following" element={<ProtectedRoute><Following /></ProtectedRoute>} />
                    <Route path="/following/:id" element={<Following />} />

                    {/* Social & Network Aliases */}
                    <Route path="/network" element={<ProtectedRoute><Following /></ProtectedRoute>} />
                    <Route path="/connections" element={<ProtectedRoute><Following /></ProtectedRoute>} />
                    <Route path="/followers" element={<ProtectedRoute><Following /></ProtectedRoute>} />
                    <Route path="/favorites" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                    <Route path="/saved" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                    <Route path="/likes" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                    <Route path="/refer" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
                    <Route path="/invite" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
                    <Route path="/product-upload" element={<ProtectedRoute requireCompleteProfile><ProductUpload /></ProtectedRoute>} />
                    <Route path="/products/upload" element={<Navigate to="/product-upload" replace />} />
                    <Route path="/edit-product/:id" element={<ProtectedRoute><EditProductPage /></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />

                    {/* Product & Marketplace Aliases */}
                    <Route path="/products" element={<Navigate to="/marketplace" replace />} />
                    <Route path="/shop" element={<Navigate to="/marketplace" replace />} />
                    <Route path="/store" element={<Navigate to="/marketplace" replace />} />
                    <Route path="/items" element={<Navigate to="/marketplace" replace />} />
                    <Route path="/product/upload" element={<Navigate to="/product-upload" replace />} />
                    <Route path="/upload" element={<Navigate to="/product-upload" replace />} />
                    <Route path="/sell" element={<Navigate to="/product-upload" replace />} />
                    <Route path="/list-item" element={<Navigate to="/product-upload" replace />} />
                    <Route path="/item/:id" element={<ProductDetail />} />
                    <Route path="/p/:id" element={<ProductDetail />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/edit/:id" element={<ProtectedRoute><EditProductPage /></ProtectedRoute>} />

                    {/* Dashboard & Analytics Aliases */}
                    <Route path="/my-dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/stats" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/statistics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/insights" element={<Navigate to="/blog" replace />} />

                    <Route path="/admin" element={
                      <AdminRoute>
                        <ErrorBoundary>
                          <AdminDashboard />
                        </ErrorBoundary>
                      </AdminRoute>
                    } />
                    <Route path="/admin/login" element={<AdminLoginRoute><AdminLogin /></AdminLoginRoute>} />
                    <Route path="/admin/security" element={<AdminRoute minRole="super_admin"><AdminSecurityDashboard /></AdminRoute>} />

                    <Route
                      path="/admin/products"
                      element={<AdminRoute minRole="moderator"><AdminDashboard /></AdminRoute>}
                    />
                    <Route
                      path="/admin/users"
                      element={<AdminRoute minRole="admin" requiredPermissions={["can_manage_users"]}><AdminDashboard /></AdminRoute>}
                    />
                    <Route
                      path="/admin/reports"
                      element={<AdminRoute minRole="admin" requiredPermissions={["can_manage_reports"]}><AdminDashboard /></AdminRoute>}
                    />
                    <Route
                      path="/admin/settings"
                      element={<AdminRoute minRole="admin" requiredPermissions={["can_manage_settings"]}><AdminDashboard /></AdminRoute>}
                    />
                    <Route
                      path="/admin/banners"
                      element={<AdminRoute minRole="admin" requiredPermissions={["can_manage_content"]}><AdminDashboard /></AdminRoute>}
                    />
                    <Route
                      path="/admin/banners/manage"
                      element={<AdminRoute minRole="admin" requiredPermissions={["can_manage_content"]}><AdminBannerManager /></AdminRoute>}
                    />
                    <Route
                      path="/admin/subscriptions"
                      element={<AdminRoute minRole="admin" requiredPermissions={["can_manage_subscriptions"]}><AdminDashboard /></AdminRoute>}
                    />

                    {/* Admin Aliases */}
                    <Route path="/administration" element={<Navigate to="/admin" replace />} />
                    <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
                    <Route path="/admin/signin" element={<Navigate to="/admin/login" replace />} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <Footer />
            </div>
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
