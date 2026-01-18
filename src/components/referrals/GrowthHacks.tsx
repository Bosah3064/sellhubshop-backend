import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Rocket,
    MessageCircle,
    Globe,
    Users,
    Zap,
    Copy,
    Check,
    Flame,
    Target,
    TrendingUp,
    Star,
    ArrowRight,
    Lightbulb,
    Video,
    Share2
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface GrowthHacksProps {
    referralCode: string;
}

export const GrowthHacks = ({ referralCode }: GrowthHacksProps) => {
    const [copied, setCopied] = useState<string | null>(null);
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

    // Dynamic "Trending" content based on day of week
    const getDailyTrend = () => {
        const day = new Date().getDay();
        const trends = [
            { tag: 'Sunday Special', desc: 'Weekend Shopping Spree', emoji: '🛍️' },
            { tag: 'Monday Motivation', desc: 'Start the Week Earning', emoji: '💪' },
            { tag: 'Tech Tuesday', desc: 'Gadget Deals & Reviews', emoji: '📱' },
            { tag: 'Winning Wednesday', desc: 'Mid-week Boost', emoji: '🏆' },
            { tag: 'Throwback Thursday', desc: 'Flash Sale Hype', emoji: '⚡' },
            { tag: 'Flash Friday', desc: 'Weekend Ready Deals', emoji: '🎉' },
            { tag: 'Super Saturday', desc: 'Ultimate Shopping Day', emoji: '🔥' },
        ];
        return trends[day];
    };

    const dailyTrend = getDailyTrend();

    const hacks = [
        {
            id: 'trending-now',
            title: `${dailyTrend.emoji} Trending: ${dailyTrend.tag}`,
            icon: Flame,
            color: 'from-orange-500 to-red-500',
            bgColor: 'from-orange-50 to-red-50',
            borderColor: 'border-orange-300',
            difficulty: 'Easy',
            difficultyColor: 'bg-green-100 text-green-700',
            potential: 'Viral',
            potentialColor: 'bg-red-100 text-red-700',
            timeRequired: '2 min',
            description: `Perfect timing! ${dailyTrend.desc} posts are getting 3x more engagement today. Use this proven template.`,
            action: 'Copy Post',
            content: `🔥 ${dailyTrend.tag} Alert! \nFound the best deals for ${dailyTrend.desc} on SellHubShop. \n👇 Check them out here:\n${referralLink}`
        },
        {
            id: 'whatsapp-status',
            title: 'The "Status Mystery" Method',
            icon: MessageCircle,
            color: 'from-green-500 to-green-600',
            bgColor: 'from-green-50 to-emerald-50',
            borderColor: 'border-green-300',
            difficulty: 'Easy',
            difficultyColor: 'bg-green-100 text-green-700',
            potential: 'Very High',
            potentialColor: 'bg-purple-100 text-purple-700',
            timeRequired: '5 min',
            description: 'Post a curiosity-driven status first (like your earnings screenshot), then reveal the link in the next status.',
            action: 'Copy Caption',
            content: '😱 I just found a way to earn KES 500 per invite! DM me for the link or check my next status! 👇'
        },
        {
            id: 'bio-link',
            title: 'The "Link-in-Bio" Strategy',
            icon: Globe,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'from-purple-50 to-pink-50',
            borderColor: 'border-purple-300',
            difficulty: 'Medium',
            difficultyColor: 'bg-yellow-100 text-yellow-700',
            potential: 'Massive',
            potentialColor: 'bg-red-100 text-red-700',
            timeRequired: '10 min',
            description: 'Add your link to Instagram/TikTok bio. Create a curiosity-driven video pointing to it. Works 24/7!',
            action: 'Copy Bio',
            content: '🇰🇪  Buy & Sell Online | Earn Rewards 🎁 \n👇 Join & Get KES 500 Bonus:\n' + referralLink
        },
        {
            id: 'groups',
            title: 'Local Facebook Groups',
            icon: Users,
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'from-blue-50 to-indigo-50',
            borderColor: 'border-blue-300',
            difficulty: 'Medium',
            difficultyColor: 'bg-yellow-100 text-yellow-700',
            potential: 'Massive',
            potentialColor: 'bg-red-100 text-red-700',
            timeRequired: '15 min',
            description: 'Join local "Buy and Sell" groups. Post a genuine review of a product - don\'t spam! This builds trust.',
            action: 'Copy Review',
            content: 'Guys, I finally found a reliable place to sell my electronics. Sold my phone in 2 days here. Highly recommend! 👉 ' + referralLink
        },
        {
            id: 'scarcity',
            title: 'The "VIP Invite" Text',
            icon: Zap,
            color: 'from-yellow-500 to-amber-500',
            bgColor: 'from-yellow-50 to-amber-50',
            borderColor: 'border-yellow-300',
            difficulty: 'Easy',
            difficultyColor: 'bg-green-100 text-green-700',
            potential: 'High',
            potentialColor: 'bg-purple-100 text-purple-700',
            timeRequired: '1 min',
            description: 'Send to 5 close friends. Scarcity + exclusivity = immediate action. Works every time!',
            action: 'Copy Message',
            content: 'Hey! I have 3 invites left for the Gold tier on SellHubShop. You get instant verification. Want one? Use this code: ' + referralCode
        },
        {
            id: 'video-content',
            title: 'Quick Video Review',
            icon: Video,
            color: 'from-pink-500 to-rose-500',
            bgColor: 'from-pink-50 to-rose-50',
            borderColor: 'border-pink-300',
            difficulty: 'Medium',
            difficultyColor: 'bg-yellow-100 text-yellow-700',
            potential: 'Very High',
            potentialColor: 'bg-purple-100 text-purple-700',
            timeRequired: '20 min',
            description: 'Record a quick 30-second video showing how you use the app. Authentic content converts 5x better than text!',
            action: 'Copy Script',
            content: `Hey! Quick review of SellHubShop - been using it to [buy/sell] and it's amazing. Use code ${referralCode} to get started with rewards! Link in bio.`
        },
    ];

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        toast.success('🚀 Strategy copied! Go make it viral!');
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-indigo-50/30 border-2 border-indigo-100 rounded-2xl sm:rounded-3xl shadow-lg">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 sm:p-8 rounded-xl sm:rounded-3xl relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 sm:w-48 h-24 sm:h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <div className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl w-fit">
                                <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold">Growth Hacks & Strategies</h3>
                                <p className="text-indigo-100 text-sm sm:text-base">Proven methods to maximize your referrals</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                                <p className="text-[10px] sm:text-xs text-indigo-200 uppercase tracking-wider">Potential</p>
                                <p className="text-lg sm:text-2xl font-bold">10K+</p>
                                <p className="text-[10px] sm:text-xs text-indigo-200">Reach</p>
                            </div>
                            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                                <p className="text-[10px] sm:text-xs text-indigo-200 uppercase tracking-wider">Difficulty</p>
                                <p className="text-lg sm:text-2xl font-bold">Easy</p>
                                <p className="text-[10px] sm:text-xs text-indigo-200">Beginner</p>
                            </div>
                            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                                <p className="text-[10px] sm:text-xs text-indigo-200 uppercase tracking-wider">Time</p>
                                <p className="text-lg sm:text-2xl font-bold">5-20</p>
                                <p className="text-[10px] sm:text-xs text-indigo-200">Minutes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategy Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {hacks.map((hack) => {
                    const Icon = hack.icon;
                    return (
                        <Card
                            key={hack.id}
                            className={`p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 ${hack.borderColor} bg-gradient-to-br ${hack.bgColor} rounded-xl sm:rounded-2xl group`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-white bg-gradient-to-br ${hack.color} shadow-lg group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge className={`${hack.potentialColor} text-[10px] sm:text-xs px-2 py-0.5`}>
                                        <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                        {hack.potential}
                                    </Badge>
                                    <span className="text-[10px] text-gray-500">{hack.timeRequired}</span>
                                </div>
                            </div>

                            {/* Title */}
                            <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors leading-tight">
                                {hack.title}
                            </h4>

                            {/* Difficulty Badge */}
                            <div className="flex items-center gap-2 mb-3">
                                <Badge className={`${hack.difficultyColor} text-[10px] sm:text-xs px-2 py-0.5`}>
                                    <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                                    {hack.difficulty}
                                </Badge>
                            </div>

                            {/* Description */}
                            <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3">
                                {hack.description}
                            </p>

                            {/* Action Button */}
                            <Button
                                variant="outline"
                                className={`w-full h-10 sm:h-11 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${copied === hack.id
                                        ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                                        : 'border-2 hover:border-indigo-300 hover:bg-indigo-50'
                                    }`}
                                onClick={() => handleCopy(hack.id, hack.content)}
                            >
                                {copied === hack.id ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        {hack.action}
                                    </>
                                )}
                            </Button>
                        </Card>
                    );
                })}
            </div>

            {/* Pro Tips Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Pro Tip Card */}
                <Card className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none rounded-xl sm:rounded-2xl">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-2.5 bg-yellow-500/20 rounded-xl text-yellow-400 flex-shrink-0">
                            <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                            <h4 className="text-base sm:text-lg font-bold mb-2">💎 Ultimate Pro Tip</h4>
                            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                                Use the <strong className="text-yellow-400">Banner Generator</strong> to create a custom image, then post it on your
                                WhatsApp Status with a trending caption. <strong className="text-white">Visuals + Curiosity = 3x More Clicks!</strong>
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Quick Action Card */}
                <Card className="p-4 sm:p-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none rounded-xl sm:rounded-2xl">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-2.5 bg-white/20 rounded-xl flex-shrink-0">
                            <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-base sm:text-lg font-bold mb-2">🚀 Quick Start Challenge</h4>
                            <p className="text-green-100 text-xs sm:text-sm mb-3">
                                Share your first post in the next 5 minutes! The sooner you start, the faster you earn.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Badge className="bg-white/20 text-white border-white/30 text-[10px] sm:text-xs">
                                    <Star className="w-3 h-3 mr-1 fill-yellow-300 text-yellow-300" />
                                    Goal: 3 invites today
                                </Badge>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </Card>
    );
};
