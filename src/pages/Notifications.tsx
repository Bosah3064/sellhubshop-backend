import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Check,
  Trash2,
  ShoppingBag,
  MessageSquare,
  Heart,
  TrendingUp,
  Star,
  Loader2,
  AlertCircle,
  Volume2,
  VolumeX,
  Filter,
  MoreVertical,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationType =
  | "order"
  | "message"
  | "favorite"
  | "review"
  | "system"
  | "product";
type LucideIcon = typeof Bell;

interface EnhancedNotification extends NotificationRow {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  type: NotificationType;
  priority: "low" | "medium" | "high";
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<EnhancedNotification[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Device compatibility checks
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    checkDeviceType();
    checkOnlineStatus();

    const handleResize = () => {
      checkDeviceType();
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("resize", handleResize);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    const count = notifications.filter((n) => !n.is_read).length;
    setUnreadCount(count);

    if (count > 0 && notifications.length > 0) {
      const latestNotification = notifications[0];
      if (
        !latestNotification.is_read &&
        Date.now() - new Date(latestNotification.created_at).getTime() < 5000
      ) {
        playNotificationSound();
      }
    }
  }, [notifications, soundEnabled]);

  const checkDeviceType = () => {
    const width = window.innerWidth;
    setIsMobile(width < 768);
    setIsTablet(width >= 768 && width < 1024);
  };

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
  };

  const playNotificationSound = () => {
    if (!soundEnabled) return;

    try {
      // Use a simple beep sound that works across devices
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;

      oscillator.start();
      setTimeout(() => oscillator.stop(), 100);
    } catch (error) {
      console.log("Audio not supported on this device");
    }
  };

  const initializeUser = async () => {
    if (!isOnline) {
      toast.error("You're offline. Please check your connection.");
      setLoading(false);
      return;
    }

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        throw new Error("Authentication failed");
      }

      if (user) {
        setCurrentUserId(user.id);
        await loadNotifications(user.id);
        setupRealtimeSubscription(user.id);

        const soundPreference = localStorage.getItem(
          "notificationSoundEnabled"
        );
        if (soundPreference !== null) {
          setSoundEnabled(JSON.parse(soundPreference));
        }
      } else {
        toast.error("Please sign in to view notifications");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error initializing user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load notifications";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const loadNotifications = async (userId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(isMobile ? 25 : 50);

      if (error) {
        console.error("Error fetching notifications:", error);
        throw new Error("Failed to load notifications from server");
      }

      const enhancedNotifications: EnhancedNotification[] = (data || []).map(
        (notification) => mapDatabaseNotificationToUI(notification)
      );

      setNotifications(enhancedNotifications);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading notifications:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load notifications";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = (userId: string) => {
    try {
      const subscription = supabase
        .channel("notifications-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("Real-time notification received:", payload);
            loadNotifications(userId);
            if (!isMobile) {
              toast.info("New notification received!");
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("Real-time notifications subscription active");
          }
        });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up real-time subscription:", error);
    }
  };

  const mapDatabaseNotificationToUI = (
    dbNotification: NotificationRow
  ): EnhancedNotification => {
    let icon: LucideIcon = Bell;
    let color = "text-gray-600";
    let bgColor = "bg-gray-100";
    let type: NotificationType = "system";
    let priority: "low" | "medium" | "high" = "medium";

    switch (dbNotification.type) {
      case "order":
        icon = ShoppingBag;
        color = "text-green-600";
        bgColor = "bg-green-50";
        type = "order";
        priority = "high";
        break;
      case "message":
        icon = MessageSquare;
        color = "text-blue-600";
        bgColor = "bg-blue-50";
        type = "message";
        priority = "high";
        break;
      case "favorite":
        icon = Heart;
        color = "text-pink-600";
        bgColor = "bg-pink-50";
        type = "favorite";
        priority = "low";
        break;
      case "review":
        icon = Star;
        color = "text-yellow-600";
        bgColor = "bg-yellow-50";
        type = "review";
        priority = "medium";
        break;
      case "product":
        icon = TrendingUp;
        color = "text-purple-600";
        bgColor = "bg-purple-50";
        type = "product";
        priority = "medium";
        break;
      default:
        icon = Bell;
        color = "text-gray-600";
        bgColor = "bg-gray-50";
        type = "system";
        priority = "low";
    }

    return {
      ...dbNotification,
      icon,
      color,
      bgColor,
      type,
      priority,
    };
  };

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    localStorage.setItem(
      "notificationSoundEnabled",
      JSON.stringify(newSoundEnabled)
    );

    toast.success(
      `Notification sound ${newSoundEnabled ? "enabled" : "disabled"}`,
      {
        duration: isMobile ? 2000 : 4000,
      }
    );
  };

  const markAsRead = async (id: string) => {
    if (!currentUserId) {
      toast.error("Please sign in to perform this action");
      return;
    }

    if (!isOnline) {
      toast.error("You're offline. Please check your connection.");
      return;
    }

    try {
      setProcessingIds((prev) => new Set(prev).add(id));

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", currentUserId);

      if (error) {
        throw new Error("Failed to mark notification as read");
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );

      toast.success("Notification marked as read", {
        duration: isMobile ? 2000 : 3000,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to mark as read";
      toast.error(errorMessage);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const markAllAsRead = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to perform this action");
      return;
    }

    if (!isOnline) {
      toast.error("You're offline. Please check your connection.");
      return;
    }

    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      if (unreadNotifications.length === 0) {
        toast.info("No unread notifications");
        return;
      }

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", currentUserId)
        .eq("is_read", false);

      if (error) {
        throw new Error("Failed to mark all notifications as read");
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to mark all as read";
      toast.error(errorMessage);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!currentUserId) {
      toast.error("Please sign in to perform this action");
      return;
    }

    if (!isOnline) {
      toast.error("You're offline. Please check your connection.");
      return;
    }

    try {
      setProcessingIds((prev) => new Set(prev).add(id));

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUserId);

      if (error) {
        throw new Error("Failed to delete notification");
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete notification";
      toast.error(errorMessage);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const clearAll = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to perform this action");
      return;
    }

    if (!isOnline) {
      toast.error("You're offline. Please check your connection.");
      return;
    }

    try {
      if (notifications.length === 0) {
        toast.info("No notifications to clear");
        return;
      }

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", currentUserId);

      if (error) {
        throw new Error("Failed to clear notifications");
      }

      setNotifications([]);
      setShowClearAllDialog(false);
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to clear notifications";
      toast.error(errorMessage);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50/50";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50/50";
      case "low":
        return "border-l-gray-400 bg-gray-50/50";
      default:
        return "border-l-gray-400";
    }
  };

  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications.filter((n) => n.type === activeTab);

  const getTabLayout = () => {
    if (isMobile) {
      return "grid grid-cols-2 gap-1";
    } else if (isTablet) {
      return "grid grid-cols-4 gap-2";
    }
    return "grid grid-cols-3 lg:grid-cols-7 gap-2";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <Bell className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Loading Notifications
            </h2>
            <p className="text-muted-foreground">
              Getting your latest updates...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your notifications
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={initializeUser} className="w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <a href="/signin">Sign In</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-3 sm:px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Stay updated with your activity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isOnline && (
                <Badge
                  variant="outline"
                  className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  Offline
                </Badge>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size={isMobile ? "icon" : "default"}
                  >
                    {isMobile ? <Settings className="w-4 h-4" /> : "Settings"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={toggleSound}>
                    {soundEnabled ? (
                      <VolumeX className="w-4 h-4 mr-2" />
                    ) : (
                      <Volume2 className="w-4 h-4 mr-2" />
                    )}
                    {soundEnabled ? "Disable Sound" : "Enable Sound"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      currentUserId && loadNotifications(currentUserId)
                    }
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {unreadCount > 0 && (
                    <DropdownMenuItem onClick={markAllAsRead}>
                      <Check className="w-4 h-4 mr-2" />
                      Mark All Read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowClearAllDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Bell className="w-4 h-4 text-primary" />
                Total: {notifications.length}
              </span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {unreadCount} Unread
                </Badge>
              )}
            </div>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className={`w-full ${getTabLayout()} p-1 bg-muted/50`}>
            <TabsTrigger value="all" className="text-xs sm:text-sm py-2">
              All
              {!isMobile && ` (${notifications.length})`}
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs sm:text-sm py-2">
              {isMobile ? "Unread" : "Unread"}
              {!isMobile && ` (${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="order" className="text-xs sm:text-sm py-2">
              {isMobile ? "Orders" : "Orders"}
            </TabsTrigger>
            <TabsTrigger value="message" className="text-xs sm:text-sm py-2">
              {isMobile ? "Messages" : "Messages"}
            </TabsTrigger>
            {!isMobile && (
              <>
                <TabsTrigger
                  value="favorite"
                  className="text-xs sm:text-sm py-2"
                >
                  Favorites
                </TabsTrigger>
                <TabsTrigger value="review" className="text-xs sm:text-sm py-2">
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="system" className="text-xs sm:text-sm py-2">
                  System
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const Icon = notification.icon;
              const isProcessing = processingIds.has(notification.id);

              return (
                <Card
                  key={notification.id}
                  className={`p-4 transition-all duration-300 border-l-4 ${getPriorityColor(
                    notification.priority
                  )} ${
                    !notification.is_read
                      ? "shadow-md ring-1 ring-primary/20"
                      : "border-border/50"
                  } hover:shadow-lg hover:scale-[1.02]`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${notification.bgColor} flex-shrink-0 mt-1`}
                    >
                      <Icon
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${notification.color}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className="text-sm sm:text-base font-semibold mb-1 line-clamp-2">
                            {notification.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Badge
                            variant="default"
                            className="flex-shrink-0 text-xs animate-pulse"
                          >
                            New
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                        <div className="flex gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <MoreVertical className="w-3 h-3" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {!notification.is_read && (
                                <DropdownMenuItem
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Mark as Read
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {notification.is_read
                                  ? "Mark Unread"
                                  : "Mark Read"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 sm:p-12 text-center border-border/50 bg-card/50">
              <div className="max-w-sm mx-auto">
                <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  {notifications.length === 0
                    ? "No Notifications"
                    : "No Matching Notifications"}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6">
                  {notifications.length === 0
                    ? "You're all caught up! New notifications will appear here."
                    : "No notifications match your current filter."}
                </p>
                {notifications.length === 0 && (
                  <Button
                    onClick={() =>
                      currentUserId && loadNotifications(currentUserId)
                    }
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog
        open={showClearAllDialog}
        onOpenChange={setShowClearAllDialog}
      >
        <AlertDialogContent className="max-w-sm sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Clear All Notifications?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {notifications.length}{" "}
              notifications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
