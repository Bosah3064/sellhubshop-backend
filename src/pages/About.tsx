import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Users,
  Shield,
  TrendingUp,
  Globe,
  Award,
  Heart,
  MapPin,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

export default function About() {
  const stats = [
    { number: "50,000+", label: "Active Users" },
    { number: "200,000+", label: "Products Listed" },
    { number: "4.8/5", label: "Customer Rating" },
    { number: "47", label: "Counties Covered" },
  ];

  const values = [
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Verified sellers and secure transactions for peace of mind",
    },
    {
      icon: Users,
      title: "Community First",
      description: "Building connections between Kenyan buyers and sellers",
    },
    {
      icon: TrendingUp,
      title: "Growth Focused",
      description: "Empowering small businesses and individual entrepreneurs",
    },
    {
      icon: Globe,
      title: "Nationwide Reach",
      description: "Connecting buyers and sellers across all 47 counties",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-0 px-4 py-2">
            About SellHubShop
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            Kenya's Trusted Marketplace
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            Connecting millions of buyers and sellers across Kenya since 2020.
            Your trusted partner for safe, secure, and seamless online shopping
            experiences.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-16 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="text-center p-6 border-0 shadow-lg bg-white"
            >
              <CardContent className="p-0">
                <div className="text-2xl md:text-3xl font-bold text-green-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Our Story */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              Our Story
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Founded in 2020, SellHubShop emerged from a simple vision: to
                create a trusted online marketplace that empowers Kenyan
                entrepreneurs and makes shopping accessible to everyone.
              </p>
              <p>
                We recognized the need for a platform that combines the
                convenience of online shopping with the trust and personal
                connection of traditional Kenyan markets.
              </p>
              <p>
                Today, we're proud to be Kenya's fastest-growing marketplace,
                connecting thousands of sellers with millions of buyers across
                the country.
              </p>
            </div>

            <div className="mt-8 flex gap-4">
              <Link to="/contact">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  Get In Touch
                </Button>
              </Link>
              <Link to="/careers">
                <Button size="lg" variant="outline">
                  Join Our Team
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
              alt="Kenyan marketplace"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-green-600" />
                <div>
                  <div className="font-bold text-gray-900">
                    Trusted by Kenyans
                  </div>
                  <div className="text-sm text-gray-600">Since 2020</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do at SellHubShop
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center">
                    <value.icon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of Kenyans who are already buying and selling on
            SellHubShop
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                Start Selling
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
