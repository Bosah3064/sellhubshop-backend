import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Search, TrendingUp, Clock, Sparkles, Zap, Globe, ArrowRight, Flame } from "lucide-react";
import { PiLogo, PiIcon } from "@/components/PiLogo";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
  authorImage?: string;
}

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const blogPosts: BlogPost[] = [
    // Pi Network Posts - TRENDING
    {
      id: "pi-1",
      title: "Pi Network: The Future of Cryptocurrency Payments in Kenya",
      excerpt: "Discover how Pi Network is revolutionizing digital payments in Africa. Learn about its potential value and why millions are mining Pi daily.",
      author: "Pi Network Kenya",
      date: "2026-01-15",
      category: "Pi Network",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1632&q=80",
      readTime: "8 min read",
      authorImage: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=80&q=80"
    },
    {
      id: "pi-2",
      title: "How to Accept Pi Payments in Your Business",
      excerpt: "A complete guide to integrating Pi Network payments into your marketplace listings. Get ready for the mainnet launch with these essential steps.",
      author: "SellHubShop Team",
      date: "2026-01-14",
      category: "Pi Network",
      image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      readTime: "6 min read",
      authorImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=80&q=80"
    },
    {
      id: "pi-3",
      title: "Pi Network Price Predictions 2026: Expert Analysis",
      excerpt: "What experts are saying about Pi's potential value after Open Mainnet. Understand the factors that could drive Pi's adoption and price.",
      author: "Crypto Analyst KE",
      date: "2026-01-12",
      category: "Pi Network",
      image: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      readTime: "10 min read",
      authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
    },
    // Original Posts
    {
      id: "1",
      title: "10 Tips for Successful Online Selling in Kenya",
      excerpt: "Learn the best strategies to increase your sales and grow your online business in the Kenyan marketplace with practical, locally-tested methods.",
      author: "Sarah Mwangi",
      date: "2025-01-10",
      category: "Selling Tips",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      readTime: "5 min read",
      authorImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
    },
    {
      id: "2",
      title: "How to Price Your Products Competitively",
      excerpt: "Master the art of pricing to attract buyers while maintaining healthy profit margins in the competitive Kenyan market.",
      author: "John Kamau",
      date: "2025-01-08",
      category: "Business",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1415&q=80",
      readTime: "7 min read",
      authorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    },
    {
      id: "3",
      title: "Building Trust with Buyers: A Complete Guide",
      excerpt: "Discover proven methods to establish credibility and build lasting relationships with your customers in East Africa.",
      author: "Grace Njeri",
      date: "2025-01-05",
      category: "Customer Service",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      readTime: "6 min read",
      authorImage: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=689&q=80"
    },
    {
      id: "4",
      title: "Photography Tips for Product Listings",
      excerpt: "Take stunning product photos that sell. Learn lighting, angles, and editing techniques using just your smartphone.",
      author: "Peter Omondi",
      date: "2025-01-03",
      category: "Marketing",
      image: "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      readTime: "8 min read",
      authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
    },
    {
      id: "5",
      title: "Using Social Media to Boost Your Sales",
      excerpt: "Leverage Facebook, Instagram, and WhatsApp to reach more customers and increase conversions across Kenya.",
      author: "Mary Wanjiku",
      date: "2025-01-01",
      category: "Marketing",
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80",
      readTime: "10 min read",
      authorImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80"
    },
    {
      id: "6",
      title: "Understanding M-Pesa Payments for Sellers",
      excerpt: "Everything you need to know about accepting mobile money payments securely from your customers in Kenya.",
      author: "David Otieno",
      date: "2024-12-28",
      category: "Payments",
      image: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      readTime: "5 min read",
      authorImage: "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1476&q=80"
    },
  ];

  const categories = ["All", "Pi Network", "Selling Tips", "Business", "Marketing", "Customer Service", "Payments"];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const otherPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Original Light Theme */}
      <div className="bg-gradient-to-r from-primary via-pink-500 to-primary/80 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            <Flame className="w-3 h-3 mr-1" />
            New Pi Network Insights
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">SellHub Insights</h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Expert tips, Pi Network news, and guides for successful online selling in Kenya
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 md:w-6 md:h-6" />
              <Input
                type="text"
                placeholder="Search articles, authors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-4 md:py-6 text-base md:text-lg text-gray-900 bg-white/95 border-0 focus-visible:ring-2 focus-visible:ring-white/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Pi Network Trending Section */}
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl p-6 md:p-8 border border-purple-200 mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="bg-purple-200 p-2.5 rounded-xl">
              <PiIcon className="w-6 h-6 fill-purple-700" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Trending: Pi Network
              </h2>
              <p className="text-sm text-purple-700">The future of crypto payments in Kenya</p>
            </div>
            <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-300">
              <Zap className="w-3 h-3 mr-1" /> HOT
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {blogPosts.filter(p => p.category === "Pi Network").slice(0, 3).map((post) => (
              <Card key={post.id} className="bg-white border-purple-200 hover:border-purple-400 transition-all duration-300 group cursor-pointer overflow-hidden shadow-sm hover:shadow-md">
                <div className="relative h-32 overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-4">
                  <h3 className="text-gray-900 font-semibold text-sm line-clamp-2 group-hover:text-purple-700 transition-colors">{post.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        {/* Categories */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-12 justify-center">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={`cursor-pointer px-4 py-2 text-sm md:text-base transition-colors hover:bg-primary/10 ${category === "Pi Network" && selectedCategory === category ? "bg-purple-600" : ""
                }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === "Pi Network" && <PiIcon className="w-3 h-3 mr-1.5 fill-current" />}
              {category}
            </Badge>
          ))}
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Card className="mb-12 overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="relative overflow-hidden">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-64 lg:h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="text-sm bg-white/95 text-gray-900 hover:bg-white">
                    {featuredPost.category}
                  </Badge>
                </div>
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center bg-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 leading-tight">
                  {featuredPost.title}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 md:gap-6 text-sm md:text-base text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      <img
                        src={featuredPost.authorImage}
                        alt={featuredPost.author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-medium">{featuredPost.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(featuredPost.date).toLocaleDateString('en-KE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
                <Button size="lg" className="w-fit px-8 bg-primary hover:bg-primary/90">
                  Read Full Article
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {otherPosts.map((post) => (
            <Card
              key={post.id}
              className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/20 group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 left-3">
                  <Badge className="text-xs bg-white/95 text-gray-900 border-0">
                    {post.category}
                  </Badge>
                </div>
              </div>
              <div className="p-5 md:p-6 bg-white">
                <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <img
                        src={post.authorImage}
                        alt={post.author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-colors">
                  Read More
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search terms or browse different categories to find what you're looking for.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}