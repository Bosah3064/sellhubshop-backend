// components/AdminBannerManager.tsx
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Megaphone, Video, Image, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  video_url?: string;
  animation_url?: string;
  media_type: "image" | "video" | "animation";
  target_url?: string;
  type: string;
  status: string;
  priority: number;
  start_date?: string;
  end_date?: string;
  button_text?: string;
  button_color?: string;
  text_color?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  creator_display?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

interface AdminBannerManagerProps {
  currentAdmin?: any;
  permissions?: any;
}

// Component for individual banner card with image error handling
const BannerCard = ({
  banner,
  onEdit,
  onDelete,
}: {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  onDelete: (id: string) => void;
}) => {
  const [imageError, setImageError] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200",
      scheduled: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return (
      <Badge
        variant="outline"
        className={variants[status as keyof typeof variants]}
      >
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      promotional: "bg-purple-100 text-purple-800 border-purple-200",
      seasonal: "bg-orange-100 text-orange-800 border-orange-200",
      emergency: "bg-red-100 text-red-800 border-red-200",
      informational: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return (
      <Badge
        variant="outline"
        className={variants[type as keyof typeof variants]}
      >
        {type}
      </Badge>
    );
  };

  const getMediaTypeBadge = (mediaType: string) => {
    const variants = {
      image: "bg-green-100 text-green-800 border-green-200",
      video: "bg-blue-100 text-blue-800 border-blue-200",
      animation: "bg-purple-100 text-purple-800 border-purple-200",
    };
    const icons = {
      image: <Image className="h-3 w-3 mr-1" />,
      video: <Video className="h-3 w-3 mr-1" />,
      animation: <Zap className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge
        variant="outline"
        className={variants[mediaType as keyof typeof variants]}
      >
        {icons[mediaType as keyof typeof icons]}
        {mediaType}
      </Badge>
    );
  };

  return (
    <Card
      key={banner.id}
      className="overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div
        className="h-32 bg-cover bg-center relative"
        style={{
          backgroundImage: imageError
            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            : `url(${banner.image_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-2 left-2 flex gap-1">
          {getMediaTypeBadge(banner.media_type)}
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          {getStatusBadge(banner.status)}
          {getTypeBadge(banner.type)}
        </div>

        {/* Hidden image for error detection */}
        {banner.media_type === "image" && (
          <img
            src={banner.image_url}
            alt=""
            className="hidden"
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        )}

        {/* Video/Animation preview */}
        {(banner.media_type === "video" || banner.media_type === "animation") &&
          banner.video_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Video className="h-8 w-8 text-white opacity-70" />
            </div>
          )}

        {/* Fallback content */}
        {imageError && banner.media_type === "image" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <Megaphone className="h-8 w-8 mx-auto mb-2" />
              <span className="text-sm font-medium">Banner Image</span>
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg leading-tight">
            {banner.title}
          </h3>
          <Badge variant="outline">P{banner.priority}</Badge>
        </div>

        {banner.description && (
          <div className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {banner.description}
          </div>
        )}

        <div className="space-y-2 text-xs text-muted-foreground mb-3">
          {banner.target_url && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Link:</span>
              <span className="truncate">{banner.target_url}</span>
            </div>
          )}
          {banner.button_text && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Button:</span>
              <span>{banner.button_text}</span>
            </div>
          )}
          {(banner.media_type === "video" ||
            banner.media_type === "animation") &&
            banner.video_url && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Video:</span>
                <span className="truncate text-blue-600">
                  {banner.video_url.split("/").pop()}
                </span>
              </div>
            )}
          <div className="flex items-center gap-1">
            <span className="font-medium">Created by:</span>
            <span>{banner.creator_display}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(banner)}
            className="flex-1"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(banner.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export function AdminBannerManager({
  currentAdmin: propAdmin,
  permissions: propPermissions,
}: AdminBannerManagerProps) {
  const [currentAdmin, setCurrentAdmin] = useState(propAdmin);
  const [permissions, setPermissions] = useState(propPermissions);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    video_url: "",
    animation_url: "",
    media_type: "image",
    target_url: "",
    type: "promotional",
    status: "active",
    priority: 1,
    button_text: "",
    button_color: "#000000",
    text_color: "#ffffff",
    start_date: "",
    end_date: "",
    autoplay: true,
    muted: true,
    loop: true,
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!currentAdmin || !permissions) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: admin } = await supabase
              .from("admin_users")
              .select("*")
              .eq("user_id", user.id)
              .single();
            
            if (admin) {
              setCurrentAdmin(admin);
              // Simple permission set for standalone mode
              setPermissions({
                canViewBanners: true,
                canManageBanners: admin.role === 'admin' || admin.role === 'super_admin' || admin.can_manage_content
              });
            }
          }
        } catch (error) {
          console.error("Error fetching admin data in BannerManager:", error);
        }
      }
    };

    fetchAdminData();
    loadBanners();
  }, [propAdmin, propPermissions]);

  useEffect(() => {
    if (editingBanner) {
      setFormData({
        title: editingBanner.title || "",
        description: editingBanner.description || "",
        image_url: editingBanner.image_url || "",
        video_url: editingBanner.video_url || "",
        animation_url: editingBanner.animation_url || "",
        media_type: editingBanner.media_type || "image",
        target_url: editingBanner.target_url || "",
        type: editingBanner.type || "promotional",
        status: editingBanner.status || "active",
        priority: editingBanner.priority || 1,
        button_text: editingBanner.button_text || "",
        button_color: editingBanner.button_color || "#000000",
        text_color: editingBanner.text_color || "#ffffff",
        start_date: editingBanner.start_date
          ? editingBanner.start_date.slice(0, 16)
          : "",
        end_date: editingBanner.end_date
          ? editingBanner.end_date.slice(0, 16)
          : "",
        autoplay: editingBanner.autoplay ?? true,
        muted: editingBanner.muted ?? true,
        loop: editingBanner.loop ?? true,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        image_url: "",
        video_url: "",
        animation_url: "",
        media_type: "image",
        target_url: "",
        type: "promotional",
        status: "active",
        priority: 1,
        button_text: "",
        button_color: "#000000",
        text_color: "#ffffff",
        start_date: "",
        end_date: "",
        autoplay: true,
        muted: true,
        loop: true,
      });
    }
  }, [editingBanner]);

  const loadBanners = async () => {
    try {
      console.log("Loading banners...");

      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log(
        "Banners loaded successfully:",
        data?.map((b) => ({
          id: b.id,
          title: b.title,
          image_url: b.image_url,
          media_type: b.media_type,
          status: b.status,
        }))
      );

      const bannersWithBasicInfo =
        data?.map((banner) => ({
          ...banner,
          creator_display: banner.created_by
            ? `User: ${banner.created_by.substring(0, 8)}...`
            : "Unknown",
        })) || [];

      setBanners(bannersWithBasicInfo);
    } catch (error: any) {
      console.error("Error loading banners:", error);
      toast({
        variant: "destructive",
        title: "Failed to load banners",
        description: error.message || "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log("Saving banner with data:", formData);

      const bannerData = {
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        video_url: formData.video_url,
        animation_url: formData.animation_url,
        media_type: formData.media_type,
        target_url: formData.target_url,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        button_text: formData.button_text,
        button_color: formData.button_color,
        text_color: formData.text_color,
        start_date: formData.start_date
          ? new Date(formData.start_date).toISOString()
          : null,
        end_date: formData.end_date
          ? new Date(formData.end_date).toISOString()
          : null,
        autoplay: formData.autoplay,
        muted: formData.muted,
        loop: formData.loop,
        updated_at: new Date().toISOString(),
      };

      console.log("Processed banner data:", bannerData);

      if (editingBanner) {
        const { error } = await supabase
          .from("banners")
          .update(bannerData)
          .eq("id", editingBanner.id);

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }

        toast({
          title: "Banner updated",
          description: "Banner has been updated successfully.",
        });
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        const { error } = await supabase.from("banners").insert([
          {
            ...bannerData,
            created_by: user.id,
          },
        ]);

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }

        toast({
          title: "Banner created",
          description: "Banner has been created successfully.",
        });
      }

      setIsDialogOpen(false);
      setEditingBanner(null);
      await loadBanners();
    } catch (error: any) {
      console.error("Error saving banner:", error);
      toast({
        variant: "destructive",
        title: "Failed to save banner",
        description: error.message || "Please check the form and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", bannerId);

      if (error) throw error;

      toast({
        title: "Banner deleted",
        description: "Banner has been deleted successfully.",
      });

      loadBanners();
    } catch (error: any) {
      console.error("Error deleting banner:", error);
      toast({
        variant: "destructive",
        title: "Failed to delete banner",
        description: error.message || "Please try again.",
      });
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setIsDialogOpen(true);
  };

  const handleCreateBanner = () => {
    setEditingBanner(null);
    setIsDialogOpen(true);
  };

  if (!permissions.canManageBanners) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Banner Management</h3>
            <p>You don't have permission to manage banners.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Banner Management
          </h2>
          <p className="text-muted-foreground">
            Manage promotional banners and campaigns with images, videos, and
            animations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleCreateBanner}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "Edit Banner" : "Create New Banner"}
              </DialogTitle>
              <DialogDescription>
                {editingBanner
                  ? "Update your banner details"
                  : "Create a new promotional banner with images, videos, or animations"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Black Friday Sale"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media_type">Media Type *</Label>
                  <Select
                    value={formData.media_type}
                    onValueChange={(value) =>
                      handleInputChange("media_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="animation">Animation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Up to 70% off on all electronics..."
                  rows={3}
                />
              </div>

              {/* Image URL - Required for all media types as fallback */}
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL *</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={(e) =>
                    handleInputChange("image_url", e.target.value)
                  }
                  placeholder="https://example.com/banner.jpg"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Required for all media types (used as fallback and thumbnail)
                </p>
              </div>

              {/* Video URL - Conditionally shown for video/animation */}
              {(formData.media_type === "video" ||
                formData.media_type === "animation") && (
                  <div className="space-y-2">
                    <Label htmlFor="video_url">
                      {formData.media_type === "video"
                        ? "Video URL"
                        : "Animation URL"}{" "}
                      *
                    </Label>
                    <Input
                      id="video_url"
                      name="video_url"
                      value={formData.video_url}
                      onChange={(e) =>
                        handleInputChange("video_url", e.target.value)
                      }
                      placeholder={
                        formData.media_type === "video"
                          ? "https://example.com/video.mp4"
                          : "https://example.com/animation.json"
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.media_type === "video"
                        ? "MP4 format recommended for best compatibility"
                        : "Lottie JSON format for animations"}
                    </p>
                  </div>
                )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_url">Target URL</Label>
                  <Input
                    id="target_url"
                    name="target_url"
                    value={formData.target_url}
                    onChange={(e) =>
                      handleInputChange("target_url", e.target.value)
                    }
                    placeholder="/deals/black-friday"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button_text">Button Text</Label>
                  <Input
                    id="button_text"
                    name="button_text"
                    value={formData.button_text}
                    onChange={(e) =>
                      handleInputChange("button_text", e.target.value)
                    }
                    placeholder="Shop Now"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (1-10)</Label>
                  <Input
                    id="priority"
                    name="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) =>
                      handleInputChange(
                        "priority",
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Banner Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="informational">
                        Informational
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Video/Animation Settings */}
              {(formData.media_type === "video" ||
                formData.media_type === "animation") && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoplay"
                        checked={formData.autoplay}
                        onCheckedChange={(checked) =>
                          handleInputChange("autoplay", checked)
                        }
                      />
                      <Label htmlFor="autoplay" className="text-sm">
                        Autoplay
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="muted"
                        checked={formData.muted}
                        onCheckedChange={(checked) =>
                          handleInputChange("muted", checked)
                        }
                      />
                      <Label htmlFor="muted" className="text-sm">
                        Muted
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="loop"
                        checked={formData.loop}
                        onCheckedChange={(checked) =>
                          handleInputChange("loop", checked)
                        }
                      />
                      <Label htmlFor="loop" className="text-sm">
                        Loop
                      </Label>
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button_color">Button Color</Label>
                  <Input
                    id="button_color"
                    name="button_color"
                    type="color"
                    value={formData.button_color}
                    onChange={(e) =>
                      handleInputChange("button_color", e.target.value)
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text_color">Text Color</Label>
                  <Input
                    id="text_color"
                    name="text_color"
                    type="color"
                    value={formData.text_color}
                    onChange={(e) =>
                      handleInputChange("text_color", e.target.value)
                    }
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) =>
                      handleInputChange("start_date", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) =>
                      handleInputChange("end_date", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingBanner
                      ? "Update Banner"
                      : "Create Banner"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onEdit={handleEditBanner}
                onDelete={handleDeleteBanner}
              />
            ))}
          </div>

          {banners.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Megaphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Banners Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first banner to start promoting campaigns and
                  announcements.
                </p>
                <Button
                  onClick={handleCreateBanner}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Banner
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default AdminBannerManager;
