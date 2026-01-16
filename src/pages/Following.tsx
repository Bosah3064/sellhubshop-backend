import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  UserPlus,
  Users,
  MessageCircle,
  Phone,
  Mail,
  Star,
  MapPin,
  CheckCircle2,
  MessageSquare,
  Video,
  Calendar,
  Shield,
  MoreHorizontal,
  TrendingUp,
  Heart,
  UserMinus,
  Zap,
  Award,
  Sparkles,
  Users2,
  Filter,
  RefreshCw,
  Crown,
  Target,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string;
  rating: number;
  total_ratings: number;
  created_at: string;
  products_count?: number;
  followers_count?: number;
}

interface Following {
  id: string;
  following_id: string;
  user: User;
  created_at: string;
}

interface Follower {
  id: string;
  follower_id: string;
  user: User;
  created_at: string;
}

// Safaricom color palette
const safaricomColors = {
  green: "#00A650",
  blue: "#0077BE",
  purple: "#8B5CF6",
  orange: "#FF6B35",
  teal: "#14B8A6",
  darkGreen: "#008040",
};

export default function Following() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [following, setFollowing] = useState<Following[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [filteredFollowing, setFilteredFollowing] = useState<Following[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filteredRecommended, setFilteredRecommended] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [currentUserFollowing, setCurrentUserFollowing] = useState<Following[]>(
    []
  );
  const [sortBy, setSortBy] = useState("recent");
  const [searchParams] = useSearchParams();

  // Sync activeTab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["discover", "all-users", "friends", "following", "followers"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (id) {
      loadAllData();
    }
  }, [id]);

  useEffect(() => {
    if (currentUser) {
      loadCurrentUserFollowing();
    }
  }, [currentUser]);

  useEffect(() => {
    filterAndSortUsers();
  }, [searchQuery, following, allUsers, recommendedUsers, sortBy]);

  const initializeUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error initializing user:", error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProfile(),
        loadFollowing(),
        loadFollowers(),
        loadAllUsers(),
        loadRecommendedUsers(),
      ]);
    } catch (error) {
      console.error("Error loading all data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast.success("Network data refreshed! 🎯");
  };

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadFollowing = async () => {
    try {
      const { data, error } = await supabase
        .from("followers")
        .select(
          `
          id,
          following_id,
          created_at,
          user:profiles!followers_following_id_fkey(
            id,
            full_name,
            username,
            avatar_url,
            bio,
            location,
            phone,
            whatsapp,
            email,
            rating,
            total_ratings,
            created_at
          )
        `
        )
        .eq("follower_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFollowing(data || []);
    } catch (error) {
      console.error("Error loading following:", error);
    }
  };

  const loadCurrentUserFollowing = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from("followers")
        .select(
          `
          id,
          following_id,
          created_at,
          user:profiles!followers_following_id_fkey(
            id,
            full_name,
            username,
            avatar_url,
            bio,
            location,
            phone,
            whatsapp,
            email,
            rating,
            total_ratings,
            created_at
          )
        `
        )
        .eq("follower_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCurrentUserFollowing(data || []);
    } catch (error) {
      console.error("Error loading current user following:", error);
    }
  };

  const loadFollowers = async () => {
    try {
      const { data, error } = await supabase
        .from("followers")
        .select(
          `
          id,
          follower_id,
          created_at,
          user:profiles!followers_follower_id_fkey(
            id,
            full_name,
            username,
            avatar_url,
            bio,
            location,
            phone,
            whatsapp,
            email,
            rating,
            total_ratings,
            created_at
          )
        `
        )
        .eq("following_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFollowers(data || []);
    } catch (error) {
      console.error("Error loading followers:", error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          username,
          avatar_url,
          bio,
          location,
          phone,
          whatsapp,
          email,
          rating,
          total_ratings,
          created_at
        `
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error("Error loading all users:", error);
    }
  };

  const loadRecommendedUsers = async () => {
    try {
      const { data: popularUsers, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          username,
          avatar_url,
          bio,
          location,
          phone,
          whatsapp,
          email,
          rating,
          total_ratings,
          created_at
        `
        )
        .order("rating", { ascending: false })
        .limit(50);

      if (error) throw error;

      const enhancedUsers = await Promise.all(
        (popularUsers || []).map(async (user) => {
          const { count: productsCount } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("owner_id", user.id)
            .in("status", ["active", "approved"]);

          const { count: followersCount } = await supabase
            .from("followers")
            .select("*", { count: "exact", head: true })
            .eq("following_id", user.id);

          return {
            ...user,
            products_count: productsCount || 0,
            followers_count: followersCount || 0,
          };
        })
      );

      const currentUserId = currentUser?.id;
      const filteredUsers = enhancedUsers.filter(
        (user) =>
          user.id !== currentUserId &&
          user.id !== id &&
          !currentUserFollowing.some(
            (follow) => follow.following_id === user.id
          )
      );

      setRecommendedUsers(filteredUsers);
    } catch (error) {
      console.error("Error loading recommended users:", error);
    }
  };

  const filterAndSortUsers = () => {
    const filterUsers = (users: any[]) => {
      if (!searchQuery) return users;

      return users.filter(
        (item) =>
          item.user?.full_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.user?.username
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item.user?.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    };

    const sortUsers = (users: any[]) => {
      switch (sortBy) {
        case "rating":
          return [...users].sort((a, b) => {
            const ratingA = a.user?.rating || a.rating || 0;
            const ratingB = b.user?.rating || b.rating || 0;
            return ratingB - ratingA;
          });
        case "products":
          return [...users].sort((a, b) => {
            const productsA = a.user?.products_count || a.products_count || 0;
            const productsB = b.user?.products_count || b.products_count || 0;
            return productsB - productsA;
          });
        case "followers":
          return [...users].sort((a, b) => {
            const followersA =
              a.user?.followers_count || a.followers_count || 0;
            const followersB =
              b.user?.followers_count || b.followers_count || 0;
            return followersB - followersA;
          });
        case "recent":
        default:
          return [...users].sort((a, b) => {
            const dateA = new Date(a.user?.created_at || a.created_at);
            const dateB = new Date(b.user?.created_at || b.created_at);
            return dateB.getTime() - dateA.getTime();
          });
      }
    };

    setFilteredFollowing(sortUsers(filterUsers(following)));
    setFilteredUsers(sortUsers(filterUsers(allUsers)));
    setFilteredRecommended(sortUsers(filterUsers(recommendedUsers)));
  };

  const handleUnfollow = async (userId: string) => {
    if (!currentUser) {
      toast.error("Please sign in to unfollow users");
      return;
    }

    try {
      const { error } = await supabase
        .from("followers")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", userId);

      if (error) throw error;

      setCurrentUserFollowing((prev) =>
        prev.filter((follow) => follow.following_id !== userId)
      );

      if (currentUser.id === id) {
        setFollowing((prev) =>
          prev.filter((follow) => follow.following_id !== userId)
        );
      }

      loadRecommendedUsers();
      toast.success("Unfollowed successfully! 🎯");
    } catch (error) {
      console.error("Error unfollowing:", error);
      toast.error("Failed to unfollow. Try again.");
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) {
      toast.error("Please sign in to follow users");
      navigate("/signin");
      return;
    }

    if (currentUser.id === userId) {
      toast.error("You cannot follow yourself");
      return;
    }

    try {
      const { data: existingFollow } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", userId)
        .single();

      if (existingFollow) {
        toast.info("You are already following this user");
        return;
      }

      const { data, error } = await supabase
        .from("followers")
        .insert({
          follower_id: currentUser.id,
          following_id: userId,
          created_at: new Date().toISOString(),
        })
        .select(
          `
          id,
          following_id,
          created_at,
          user:profiles!followers_following_id_fkey(
            id,
            full_name,
            username,
            avatar_url,
            bio,
            location,
            phone,
            whatsapp,
            email,
            rating,
            total_ratings,
            created_at
          )
        `
        )
        .single();

      if (error) throw error;

      setCurrentUserFollowing((prev) => [...prev, data]);
      if (currentUser.id === id) {
        setFollowing((prev) => [...prev, data]);
      }
      setRecommendedUsers((prev) => prev.filter((user) => user.id !== userId));

      toast.success("Following user! 🤝");
    } catch (error) {
      console.error("Error following:", error);
      toast.error("Failed to follow. Please try again.");
    }
  };

  const handleContact = (
    user: User,
    method: "whatsapp" | "phone" | "email" | "sms"
  ) => {
    try {
      let url: string | null = null;
      let message = "";

      switch (method) {
        case "whatsapp":
          if (user.whatsapp) {
            message = `Hi ${user.full_name || "there"
              }! I saw your profile on Marketplace and would like to connect.`;
            url = `https://wa.me/${user.whatsapp.replace(
              /\D/g,
              ""
            )}?text=${encodeURIComponent(message)}`;
          } else {
            toast.error("WhatsApp number not available");
            return;
          }
          break;

        case "phone":
          if (user.phone) {
            url = `tel:${user.phone}`;
          } else {
            toast.error("Phone number not available");
            return;
          }
          break;

        case "email":
          message = `Connection Request from Marketplace`;
          url = `mailto:${user.email}?subject=${encodeURIComponent(
            message
          )}&body=${encodeURIComponent(
            `Hi ${user.full_name || "there"
            }!\n\nI saw your profile on the marketplace and would like to connect with you.`
          )}`;
          break;

        case "sms":
          if (user.phone) {
            message = `Hi! I saw your profile on Marketplace and would like to connect.`;
            url = `sms:${user.phone}?body=${encodeURIComponent(message)}`;
          } else {
            toast.error("Phone number not available for SMS");
            return;
          }
          break;
      }

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        toast.success(
          `Contacting ${user.full_name || "user"} via ${method} 📞`
        );
      }
    } catch (error) {
      console.error("Contact error:", error);
      toast.error("Failed to open contact");
    }
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleShareProfile = async (user: User) => {
    try {
      const profileUrl = `${window.location.origin}/profile/${user.id}`;
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Profile link copied to clipboard! 📋");
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to copy link");
    }
  };

  const getRelationshipStatus = (userId: string) => {
    if (!currentUser) return "none";
    if (currentUser.id === userId) return "own-profile";

    const isFollowing = currentUserFollowing.some(
      (follow) => follow.following_id === userId
    );
    const isFollower = followers.some(
      (follower) => follower.follower_id === userId
    );

    if (isFollowing && isFollower) return "friends";
    if (isFollowing) return "following";
    if (isFollower) return "follower";

    return "none";
  };

  const isCurrentUserFollowing = (userId: string) => {
    return currentUserFollowing.some(
      (follow) => follow.following_id === userId
    );
  };

  const getInitials = (name: string | null, email: string): string => {
    if (name) return name.charAt(0).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const getUserStats = (user: User) => {
    const hasHighRating = user.rating > 4.5;
    const isPopular = user.followers_count && user.followers_count > 10;
    const isActive =
      new Date(user.created_at) >
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const isTopSeller = user.products_count && user.products_count > 5;

    return { hasHighRating, isPopular, isActive, isTopSeller };
  };

  // Enhanced UserCard with Safaricom theme
  const UserCard = ({
    user,
    showActions = true,
    showStats = false,
  }: {
    user: User;
    showActions?: boolean;
    showStats?: boolean;
  }) => {
    const relationshipStatus = getRelationshipStatus(user.id);
    const isOwnProfile = currentUser?.id === user.id;
    const isFollowing = isCurrentUserFollowing(user.id);
    const { hasHighRating, isPopular, isActive, isTopSeller } =
      getUserStats(user);

    return (
      <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30 group hover:scale-[1.02]">
        <div className="flex items-start gap-4">
          <Avatar
            className="w-16 h-16 cursor-pointer border-2 border-green-200 shadow-lg group-hover:border-green-400 transition-all duration-300"
            onClick={() => handleViewProfile(user.id)}
          >
            <AvatarImage src={user.avatar_url || ""} />
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-lg">
              {getInitials(user.full_name, user.email)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div
                className="cursor-pointer flex-1 min-w-0"
                onClick={() => handleViewProfile(user.id)}
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-lg truncate text-gray-900">
                    {user.full_name || "Unknown User"}
                  </h3>

                  {/* Enhanced Relationship Badges with Safaricom Colors */}
                  {relationshipStatus !== "none" && !isOwnProfile && (
                    <Badge
                      variant="secondary"
                      className={
                        relationshipStatus === "friends"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg"
                          : relationshipStatus === "following"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-purple-100 text-purple-800 border-purple-200"
                      }
                    >
                      {relationshipStatus === "friends" && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-current" />
                          <span>Friends</span>
                        </div>
                      )}
                      {relationshipStatus === "following" && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Following</span>
                        </div>
                      )}
                      {relationshipStatus === "follower" && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Follows You</span>
                        </div>
                      )}
                    </Badge>
                  )}

                  {/* Enhanced Achievement Badges */}
                  {hasHighRating && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Crown className="w-3 h-3 fill-current mr-1" />
                      Top Rated
                    </Badge>
                  )}

                  {isPopular && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}

                  {isTopSeller && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <Award className="w-3 h-3 mr-1" />
                      Top Seller
                    </Badge>
                  )}

                  {isActive && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <Zap className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>

                {user.username && (
                  <p className="text-sm text-muted-foreground mb-2">
                    @{user.username}
                  </p>
                )}

                {user.bio && (
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 mb-3">
                    {user.bio}
                  </p>
                )}

                {/* Enhanced User Stats */}
                {showStats && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap mb-3">
                    {user.products_count && user.products_count > 0 && (
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                        <Award className="w-3 h-3 text-blue-600" />
                        <span className="font-medium">
                          {user.products_count} products
                        </span>
                      </div>
                    )}
                    {user.followers_count && user.followers_count > 0 && (
                      <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-full">
                        <Users className="w-3 h-3 text-purple-600" />
                        <span className="font-medium">
                          {user.followers_count} followers
                        </span>
                      </div>
                    )}
                    {user.total_ratings > 0 && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {user.rating?.toFixed(1) || "5.0"} (
                          {user.total_ratings})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  {user.location && (
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                      <MapPin className="w-3 h-3" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    <span>Joined {formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>

              {showActions && currentUser && !isOwnProfile && (
                <div className="flex flex-col gap-2 ml-4">
                  {/* Enhanced Follow/Unfollow Button */}
                  {isFollowing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnfollow(user.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all shadow-sm"
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Unfollow
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleFollow(user.id)}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25 transition-all"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Follow
                    </Button>
                  )}

                  {/* Enhanced Communication Buttons */}
                  <div className="flex gap-1">
                    {user.whatsapp && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="w-8 h-8 bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:scale-110 transition-all"
                        onClick={() => handleContact(user, "whatsapp")}
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                    )}
                    {user.phone && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="w-8 h-8 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:scale-110 transition-all"
                        onClick={() => handleContact(user, "phone")}
                        title="Call"
                      >
                        <Phone className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="outline"
                      className="w-8 h-8 bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100 hover:scale-110 transition-all"
                      onClick={() => handleContact(user, "email")}
                      title="Email"
                    >
                      <Mail className="w-3 h-3" />
                    </Button>

                    {/* More Options Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="outline"
                          className="w-8 h-8 bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:scale-110 transition-all"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 border-0 shadow-xl"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            toast.success("Video call feature coming soon! 🎥")
                          }
                          className="cursor-pointer"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Video Call
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast.success(
                              "Schedule meeting feature coming soon! 📅"
                            )
                          }
                          className="cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Meeting
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleViewProfile(user.id)}
                          className="cursor-pointer"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleShareProfile(user)}
                          className="cursor-pointer"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Share Profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const getUsersByRelationship = (relationship: string) => {
    return allUsers.filter(
      (user) => getRelationshipStatus(user.id) === relationship
    );
  };

  const getDiscoverUsers = useMemo(() => {
    return recommendedUsers.filter(
      (user) =>
        !currentUserFollowing.some(
          (follow) => follow.following_id === user.id
        ) && user.id !== currentUser?.id
    );
  }, [recommendedUsers, currentUserFollowing, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
        <Card className="p-8 text-center border-0 shadow-xl bg-gradient-to-br from-white to-green-50/30">
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900">
            Loading Network
          </h3>
          <p className="text-muted-foreground">Discovering amazing people...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="hover:bg-green-50 text-green-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  Network & Connect
                </h1>
                <p className="text-sm text-muted-foreground">
                  {currentUser?.id === id
                    ? "Your professional network"
                    : `${profile?.full_name || profile?.username}'s network`}
                </p>
              </div>
            </div>
            <Button
              onClick={refreshData}
              disabled={refreshing}
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Search & Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, username, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-base border-2 border-green-200 focus:border-green-500 transition-colors rounded-xl"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-green-200 text-green-600 hover:bg-green-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Sort:{" "}
                  {sortBy === "recent"
                    ? "Recent"
                    : sortBy === "rating"
                      ? "Top Rated"
                      : sortBy === "products"
                        ? "Most Products"
                        : "Most Followers"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-0 shadow-xl"
              >
                <DropdownMenuItem
                  onClick={() => setSortBy("recent")}
                  className="cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Most Recent
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("rating")}
                  className="cursor-pointer"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Top Rated
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("products")}
                  className="cursor-pointer"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Most Products
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("followers")}
                  className="cursor-pointer"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Most Followers
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="w-full grid grid-cols-5 bg-green-50/50 p-1 rounded-xl border border-green-200">
            <TabsTrigger
              value="discover"
              className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-700 font-semibold rounded-lg transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Discover ({getDiscoverUsers.length})
            </TabsTrigger>
            <TabsTrigger
              value="all-users"
              className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-700 font-semibold rounded-lg transition-all"
            >
              <Users2 className="w-4 h-4 mr-2" />
              All Users ({allUsers.length})
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-700 font-semibold rounded-lg transition-all"
            >
              <Heart className="w-4 h-4 mr-2" />
              Friends ({getUsersByRelationship("friends").length})
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-700 font-semibold rounded-lg transition-all"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Following ({following.length})
            </TabsTrigger>
            <TabsTrigger
              value="followers"
              className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-700 font-semibold rounded-lg transition-all"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Followers ({followers.length})
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Tab Contents */}
          <TabsContent value="discover" className="space-y-4">
            {filteredRecommended.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    🎯 Recommended for You
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Discover amazing people based on your interests and
                    marketplace activity
                  </p>
                </div>
                {filteredRecommended.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    showActions={true}
                    showStats={true}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-16 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  No New Recommendations
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You're following most recommended users! Check back later for
                  new suggestions.
                </p>
                <Button
                  onClick={() => setActiveTab("all-users")}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
                >
                  <Users2 className="w-4 h-4 mr-2" />
                  Explore All Users
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Other tabs with similar enhanced styling... */}
          <TabsContent value="all-users" className="space-y-4">
            {filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    showActions={true}
                    showStats={true}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-16 border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users2 className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  {searchQuery ? "No matches found" : "No Users Available"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? "Try adjusting your search terms to find more people."
                    : "Check back later to discover new users in the community."}
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="friends" className="space-y-4">
            {getUsersByRelationship("friends").length > 0 ? (
              <div className="space-y-4">
                {getUsersByRelationship("friends").map((user) => (
                  <UserCard key={user.id} user={user} showActions={true} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-16 border-0 shadow-lg bg-gradient-to-br from-white to-green-50/30">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  No Mutual Friends Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Connect with people who follow you back to build mutual
                  friendships!
                </p>
                <Button
                  onClick={() => setActiveTab("discover")}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Discover People
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            {filteredFollowing.length > 0 ? (
              <div className="space-y-4">
                {filteredFollowing.map((follow) => (
                  <UserCard
                    key={follow.id}
                    user={follow.user}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-16 border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  Not Following Anyone Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start building your network! Follow interesting people to see
                  their updates.
                </p>
                <Button
                  onClick={() => setActiveTab("discover")}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Discover People
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="followers" className="space-y-4">
            {followers.length > 0 ? (
              <div className="space-y-4">
                {followers.map((follower) => (
                  <UserCard
                    key={follower.id}
                    user={follower.user}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-16 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  No Followers Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Engage with the community and share great content to attract
                  followers!
                </p>
                <Button
                  onClick={() => setActiveTab("discover")}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
                >
                  <Users2 className="w-4 h-4 mr-2" />
                  Explore Community
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
