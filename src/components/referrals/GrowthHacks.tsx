import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Rocket,
    MessageCircle,
    Globe,
    Users,
    Zap,
    ExternalLink,
    Copy,
    Check,
    Flame
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface GrowthHacksProps {
    referralCode: string;
}

export const GrowthHacks = ({ referralCode }: GrowthHacksProps) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('trending');
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

    // Dynamic "Trending" content based on day of week
    const getDailyTrend = () => {
        const day = new Date().getDay();
        const trends = [
            { tag: 'Sunday Special', desc: 'Weekend Shopping Spree' },
            { tag: 'Monday Motivation', desc: 'Start the Week Earning' },
            { tag: 'Tech Tuesday', desc: 'Gadget Deals & Reviews' },
            { tag: 'Winning Wednesday', desc: 'Mid-week Boost' },
            { tag: 'Throwback Thursday', desc: 'Flash Sale Hype' },
            { tag: 'Flash Friday', desc: 'Weekend Ready Deals' },
            { tag: 'Super Saturday', desc: 'Ultimate Shopping Day' },
        ];
        return trends[day];
    };

    const dailyTrend = getDailyTrend();

    const hacks = [
        {
            id: 'trending-now',
            title: `🔥 Trending: ${dailyTrend.tag}`,
            icon: Flame,
            color: 'bg-orange-100 text-orange-600',
            difficulty: 'Easy',
            potential: 'Viral',
            description: `Specific strategy for ${dailyTrend.desc}. High conversion potential today!`,
            action: 'Copy Trending Post',
            content: `🔥 ${dailyTrend.tag} Alert! \nfound the best deals for ${dailyTrend.desc} on SellHubShop. \n👇 Check them out here:\n${referralLink}`
        },
        {
            id: 'whatsapp-status',
            title: 'The "WhatsApp Status" Method',
            icon: MessageCircle,
            color: 'bg-green-100 text-green-600',
            difficulty: 'Easy',
            potential: 'High',
            description: 'Don\'t just post the link! Post a "Result" image (like your earnings) first, then the link in the next status.',
            action: 'Copy Catchy Caption',
            content: '😱 I just found a way to earn KES 500 per invite! DM me for the link or check my next status! 👇'
        },
        {
            id: 'bio-link',
            title: 'The "Link-in-Bio" Strategy',
            icon: Globe,
            color: 'bg-purple-100 text-purple-600',
            difficulty: 'Medium',
            potential: 'Very High',
            description: 'Add your link to your Instagram/TikTok bio. Create a curiosity-driven video pointing to it.',
            action: 'Copy Bio Text',
            content: '🇰🇪  Buy & Sell Online | Earn Rewards 🎁 \n👇 Join & Get KES 500 Bonus:\n' + referralLink
        },
        {
            id: 'groups',
            title: 'Local Facebook Groups',
            icon: Users,
            color: 'bg-blue-100 text-blue-600',
            difficulty: 'Medium',
            potential: 'Massive',
            description: 'Join local "Buy and Sell" groups in Nairobi/Mombasa. Don\'t spam! Post a genuine review of a product you found.',
            action: 'Copy Review Script',
            content: 'Guys, I finally found a reliable place to sell my electronics. Sold my phone in 2 days here. Highly recommend! 👉 ' + referralLink
        },
        {
            id: 'scarcity',
            title: 'The "Scarcity" Text',
            icon: Zap,
            color: 'bg-yellow-100 text-yellow-700',
            difficulty: 'Easy',
            potential: 'High',
            description: 'Send this to 5 close friends. It creates urgency.',
            action: 'Copy Message',
            content: 'Hey! I have 3 invites left for the Gold tier on SellHubShop. You get instant verification. Want one? Use this code: ' + referralCode
        }
    ];


    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        toast.success('Strategy copied to clipboard!');
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Header Card */}
            <Card className="col-span-1 md:col-span-2 p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none shadow-xl rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                            <Rocket className="w-8 h-8 text-yellow-300 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">Growth Hacks & Hidden Ports</h3>
                            <p className="text-indigo-100">Untapped strategies to make your link trend 🚀</p>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-6">
                        <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                            <p className="text-xs text-indigo-200 uppercase tracking-wider">Potential Reach</p>
                            <p className="text-xl font-bold">10k+ Users</p>
                        </div>
                        <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                            <p className="text-xs text-indigo-200 uppercase tracking-wider">Difficulty</p>
                            <p className="text-xl font-bold">Beginner</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Strategy Cards */}
            {hacks.map((hack) => (
                <Card key={hack.id} className="p-6 hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-indigo-500 group">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${hack.color} group-hover:scale-110 transition-transform`}>
                            <hack.icon className="w-6 h-6" />
                        </div>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            <Flame className="w-3 h-3 mr-1 text-orange-500" />
                            {hack.potential}
                        </Badge>
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                        {hack.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {hack.description}
                    </p>

                    <Button
                        variant="outline"
                        className="w-full justify-between group-hover:border-indigo-200 group-hover:bg-indigo-50"
                        onClick={() => handleCopy(hack.id, hack.content)}
                    >
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 group-hover:text-indigo-600">
                            {copied === hack.id ? 'Copied!' : hack.action}
                        </span>
                        {copied === hack.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                        )}
                    </Button>
                </Card>
            ))}

            {/* Pro Tip Card */}
            <Card className="col-span-1 md:col-span-2 p-6 bg-slate-900 text-white border-none rounded-3xl">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold mb-1">Professional "Pro" Tip</h4>
                        <p className="text-slate-400 text-sm">
                            Use the <strong>Banner Generator</strong> to create a custom image, then post it on your
                            WhatsApp Status with the caption from "Strategy #1". Visuals + Curiosity = 2x Clicks.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};
