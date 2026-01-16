import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronDown,
  ChevronUp,
  Tag,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Shield,
  Star,
  Camera,
  Trash2,
  Save,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";
import kenyanLocations from "@/data/kenyan-locations.json";

// Complete categories data
const completeCategoriesData = {
  Electronics: {
    icon: "📱",
    subcategories: {
      "Mobile Phones": {
        properties: {
          Brand: [
            "Apple",
            "Samsung",
            "Huawei",
            "Tecno",
            "Infinix",
            "Nokia",
            "Oppo",
            "Vivo",
            "Realme",
            "Xiaomi",
            "OnePlus",
            "Google",
            "Itel",
            "Other",
          ],
          Model: ["Custom Input"],
          Storage: ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB"],
          RAM: ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB"],
          "Screen Size": ["4-5 inch", "5-6 inch", "6-7 inch", "7+ inch"],
          Network: ["2G", "3G", "4G", "5G"],
          Condition: [
            "New",
            "Refurbished",
            "Used - Like New",
            "Used - Good",
            "Used - Fair",
            "For Parts",
          ],
        },
      },
      Laptops: {
        properties: {
          Brand: [
            "Apple",
            "Dell",
            "HP",
            "Lenovo",
            "Asus",
            "Acer",
            "Microsoft",
            "Other",
          ],
          Processor: [
            "Intel Core i3",
            "Intel Core i5",
            "Intel Core i7",
            "Intel Core i9",
            "AMD Ryzen 3",
            "AMD Ryzen 5",
            "AMD Ryzen 7",
            "AMD Ryzen 9",
            "Apple M1",
            "Apple M2",
          ],
          RAM: ["4GB", "8GB", "16GB", "32GB", "64GB"],
          Storage: [
            "256GB SSD",
            "512GB SSD",
            "1TB HDD",
            "1TB SSD",
            "2TB HDD",
            "2TB SSD",
          ],
          "Screen Size": ["11-13 inch", "14-15 inch", "16-17 inch", "18+ inch"],
          Condition: ["New", "Refurbished", "Used - Like New", "Used - Good"],
        },
      },
      Tablets: {
        properties: {
          Brand: ["Apple", "Samsung", "Huawei", "Lenovo", "Microsoft", "Other"],
          "Screen Size": ["7-8 inch", "9-10 inch", "11-12 inch", "13+ inch"],
          Storage: ["32GB", "64GB", "128GB", "256GB", "512GB"],
          Connectivity: ["WiFi Only", "WiFi + Cellular"],
          Condition: ["New", "Refurbished", "Used - Like New", "Used - Good"],
        },
      },
      "TVs & Monitors": {
        properties: {
          Type: [
            "Smart TV",
            "LED TV",
            "OLED TV",
            "QLED TV",
            "Curved TV",
            "Computer Monitor",
          ],
          Size: [
            "32 inch",
            "40 inch",
            "43 inch",
            "50 inch",
            "55 inch",
            "65 inch",
            "75 inch",
            "85 inch+",
          ],
          Brand: [
            "Samsung",
            "LG",
            "Sony",
            "TCL",
            "Hisense",
            "Panasonic",
            "Other",
          ],
          Condition: ["New", "Refurbished", "Used - Like New", "Used - Good"],
        },
      },
      "Audio & Headphones": {
        properties: {
          Type: [
            "Headphones",
            "Earphones",
            "Speakers",
            "Soundbars",
            "Home Theater",
          ],
          Brand: ["Apple", "Samsung", "Sony", "JBL", "Bose", "Other"],
          Connectivity: ["Wired", "Wireless", "Bluetooth"],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
      Cameras: {
        properties: {
          Type: [
            "DSLR",
            "Mirrorless",
            "Point & Shoot",
            "Action Camera",
            "Video Camera",
          ],
          Brand: ["Canon", "Nikon", "Sony", "Fujifilm", "GoPro", "Other"],
          Resolution: ["4K", "1080p", "720p", "Other"],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
    },
  },
  Fashion: {
    icon: "👕",
    subcategories: {
      "Men's Clothing": {
        properties: {
          Type: [
            "Shirts",
            "T-Shirts",
            "Trousers",
            "Suits",
            "Jackets",
            "Sweaters",
            "Shorts",
            "Jeans",
            "Underwear",
            "Sportswear",
            "Traditional Wear",
          ],
          Size: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
          Material: [
            "Cotton",
            "Polyester",
            "Wool",
            "Silk",
            "Denim",
            "Linen",
            "Leather",
          ],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
      "Women's Clothing": {
        properties: {
          Type: [
            "Dresses",
            "Blouses",
            "Skirts",
            "Jeans",
            "Jackets",
            "Tops",
            "Jumpsuits",
            "Lingerie",
            "Sportswear",
            "Traditional Wear",
          ],
          Size: ["XS", "S", "M", "L", "XL", "XXL", "Plus Size"],
          Material: [
            "Cotton",
            "Polyester",
            "Wool",
            "Silk",
            "Lace",
            "Denim",
            "Linen",
          ],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
      "Shoes & Footwear": {
        properties: {
          Type: [
            "Sneakers",
            "Boots",
            "Sandals",
            "Formal Shoes",
            "Sports Shoes",
            "Heels",
            "Flats",
            "Loafers",
            "Slippers",
          ],
          Size: [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45",
            "46",
            "47",
          ],
          Gender: ["Men", "Women", "Children", "Unisex"],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
      "Bags & Accessories": {
        properties: {
          Type: [
            "Handbags",
            "Backpacks",
            "Wallets",
            "Belts",
            "Sunglasses",
            "Watches",
            "Jewelry",
          ],
          Material: ["Leather", "Fabric", "Synthetic", "Metal"],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
    },
  },
  "Home & Garden": {
    icon: "🏠",
    subcategories: {
      Furniture: {
        properties: {
          Type: [
            "Sofa",
            "Bed",
            "Table",
            "Chairs",
            "Wardrobe",
            "Cabinet",
            "Shelves",
            "Office Furniture",
          ],
          Material: ["Wood", "Fabric", "Leather", "Metal", "Glass", "Plastic"],
          Condition: ["New", "Used - Like New", "Used - Good", "Used - Fair"],
        },
      },
      "Home Appliances": {
        properties: {
          Type: [
            "Refrigerator",
            "Cooker",
            "Microwave",
            "Blender",
            "Toaster",
            "Coffee Maker",
            "Washing Machine",
            "Vacuum Cleaner",
            "Air Conditioner",
          ],
          Brand: ["Samsung", "LG", "Hisense", "Midea", "Other"],
          Condition: ["New", "Refurbished", "Used - Like New", "Used - Good"],
        },
      },
      "Garden & Outdoor": {
        properties: {
          Type: [
            "Garden Furniture",
            "Plants",
            "Gardening Tools",
            "BBQ Grill",
            "Outdoor Lighting",
            "Swimming Pool",
          ],
          Condition: ["New", "Used - Like New", "Used - Good", "Used - Fair"],
        },
      },
      "Home Decor": {
        properties: {
          Type: [
            "Lighting",
            "Curtains",
            "Rugs",
            "Wall Art",
            "Mirrors",
            "Vases",
            "Clocks",
          ],
          Style: [
            "Modern",
            "Traditional",
            "Minimalist",
            "Vintage",
            "Industrial",
          ],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
    },
  },
  Vehicles: {
    icon: "🚗",
    subcategories: {
      Cars: {
        properties: {
          Make: [
            "Toyota",
            "Honda",
            "Nissan",
            "Mercedes",
            "BMW",
            "Audi",
            "Volkswagen",
            "Ford",
            "Subaru",
            "Mitsubishi",
            "Isuzu",
            "Other",
          ],
          Model: ["Custom Input"],
          Year: Array.from({ length: 30 }, (_, i) =>
            (new Date().getFullYear() - i).toString()
          ),
          Fuel: ["Petrol", "Diesel", "Electric", "Hybrid", "LPG"],
          Transmission: ["Manual", "Automatic"],
          Mileage: [
            "0-10,000 km",
            "10,000-50,000 km",
            "50,000-100,000 km",
            "100,000+ km",
          ],
          "Body Type": [
            "Sedan",
            "SUV",
            "Hatchback",
            "Pickup",
            "Van",
            "Coupe",
            "Convertible",
          ],
        },
      },
      Motorcycles: {
        properties: {
          Type: [
            "Sport",
            "Cruiser",
            "Scooter",
            "Off-road",
            "Touring",
            "Naked",
            "Adventure",
          ],
          "Engine Size": [
            "50-125cc",
            "126-250cc",
            "251-500cc",
            "501-750cc",
            "751cc+",
          ],
          Make: [
            "Honda",
            "Yamaha",
            "Suzuki",
            "Kawasaki",
            "Bajaj",
            "TVS",
            "Other",
          ],
          Year: Array.from({ length: 20 }, (_, i) =>
            (new Date().getFullYear() - i).toString()
          ),
        },
      },
      "Vehicle Parts": {
        properties: {
          Type: [
            "Engine Parts",
            "Wheels & Tires",
            "Electronics",
            "Body Parts",
            "Accessories",
            "Car Audio",
            "Lighting",
          ],
          Compatibility: ["Custom Input"],
          Condition: ["New", "Used - Like New", "Used - Good", "Refurbished"],
        },
      },
      "Boats & Watercraft": {
        properties: {
          Type: [
            "Speedboat",
            "Sailboat",
            "Fishing Boat",
            "Yacht",
            "Jet Ski",
            "Canoe",
          ],
          Length: ["Under 10ft", "10-20ft", "20-30ft", "30-40ft", "40ft+"],
          Condition: ["New", "Used - Like New", "Used - Good", "Used - Fair"],
        },
      },
    },
  },
  Property: {
    icon: "🏢",
    subcategories: {
      "Apartments for Rent": {
        properties: {
          Bedrooms: ["Studio", "1", "2", "3", "4", "5+"],
          Bathrooms: ["1", "2", "3", "4+"],
          Furnishing: ["Furnished", "Unfurnished", "Semi-Furnished"],
          "Location Area": [
            "Westlands",
            "Kilimani",
            "Karen",
            "Lavington",
            "Kileleshwa",
            "Runda",
            "Other",
          ],
          "Rent Period": ["Monthly", "Yearly"],
        },
      },
      "Houses for Sale": {
        properties: {
          Type: ["Bungalow", "Maisonette", "Townhouse", "Villa", "Mansion"],
          Bedrooms: ["1", "2", "3", "4", "5+"],
          Bathrooms: ["1", "2", "3", "4+"],
          Parking: ["1", "2", "3", "4+"],
          "Location Area": ["Custom Input"],
        },
      },
      "Commercial Properties": {
        properties: {
          Type: [
            "Office Space",
            "Retail Space",
            "Warehouse",
            "Hotel",
            "Restaurant",
            "Factory",
          ],
          Size: [
            "Small (<1000 sq ft)",
            "Medium (1000-5000 sq ft)",
            "Large (5000+ sq ft)",
          ],
          Purpose: ["Rent", "Sale", "Lease"],
        },
      },
      "Land & Plots": {
        properties: {
          Type: ["Residential", "Commercial", "Agricultural", "Industrial"],
          Size: ["1/8 Acre", "1/4 Acre", "1/2 Acre", "1 Acre", "2+ Acres"],
          "Location Area": ["Custom Input"],
        },
      },
    },
  },
  Jobs: {
    icon: "💼",
    subcategories: {
      "Full-time Jobs": {
        properties: {
          Industry: [
            "IT & Tech",
            "Healthcare",
            "Education",
            "Finance",
            "Sales & Marketing",
            "Hospitality",
            "Construction",
            "Manufacturing",
            "Other",
          ],
          "Experience Level": [
            "Entry Level",
            "Mid Level",
            "Senior Level",
            "Executive",
          ],
          Education: [
            "High School",
            "Diploma",
            "Bachelor's",
            "Master's",
            "PhD",
          ],
          "Job Type": ["Permanent", "Contract"],
          "Salary Range": ["Custom Input"],
        },
      },
      "Part-time Jobs": {
        properties: {
          Industry: [
            "Retail",
            "Hospitality",
            "Tutoring",
            "Delivery",
            "Customer Service",
            "Other",
          ],
          Schedule: ["Weekends", "Evenings", "Flexible", "Morning"],
          "Salary Type": ["Hourly", "Daily", "Weekly", "Monthly"],
        },
      },
      "Home Services": {
        properties: {
          Type: [
            "Plumbing",
            "Electrical",
            "Cleaning",
            "Painting",
            "Carpentry",
            "Moving",
            "Pest Control",
            "Gardening",
          ],
          "Service Area": ["Custom Input"],
          Experience: ["Beginner", "Intermediate", "Expert"],
        },
      },
      "Professional Services": {
        properties: {
          Type: [
            "Legal",
            "Accounting",
            "Consulting",
            "Design",
            "Writing",
            "Marketing",
            "IT Support",
            "Photography",
          ],
          "Service Area": ["Custom Input"],
          Experience: ["1-3 years", "3-5 years", "5-10 years", "10+ years"],
        },
      },
    },
  },
  Sports: {
    icon: "⚽",
    subcategories: {
      "Sports Equipment": {
        properties: {
          Type: [
            "Gym Equipment",
            "Football",
            "Basketball",
            "Tennis",
            "Golf",
            "Cycling",
            "Running",
            "Swimming",
            "Martial Arts",
            "Cricket",
          ],
          Condition: ["New", "Used - Like New", "Used - Good", "Used - Fair"],
          Brand: ["Custom Input"],
        },
      },
      "Sports Clothing": {
        properties: {
          Type: [
            "Jerseys",
            "Shoes",
            "Shorts",
            "Tops",
            "Jackets",
            "Accessories",
          ],
          Size: ["XS", "S", "M", "L", "XL", "XXL"],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
      "Outdoor & Camping": {
        properties: {
          Type: [
            "Tents",
            "Sleeping Bag",
            "Backpacks",
            "Cooking Gear",
            "Hiking Equipment",
          ],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
    },
  },
  Beauty: {
    icon: "💄",
    subcategories: {
      Skincare: {
        properties: {
          Type: [
            "Moisturizers",
            "Cleansers",
            "Serums",
            "Sunscreen",
            "Face Masks",
            "Toners",
            "Anti-aging",
          ],
          "Skin Type": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
          Brand: ["Custom Input"],
          Condition: ["New", "Unopened", "Used - Slightly"],
        },
      },
      Makeup: {
        properties: {
          Type: [
            "Foundation",
            "Lipstick",
            "Mascara",
            "Eyeshadow",
            "Blush",
            "Concealer",
            "Makeup Brushes",
          ],
          Brand: ["Custom Input"],
          Condition: ["New", "Unopened", "Used - Slightly"],
        },
      },
      "Hair Care": {
        properties: {
          Type: [
            "Shampoo",
            "Conditioner",
            "Hair Oil",
            "Styling Products",
            "Hair Color",
            "Hair Tools",
          ],
          "Hair Type": ["Straight", "Curly", "Wavy", "Coily", "All Types"],
          Brand: ["Custom Input"],
          Condition: ["New", "Unopened", "Used - Slightly"],
        },
      },
      Fragrances: {
        properties: {
          Type: ["Perfume", "Cologne", "Body Spray", "Essential Oils"],
          Size: ["30ml", "50ml", "100ml", "200ml", "Other"],
          Brand: ["Custom Input"],
          Condition: ["New", "Unopened", "Used - Slightly"],
        },
      },
    },
  },
  Books: {
    icon: "📚",
    subcategories: {
      Fiction: {
        properties: {
          Genre: [
            "Romance",
            "Mystery",
            "Science Fiction",
            "Fantasy",
            "Thriller",
            "Historical",
            "Other",
          ],
          Format: ["Paperback", "Hardcover", "E-book"],
          Condition: ["New", "Used - Like New", "Used - Good", "Used - Fair"],
        },
      },
      "Non-Fiction": {
        properties: {
          Category: [
            "Biography",
            "Self-Help",
            "Business",
            "History",
            "Science",
            "Travel",
            "Other",
          ],
          Format: ["Paperback", "Hardcover", "E-book"],
          Condition: ["New", "Used - Like New", "Used - Good", "Used - Fair"],
        },
      },
      "Academic & Textbooks": {
        properties: {
          Subject: [
            "Mathematics",
            "Science",
            "Literature",
            "History",
            "Business",
            "Engineering",
            "Other",
          ],
          Level: ["Primary", "Secondary", "University", "Professional"],
          Condition: ["New", "Used - Like New", "Used - Good", "Used - Fair"],
        },
      },
    },
  },
  Toys: {
    icon: "🧸",
    subcategories: {
      "Children's Toys": {
        properties: {
          Type: [
            "Action Figures",
            "Dolls",
            "Building Blocks",
            "Educational Toys",
            "Stuffed Animals",
            "Vehicles",
          ],
          "Age Group": ["0-2 years", "3-5 years", "6-8 years", "9-12 years"],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
      Games: {
        properties: {
          Type: [
            "Board Games",
            "Video Games",
            "Card Games",
            "Puzzles",
            "Outdoor Games",
          ],
          "Age Group": ["3-5 years", "6-8 years", "9-12 years", "13+ years"],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
    },
  },
  Jewelry: {
    icon: "💎",
    subcategories: {
      "Fine Jewelry": {
        properties: {
          Type: ["Necklaces", "Earrings", "Rings", "Bracelets", "Watches"],
          Material: [
            "Gold",
            "Silver",
            "Platinum",
            "Diamond",
            "Pearl",
            "Gemstone",
          ],
          Condition: ["New", "Used - Like New", "Vintage"],
        },
      },
      "Fashion Jewelry": {
        properties: {
          Type: [
            "Necklaces",
            "Earrings",
            "Rings",
            "Bracelets",
            "Hair Accessories",
          ],
          Material: ["Stainless Steel", "Brass", "Copper", "Beads", "Other"],
          Condition: ["New", "Used - Like New"],
        },
      },
    },
  },
  Health: {
    icon: "🏥",
    subcategories: {
      "Fitness Equipment": {
        properties: {
          Type: [
            "Treadmills",
            "Exercise Bikes",
            "Weights",
            "Yoga Mats",
            "Resistance Bands",
          ],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
      "Medical Supplies": {
        properties: {
          Type: [
            "First Aid",
            "Mobility Aids",
            "Monitoring Devices",
            "Therapy Equipment",
          ],
          Condition: ["New", "Used - Like New", "Sterilized"],
        },
      },
      Supplements: {
        properties: {
          Type: [
            "Vitamins",
            "Protein",
            "Weight Management",
            "Sports Nutrition",
          ],
          "Expiry Date": ["Custom Input"],
          Condition: ["New", "Unopened"],
        },
      },
    },
  },
  Food: {
    icon: "🍕",
    subcategories: {
      "Fresh Produce": {
        properties: {
          Type: [
            "Fruits",
            "Vegetables",
            "Grains",
            "Herbs",
            "Spices",
            "Dairy",
            "Eggs",
          ],
          Quantity: ["Small", "Medium", "Large", "Bulk"],
          Organic: ["Yes", "No"],
        },
      },
      "Processed Foods": {
        properties: {
          Type: [
            "Baked Goods",
            "Canned Foods",
            "Beverages",
            "Snacks",
            "Condiments",
            "Frozen Foods",
          ],
          Packaging: ["Sealed", "Bulk", "Custom"],
          "Expiry Date": ["Custom Input"],
        },
      },
    },
  },
  Pets: {
    icon: "🐕",
    subcategories: {
      "Pets for Sale": {
        properties: {
          Type: ["Dogs", "Cats", "Birds", "Fish", "Reptiles", "Small Animals"],
          Breed: ["Custom Input"],
          Age: ["Young", "Adult", "Senior"],
          Vaccinated: ["Yes", "No"],
        },
      },
      "Pet Supplies": {
        properties: {
          Type: [
            "Food",
            "Toys",
            "Accessories",
            "Grooming",
            "Health Care",
            "Bedding",
            "Cages",
          ],
          "For Animal": [
            "Dogs",
            "Cats",
            "Birds",
            "Fish",
            "Reptiles",
            "Small Animals",
          ],
          Condition: ["New", "Used - Like New"],
        },
      },
    },
  },
  Office: {
    icon: "📁",
    subcategories: {
      "Office Equipment": {
        properties: {
          Type: [
            "Computers",
            "Printers",
            "Photocopiers",
            "Scanners",
            "Projectors",
            "Telephones",
          ],
          Condition: ["New", "Refurbished", "Used - Like New", "Used - Good"],
        },
      },
      "Office Supplies": {
        properties: {
          Type: [
            "Stationery",
            "Furniture",
            "Storage",
            "Organizers",
            "Writing Instruments",
          ],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
    },
  },
  "Art & Crafts": {
    icon: "🎨",
    subcategories: {
      "Art Supplies": {
        properties: {
          Type: [
            "Paints",
            "Brushes",
            "Canvas",
            "Sketchbooks",
            "Clay",
            "Drawing Tools",
          ],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
      "Handmade Crafts": {
        properties: {
          Type: [
            "Jewelry",
            "Pottery",
            "Textiles",
            "Woodwork",
            "Metalwork",
            "Candles",
          ],
          Material: ["Custom Input"],
          Condition: ["New", "Made to Order"],
        },
      },
    },
  },
  Music: {
    icon: "🎵",
    subcategories: {
      Instruments: {
        properties: {
          Type: [
            "Guitar",
            "Piano",
            "Drums",
            "Violin",
            "Keyboard",
            "Saxophone",
            "Trumpet",
          ],
          Condition: [
            "New",
            "Used - Like New",
            "Used - Good",
            "Used - Fair",
            "Vintage",
          ],
        },
      },
      "Music Accessories": {
        properties: {
          Type: [
            "Amplifiers",
            "Cases",
            "Stands",
            "Strings",
            "Sheet Music",
            "Recording Equipment",
          ],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
    },
  },
  "Baby & Kids": {
    icon: "👶",
    subcategories: {
      "Baby Gear": {
        properties: {
          Type: [
            "Strollers",
            "Car Seats",
            "Cribs",
            "High Chairs",
            "Baby Carriers",
            "Playpens",
          ],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
      "Kids Clothing": {
        properties: {
          "Age Group": [
            "0-12 months",
            "1-3 years",
            "4-6 years",
            "7-10 years",
            "11-14 years",
          ],
          Gender: ["Boys", "Girls", "Unisex"],
          Type: ["Tops", "Bottoms", "Dresses", "Outerwear", "School Uniforms"],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
    },
  },
  Travel: {
    icon: "✈️",
    subcategories: {
      Luggage: {
        properties: {
          Type: ["Suitcases", "Backpacks", "Travel Bags", "Carry-ons"],
          Size: ["Small", "Medium", "Large", "Extra Large"],
          Condition: ["New", "Used - Like New", "Used - Good"],
        },
      },
      "Travel Accessories": {
        properties: {
          Type: [
            "Travel Pillows",
            "Toiletry Bags",
            "Passport Holders",
            "Travel Adapters",
            "Luggage Tags",
          ],
          Condition: ["New", "Used - Like New"],
        },
      },
    },
  },
  Industrial: {
    icon: "🏭",
    subcategories: {
      "Tools & Machinery": {
        properties: {
          Type: [
            "Power Tools",
            "Hand Tools",
            "Heavy Machinery",
            "Measuring Tools",
            "Safety Equipment",
          ],
          Condition: ["New", "Used - Like New", "Used - Good", "Used - Fair"],
        },
      },
      "Industrial Equipment": {
        properties: {
          Type: [
            "Generators",
            "Compressors",
            "Welding Machines",
            "Pumps",
            "Forklifts",
          ],
          Condition: ["New", "Used - Like New", "Used - Good", "Used - Fair"],
        },
      },
    },
  },
  Collectibles: {
    icon: "🏆",
    subcategories: {
      "Collectible Items": {
        properties: {
          Type: [
            "Coins",
            "Stamps",
            "Comics",
            "Action Figures",
            "Trading Cards",
            "Memorabilia",
          ],
          Era: ["Modern", "Vintage", "Antique"],
          Condition: ["Mint", "Excellent", "Good", "Fair", "Poor"],
        },
      },
      "Art & Antiques": {
        properties: {
          Type: [
            "Paintings",
            "Sculptures",
            "Furniture",
            "Ceramics",
            "Vintage Items",
          ],
          Era: ["Modern", "Vintage", "Antique"],
          Condition: ["Excellent", "Good", "Fair", "Needs Restoration"],
        },
      },
    },
  },
};

interface ProductFormData {
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

interface ProductData {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  category: string;
  subcategory: string;
  description: string;
  brand: string | null;
  condition: string;
  county: string;
  location: string;
  phone: string;
  whatsapp: string | null;
  email: string;
  is_negotiable: boolean;
  featured: boolean;
  properties: Record<string, string>;
  images: string[];
  user_id: string;
}

interface County {
  id: string;
  name: string;
  locations: string[];
}

interface LocationData {
  counties: County[];
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
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

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: "",
    originalPrice: "",
    category: "",
    subcategory: "",
    description: "",
    brand: "",
    condition: "new",
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
    if (id) {
      loadProduct();
    }
  }, [id]);

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

  const loadProduct = async () => {
    try {
      setLoading(true);

      const { data: productData, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (!productData) {
        toast({
          title: "Product not found",
          description: "The product you're trying to edit doesn't exist.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setProduct(productData as ProductData);

      // Check if current user owns this product
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (productData.user_id !== user?.id) {
        toast({
          title: "Access denied",
          description: "You can only edit your own products.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Populate form with existing data including county
      setFormData({
        name: productData.name || "",
        price: productData.price?.toString() || "",
        originalPrice: productData.original_price?.toString() || "",
        category: productData.category || "",
        subcategory: productData.subcategory || "",
        description: productData.description || "",
        brand: productData.brand || "",
        condition: productData.condition || "new",
        county: productData.county || "",
        location: productData.location || "",
        phone: productData.phone || "",
        whatsapp: productData.whatsapp || "",
        email: productData.email || "",
        negotiable: productData.is_negotiable || true,
        featured: productData.featured || false,
        properties: productData.properties || {},
      });

      // Set existing images
      if (productData.images && Array.isArray(productData.images)) {
        setExistingImages(productData.images);
      }

      // Handle custom inputs for properties
      const properties = productData.properties || {};
      const newCustomInputs: Record<string, string> = {};

      Object.entries(properties).forEach(([key, value]) => {
        if (
          typeof value === "string" &&
          (value.toLowerCase().includes("custom") ||
            value.toLowerCase().includes("other"))
        ) {
          newCustomInputs[key] = value;
        }
      });

      setCustomInputs(newCustomInputs);
    } catch (error: any) {
      console.error("Error loading product:", error);
      toast({
        title: "Error loading product",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).slice(
      0,
      10 - (existingImages.length + images.length)
    );

    newImages.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        return;
      }

      setImages((prev) => [...prev, file]);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreviews((prev) => [...prev, e.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      category,
      subcategory: "",
      properties: {},
      brand: "",
    }));
    setCustomInputs({});
    setExpandedSections((prev) => ({ ...prev, properties: true }));
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setFormData((prev) => ({
      ...prev,
      subcategory,
      properties: {},
      brand: "",
    }));
    setCustomInputs({});
  };

  const handlePropertyChange = (property: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      properties: {
        ...prev.properties,
        [property]: value,
      },
    }));

    if (
      value.toLowerCase().includes("custom") ||
      value.toLowerCase().includes("other")
    ) {
      setCustomInputs((prev) => ({
        ...prev,
        [property]: prev[property] || "",
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

  const getCurrentProperties = () => {
    if (!formData.category || !formData.subcategory) return {};
    const category =
      completeCategoriesData[
        formData.category as keyof typeof completeCategoriesData
      ];
    if (!category) return {};
    return category.subcategories[formData.subcategory]?.properties || {};
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof expandedSections],
    }));
  };

  const uploadImagesToStorage = async (
    productId: string
  ): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${productId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, image);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        description:
          "Please fill in all required fields including county and location",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Upload new images first
      let newImageUrls: string[] = [];
      if (images.length > 0) {
        newImageUrls = await uploadImagesToStorage(id!);
      }

      // Combine existing and new images
      const allImageUrls = [...existingImages, ...newImageUrls];

      // Prepare update data with county field
      const updateData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        subcategory: formData.subcategory,
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
        images: allImageUrls,
        updated_at: new Date().toISOString(),
      };

      // Update product
      const { error: updateError } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "✅ Product updated successfully!",
        description: "Your changes have been saved.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const properties = getCurrentProperties();
  const hasBrandProperty = properties && "Brand" in properties;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading product...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Product
            </h1>
            <div className="w-24"></div> {/* Spacer for balance */}
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Update your product listing. Changes will be visible to buyers
            immediately.
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <Card className="mb-6 shadow-lg border-0">
            <CardHeader
              className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg"
              onClick={() => toggleSection("basic")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-white">
                  <Tag className="h-6 w-6" />
                  Basic Information
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-400">
                    {existingImages.length + images.length}/10 photos
                  </Badge>
                  {expandedSections.basic ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>
            </CardHeader>
            {expandedSections.basic && (
              <CardContent className="p-6 space-y-6">
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">
                    Product Photos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Update your product photos. You can add new ones or remove
                    existing ones.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Existing Images */}
                    {existingImages.map((imageUrl, i) => (
                      <div
                        key={`existing-${i}`}
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-200 shadow-md group"
                      >
                        <img
                          src={imageUrl}
                          alt={`Existing product image ${i + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingImage(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {i === 0 && (
                          <Badge className="absolute top-2 left-2 bg-green-600">
                            Main
                          </Badge>
                        )}
                        <Badge className="absolute top-2 right-2 bg-blue-600 text-xs">
                          Existing
                        </Badge>
                      </div>
                    ))}

                    {/* New Image Previews */}
                    {imagePreviews.map((preview, i) => (
                      <div
                        key={`new-${i}`}
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-200 shadow-md group"
                      >
                        <img
                          src={preview}
                          alt={`New product image ${i + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeNewImage(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge className="absolute top-2 right-2 bg-green-600 text-xs">
                          New
                        </Badge>
                      </div>
                    ))}

                    {/* Upload Button */}
                    {existingImages.length + images.length < 10 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center transition-all hover:bg-blue-50">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Camera className="h-8 w-8 text-blue-500 mb-2" />
                        <p className="text-sm font-medium text-blue-600">
                          Add Photos
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Max 5MB each
                        </p>
                      </label>
                    )}
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

                  {/* Location Section with County/Location Selector */}
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
                    className="text-base font-semibold"
                  >
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your product in detail..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="text-base resize-none"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.description.length}/2000 characters
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
                        {Object.entries(completeCategoriesData).map(
                          ([category, data]) => (
                            <SelectItem
                              key={category}
                              value={category}
                              className="text-base"
                            >
                              <span className="mr-2">{data.icon}</span>
                              {category}
                            </SelectItem>
                          )
                        )}
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
                        {formData.category &&
                          Object.keys(
                            completeCategoriesData[
                              formData.category as keyof typeof completeCategoriesData
                            ]?.subcategories || {}
                          ).map((subcat) => (
                            <SelectItem
                              key={subcat}
                              value={subcat}
                              className="text-base"
                            >
                              {subcat}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Only show brand field if category doesn't have Brand property */}
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
                        <SelectItem value="new">🆕 New</SelectItem>
                        <SelectItem value="used-like-new">
                          ✨ Used - Like New
                        </SelectItem>
                        <SelectItem value="used-good">
                          👍 Used - Good
                        </SelectItem>
                        <SelectItem value="used-fair">
                          ✅ Used - Fair
                        </SelectItem>
                        <SelectItem value="refurbished">
                          🔧 Refurbished
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.category && formData.subcategory && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Selected: {formData.category} → {formData.subcategory}
                    </h4>
                    <p className="text-sm text-green-700">
                      Please update the specific properties for your{" "}
                      {formData.subcategory.toLowerCase()} below.
                    </p>
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
                    {Object.entries(properties).map(([property, options]) => (
                      <div key={property} className="space-y-3">
                        <Label
                          htmlFor={`property-${property}`}
                          className="text-base font-semibold"
                        >
                          {property} {property !== "Brand" ? "*" : ""}
                        </Label>
                        <Select
                          value={formData.properties[property] || ""}
                          onValueChange={(value) =>
                            handlePropertyChange(property, value)
                          }
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue
                              placeholder={`Select ${property.toLowerCase()}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {(options as string[]).map((option: string) => (
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

                        {customInputs[property] !== undefined && (
                          <div className="mt-2">
                            <Input
                              placeholder={`Specify ${property.toLowerCase()}`}
                              value={customInputs[property]}
                              onChange={(e) =>
                                handleCustomInputChange(
                                  property,
                                  e.target.value
                                )
                              }
                              className="h-12 text-base"
                              required={property !== "Brand"}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {Object.keys(formData.properties).length > 0 && (
                    <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-3">
                        Current Specifications:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(formData.properties).map(
                          ([key, value]) => (
                            <Badge
                              key={key}
                              variant="secondary"
                              className="px-3 py-1 bg-purple-100 text-purple-800 border-purple-300"
                            >
                              <strong>{key}:</strong> {value}
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
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              size="lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Updating Product...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Update Product
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
