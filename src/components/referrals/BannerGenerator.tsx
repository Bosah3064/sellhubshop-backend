import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Layout, Palette, Type, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

interface BannerGeneratorProps {
    referralCode: string;
    userName?: string;
}

export const BannerGenerator = ({ referralCode, userName }: BannerGeneratorProps) => {
    const bannerRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const [config, setConfig] = useState({
        template: 'modern',
        headline: 'Join me on SellHubShop!',
        subheadline: 'Get rewards when you sign up using my referral code',
        ctaText: 'Sign Up Now',
        accentColor: '#10b981',
        theme: 'gradient', // gradient, image, solid
        pattern: 'circles', // circles, dots, grid, waves
        opacity: 0.9,
    });

    const patterns = {
        circles: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
        dots: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
        grid: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        waves: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.735-5.197-1.52-8.144-2.68-9.404-3.707-16.79-6.32-28.532-6.32-11.77 0-20.211 3.27-29.626 7.02-1.95.776-3.766 1.498-5.422 2.155L21.184 20zM21.2 0c.93.383 1.87.739 2.75 1.072h6.225c-2.51-.735-5.197-1.52-8.144-2.68-9.404-3.707-16.79-6.32-28.532-6.32-11.77 0-20.211 3.27-29.626 7.02-1.95.776-3.766 1.498-5.422 2.155L.784 1.875C3.396 2.784 7.043 3.99 12.8 3.99c2.723 0 5.568-.277 8.4-1.97v-2.02z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
    };

    const themes = [
        {
            id: 'modern',
            name: 'Neo Mint',
            bg: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
            accent: '#064e3b'
        },
        {
            id: 'royal',
            name: 'Royal Blue',
            bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            accent: '#172554'
        },
        {
            id: 'sunset',
            name: 'Golden Hour',
            bg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
            accent: '#78350f'
        },
        {
            id: 'berry',
            name: 'Wild Berry',
            bg: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
            accent: '#831843'
        },
        {
            id: 'dark',
            name: 'Midnight',
            bg: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
            accent: '#000000'
        },
    ];

    const handleDownload = async () => {
        if (!bannerRef.current) return;

        try {
            setDownloading(true);
            const dataUrl = await toPng(bannerRef.current, {
                quality: 1,
                pixelRatio: 3, // Higher quality for professional look
            });

            const link = document.createElement('a');
            link.download = `referral-card-${referralCode}.png`;
            link.href = dataUrl;
            link.click();

            toast.success('Professional card downloaded!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to download card');
        } finally {
            setDownloading(false);
        }
    };

    const activeTheme = themes.find(t => t.id === config.template) || themes[0];

    return (
        <Card className="p-6 bg-white border-2 border-gray-100 shadow-sm">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    Pro Card Designer
                </h3>
                <p className="text-gray-600">
                    Design premium social media cards that stand out
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Controls Panel */}
                <div className="xl:col-span-4 space-y-8">
                    <Tabs defaultValue="design" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="design">Design</TabsTrigger>
                            <TabsTrigger value="content">Content</TabsTrigger>
                            <TabsTrigger value="style">Style</TabsTrigger>
                        </TabsList>

                        <TabsContent value="design" className="space-y-6">
                            <div>
                                <Label className="text-sm font-semibold text-gray-700 mb-3 block">Color Theme</Label>
                                <div className="grid grid-cols-5 gap-3">
                                    {themes.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setConfig({ ...config, template: t.id })}
                                            className={`w-full aspect-square rounded-full transition-all duration-300 relative ${config.template === t.id ? 'transform scale-110 ring-2 ring-offset-2 ring-purple-500' : 'hover:scale-105'
                                                }`}
                                            style={{ background: t.bg }}
                                        >
                                            {config.template === t.id && (
                                                <Check className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-gray-700 mb-3 block">Background Pattern</Label>
                                <div className="grid grid-cols-4 gap-3">
                                    {Object.entries(patterns).map(([key, value]) => (
                                        <button
                                            key={key}
                                            onClick={() => setConfig({ ...config, pattern: key })}
                                            className={`h-12 rounded-lg border-2 transition-all ${config.pattern === key
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            style={{ backgroundImage: value, backgroundColor: '#f3f4f6' }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                                    Transparency ({Math.round(config.opacity * 100)}%)
                                </Label>
                                <Slider
                                    value={[config.opacity]}
                                    min={0.5}
                                    max={1}
                                    step={0.1}
                                    onValueChange={([val]) => setConfig({ ...config, opacity: val })}
                                    className="py-4"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="content" className="space-y-5">
                            <div>
                                <Label>Headline</Label>
                                <Input
                                    value={config.headline}
                                    onChange={(e) => setConfig({ ...config, headline: e.target.value })}
                                    className="mt-1"
                                    maxLength={40}
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input
                                    value={config.subheadline}
                                    onChange={(e) => setConfig({ ...config, subheadline: e.target.value })}
                                    className="mt-1"
                                    maxLength={60}
                                />
                            </div>
                            <div>
                                <Label>Button Text</Label>
                                <Input
                                    value={config.ctaText}
                                    onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
                                    className="mt-1"
                                    maxLength={20}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="style" className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Pro Tip 💡</p>
                                <p className="text-xs text-gray-500">
                                    Keep text concise for better readability on mobile devices. Use emojis to add personality!
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <Button
                        onClick={handleDownload}
                        disabled={downloading}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                    >
                        <Download className="w-5 h-5 mr-2" />
                        {downloading ? 'Creating HD Image...' : 'Download HD Card'}
                    </Button>
                </div>

                {/* Preview Panel */}
                <div className="xl:col-span-8 flex items-center justify-center bg-gray-100 rounded-3xl p-4 sm:p-10 border border-gray-200">
                    <div
                        ref={bannerRef}
                        className="w-full max-w-[800px] aspect-[1.91/1] rounded-3xl shadow-2xl flex relative overflow-hidden group select-none transition-all duration-300"
                        style={{
                            background: activeTheme.bg,
                        }}
                    >
                        {/* Pattern Overlay */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{ backgroundImage: patterns[config.pattern as keyof typeof patterns] }}
                        />

                        {/* Glassmorphism Container */}
                        <div
                            className="absolute inset-4 md:inset-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 md:p-10 flex flex-col justify-between"
                            style={{ opacity: config.opacity }}
                        >
                            {/* Header Section */}
                            <div className="flex justify-between items-start">
                                <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-white text-xs md:text-sm font-bold tracking-wide">SELLHUBSHOP</span>
                                </div>

                                <div className="text-white text-right">
                                    <p className="text-[10px] md:text-xs opacity-80 uppercase tracking-widest mb-0.5">REFERRAL CODE</p>
                                    <p className="text-lg md:text-2xl font-mono font-bold tracking-wider">{referralCode}</p>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="space-y-4 max-w-lg">
                                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-lg">
                                    {config.headline}
                                </h1>
                                <p className="text-white/90 text-sm md:text-xl font-medium leading-relaxed">
                                    {config.subheadline}
                                </p>
                            </div>

                            {/* Footer / CTA */}
                            <div className="flex items-end justify-between mt-4">
                                <div className="flex items-center gap-3">
                                    {userName && (
                                        <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white/20">
                                                {userName.charAt(0)}
                                            </div>
                                            <div className="text-white">
                                                <p className="text-[10px] opacity-70">INVITED BY</p>
                                                <p className="text-sm font-bold leading-none">{userName.split(' ')[0]}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className="px-8 py-3 rounded-xl font-bold text-sm md:text-base shadow-xl flex items-center gap-2 transition-transform"
                                    style={{
                                        backgroundColor: 'white',
                                        color: activeTheme.accent
                                    }}
                                >
                                    {config.ctaText}
                                    <Layout className="w-4 h-4 ml-1" />
                                </div>
                            </div>

                            {/* Decorative Elements */}
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -top-20 -left-20 w-64 h-64 bg-black/5 rounded-full blur-3xl pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
