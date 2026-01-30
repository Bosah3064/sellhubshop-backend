import { useLocation, useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Download,
  Star,
  Shield,
  CreditCard,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Smartphone,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import logo from "../assets/logo.png";

// Define the BeforeInstallPromptEvent type
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Auto-scroll to top when route changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [location.pathname]);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const checkIfInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstallable(false);
      }
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", () => {
      setInstallPrompt(null);
      setIsInstallable(false);
    });

    checkIfInstalled();

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      console.log("Subscribing email:", email);
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  // Enhanced navigation handler
  const handleNavigation = (href: string) => {
    // If it's an external link, open in new tab
    if (href.startsWith("http")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    // If we're already on the target page, scroll to top
    if (href === location.pathname) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      // Navigate to new page - will trigger the useEffect to scroll to top
      navigate(href);
    }
  };

  // Handle PWA installation
  const handleInstallPWA = async () => {
    if (!installPrompt) {
      showManualInstallInstructions();
      return;
    }

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("✅ User accepted the install prompt");
      } else {
        console.log("❌ User dismissed the install prompt");
      }

      setInstallPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("💥 Error during installation:", error);
      showManualInstallInstructions();
    }
  };

  const showManualInstallInstructions = () => {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-md w-full">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-lg text-gray-900">Install SellHubShop</h3>
            <p class="text-gray-600 text-sm">Follow these steps to install our app</p>
          </div>
        </div>
        
        <div class="space-y-4 text-sm">
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
            <div>
              <strong class="text-gray-900">For Android (Chrome):</strong>
              <p class="text-gray-600 mt-1">Tap <span class="font-mono bg-gray-100 px-1 rounded">⋮</span> → "Add to Home screen"</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
            <div>
              <strong class="text-gray-900">For iPhone (Safari):</strong>
              <p class="text-gray-600 mt-1">Tap <span class="font-mono bg-gray-100 px-1 rounded">⎙</span> → "Add to Home Screen"</p>
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex gap-3">
          <button id="close-modal" class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            Got it!
          </button>
          <button onclick="window.open('/?ref=install-help', '_blank')" class="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
            Open Help
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal || (e.target as Element).id === "close-modal") {
        document.body.removeChild(modal);
      }
    });
  };

  const currentYear = new Date().getFullYear();

  // UPDATED: Correct footer sections based on your actual pages
  const footerSections = [
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Blog", href: "/blog" },
        { name: "Contact", href: "/contact" },
        { name: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Marketplace",
      links: [
        { name: "Browse Products", href: "/marketplace" },
        { name: "Discover", href: "/discover" },
        { name: "Search", href: "/search" },
        { name: "Compare", href: "/compare" },
      ],
    },
    {
      title: "Sell on SellHub",
      links: [
        { name: "Start Selling", href: "/products/upload" },
        { name: "Seller Dashboard", href: "/dashboard" },
        { name: "Analytics", href: "/analytics" },
        { name: "Referrals", href: "/referrals" },
      ],
    },
    {
      title: "Trending",
      links: [
        { name: "All Products", href: "/marketplace" },
        { name: "iPhones for Sale", href: "/marketplace?search=iphone" },
        { name: "Laptops Kenya", href: "/marketplace?search=laptop" },
        { name: "Shoes in Nairobi", href: "/marketplace?search=shoes" },
        { name: "Furniture Deals", href: "/marketplace?search=furniture" },
        { name: "Gaming Consoles", href: "/marketplace?search=gaming" },
      ],
    },
    {
      title: "Account",
      links: [
        { name: "My Profile", href: "/profile" },
        { name: "Dashboard", href: "/dashboard" },
        { name: "Wishlist", href: "/wishlist" },
        { name: "Messages", href: "/messages" },
        { name: "Reviews", href: "/reviews" },
        { name: "Settings", href: "/settings" },
        { name: "Notifications", href: "/notifications" },
        { name: "Help Center", href: "/help-center" },
      ],
    },
  ];

  const socialLinks = [
    {
      name: "Facebook",
      href: "https://facebook.com/sellhubshop",
      icon: Facebook,
      color: "hover:bg-blue-600 hover:text-white",
    },
    {
      name: "Twitter",
      href: "https://twitter.com/sellhubshop",
      icon: Twitter,
      color: "hover:bg-blue-400 hover:text-white",
    },
    {
      name: "Instagram",
      href: "https://instagram.com/sellhubshop",
      icon: Instagram,
      color: "hover:bg-pink-600 hover:text-white",
    },
    {
      name: "LinkedIn",
      href: "https://linkedin.com/company/sellhubshop",
      icon: Linkedin,
      color: "hover:bg-blue-700 hover:text-white",
    },
    {
      name: "YouTube",
      href: "https://youtube.com/sellhubshop",
      icon: Youtube,
      color: "hover:bg-red-600 hover:text-white",
    },
  ];

  const paymentMethods = [
    { name: "M-Pesa", icon: "📱" },
    { name: "Visa", icon: "💳" },
    { name: "MasterCard", icon: "💳" },
    { name: "Airtel Money", icon: "📱" },
  ];

  // UPDATED: Correct legal links based on your actual pages
  const legalLinks = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookie-policy" },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="SellHubShop Logo"
                className="w-12 h-12 rounded-xl shadow-lg ring-2 ring-primary/20 hover:scale-105 transition-transform duration-300"
              />
              <div>
                <span className="text-2xl font-bold text-green-600">
                  SellHubShop
                </span>
                <p className="text-sm text-gray-600">
                  Kenya's Trusted Marketplace
                </p>
              </div>
            </div>

            <p className="text-gray-600 max-w-md leading-relaxed">
              Connecting millions of buyers and sellers across Kenya. Your
              trusted partner for safe, secure, and seamless online shopping
              experiences since 2020.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-medium">100% Secure Payments</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Star className="h-5 w-5 text-green-600" />
                <span className="font-medium">4.8/5 Customer Rating</span>
              </div>
            </div>
          </div>

          {/* Newsletter & PWA Section */}
          <div className="space-y-6">
            {/* Newsletter Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                Stay in the Loop
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Get exclusive deals, new product alerts, and shopping tips
                delivered to your inbox.
              </p>

              {isSubscribed ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">
                      Welcome to our community! Check your email to confirm.
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-lg"
                      required
                    />
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 transition-colors duration-200"
                    >
                      Subscribe
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    By subscribing, you agree to our Privacy Policy
                  </p>
                </form>
              )}
            </div>

            {/* PWA Install Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Download className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Get the App</h4>
                  <p className="text-gray-600 text-sm">
                    {isInstallable
                      ? "One-click install to your phone"
                      : "Install on your phone for quick access"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleInstallPWA}
                  className={`w-full rounded-xl p-4 h-auto transition-all duration-200 hover:shadow-lg ${isInstallable
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                    : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
                    }`}
                >
                  <div className="flex items-center gap-3 w-full justify-center">
                    <Smartphone className="h-5 w-5" />
                    <div className="text-left">
                      <div className="text-xs font-medium">
                        {isInstallable ? "Click to Install" : "Install"}
                      </div>
                      <div className="text-sm font-bold">SellHubShop App</div>
                    </div>
                  </div>
                </Button>

                {isInstallable && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg p-2 justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Ready to install! One click away 🚀</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  <QrCode className="h-4 w-4 text-green-600" />
                  <span>
                    Works on Android & iPhone - No app store required!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Links Grid - Mobile optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {footerSections.map((section) => (
            <div key={section.title} className="mb-2 sm:mb-0">
              <h4 className={`font-semibold text-gray-900 mb-3 sm:mb-4 text-sm ${section.title === "Trending" ? "text-primary animate-neon-pop" : ""}`}>
                {section.title}
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => handleNavigation(link.href)}
                      className="text-gray-600 hover:text-green-600 text-sm transition-all duration-200 block hover:translate-x-1 transform hover:font-medium text-left w-full"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">
              Contact Us
            </h4>
            <div className="space-y-3 text-sm text-gray-600">
              <button
                onClick={() =>
                  window.open("mailto:support@sellhub.co.ke", "_self")
                }
                className="flex items-center gap-2 hover:text-green-600 transition-colors duration-200 w-full text-left"
              >
                <Mail className="h-4 w-4 text-green-600" />
                <span className="hover:underline">support@sellhub.co.ke</span>
              </button>
              <button
                onClick={() => window.open("tel:+254700123456", "_self")}
                className="flex items-center gap-2 hover:text-green-600 transition-colors duration-200 w-full text-left"
              >
                <Phone className="h-4 w-4 text-green-600" />
                <span className="hover:underline">+254 116 892 532</span>
              </button>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6">
              <h5 className="font-semibold text-gray-900 mb-3 text-sm">
                Follow Us
              </h5>
              <div className="flex gap-2">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <button
                      key={social.name}
                      onClick={() => handleNavigation(social.href)}
                      className={`w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center transition-all duration-200 hover:scale-110 transform ${social.color} cursor-pointer`}
                      aria-label={social.name}
                    >
                      <IconComponent className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-6 sm:pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 sm:gap-6">
            {/* Copyright */}
            <div className="text-center lg:text-left">
              <p className="text-gray-600 text-sm">
                &copy; {currentYear} SellHubShop Kenya. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Building Kenya's digital marketplace ecosystem.
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600 justify-center">
              {legalLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavigation(link.href)}
                  className="hover:text-green-600 transition-colors duration-200 font-medium"
                >
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <span className="text-sm text-gray-600 font-medium">
                Accepted Payment Methods:
              </span>
              <div className="flex flex-wrap gap-3 justify-center">
                {paymentMethods.map((method) => (
                  <div
                    key={method.name}
                    className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 hover:border-green-500 hover:text-green-600 transition-all duration-200"
                  >
                    <span>{method.icon}</span>
                    <span>{method.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
