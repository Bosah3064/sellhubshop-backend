import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Copy,
    Check,
    Instagram,
    Facebook,
    Twitter,
    MessageCircle,
    Sparkles,
    Flame,
    Zap,
    TrendingUp,
    Star,
    Clock,
    Share2
} from 'lucide-react';
import { toast } from 'sonner';

interface SocialTemplatesProps {
    referralCode: string;
    userName?: string;
}

export const SocialTemplates = ({ referralCode, userName }: SocialTemplatesProps) => {
    const [copied, setCopied] = useState<string | null>(null);
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

    // Dynamic Content Generator
    const getDynamicContent = () => {
        const day = new Date().getDay();
        const hours = new Date().getHours();

        // Time-based greeting
        const timeGreeting = hours < 12 ? 'Morning' : hours < 17 ? 'Afternoon' : 'Evening';

        // Day-based hooks
        const hooks = [
            "Running low on cash this Sunday?", // 0
            "Hate Mondays? Change your income stream!", // 1
            "Tech Tuesday Deals you can't miss!", // 2
            "Mid-week slump? Boost your wallet!", // 3
            "Throwback to when I was broke... not anymore!", // 4
            "Friday feeling! Get weekend spending money!", // 5
            "Saturday Shopping Spree!", // 6
        ];

        return {
            hook: hooks[day],
            greeting: timeGreeting
        };
    };

    const dynamic = getDynamicContent();

    const templates = [
        {
            id: 'trending',
            name: '🔥 Today\'s Best',
            platform: 'Trending Now',
            icon: Flame,
            color: 'from-orange-500 to-red-500',
            bgColor: 'from-orange-50 to-red-50',
            borderColor: 'border-orange-200',
            badge: 'TOP PICK',
            engagement: '3.2x more shares',
            content: `${dynamic.hook} 🚀\n\nI've been using SellHubShop to earn extra KES on the side. It's legit and pays fast! 💰\n\nUse my code ${referralCode} for a welcoming bonus!\n\n👇 Start here:\n${referralLink}`
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            platform: 'Status & Groups',
            icon: MessageCircle,
            color: 'from-green-500 to-green-600',
            bgColor: 'from-green-50 to-emerald-50',
            borderColor: 'border-green-200',
            badge: 'VIRAL',
            engagement: '5x more clicks',
            content: `Hey! 👋 Check out this new app I'm using.\n\n🛒 SellHubShop - Buy & Sell Anything\n✅ Secure Payments\n✅ Verified Sellers\n✅ KES Rewards for Joining!\n\nUse my code *${referralCode}*\n\n🔗 ${referralLink}`
        },
        {
            id: 'instagram',
            name: 'Instagram',
            platform: 'Bio & Stories',
            icon: Instagram,
            color: 'from-pink-500 to-purple-600',
            bgColor: 'from-pink-50 to-purple-50',
            borderColor: 'border-pink-200',
            engagement: '2.5x more saves',
            content: `Found this amazing marketplace! 🛍️✨\n\n🔥 SellHubShop Kenya\n💰 earn rewards when friends join\n🛡️ Secure & verified\n\nCode: ${referralCode}\n📱 Link in bio!\n\n#sellhub #kenya #marketplace #deals #nairobi #kenyanbusiness`
        },
        {
            id: 'twitter',
            name: 'Twitter / X',
            platform: 'Thread Starter',
            icon: Twitter,
            color: 'from-gray-800 to-black',
            bgColor: 'from-gray-50 to-slate-50',
            borderColor: 'border-gray-200',
            engagement: '2x more retweets',
            content: `Finally found a marketplace that actually works! 🚀\n\n✓ Secure payments\n✓ Verified sellers\n✓ Real rewards\n\nCode: ${referralCode}\nSign up to get bonus! 👇\n${referralLink}`
        },
        {
            id: 'facebook',
            name: 'Facebook',
            platform: 'Posts & Groups',
            icon: Facebook,
            color: 'from-blue-600 to-blue-700',
            bgColor: 'from-blue-50 to-indigo-50',
            borderColor: 'border-blue-200',
            engagement: '4x more shares',
            content: `Friends & Family! 📣\n\nIf you're looking to buy or sell anything online safely, I highly recommend SellHubShop.\n\n🛡️ Super secure\n💳 Easy payments\n🎁 Rewards program\n\nUse my code: ${referralCode}\n\n👉 ${referralLink}`
        },
        {
            id: 'sms',
            name: 'SMS Text',
            platform: 'Direct Message',
            icon: Share2,
            color: 'from-teal-500 to-cyan-500',
            bgColor: 'from-teal-50 to-cyan-50',
            borderColor: 'border-teal-200',
            engagement: '80% open rate',
            content: `Hi! Quick tip: SellHubShop is a great app to buy/sell stuff online. Use my code ${referralCode} when signing up and we both get rewards! ${referralLink}`
        },
    ];

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        toast.success('🎉 Template copied! Ready to share.');
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-yellow-50/30 border-2 border-yellow-100 rounded-2xl sm:rounded-3xl shadow-lg">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 sm:p-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl sm:rounded-2xl shadow-lg">
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Viral Content Library
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500">
                                Ready-to-post templates for every platform
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Badge className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200 text-[10px] sm:text-xs px-2 sm:px-3 py-1 animate-pulse">
                            <Zap className="w-3 h-3 mr-1" />
                            LIVE TRENDS
                        </Badge>
                        <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 text-[10px] sm:text-xs px-2 sm:px-3 py-1">
                            <Clock className="w-3 h-3 mr-1" />
                            Updated Today
                        </Badge>
                    </div>
                </div>

                {/* Stats Banner */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-gradient-to-r from-gray-900 to-gray-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-white">
                    <div className="text-center">
                        <p className="text-lg sm:text-2xl font-bold">6</p>
                        <p className="text-[10px] sm:text-xs text-gray-300">Templates</p>
                    </div>
                    <div className="text-center border-x border-gray-600">
                        <p className="text-lg sm:text-2xl font-bold text-green-400">↑ 85%</p>
                        <p className="text-[10px] sm:text-xs text-gray-300">Engagement</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg sm:text-2xl font-bold text-yellow-400">⭐ 4.9</p>
                        <p className="text-[10px] sm:text-xs text-gray-300">User Rating</p>
                    </div>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {templates.map((template) => {
                    const Icon = template.icon;
                    return (
                        <Card
                            key={template.id}
                            className={`p-4 sm:p-5 transition-all duration-300 border-2 rounded-xl sm:rounded-2xl hover:shadow-xl hover:scale-[1.02] ${template.borderColor} bg-gradient-to-br ${template.bgColor}`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-white bg-gradient-to-br ${template.color} shadow-lg`}>
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm sm:text-base">{template.name}</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">{template.platform}</p>
                                    </div>
                                </div>
                                {template.badge && (
                                    <span className={`text-[8px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${template.color} text-white shadow`}>
                                        {template.badge}
                                    </span>
                                )}
                            </div>

                            {/* Performance Badge */}
                            <div className="flex items-center gap-1.5 mb-3 text-[10px] sm:text-xs">
                                <TrendingUp className="w-3 h-3 text-green-600" />
                                <span className="text-green-700 font-medium">{template.engagement}</span>
                            </div>

                            {/* Content Preview */}
                            <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-100 h-28 sm:h-32 mb-3 sm:mb-4 overflow-y-auto">
                                <p className="text-xs sm:text-sm text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">
                                    {template.content}
                                </p>
                            </div>

                            {/* Copy Button */}
                            <Button
                                className={`w-full h-10 sm:h-12 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all ${copied === template.id
                                        ? 'bg-green-500 hover:bg-green-600'
                                        : `bg-gradient-to-r ${template.color} hover:opacity-90`
                                    } text-white shadow-lg`}
                                onClick={() => handleCopy(template.content, template.id)}
                            >
                                {copied === template.id ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Copied! ✓
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Template
                                    </>
                                )}
                            </Button>
                        </Card>
                    );
                })}
            </div>

            {/* Pro Tips */}
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl sm:rounded-2xl border border-purple-200">
                <h4 className="font-bold text-purple-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500" />
                    Pro Tips for Maximum Virality
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm">Best Times</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Post 8-10 AM or 7-9 PM</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm">Engage Back</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Reply to all comments</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                            <Share2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm">Cross-Post</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Share on 3+ platforms</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm">Add Stories</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Share personal wins</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
