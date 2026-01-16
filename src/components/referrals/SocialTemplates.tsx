import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Copy,
    Check,
    Download,
    Instagram,
    Facebook,
    Twitter,
    Linkedin,
    Mail,
    MessageCircle,
    Sparkles,
    Flame,
    Zap
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
            name: '🔥 Trending Now',
            icon: Flame,
            color: 'bg-orange-500',
            content: `${dynamic.hook} 🚀\n\nI've been using SellHubShop to earn extra KES on the side. It's legit and pays fast! 💰\n\nUse my code ${referralCode} for a welcoming bonus!\n\n👇 Start here:\n${referralLink}`
        },
        {
            id: 'instagram',
            name: 'Instagram',
            icon: Instagram,
            color: 'bg-pink-600',
            content: `Found this amazing marketplace! 🛍️✨\n\nBuy & Sell securely on SellHubShop. \nUse my code: ${referralCode}\n\n#sellhub #kenya #marketplace #deals #nairobi`
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            icon: MessageCircle,
            color: 'bg-green-500',
            content: `Hey! 👋 Check out this new app I'm using to buy and sell stuff. \n\nYou get rewards for joining! Use my code *${referralCode}* when you sign up.\n\nLink: ${referralLink}`
        },
        {
            id: 'twitter',
            name: 'Twitter / X',
            icon: Twitter,
            color: 'bg-black',
            content: `Finally found a marketplace that actually works! 🚀\n\nSecure payments & verified sellers. \n\nSign up with code ${referralCode} for a bonus! 👇\n${referralLink}`
        },
        {
            id: 'facebook',
            name: 'Facebook',
            icon: Facebook,
            color: 'bg-blue-600',
            content: `Friends & Family! 📣\n\nIf you're looking to buy or sell anything online, I highly recommend SellHubShop.\n\nIt's super secure and easy to use. Use my referral link to join and we both get rewards! 🎁\n\nTarget Code: ${referralCode}\n${referralLink}`
        }
    ];

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        toast.success('Template copied!');
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <Card className="p-6 bg-white border-none shadow-none">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                        Viral Content Library
                    </h3>
                    <p className="text-gray-600">Fresh templates updated daily for maximum engagement</p>
                </div>
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    LIVE TRENDS
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <Card
                        key={template.id}
                        className={`p-5 hover:shadow-xl transition-all duration-300 border-2 ${template.id === 'trending' ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg text-white ${template.color}`}>
                                <template.icon className="w-5 h-5" />
                            </div>
                            {template.id === 'trending' && (
                                <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                                    TOP PICK
                                </span>
                            )}
                        </div>

                        <h4 className="font-bold text-gray-900 mb-2">{template.name}</h4>

                        <div className="bg-white p-3 rounded-xl border border-gray-100 h-32 mb-4 overflow-y-auto text-sm text-gray-600 font-medium">
                            {template.content}
                        </div>

                        <Button
                            className={`w-full ${template.id === 'trending'
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                                }`}
                            onClick={() => handleCopy(template.content, template.id)}
                        >
                            {copied === template.id ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Template
                                </>
                            )}
                        </Button>
                    </Card>
                ))}
            </div>
        </Card>
    );
};
