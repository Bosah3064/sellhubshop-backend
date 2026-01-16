import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Search,
  Image,
  Paperclip,
  CheckCheck,
  Loader2,
  AlertCircle,
  User,
  Volume2,
  VolumeX,
  RefreshCw,
  MessageCircle,
  FileText,
  Mic,
  Smile,
  Calendar,
  MapPin,
  Shield,
  Flag,
  ChevronLeft,
  Menu,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

interface EnhancedMessage extends MessageRow {
  isOwn: boolean;
  status: "sending" | "sent" | "delivered" | "read";
  displayTime: string;
  sender_profile?: ProfileRow;
  receiver_profile?: ProfileRow;
}

interface EnhancedConversation extends ConversationRow {
  other_user?: ProfileRow;
  product?: ProductRow | null;
  product_image?: string; // ✅ ADDED: Product image field
  unread_count: number;
  last_message?: MessageRow;
  last_message_display: string;
}

export default function Messages() {
  const [conversations, setConversations] = useState<EnhancedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<ProfileRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showConversations, setShowConversations] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('Current User ID:', currentUserId);
    console.log('Selected Conversation:', selectedConversation);
    console.log('Messages count:', messages.length);
    console.log('Conversations count:', conversations.length);
    console.log('Current User Profile:', currentUserProfile);
  }, [currentUserId, selectedConversation, messages, conversations, currentUserProfile]);

  // Check mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024 && selectedConversation) {
        setShowConversations(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [selectedConversation]);

  // Initialize user session
  const initializeUser = useCallback(async () => {
    try {
      console.log('Initializing user...');
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error("Failed to authenticate user");
      }

      if (user) {
        console.log('User found:', user.id);
        setCurrentUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
        } else {
          setCurrentUserProfile(profile);
        }

        await Promise.all([
          loadConversations(user.id),
          setupRealtimeSubscription(user.id),
        ]);
      } else {
        console.log('No user found');
        setError("Please sign in to view messages");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error initializing user:", error);
      setError("Failed to load messages");
      setLoading(false);
    }
  }, []);

  const loadConversations = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading conversations for user:', userId);

      const { data: conversationsData, error: conversationsError } = await supabase
        .from("conversations")
        .select(`
          *,
          products (*)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (conversationsError) {
        console.error('Conversations query error:', conversationsError);
        throw conversationsError;
      }

      console.log('Raw conversations data:', conversationsData);

      if (!conversationsData?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const enhancedConversations = await Promise.all(
        conversationsData.map(async (conv) => {
          try {
            const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
            
            console.log(`Processing conversation ${conv.id}, other user:`, otherUserId);

            // Fetch other user profile
            const { data: otherUserProfile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", otherUserId)
              .single();

            if (profileError) {
              console.error(`Error fetching profile for ${otherUserId}:`, profileError);
            }

            // Fetch last message
            const { data: lastMessage, error: messageError } = await supabase
              .from("messages")
              .select("*")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            if (messageError && messageError.code !== 'PGRST116') {
              console.error(`Error fetching last message for ${conv.id}:`, messageError);
            }

            // Get unread count
            const { count, error: countError } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .eq("is_read", false)
              .neq("sender_id", userId);

            if (countError) {
              console.error(`Error counting unread messages for ${conv.id}:`, countError);
            }

            return {
              ...conv,
              other_user: otherUserProfile || undefined,
              product: conv.products,
              product_image: conv.products?.images?.[0] || null, // ✅ ADDED: Get first product image
              unread_count: count || 0,
              last_message: lastMessage || undefined,
              last_message_display: lastMessage?.content?.substring(0, 50) + (lastMessage?.content?.length > 50 ? '...' : '') || "Start a conversation",
            };
          } catch (error) {
            console.error(`Error processing conversation ${conv.id}:`, error);
            const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
            return {
              ...conv,
              other_user: { id: otherUserId, username: 'Unknown User' } as ProfileRow,
              product: conv.products,
              product_image: conv.products?.images?.[0] || null, // ✅ ADDED: Get first product image
              unread_count: 0,
              last_message: undefined,
              last_message_display: "Error loading conversation",
            };
          }
        })
      );

      console.log('Enhanced conversations:', enhancedConversations);
      setConversations(enhancedConversations);

    } catch (error) {
      console.error("Error loading conversations:", error);
      setError("Failed to load conversations");
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!currentUserId || !conversationId) {
      console.error('Missing currentUserId or conversationId');
      return;
    }

    try {
      setMessagesLoading(true);
      setError(null);
      console.log('Loading messages for conversation:', conversationId);

      // Clear previous messages first
      setMessages([]);

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error('Messages query error:', messagesError);
        throw messagesError;
      }

      console.log('Raw messages data:', messagesData);

      if (!messagesData?.length) {
        setMessages([]);
        setMessagesLoading(false);
        return;
      }

      // Get unique user IDs from messages
      const userIds = Array.from(
        new Set(messagesData.flatMap(msg => [msg.sender_id, msg.receiver_id]))
      ).filter(Boolean) as string[];

      console.log('User IDs to fetch:', userIds);

      // Fetch profiles with better error handling
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        // Continue without profiles rather than failing completely
      }

      const profilesMap = new Map(
        profiles?.map(profile => [profile.id, profile]) || []
      );

      console.log('Profiles map:', profilesMap);

      // Mark messages as read
      await markMessagesAsRead(conversationId);

      const enhancedMessages: EnhancedMessage[] = messagesData.map((msg) => {
        const senderProfile = profilesMap.get(msg.sender_id);
        const receiverProfile = profilesMap.get(msg.receiver_id);
        
        console.log(`Message ${msg.id}:`, {
          sender: msg.sender_id,
          receiver: msg.receiver_id,
          senderProfile: senderProfile?.full_name,
          receiverProfile: receiverProfile?.full_name
        });

        return {
          ...msg,
          sender_profile: senderProfile,
          receiver_profile: receiverProfile,
          isOwn: msg.sender_id === currentUserId,
          status: msg.is_read ? "read" : msg.sender_id === currentUserId ? "sent" : "delivered",
          displayTime: formatTime(msg.created_at),
        };
      });

      console.log('Enhanced messages:', enhancedMessages);
      setMessages(enhancedMessages);

    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Failed to load messages");
      toast.error("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!currentUserId || !conversationId) return;

    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("receiver_id", currentUserId)
        .eq("is_read", false);

      if (error) throw error;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );

      window.dispatchEvent(new CustomEvent("refreshUnreadCounts"));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const setupRealtimeSubscription = useCallback(
    (userId: string) => {
      try {
        console.log('Setting up real-time subscription for user:', userId);
        
        const subscription = supabase
          .channel(`messages-${userId}`) // Unique channel per user
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
            },
            async (payload) => {
              const newMessage = payload.new as MessageRow;
              
              // Only process messages relevant to current user
              if (newMessage.receiver_id !== userId && newMessage.sender_id !== userId) {
                return;
              }

              console.log('New message received:', newMessage);

              // If this message is for the currently selected conversation
              if (selectedConversation && newMessage.conversation_id === selectedConversation) {
                try {
                  // Get sender profile
                  const { data: senderProfile, error: profileError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", newMessage.sender_id)
                    .single();

                  if (profileError) {
                    console.error('Error fetching sender profile:', profileError);
                    return;
                  }

                  const enhancedMessage: EnhancedMessage = {
                    ...newMessage,
                    sender_profile: senderProfile || undefined,
                    receiver_profile: currentUserProfile || undefined,
                    isOwn: newMessage.sender_id === userId,
                    status: newMessage.is_read ? "read" : "delivered",
                    displayTime: formatTime(newMessage.created_at),
                  };

                  setMessages((prev) => {
                    // Prevent duplicates
                    if (prev.some(msg => msg.id === newMessage.id)) {
                      return prev;
                    }
                    return [...prev, enhancedMessage];
                  });

                  // Auto-scroll to new message
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                  }, 100);

                } catch (error) {
                  console.error('Error processing new message:', error);
                }
              }

              // Refresh conversations list
              loadConversations(userId);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "messages",
            },
            (payload) => {
              const updatedMessage = payload.new as MessageRow;
              
              // Update message status in UI
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === updatedMessage.id
                    ? { 
                        ...msg, 
                        ...updatedMessage,
                        status: updatedMessage.is_read ? "read" : msg.status 
                      }
                    : msg
                )
              );
            }
          )
          .subscribe((status) => {
            console.log('Realtime subscription status:', status);
          });

        return () => {
          console.log('Unsubscribing from real-time');
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error setting up real-time subscription:", error);
      }
    },
    [selectedConversation, currentUserProfile, currentUserId]
  );

  const handleSelectConversation = (conversationId: string) => {
    console.log('Selecting conversation:', conversationId);
    setSelectedConversation(conversationId);
    setMessages([]);
    setError(null);
    loadMessages(conversationId);

    if (isMobile) {
      setShowConversations(false);
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleBackToConversations = () => {
    setShowConversations(true);
    setSelectedConversation(null);
  };

const handleSendMessage = async () => {
  if (!newMessage.trim() || !selectedConversation || !currentUserId) {
    toast.error("Please enter a message");
    return;
  }

  const selectedConv = conversations.find(
    (c) => c.id === selectedConversation
  );
  if (!selectedConv) {
    toast.error("Conversation not found");
    return;
  }

  try {
    setSending(true);
    setError(null);

    const receiverId =
      selectedConv.user1_id === currentUserId
        ? selectedConv.user2_id
        : selectedConv.user1_id;

    console.log('Sending message:', {
      conversationId: selectedConversation,
      senderId: currentUserId,
      receiverId: receiverId,
      content: newMessage.trim(),
      productId: selectedConv.product_id // Make sure product context is preserved
    });

    // Create optimistic message
    const optimisticMessage: EnhancedMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation,
      sender_id: currentUserId,
      receiver_id: receiverId,
      content: newMessage.trim(),
      message_text: newMessage.trim(),
      message_type: "text",
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      product_id: selectedConv.product_id, // ✅ Preserve product context
      sender_profile: currentUserProfile || undefined,
      receiver_profile: selectedConv.other_user,
      isOwn: true,
      status: "sending",
      displayTime: "Just now",
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    // Send message with product context
    const { data: sentMessage, error: sendError } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation,
        sender_id: currentUserId,
        receiver_id: receiverId,
        content: newMessage.trim(),
        message_text: newMessage.trim(),
        message_type: "text",
        is_read: false,
        product_id: selectedConv.product_id, // ✅ Preserve product context
      })
      .select()
      .single();

    if (sendError) {
      console.error('Send message error:', sendError);
      throw sendError;
    }

    console.log('Message sent successfully:', sentMessage);

    // Update conversation timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", selectedConversation);

    // Create final message with profiles
    const finalMessage: EnhancedMessage = {
      ...sentMessage,
      sender_profile: currentUserProfile || undefined,
      receiver_profile: selectedConv.other_user,
      isOwn: true,
      status: "sent",
      displayTime: formatTime(sentMessage.created_at),
    };

    // Replace optimistic message with actual message
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === optimisticMessage.id ? finalMessage : msg
      )
    );

    // Refresh conversations
    await loadConversations(currentUserId);

    toast.success("Message sent");
    window.dispatchEvent(new CustomEvent("refreshUnreadCounts"));
  } catch (error) {
    console.error("Error sending message:", error);
    setError("Failed to send message");
    toast.error("Failed to send message");

    // Remove optimistic message on error
    setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
  } finally {
    setSending(false);
  }
};

  const handleRefresh = async () => {
    if (currentUserId) {
      setLoading(true);
      await loadConversations(currentUserId);
      if (selectedConversation) {
        await loadMessages(selectedConversation);
      }
      toast.success("Refreshed");
    }
  };

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    localStorage.setItem(
      "messageSoundEnabled",
      JSON.stringify(newSoundEnabled)
    );
    toast.success(`Sound ${newSoundEnabled ? "enabled" : "disabled"}`);
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();

      if (diff < 60000) return "Just now";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000)
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      if (diff < 604800000)
        return date.toLocaleDateString([], {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
      return date.toLocaleDateString();
    } catch {
      return "Unknown time";
    }
  };

  const getStatusIcon = (status: EnhancedMessage["status"]) => {
    switch (status) {
      case "sending":
        return (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        );
      case "sent":
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-green-500" />;
      default:
        return null;
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setIsScrolled(scrollHeight - scrollTop - clientHeight > 200);
  };

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      if (scrollHeight - scrollTop - clientHeight < 300) {
        scrollToBottom();
      }
    }
  }, [messages]);

  // Initialize on component mount
  useEffect(() => {
    initializeUser();
    const soundPreference = localStorage.getItem("messageSoundEnabled");
    if (soundPreference !== null) {
      setSoundEnabled(JSON.parse(soundPreference));
    }

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up messages component');
      supabase.removeAllChannels();
    };
  }, [initializeUser]);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.other_user?.full_name?.toLowerCase().includes(query) ||
      conv.other_user?.username?.toLowerCase().includes(query) ||
      conv.product?.name?.toLowerCase().includes(query) ||
      conv.last_message_display.toLowerCase().includes(query)
    );
  });

  const selectedConv = conversations.find((c) => c.id === selectedConversation);
  const totalUnreadCount = conversations.reduce(
    (sum, conv) => sum + conv.unread_count,
    0
  );

  // Mobile Conversations Sheet
  const ConversationsContent = () => (
    <CardContent className="p-4 md:p-6 flex flex-col flex-1">
      {/* Search */}
      <div className="mb-4 md:mb-6">
        <div className="relative">
          <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 md:pl-12 h-11 md:h-12 rounded-xl border-2 bg-white/50 focus:bg-white transition-all text-sm md:text-base"
            disabled={loading}
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1 -mx-2">
        <div className="space-y-2 px-2">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`p-3 md:p-4 rounded-xl cursor-pointer transition-all border-2 ${
                selectedConversation === conv.id
                  ? "bg-gradient-to-r from-primary/10 to-blue-100/50 border-primary/30 shadow-md"
                  : "border-transparent hover:bg-white/70 hover:border-gray-200 hover:shadow-sm"
              } group`}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="relative flex-shrink-0">
                  <Avatar className="w-12 h-12 md:w-14 md:h-14 border-2 md:border-3 border-white shadow-md group-hover:scale-105 transition-transform">
                    <AvatarImage
                      src={conv.other_user?.avatar_url}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-blue-100 font-semibold text-xs md:text-sm">
                      {conv.other_user?.full_name?.charAt(0) ||
                        conv.other_user?.username?.charAt(0) || (
                          <User className="w-4 h-4 md:w-6 md:h-6" />
                        )}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unread_count > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 min-w-5 h-5 md:min-w-6 md:h-6 flex items-center justify-center rounded-full text-xs font-bold shadow-md animate-pulse"
                    >
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1 md:space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 truncate text-sm">
                      {conv.other_user?.full_name ||
                        conv.other_user?.username ||
                        "Unknown User"}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 ml-2">
                      {formatTime(conv.updated_at)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 truncate leading-relaxed">
                    {conv.last_message_display}
                  </p>

                  {conv.product && (
                    <div className="flex items-center gap-2 text-xs">
                      {/* ✅ ADDED: Product thumbnail in conversation list */}
                      {conv.product_image ? (
                        <img
                          src={conv.product_image}
                          alt={conv.product.name}
                          className="w-6 h-6 rounded object-cover flex-shrink-0 border"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Package className="w-3 h-3 text-gray-500" />
                        </div>
                      )}
                      <div className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium truncate flex-1">
                        {conv.product.name}
                      </div>
                      <span className="font-bold text-primary whitespace-nowrap">
                        KES {conv.product.price?.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredConversations.length === 0 && !loading && (
            <div className="text-center py-8 md:py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-40" />
              <p className="font-semibold mb-2 text-sm md:text-base">
                No conversations found
              </p>
              {searchQuery ? (
                <Button
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  Clear Search
                </Button>
              ) : (
                <p className="text-xs md:text-sm max-w-xs mx-auto">
                  Your conversations will appear here when you start messaging
                  buyers or sellers
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </CardContent>
  );

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="relative">
            <MessageCircle className="w-12 h-12 md:w-16 md:h-16 text-primary/60 mx-auto mb-4" />
            <Loader2 className="w-6 h-6 animate-spin text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Loading Messages
            </h2>
            <p className="text-gray-600 text-sm md:text-base max-w-sm">
              We're loading your conversations. This will just take a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md w-full">
          <div className="bg-white rounded-2xl p-6 shadow-lg border">
            <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 text-sm md:text-base mb-6">
              Please sign in to access your messages and continue conversations
              with buyers and sellers.
            </p>
            <Button onClick={initializeUser} size="lg" className="w-full">
              Sign In to Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 safe-area-bottom">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6">
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-white rounded-2xl p-2 md:p-3 shadow-sm border">
                  <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Messages
                  </h1>
                  <p className="text-gray-600 mt-1 flex items-center gap-2 text-sm md:text-base">
                    Chat with buyers and sellers
                    {totalUnreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="animate-pulse text-xs"
                      >
                        {totalUnreadCount} unread
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSound}
                className="h-10 w-10 md:h-11 md:w-11 rounded-xl border-2"
                title={soundEnabled ? "Disable sound" : "Enable sound"}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="h-10 px-3 md:h-11 md:px-4 rounded-xl border-2 flex items-center gap-2 md:gap-3 text-sm"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6 h-[calc(100vh-140px)] md:h-[calc(100vh-200px)]">
          {/* Conversations List - Desktop */}
          {!isMobile && (
            <Card className="xl:col-span-1 flex flex-col border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm">
              <ConversationsContent />
            </Card>
          )}

          {/* Conversations List - Mobile Sheet */}
          {isMobile && (
            <Sheet open={showConversations} onOpenChange={setShowConversations}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-white"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-md p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Conversations</h2>
                  </div>
                  <ConversationsContent />
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Chat Area */}
          <Card
            className={`flex flex-col h-full border-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm overflow-hidden ${
              isMobile ? "col-span-1" : "xl:col-span-3"
            }`}
          >
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 md:p-6 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                      {isMobile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleBackToConversations}
                          className="h-10 w-10 rounded-xl mr-1"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                      )}
                      <Avatar className="w-10 h-10 md:w-14 md:h-14 border-2 md:border-3 border-white shadow-md">
                        <AvatarImage
                          src={selectedConv.other_user?.avatar_url}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-blue-100 font-semibold text-xs md:text-sm">
                          {selectedConv.other_user?.full_name?.charAt(0) ||
                            selectedConv.other_user?.username?.charAt(0) || (
                              <User className="w-4 h-4 md:w-6 md:h-6" />
                            )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 md:gap-3">
                          <h3 className="font-bold text-base md:text-lg text-gray-900">
                            {selectedConv.other_user?.full_name ||
                              selectedConv.other_user?.username ||
                              "Unknown User"}
                          </h3>
                          {selectedConv.unread_count > 0 && (
                            <Badge
                              variant="destructive"
                              className="text-xs font-bold animate-pulse"
                            >
                              {selectedConv.unread_count}
                            </Badge>
                          )}
                        </div>
                        
                        {/* ✅ UPDATED: Product section with thumbnail */}
                        {selectedConv.product ? (
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border max-w-md">
                            {selectedConv.product_image ? (
                              <img
                                src={selectedConv.product_image}
                                alt={selectedConv.product.name}
                                className="w-8 h-8 rounded object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {selectedConv.product.name}
                              </p>
                              <p className="text-xs font-bold text-primary">
                                KES {selectedConv.product.price?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                            <span>Direct message</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 md:gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 md:h-11 md:w-11 rounded-xl"
                        title="Voice call"
                      >
                        <Phone className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 md:h-11 md:w-11 rounded-xl"
                        title="Video call"
                      >
                        <Video className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 md:h-11 md:w-11 rounded-xl"
                          >
                            <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl"
                        >
                          <DropdownMenuItem className="flex items-center gap-3 rounded-lg text-sm">
                            <User className="w-4 h-4" />
                            View Profile
                          </DropdownMenuItem>
                          {selectedConv.product && (
                            <DropdownMenuItem className="flex items-center gap-3 rounded-lg text-sm">
                              <FileText className="w-4 h-4" />
                              View Product
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex items-center gap-3 rounded-lg text-sm">
                            <Shield className="w-4 h-4" />
                            Block User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-3 rounded-lg text-sm text-destructive">
                            <Flag className="w-4 h-4" />
                            Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 flex flex-col min-h-0 relative bg-gradient-to-b from-white to-blue-50/30">
                  {isScrolled && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-10 shadow-lg border-2 rounded-full backdrop-blur-sm text-xs"
                      onClick={scrollToBottom}
                    >
                      <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      Scroll to latest
                    </Button>
                  )}

                  <ScrollArea
                    className="h-full"
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                  >
                    <div className="p-4 md:p-6 flex flex-col min-h-full space-y-4 md:space-y-6">
                      {messagesLoading ? (
                        <div className="flex justify-center items-center py-8 md:py-12">
                          <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-primary mr-2 md:mr-3" />
                          <span className="text-gray-600 font-medium text-sm md:text-base">
                            Loading messages...
                          </span>
                        </div>
                      ) : messages.length > 0 ? (
                        <>
                          {messages.map((message, index) => {
                            const showAvatar =
                              index === 0 ||
                              messages[index - 1]?.sender_id !==
                                message.sender_id ||
                              new Date(message.created_at).getTime() -
                                new Date(
                                  messages[index - 1].created_at
                                ).getTime() >
                                300000;

                            return (
                              <div
                                key={message.id}
                                className={`flex ${
                                  message.isOwn
                                    ? "justify-end"
                                    : "justify-start"
                                } group`}
                              >
                                <div
                                  className={`flex items-end gap-2 md:gap-3 max-w-[85%] md:max-w-[75%] ${
                                    message.isOwn
                                      ? "flex-row-reverse"
                                      : "flex-row"
                                  }`}
                                >
                                  {/* Avatar */}
                                  {!message.isOwn && showAvatar && (
                                    <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 mt-1 border-2 border-white shadow-sm">
                                      <AvatarImage
                                        src={message.sender_profile?.avatar_url}
                                      />
                                      <AvatarFallback className="text-xs bg-gradient-to-br from-gray-100 to-gray-200">
                                        {message.sender_profile?.full_name?.charAt(
                                          0
                                        ) ||
                                          message.sender_profile?.username?.charAt(
                                            0
                                          ) ||
                                          "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}

                                  {!message.isOwn && !showAvatar && (
                                    <div className="w-8 md:w-10 flex-shrink-0" />
                                  )}

                                  {/* Message Content */}
                                  <div
                                    className={`flex flex-col ${
                                      message.isOwn
                                        ? "items-end"
                                        : "items-start"
                                    } space-y-1 md:space-y-2 flex-1 min-w-0`}
                                  >
                                    {!message.isOwn && showAvatar && (
                                      <p className="text-xs text-gray-500 font-medium px-2 md:px-3">
                                        {message.sender_profile?.full_name ||
                                          message.sender_profile?.username ||
                                          "Unknown User"}
                                      </p>
                                    )}

                                    <div
                                      className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 max-w-full shadow-sm ${
                                        message.isOwn
                                          ? "bg-gradient-to-br from-primary to-primary/90 text-white rounded-br-md"
                                          : "bg-white border border-gray-200 rounded-bl-md"
                                      } group-hover:shadow-md transition-shadow`}
                                    >
                                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                        {message.content}
                                      </p>
                                    </div>

                                    {/* Message Metadata */}
                                    <div
                                      className={`flex items-center gap-1 md:gap-2 px-1 ${
                                        message.isOwn ? "flex-row-reverse" : ""
                                      }`}
                                    >
                                      <span
                                        className={`text-xs ${
                                          message.isOwn
                                            ? "text-primary/70"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {message.displayTime}
                                      </span>
                                      {message.isOwn && (
                                        <span className="flex items-center">
                                          {getStatusIcon(message.status)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                          <div className="text-center max-w-md space-y-4 p-4">
                            <MessageCircle className="w-16 h-16 md:w-20 md:h-20 mx-auto opacity-30" />
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg md:text-xl text-gray-700">
                                No messages yet
                              </h3>
                              <p className="text-gray-600 text-sm md:text-base">
                                Start the conversation by sending a message. Be
                                clear and friendly to build trust with{" "}
                                {selectedConv.other_user?.full_name ||
                                  "the other user"}
                                .
                              </p>
                            </div>
                            <Button
                              onClick={() => inputRef.current?.focus()}
                              variant="outline"
                              size="lg"
                              className="rounded-xl border-2 mt-4 text-sm md:text-base"
                            >
                              Write your first message
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Message Input */}
                <div className="p-4 md:p-6 border-t border-gray-200 bg-white/90 backdrop-blur-sm safe-area-padding">
                  <div className="flex items-center gap-2 md:gap-3 w-full">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={sending}
                        className="h-10 w-10 md:h-12 md:w-12 rounded-xl"
                      >
                        <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={sending}
                        className="h-10 w-10 md:h-12 md:w-12 rounded-xl"
                      >
                        <Image className="w-4 h-4 md:w-5 md:h-5" />
                      </Button>
                    </div>

                    <div className="flex-1 flex items-center gap-2 md:gap-3 min-w-0 bg-white border-2 border-gray-200 rounded-2xl px-3 md:px-4 focus-within:border-primary focus-within:shadow-sm transition-all">
                      <Input
                        ref={inputRef}
                        placeholder={`Message ${
                          selectedConv.other_user?.full_name ||
                          selectedConv.other_user?.username ||
                          "user"
                        }...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !sending &&
                            newMessage.trim()
                          ) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 min-w-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent py-2 md:py-3 text-sm md:text-base"
                        disabled={sending}
                      />

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 md:h-10 md:w-10 rounded-xl"
                        >
                          <Smile className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending}
                          size="icon"
                          className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all"
                        >
                          {sending ? (
                            <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3 md:w-4 md:h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center max-w-md space-y-4 md:space-y-6 p-4">
                  <div className="bg-gradient-to-br from-primary/10 to-blue-100/50 rounded-3xl p-6 md:p-8 inline-block">
                    <MessageCircle className="w-16 h-16 md:w-20 md:h-20 text-primary/50 mx-auto" />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <h3 className="font-bold text-xl md:text-2xl text-gray-700">
                      Select a Conversation
                    </h3>
                    <p className="text-gray-600 text-sm md:text-lg">
                      Choose a conversation from the list to start messaging or
                      view your existing chats
                    </p>
                    {/* ✅ ADDED: Sample product thumbnail in empty state */}
                    <div className="flex justify-center">
                      <div className="bg-white rounded-lg p-3 border shadow-sm max-w-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900">Product chats show thumbnails</p>
                            <p className="text-xs text-primary font-bold">KES 0</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {isMobile && (
                    <Button
                      onClick={() => setShowConversations(true)}
                      className="rounded-xl"
                    >
                      <Menu className="w-4 h-4 mr-2" />
                      View Conversations
                    </Button>
                  )}
                  <div className="flex items-center justify-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                    <div className="flex items-center gap-1 md:gap-2">
                      <Phone className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Secure messaging</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <Shield className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Protected</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}