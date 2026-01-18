import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Download, Sparkles, Check, Star, ShoppingBag, Zap, Gift,
    Crown, TrendingUp, Users, Heart, Package, ArrowRight, Shield, Image as ImageIcon, FileImage
} from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import { toast } from 'sonner';

interface BannerGeneratorProps {
    referralCode: string;
    userName?: string;
}

export const BannerGenerator = ({ referralCode, userName }: BannerGeneratorProps) => {
    const bannerRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState('marketplace');
    const [downloadFormat, setDownloadFormat] = useState('png');
    const [imageQuality, setImageQuality] = useState('high');

    const [config, setConfig] = useState({
        headline: 'Shop Smarter, Earn Rewards!',
        subheadline: 'Join Kenya\'s fastest growing marketplace. Use my code and we both win!',
        ctaText: 'Join Now & Save',
        accentColor: '#10b981',
        showProducts: true,
        showStats: true,
        showBadge: true,
        showLogo: true,
        opacity: 0.95,
    });

    // Professional banner templates
    const templates = [
        {
            id: 'marketplace',
            name: 'Marketplace Pro',
            icon: ShoppingBag,
            bg: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
            accent: '#064e3b',
            description: 'Best for product showcase'
        },
        {
            id: 'rewards',
            name: 'Rewards Focus',
            icon: Gift,
            bg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
            accent: '#4c1d95',
            description: 'Highlight earning potential'
        },
        {
            id: 'premium',
            name: 'Premium Gold',
            icon: Crown,
            bg: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #fbbf24 100%)',
            accent: '#78350f',
            description: 'Luxury & exclusivity'
        },
        {
            id: 'trust',
            name: 'Trust Builder',
            icon: Shield,
            bg: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
            accent: '#1e3a8a',
            description: 'Build credibility'
        },
        {
            id: 'modern',
            name: 'Dark Mode',
            icon: Zap,
            bg: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
            accent: '#000000',
            description: 'Sleek & professional'
        },
    ];

    // Simulated marketplace products for visual appeal
    const showcaseProducts = [
        { name: 'Electronics', price: 'KES 25,000', emoji: '📱', discount: '-15%' },
        { name: 'Fashion', price: 'KES 3,500', emoji: '👗', discount: '-20%' },
        { name: 'Home & Living', price: 'KES 12,000', emoji: '🏠', discount: '-10%' },
    ];

    const stats = [
        { label: 'Active Sellers', value: '5,000+', icon: Users },
        { label: 'Products Listed', value: '50K+', icon: Package },
        { label: 'Happy Buyers', value: '100K+', icon: Heart },
    ];

    const handleDownload = async () => {
        if (!bannerRef.current) return;

        try {
            setDownloading(true);

            const pixelRatio = imageQuality === 'high' ? 3 : imageQuality === 'medium' ? 2 : 1;
            const quality = imageQuality === 'high' ? 1 : imageQuality === 'medium' ? 0.9 : 0.8;

            let dataUrl: string;
            let fileExtension: string;

            if (downloadFormat === 'png') {
                dataUrl = await toPng(bannerRef.current, {
                    quality: 1,
                    pixelRatio,
                    cacheBust: true,
                });
                fileExtension = 'png';
            } else {
                dataUrl = await toJpeg(bannerRef.current, {
                    quality,
                    pixelRatio,
                    cacheBust: true,
                    backgroundColor: '#ffffff',
                });
                fileExtension = 'jpg';
            }

            const link = document.createElement('a');
            link.download = `sellhubshop-referral-${referralCode}.${fileExtension}`;
            link.href = dataUrl;
            link.click();

            toast.success(`🎉 Banner downloaded as ${fileExtension.toUpperCase()}!`);
        } catch (err) {
            console.error(err);
            toast.error('Failed to download banner');
        } finally {
            setDownloading(false);
        }
    };

    const currentTemplate = templates.find(t => t.id === activeTemplate) || templates[0];

    return (
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 shadow-lg rounded-2xl sm:rounded-3xl">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl shadow-lg">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Pro Banner Studio
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                            Create professional social media graphics
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-8">
                {/* Controls Panel */}
                <div className="xl:col-span-4 space-y-4 sm:space-y-6">
                    {/* Template Selector */}
                    <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                            Choose Template
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
                            {templates.map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTemplate(t.id)}
                                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-left ${activeTemplate === t.id
                                                ? 'border-purple-500 bg-purple-50 shadow-lg scale-[1.02]'
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div
                                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md"
                                                style={{ background: t.bg }}
                                            >
                                                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{t.name}</p>
                                                <p className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:block">{t.description}</p>
                                            </div>
                                            {activeTemplate === t.id && (
                                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Tabs */}
                    <Tabs defaultValue="content" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="content" className="text-xs sm:text-sm">Content</TabsTrigger>
                            <TabsTrigger value="options" className="text-xs sm:text-sm">Options</TabsTrigger>
                            <TabsTrigger value="export" className="text-xs sm:text-sm">Export</TabsTrigger>
                        </TabsList>

                        <TabsContent value="content" className="space-y-4">
                            <div>
                                <Label className="text-xs sm:text-sm font-medium">Headline</Label>
                                <Input
                                    value={config.headline}
                                    onChange={(e) => setConfig({ ...config, headline: e.target.value })}
                                    className="mt-1 text-sm"
                                    maxLength={40}
                                    placeholder="Your catchy headline..."
                                />
                            </div>
                            <div>
                                <Label className="text-xs sm:text-sm font-medium">Description</Label>
                                <Input
                                    value={config.subheadline}
                                    onChange={(e) => setConfig({ ...config, subheadline: e.target.value })}
                                    className="mt-1 text-sm"
                                    maxLength={80}
                                    placeholder="Describe the benefits..."
                                />
                            </div>
                            <div>
                                <Label className="text-xs sm:text-sm font-medium">Button Text</Label>
                                <Input
                                    value={config.ctaText}
                                    onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
                                    className="mt-1 text-sm"
                                    maxLength={20}
                                    placeholder="Call to action..."
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="options" className="space-y-4">
                            <div className="space-y-3">
                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Show Logo</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={config.showLogo}
                                        onChange={(e) => setConfig({ ...config, showLogo: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Show Products</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={config.showProducts}
                                        onChange={(e) => setConfig({ ...config, showProducts: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Show Stats</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={config.showStats}
                                        onChange={(e) => setConfig({ ...config, showStats: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">Show Badge</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={config.showBadge}
                                        onChange={(e) => setConfig({ ...config, showBadge: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                </label>
                            </div>
                        </TabsContent>

                        <TabsContent value="export" className="space-y-4">
                            {/* Format Selection */}
                            <div>
                                <Label className="text-xs sm:text-sm font-medium mb-2 block">Download Format</Label>
                                <Select value={downloadFormat} onValueChange={setDownloadFormat}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="png">
                                            <div className="flex items-center gap-2">
                                                <FileImage className="w-4 h-4" />
                                                <span>PNG (Best Quality)</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="jpg">
                                            <div className="flex items-center gap-2">
                                                <FileImage className="w-4 h-4" />
                                                <span>JPG (Smaller Size)</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Quality Selection */}
                            <div>
                                <Label className="text-xs sm:text-sm font-medium mb-2 block">Image Quality</Label>
                                <Select value={imageQuality} onValueChange={setImageQuality}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select quality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="high">
                                            <span>High Quality (HD - Large file)</span>
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            <span>Medium Quality (Balanced)</span>
                                        </SelectItem>
                                        <SelectItem value="low">
                                            <span>Low Quality (Small file)</span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                <p className="text-sm font-medium text-blue-900 mb-1">📁 Export Info</p>
                                <p className="text-xs text-blue-700">
                                    <strong>PNG</strong>: Best for web & transparency. Larger file size.<br />
                                    <strong>JPG</strong>: Great for sharing. Smaller file size.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Download Button */}
                    <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12 sm:h-14 rounded-xl sm:rounded-2xl shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl text-sm sm:text-base"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        {downloading ? 'Creating Image...' : `Download as ${downloadFormat.toUpperCase()}`}
                    </Button>
                </div>

                {/* Preview Panel */}
                <div className="xl:col-span-8 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl sm:rounded-3xl p-3 sm:p-8 border border-gray-200 min-h-[300px] sm:min-h-[400px]">
                    <div
                        ref={bannerRef}
                        className="w-full max-w-[800px] aspect-[1.91/1] rounded-2xl sm:rounded-3xl shadow-2xl flex relative overflow-hidden select-none"
                        style={{ background: currentTemplate.bg }}
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute inset-0 overflow-hidden">
                            {/* Gradient Orbs */}
                            <div className="absolute -top-20 -right-20 w-40 sm:w-80 h-40 sm:h-80 bg-white/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-20 -left-20 w-40 sm:w-60 h-40 sm:h-60 bg-black/10 rounded-full blur-3xl" />

                            {/* Pattern Grid */}
                            <div
                                className="absolute inset-0 opacity-10"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                }}
                            />
                        </div>

                        {/* Main Content Container */}
                        <div className="absolute inset-0 flex flex-col p-4 sm:p-8 z-10">
                            {/* Top Bar */}
                            <div className="flex justify-between items-start mb-auto">
                                {/* Brand Badge with Logo */}
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/30">
                                    {config.showLogo && (
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden">
                                            <img
                                                src="/logo.png"
                                                alt="SellHubShop"
                                                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                                                onError={(e) => {
                                                    // Fallback if logo doesn't load
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-white text-[10px] sm:text-sm font-bold tracking-wide">SELLHUBSHOP</span>
                                </div>

                                {/* Referral Code */}
                                <div className="text-right">
                                    <p className="text-[8px] sm:text-xs text-white/70 uppercase tracking-widest mb-0.5">Use Code</p>
                                    <div className="bg-white/20 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg border border-white/30">
                                        <p className="text-base sm:text-2xl font-mono font-black text-white tracking-wider">{referralCode}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Middle Content */}
                            <div className="flex-1 flex items-center">
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-6 w-full">
                                    {/* Text Content */}
                                    <div className="flex-1 space-y-2 sm:space-y-4">
                                        {config.showBadge && (
                                            <div className="inline-flex items-center gap-1 sm:gap-2 bg-yellow-400 text-yellow-900 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
                                                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                                                EXCLUSIVE INVITE
                                            </div>
                                        )}

                                        <h1 className="text-xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-lg">
                                            {config.headline}
                                        </h1>

                                        <p className="text-white/90 text-xs sm:text-lg font-medium leading-relaxed max-w-md">
                                            {config.subheadline}
                                        </p>

                                        {/* CTA Button */}
                                        <div className="inline-flex items-center gap-2 bg-white text-gray-900 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all"
                                            style={{ color: currentTemplate.accent }}
                                        >
                                            {config.ctaText}
                                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                    </div>

                                    {/* Product Showcase Cards */}
                                    {config.showProducts && (
                                        <div className="hidden lg:flex flex-col gap-2">
                                            {showcaseProducts.map((product, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/50"
                                                    style={{ transform: `translateX(${idx * 10}px)` }}
                                                >
                                                    <div className="text-2xl">{product.emoji}</div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900">{product.name}</p>
                                                        <p className="text-xs text-gray-600">{product.price}</p>
                                                    </div>
                                                    <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        {product.discount}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Stats Bar */}
                            {config.showStats && (
                                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mt-auto pt-3 sm:pt-4 border-t border-white/20">
                                    {stats.map((stat, idx) => {
                                        const Icon = stat.icon;
                                        return (
                                            <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                                                <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
                                                <div>
                                                    <p className="text-[10px] sm:text-sm font-bold text-white">{stat.value}</p>
                                                    <p className="text-[8px] sm:text-xs text-white/70">{stat.label}</p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Inviter Info */}
                                    {userName && (
                                        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm border-2 border-white/30">
                                                {userName.charAt(0)}
                                            </div>
                                            <div className="text-white">
                                                <p className="text-[8px] sm:text-[10px] opacity-70">INVITED BY</p>
                                                <p className="text-xs sm:text-sm font-bold leading-none">{userName.split(' ')[0]}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Tips Section */}
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                    Quick Tips for Maximum Impact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm">WhatsApp Status</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Post as status for 24hr visibility</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm">Facebook Groups</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Share in local buy/sell groups</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm">Instagram Stories</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">Use swipe-up or link sticker</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
