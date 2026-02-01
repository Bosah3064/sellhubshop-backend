import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, Phone, BookOpen } from "lucide-react";

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      id: "buying",
      name: "Buying Guide",
      description: "Learn how to find and contact sellers",
      color: "text-blue-600 bg-blue-100",
    },
    {
      id: "selling",
      name: "Selling Guide",
      description: "Tips for successful product listings",
      color: "text-green-600 bg-green-100",
    },
    {
      id: "safety",
      name: "Safety Tips",
      description: "Stay safe while meeting sellers",
      color: "text-red-600 bg-red-100",
    },
  ];

  const popularArticles = [
    {
      title: "How to Contact Sellers Safely",
      category: "safety",
      readTime: "3 min read",
    },
    {
      title: "Creating Effective Product Listings",
      category: "selling",
      readTime: "5 min read",
    },
    {
      title: "Verifying Seller Profiles",
      category: "buying",
      readTime: "4 min read",
    },
    {
      title: "Safe Meeting Places for Transactions",
      category: "safety",
      readTime: "4 min read",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-0 px-4 py-2">
            Help & Support
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            How can we help?
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
            Find answers to common questions or get in touch with our support
            team
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg text-gray-900 dark:text-gray-100 bg-white/95 dark:bg-slate-800/95 border-0 focus-visible:ring-2 focus-visible:ring-white/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer dark:bg-slate-900 dark:border dark:border-slate-800"
            >
              <CardContent className="p-6 text-center">
                <div
                  className={`w-12 h-12 mx-auto mb-4 ${category.color} dark:bg-opacity-20 rounded-xl flex items-center justify-center`}
                >
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{category.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Popular Help Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {popularArticles.map((article, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-slate-900 dark:border dark:border-slate-800"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="text-xs dark:text-gray-300 dark:border-slate-700">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 hover:text-green-600 cursor-pointer transition-colors">
                    {article.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-500/10"
                  >
                    Read Article →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
