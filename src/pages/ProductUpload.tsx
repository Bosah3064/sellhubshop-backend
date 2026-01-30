import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Upload,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Shield,
  Clock,
  Star,
  Camera,
  Image as ImageIcon,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  Search,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import kenyanLocations from "@/data/kenyan-locations.json";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  properties: any;
  subcategories?: Category[];
}

interface UserProfile {
  plan_type?: string;
}

interface FormData {
  name: string;
  price: string;
  originalPrice: string;
  category: string;
  subcategory: string;
  description: string;
  brand: string;
  condition: string;
  county: string;
  location: string;
  phone: string;
  whatsapp: string;
  email: string;
  negotiable: boolean;
  featured: boolean;
  properties: Record<string, string>;
}

interface PropertyConfig {
  type: string;
  label: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

interface County {
  id: string;
  name: string;
  locations: string[];
}

interface LocationData {
  counties: County[];
}

export default function ProductUpload() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [imageSizes, setImageSizes] = useState<number[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    category: true,
    properties: false,
    contact: false,
  });

  // Location search states
  const [searchCounty, setSearchCounty] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState("");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    price: "",
    originalPrice: "",
    category: "",
    subcategory: "",
    description: "",
    brand: "",
    condition: "New",
    county: "",
    location: "",
    phone: "",
    whatsapp: "",
    email: "",
    negotiable: true,
    featured: false,
    properties: {},
  });

  useEffect(() => {
    document.title = "Upload Product – Add your listing";
    loadCurrentUser();
    loadCategoriesFromDatabase();
  }, []);

  // AI Listing Strength Calculation
  const calculateListingStrength = () => {
    let score = 0;
    const { name, description, price, category, subcategory, county, location, properties } = formData;
    
    // Title strength (max 20)
    if (name.length >= 10) score += 10;
    if (name.length >= 25) score += 5;
    if (name.length >= 40) score += 5;
    
    // Description richness (max 30)
    if (description.length >= 50) score += 10;
    if (description.length >= 200) score += 10;
    if (description.length >= 500) score += 10;
    
    // Visual impact (max 30)
    if (images.length >= 1) score += 10;
    if (images.length >= 3) score += 10;
    if (images.length >= 6) score += 10;
    
    // Metadata completeness (max 20)
    if (price && parseFloat(price) > 0) score += 5;
    if (category && subcategory) score += 5;
    if (county && location) score += 5;
    if (Object.keys(properties).length >= 2) score += 5;
    
    return Math.min(score, 100);
  };

  const listingStrength = calculateListingStrength();

  const getStrengthColor = (score: number) => {
    if (score < 40) return "bg-red-500";
    if (score < 70) return "bg-amber-500";
    return "bg-green-600";
  };

  const getStrengthText = (score: number) => {
    if (score < 40) return "Weak Listing";
    if (score < 70) return "Good Listing";
    return "Excellent Listing!";
  };

  const enhanceDescription = () => {
    const categoryName = getCurrentCategory()?.name || "";
    if (!formData.name) {
      toast({
        title: "Add a title first",
        description: "We need a product title to enhance your description.",
        variant: "destructive"
      });
      return;
    }

    let enhanced = "";
    const name = formData.name;
    const condition = formData.condition;

    // AI logic: select template based on category
    if (categoryName.toLowerCase().includes("phone") || categoryName.toLowerCase().includes("electronics")) {
      enhanced = `Check out this amazing ${name}! In ${condition} condition, this device offers top-tier performance and reliability. \n\nKey features:\n- High-resolution display\n- Long-lasting battery life\n- Premium build quality\n\nIt's been well-maintained and works perfectly. Great value for anyone looking for a quality ${categoryName}. Contact me for more details!`;
    } else if (categoryName.toLowerCase().includes("car") || categoryName.toLowerCase().includes("vehicles")) {
      enhanced = `Up for sale is a stunning ${name}. This ${condition} vehicle is a perfect blend of style, comfort, and efficiency. \n\nHighlights:\n- Smooth handling and great performance\n- Clean interior and exterior\n- Low maintenance and reliable\n\nA fantastic choice for daily commuting or weekend drives. Priced to sell fast!`;
    } else {
      enhanced = `Experience the best of ${name}. This ${condition} item is perfect for anyone looking for quality and value. Features include modern design, durability, and excellent ${categoryName} performance. \n\nReady for immediate use. Don't miss out on this amazing deal!`;
    }
    
    setFormData(prev => ({ ...prev, description: enhanced }));
    toast({
      title: "✨ AI Description Generated!",
      description: `Optimized for ${categoryName || 'general'} sales.`,
    });
  };

  // Load current user
  const loadCurrentUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to upload products",
      });
      navigate("/login");
    }
  };

  // Load categories from database
  const loadCategoriesFromDatabase = async () => {
    try {
      setLoadingCategories(true);
      const { data: categoriesData, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;

      console.log("Loaded categories:", categoriesData);

      // Build category hierarchy
      const parentCategories =
        categoriesData?.filter((cat) => !cat.parent_id) || [];
      const categoriesWithSubs = await Promise.all(
        parentCategories.map(async (parent) => {
          const { data: subcategories } = await supabase
            .from("categories")
            .select("*")
            .eq("parent_id", parent.id)
            .order("name");

          return {
            ...parent,
            subcategories: subcategories || [],
          };
        })
      );

      setCategories(categoriesWithSubs);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        variant: "destructive",
        title: "Error loading categories",
        description: "Please try again later",
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  // Filter counties based on search
  const filteredCounties = (kenyanLocations as LocationData).counties.filter(
    (county) =>
      county.name.toLowerCase().includes(searchCounty.toLowerCase()) ||
      county.locations.some((loc) =>
        loc.toLowerCase().includes(searchCounty.toLowerCase())
      )
  );

  // Get locations for selected county
  const getLocationsForCounty = (countyId: string): string[] => {
    const county = (kenyanLocations as LocationData).counties.find(
      (c) => c.id === countyId
    );
    return county?.locations || [];
  };

  // Filter locations based on search
  const filteredLocations = getLocationsForCounty(formData.county).filter(
    (location) => location.toLowerCase().includes(searchLocation.toLowerCase())
  );

  // Get selected county name
  const getSelectedCountyName = () => {
    const county = (kenyanLocations as LocationData).counties.find(
      (c) => c.id === formData.county
    );
    return county?.name || "";
  };

  // Image Compression Function
  const compressImage = async (
    file: File,
    maxWidth = 1200,
    quality = 0.8
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob conversion failed"));
              return;
            }

            // Create new file with compressed image
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            console.log(
              `✅ Compressed: ${file.name} | Original: ${(
                file.size /
                1024 /
                1024
              ).toFixed(2)}MB → Compressed: ${(blob.size / 1024 / 1024).toFixed(
                2
              )}MB`
            );
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Convert to WebP for better compression
  const convertToWebP = async (file: File, quality = 0.75): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("WebP conversion failed"));
              return;
            }

            const webpFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".webp"),
              {
                type: "image/webp",
                lastModified: Date.now(),
              }
            );

            console.log(
              `🔄 Converted to WebP: ${(webpFile.size / 1024 / 1024).toFixed(
                2
              )}MB`
            );
            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () =>
        reject(new Error("Failed to load image for WebP conversion"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image upload with optimization
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).slice(0, 10 - images.length);

    toast({
      title: "🔄 Optimizing images...",
      description: "Compressing images for faster upload",
    });

    for (const file of newImages) {
      try {
        // Check file size first
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Image too large",
            description: "Maximum file size is 10MB",
            variant: "destructive",
          });
          continue;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: "Please upload image files only",
            variant: "destructive",
          });
          continue;
        }

        let optimizedFile = file;

        // Only compress if file is larger than 1MB
        if (file.size > 1 * 1024 * 1024) {
          optimizedFile = await compressImage(file, 1200, 0.8);

          // Convert to WebP for additional savings (optional)
          if (optimizedFile.size > 500 * 1024) {
            optimizedFile = await convertToWebP(optimizedFile, 0.75);
          }
        }

        setImages((prev) => [...prev, optimizedFile]);
        setImageSizes((prev) => [...prev, optimizedFile.size]);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImagePreviews((prev) => [...prev, e.target.result as string]);
          }
        };
        reader.readAsDataURL(optimizedFile);
      } catch (error) {
        console.error("Error optimizing image:", error);
        toast({
          title: "Image processing failed",
          description: "Using original image instead",
          variant: "destructive",
        });

        // Fallback to original file
        setImages((prev) => [...prev, file]);
        setImageSizes((prev) => [...prev, file.size]);

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImagePreviews((prev) => [...prev, e.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    toast({
      title: "✅ Images optimized",
      description: `Added ${newImages.length} image(s)`,
    });
  };

  // Calculate total size savings
  const getSizeSavings = () => {
    if (imageSizes.length === 0)
      return { original: 0, compressed: 0, savings: 0 };

    const original = images.reduce((sum, img, index) => {
      return (
        sum + (img.size > imageSizes[index] ? img.size : imageSizes[index])
      );
    }, 0);

    const compressed = imageSizes.reduce((sum, size) => sum + size, 0);
    const savings = original - compressed;

    return {
      original: original / 1024 / 1024,
      compressed: compressed / 1024 / 1024,
      savings: savings / 1024 / 1024,
    };
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageSizes((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload optimized images to storage
  const uploadImagesToStorage = async (
    productId: string
  ): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      const fileExt = image.name.split(".").pop() || "jpg";
      const fileName = `${productId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      console.log(
        `📤 Uploading: ${image.name} (${(image.size / 1024 / 1024).toFixed(
          2
        )}MB)`
      );

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, image, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
      console.log(`✅ Uploaded: ${publicUrl}`);
    }

    return uploadedUrls;
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category: categoryId,
      subcategory: "",
      properties: {},
      brand: "",
      condition: "New",
    }));
    setCustomInputs({});
    setExpandedSections((prev) => ({ ...prev, properties: true }));
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    const subcategory = getCurrentSubcategory();
    console.log("Selected subcategory:", subcategory);
    console.log("Subcategory properties:", subcategory?.properties);

    setFormData((prev) => ({
      ...prev,
      subcategory: subcategoryId,
      properties: {},
      brand: "",
      condition: "New",
    }));
    setCustomInputs({});
  };

  const handlePropertyChange = (property: string, value: string) => {
    console.log("Property changed:", property, value);

    setFormData((prev) => ({
      ...prev,
      properties: {
        ...prev.properties,
        [property]: value,
      },
    }));

    // Show custom input if "Other" or similar is selected
    if (
      value.toLowerCase().includes("custom") ||
      value.toLowerCase().includes("other")
    ) {
      setCustomInputs((prev) => ({
        ...prev,
        [property]: "",
      }));
    } else {
      setCustomInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[property];
        return newInputs;
      });
    }
  };

  const handleCustomInputChange = (property: string, value: string) => {
    setCustomInputs((prev) => ({
      ...prev,
      [property]: value,
    }));

    setFormData((prev) => ({
      ...prev,
      properties: {
        ...prev.properties,
        [property]: value,
      },
    }));
  };

  // Get current category and its properties
  const getCurrentCategory = () => {
    return categories.find((cat) => cat.id === formData.category);
  };

  const getCurrentSubcategory = () => {
    const category = getCurrentCategory();
    return category?.subcategories?.find(
      (sub) => sub.id === formData.subcategory
    );
  };

  // FIXED: Better property extraction with multiple format support
  const getCurrentProperties = (): Record<string, PropertyConfig> => {
    const subcategory = getCurrentSubcategory();
    console.log("Getting properties for subcategory:", subcategory);
    console.log("Subcategory properties raw:", subcategory?.properties);

    if (!subcategory?.properties) return {};

    // Handle different property structure formats
    const properties = subcategory.properties;

    // Format 1: Direct properties object
    if (properties.fields && typeof properties.fields === "object") {
      return properties.fields;
    }

    // Format 2: Properties is already the fields object
    if (typeof properties === "object" && !Array.isArray(properties)) {
      // Check if it has any property config-like structure
      const firstKey = Object.keys(properties)[0];
      if (
        firstKey &&
        properties[firstKey] &&
        typeof properties[firstKey] === "object"
      ) {
        return properties;
      }
    }

    // Format 3: JSON string that needs parsing
    if (typeof properties === "string") {
      try {
        const parsed = JSON.parse(properties);
        return parsed.fields || parsed;
      } catch (e) {
        console.error("Error parsing properties JSON:", e);
      }
    }

    return {};
  };

  const getRequiredFields = (): string[] => {
    const subcategory = getCurrentSubcategory();
    if (!subcategory?.properties) return [];

    const properties = subcategory.properties;

    // Handle different formats for required fields
    if (properties.required && Array.isArray(properties.required)) {
      return properties.required;
    }

    if (properties.fields && properties.fields.required) {
      return properties.fields.required;
    }

    return [];
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof expandedSections],
    }));
  };

  const validateForm = () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload products",
        variant: "destructive",
      });
      return false;
    }

    if (images.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one product image",
        variant: "destructive",
      });
      return false;
    }

    if (
      !formData.name ||
      !formData.price ||
      !formData.category ||
      !formData.subcategory ||
      !formData.county ||
      !formData.location
    ) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }

    // Validate required properties from category
    const requiredFields = getRequiredFields();
    const missingProperties = requiredFields.filter(
      (field) =>
        !formData.properties[field] || formData.properties[field].trim() === ""
    );

    if (missingProperties.length > 0) {
      const propertyLabels = missingProperties.map((field) => {
        const properties = getCurrentProperties();
        return properties[field]?.label || field;
      });

      toast({
        title: "Missing specifications",
        description: `Please fill in: ${propertyLabels.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setUploading(true);

    try {
      // Check plan limits
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("plan_type")
        .eq("id", currentUser.id)
        .single();

      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUser.id);

      const planType = (userProfile as UserProfile)?.plan_type?.toLowerCase() || "free";
      const planLimit =
        planType === "free" || planType === "starter"
          ? 5
          : planType === "silver" || planType === "professional"
            ? 50
            : planType === "gold" || planType === "enterprise"
              ? Infinity
              : Infinity;

      if (productCount && productCount >= planLimit) {
        toast({
          title: "Product limit reached",
          description: `Upgrade your plan to add more products (${productCount}/${planLimit} used)`,
          variant: "destructive",
        });
        navigate("/pricing");
        return;
      }

      // Get category and subcategory names for display
      const category = getCurrentCategory();
      const subcategory = getCurrentSubcategory();

      console.log("Creating product with:", {
        categoryId: formData.category,
        subcategoryId: formData.subcategory,
        categoryName: category?.name,
        subcategoryName: subcategory?.name,
      });

      // Create product with proper data structure including owner_id
      const productData = {
        user_id: currentUser.id,
        owner_id: currentUser.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category,
        category: category?.name,
        subcategory_id: formData.subcategory,
        subcategory: subcategory?.name,
        brand: formData.brand || null,
        condition: formData.condition,
        county: formData.county,
        location: formData.location,
        phone: formData.phone,
        whatsapp: formData.whatsapp || null,
        email: formData.email,
        original_price: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : null,
        featured: formData.featured,
        is_negotiable: formData.negotiable,
        properties: {
          ...formData.properties,
          ...customInputs,
        },
        status: "pending",
        images: [] as string[],
      };

      console.log("Final product data:", productData);

      // First create the product
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert([productData])
        .select()
        .single();

      if (productError) {
        console.error("Product creation error details:", productError);
        throw new Error(`Failed to create product: ${productError.message}`);
      }

      console.log("Product created successfully:", product);

      // Upload images if there are any
      if (images.length > 0 && product) {
        try {
          const imageUrls = await uploadImagesToStorage(product.id);
          console.log("Images uploaded:", imageUrls);

          // Update product with image URLs
          const { error: updateError } = await supabase
            .from("products")
            .update({ images: imageUrls })
            .eq("id", product.id);

          if (updateError) {
            console.error("Error updating product images:", updateError);
            throw new Error(
              `Failed to update product with images: ${updateError.message}`
            );
          }
        } catch (imageError) {
          console.error("Image upload error:", imageError);
          // Continue without images if upload fails
          toast({
            title: "Images upload failed",
            description: "Product created but images failed to upload",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "🎉 Product submitted for review!",
        description:
          "Your listing is pending admin approval and will be visible soon.",
      });

      navigate(`/dashboard`);
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);

      let errorMessage =
        "There was an error uploading your product. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const properties = getCurrentProperties();
  const requiredFields = getRequiredFields();
  const hasBrandProperty = properties && "brand" in properties;
  const sizeInfo = getSizeSavings();

  console.log("Current properties:", properties);
  console.log("Required fields:", requiredFields);
  console.log("Has brand property:", hasBrandProperty);

  // Get condition options from properties or use default
  const conditionOptions = properties?.condition?.options || [
    "New",
    "Used - Like New",
    "Used - Good",
    "Used - Fair",
    "Refurbished",
    "For Parts",
  ];

  if (loadingCategories) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-lg text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Sell Your Item
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Reach thousands of buyers. Fill in the details below to create your
            professional listing.
          </p>
        </header>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {["Basic", "Category", "Details", "Contact"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${index === 0
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
                    }`}
                >
                  {index + 1}
                </div>
                <span className="ml-2 text-sm font-medium">{step}</span>
                {index < 3 && <div className="w-12 h-1 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <Card className="mb-6 shadow-lg border-0">
            <CardHeader
              className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg"
              onClick={() => toggleSection("basic")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-white">
                  <Camera className="h-6 w-6" />
                  Product Images & Details
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-400">
                    {images.length}/10 photos
                  </Badge>
                  {expandedSections.basic ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.basic && (
              <CardContent className="p-6 space-y-6">
                {/* Image Upload Section with Optimization Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">
                      Product Photos *
                    </Label>
                    {images.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">
                          Saved {sizeInfo.savings.toFixed(2)}MB
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Add clear photos from different angles. Images are
                    automatically optimized for faster upload.
                    {images.length > 0 && (
                      <span className="block mt-1 text-green-600">
                        ✅ Images optimized: {sizeInfo.compressed.toFixed(2)}MB
                        total
                      </span>
                    )}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {imagePreviews.map((preview, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-200 shadow-md group"
                      >
                        <img
                          src={preview}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {i === 0 && (
                          <Badge className="absolute top-2 left-2 bg-blue-600">
                            Main
                          </Badge>
                        )}
                        {/* Show image size badge */}
                        <Badge
                          variant="secondary"
                          className="absolute bottom-2 right-2 text-xs bg-black bg-opacity-70 text-white"
                        >
                          {(imageSizes[i] / 1024 / 1024).toFixed(1)}MB
                        </Badge>
                      </div>
                    ))}

                    {images.length < 10 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center transition-all hover:bg-blue-50 group">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Camera className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-medium text-blue-600">
                          Add Photos
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          Max 10MB each
                          <br />
                          <span className="text-green-600">Auto-optimized</span>
                        </p>
                      </label>
                    )}
                  </div>

                  {/* Listing Strength Meter */}
                  <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-bold text-gray-700">Listing Strength</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${getStrengthColor(listingStrength)} shadow-sm`}>
                        {listingStrength}% - {getStrengthText(listingStrength)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out ${getStrengthColor(listingStrength)} shadow-[0_0_10px_rgba(34,197,94,0.3)]`}
                        style={{ width: `${listingStrength}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-gray-500 italic">
                      High-strength listings reach 3x more buyers. Add more photos and details to improve!
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-semibold">
                      Product Title *
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. iPhone 13 Pro Max 256GB - Like New Condition"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="price" className="text-base font-semibold">
                      Price (KES) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="15000"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="originalPrice"
                      className="text-base font-semibold"
                    >
                      Original Price (Optional)
                    </Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      placeholder="20000"
                      value={formData.originalPrice}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          originalPrice: e.target.value,
                        }))
                      }
                      className="h-12 text-base"
                    />
                  </div>

                  {/* Professional Location Section */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location *
                    </Label>
                    <div className="space-y-4">
                      {/* County Selector */}
                      <div className="space-y-2">
                        <Label htmlFor="county" className="text-sm font-medium">
                          County
                        </Label>
                        <Select
                          value={formData.county}
                          onValueChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              county: value,
                              location: "", // Reset location when county changes
                            }));
                            setShowCustomLocation(false);
                            setCustomLocation("");
                            setSearchLocation("");
                          }}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Search or select county" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Search input inside dropdown */}
                            <div className="p-2 border-b">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search counties..."
                                  value={searchCounty}
                                  onChange={(e) =>
                                    setSearchCounty(e.target.value)
                                  }
                                  className="h-9 pl-8"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>

                            {filteredCounties.map((county) => (
                              <SelectItem
                                key={county.id}
                                value={county.id}
                                className="text-base"
                              >
                                {county.name}
                              </SelectItem>
                            ))}

                            {filteredCounties.length === 0 && (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                No counties found
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Location Selector */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="location"
                          className="text-sm font-medium"
                        >
                          Specific Area/Neighborhood
                        </Label>

                        {!showCustomLocation ? (
                          <div className="space-y-2">
                            <Select
                              value={formData.location}
                              onValueChange={(value) => {
                                if (value === "custom") {
                                  setShowCustomLocation(true);
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    location: value,
                                  }));
                                }
                              }}
                              disabled={!formData.county}
                            >
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue
                                  placeholder={
                                    formData.county
                                      ? "Search or select location"
                                      : "Select county first"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Search input inside dropdown */}
                                <div className="p-2 border-b">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search locations..."
                                      value={searchLocation}
                                      onChange={(e) =>
                                        setSearchLocation(e.target.value)
                                      }
                                      className="h-9 pl-8"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>

                                {filteredLocations.map((location) => (
                                  <SelectItem
                                    key={location}
                                    value={location}
                                    className="text-base"
                                  >
                                    {location}
                                  </SelectItem>
                                ))}

                                <SelectItem
                                  value="custom"
                                  className="text-base text-blue-600 font-medium border-t"
                                >
                                  + Add Custom Location
                                </SelectItem>

                                {filteredLocations.length === 0 &&
                                  formData.county && (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                      No locations found
                                    </div>
                                  )}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Enter your specific location..."
                                value={customLocation}
                                onChange={(e) => {
                                  setCustomLocation(e.target.value);
                                  setFormData((prev) => ({
                                    ...prev,
                                    location: e.target.value,
                                  }));
                                }}
                                className="h-12 text-base"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setShowCustomLocation(false);
                                  setCustomLocation("");
                                  setFormData((prev) => ({
                                    ...prev,
                                    location: "",
                                  }));
                                }}
                                className="h-12"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Enter your exact area, estate, or landmark
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Location Display */}
                    {formData.county && formData.location && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-blue-800">
                          <MapPin className="h-4 w-4" />
                          <span>
                            <strong>{formData.location}</strong>,{" "}
                            {getSelectedCountyName()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="description"
                    className="text-base font-semibold flex items-center justify-between"
                  >
                    <span>Description *</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={enhanceDescription}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold gap-1 animate-pulse"
                    >
                      <Sparkles className="h-3 w-3" />
                      AI Enhance
                    </Button>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product in detail... Include features, specifications, reason for selling, and any important details that buyers should know."
                    rows={6}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="text-base resize-none border-2 focus:border-blue-500 rounded-xl"
                    required
                  />
                  <p className="text-sm text-muted-foreground flex justify-between">
                    <span>{formData.description.length}/2000 characters</span>
                    {formData.description.length < 50 && (
                      <span className="text-amber-500 text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Add more details for a better score
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.negotiable}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          negotiable: checked,
                        }))
                      }
                    />
                    <Label className="text-sm font-medium">
                      Price Negotiable
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.featured}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, featured: checked }))
                      }
                    />
                    <Label className="text-sm font-medium">
                      Feature Listing (+KES 500)
                    </Label>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Rest of your existing Category, Properties, and Contact sections remain the same */}
          {/* Category Section */}
          <Card className="mb-6 shadow-lg border-0">
            <CardHeader
              className="cursor-pointer bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg"
              onClick={() => toggleSection("category")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-white">
                  <Tag className="h-6 w-6" />
                  Category & Type
                </CardTitle>
                {expandedSections.category ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CardHeader>
            {expandedSections.category && (
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label
                      htmlFor="category"
                      className="text-base font-semibold"
                    >
                      Main Category *
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                            className="text-base"
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="subcategory"
                      className="text-base font-semibold"
                    >
                      Subcategory *
                    </Label>
                    <Select
                      value={formData.subcategory}
                      onValueChange={handleSubcategoryChange}
                      disabled={!formData.category}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCurrentCategory()?.subcategories?.map(
                          (subcategory) => (
                            <SelectItem
                              key={subcategory.id}
                              value={subcategory.id}
                              className="text-base"
                            >
                              {subcategory.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Only show brand field if subcategory doesn't have brand property */}
                  {!hasBrandProperty && (
                    <div className="space-y-3">
                      <Label
                        htmlFor="brand"
                        className="text-base font-semibold"
                      >
                        Brand (Optional)
                      </Label>
                      <Input
                        id="brand"
                        placeholder="e.g. Apple, Samsung, Toyota"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            brand: e.target.value,
                          }))
                        }
                        className="h-12 text-base"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label
                      htmlFor="condition"
                      className="text-base font-semibold"
                    >
                      Condition
                    </Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, condition: v }))
                      }
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionOptions.map((option) => (
                          <SelectItem
                            key={option}
                            value={option}
                            className="text-base"
                          >
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.category && formData.subcategory && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Selected: {getCurrentCategory()?.name} →{" "}
                      {getCurrentSubcategory()?.name}
                    </h4>
                    <p className="text-sm text-green-700">
                      Please fill in the specific properties for your{" "}
                      {getCurrentSubcategory()?.name?.toLowerCase()} in the next
                      section.
                    </p>
                    {Object.keys(properties).length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-green-600">
                          Required fields:{" "}
                          {requiredFields
                            .map((field) => properties[field]?.label || field)
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Properties Section */}
          {Object.keys(properties).length > 0 && (
            <Card className="mb-6 shadow-lg border-0">
              <CardHeader
                className="cursor-pointer bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg"
                onClick={() => toggleSection("properties")}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-white">
                    <Shield className="h-6 w-6" />
                    Specifications & Properties
                    <Badge variant="secondary" className="ml-2 bg-purple-400">
                      {Object.keys(properties).length} fields
                    </Badge>
                  </CardTitle>
                  {expandedSections.properties ? (
                    <ChevronUp />
                  ) : (
                    <ChevronDown />
                  )}
                </div>
              </CardHeader>
              {expandedSections.properties && (
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {Object.entries(properties).map(([propertyKey, config]) => {
                      const property = config as PropertyConfig;
                      const isRequired = requiredFields.includes(propertyKey);

                      return (
                        <div key={propertyKey} className="space-y-3">
                          <Label
                            htmlFor={`property-${propertyKey}`}
                            className="text-base font-semibold"
                          >
                            {property.label}{" "}
                            {isRequired && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>

                          {property.type === "select" ? (
                            <Select
                              value={formData.properties[propertyKey] || ""}
                              onValueChange={(value) =>
                                handlePropertyChange(propertyKey, value)
                              }
                              required={isRequired}
                            >
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue
                                  placeholder={`Select ${property.label.toLowerCase()}`}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {property.options?.map((option: string) => (
                                  <SelectItem
                                    key={option}
                                    value={option}
                                    className="text-base"
                                  >
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={`property-${propertyKey}`}
                              type={property.type}
                              placeholder={property.placeholder}
                              value={formData.properties[propertyKey] || ""}
                              onChange={(e) =>
                                handlePropertyChange(
                                  propertyKey,
                                  e.target.value
                                )
                              }
                              className="h-12 text-base"
                              required={isRequired}
                            />
                          )}

                          {customInputs[propertyKey] !== undefined && (
                            <div className="mt-2">
                              <Input
                                placeholder={`Specify ${property.label.toLowerCase()}`}
                                value={customInputs[propertyKey]}
                                onChange={(e) =>
                                  handleCustomInputChange(
                                    propertyKey,
                                    e.target.value
                                  )
                                }
                                className="h-12 text-base"
                                required={isRequired}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {Object.keys(formData.properties).length > 0 && (
                    <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-3">
                        Selected Specifications:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(formData.properties).map(
                          ([key, value]) => (
                            <Badge
                              key={key}
                              variant="secondary"
                              className="px-3 py-1 bg-purple-100 text-purple-800 border-purple-300"
                            >
                              <strong>{properties[key]?.label || key}:</strong>{" "}
                              {value}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {/* Contact Information Section */}
          <Card className="mb-6 shadow-lg border-0">
            <CardHeader
              className="cursor-pointer bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg"
              onClick={() => toggleSection("contact")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-white">
                  <Phone className="h-6 w-6" />
                  Contact Information
                </CardTitle>
                {expandedSections.contact ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CardHeader>
            {expandedSections.contact && (
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <Label
                      htmlFor="phone"
                      className="text-base font-semibold flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Phone *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+254712345678"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="whatsapp"
                      className="text-base font-semibold flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="+254712345678"
                      value={formData.whatsapp}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          whatsapp: e.target.value,
                        }))
                      }
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="email"
                      className="text-base font-semibold flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="h-12 text-base"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Privacy & Safety
                  </h4>
                  <p className="text-sm text-orange-700">
                    Your contact information will be visible to potential
                    buyers. We recommend meeting in public places for
                    transactions.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 sticky bottom-4 bg-white p-4 rounded-xl shadow-2xl border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex-1 h-14 text-base font-semibold"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading}
              className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-3" />
                  Publishing Your Listing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Publish Product
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
