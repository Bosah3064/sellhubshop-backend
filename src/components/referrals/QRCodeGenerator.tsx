import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Share2, Copy, Check, Smartphone, Printer, Mail, Store, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';

interface QRCodeGeneratorProps {
    referralCode: string;
    userName?: string;
}

export const QRCodeGenerator = ({ referralCode, userName }: QRCodeGeneratorProps) => {
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

    const downloadQRCode = async () => {
        try {
            setDownloading(true);
            const qrElement = document.getElementById('qr-code-container');

            if (!qrElement) {
                toast.error('QR code not found');
                return;
            }

            const dataUrl = await toPng(qrElement, {
                quality: 1,
                pixelRatio: 3,
                backgroundColor: '#ffffff',
            });

            const link = document.createElement('a');
            link.download = `sellhubshop-qr-${referralCode}.png`;
            link.href = dataUrl;
            link.click();

            toast.success('🎉 QR code downloaded!');
        } catch (error) {
            console.error('Error downloading QR code:', error);
            toast.error('Failed to download QR code');
        } finally {
            setDownloading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const shareQRCode = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join SellHubShop',
                    text: `Use my referral code: ${referralCode} and earn rewards!`,
                    url: referralLink,
                });
                toast.success('Shared successfully!');
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            copyLink();
        }
    };

    const useCases = [
        { icon: Printer, title: 'Print Materials', desc: 'Business cards, flyers, posters' },
        { icon: Store, title: 'In-Store Display', desc: 'Counter signs, window stickers' },
        { icon: Smartphone, title: 'Social Media', desc: 'Stories, posts, reels' },
        { icon: Mail, title: 'Email Signature', desc: 'Add to your email footer' },
    ];

    return (
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-white via-green-50/50 to-emerald-50 border-2 border-green-200 rounded-2xl sm:rounded-3xl shadow-lg">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-3 shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    Instant Scanning
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Your Personal QR Code
                </h3>
                <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
                    Perfect for offline marketing! Let anyone scan and join instantly.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* QR Code Display */}
                <div className="flex flex-col items-center">
                    <div
                        id="qr-code-container"
                        className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border-2 border-gray-100"
                    >
                        {/* Header */}
                        <div className="text-center mb-4 sm:mb-6">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <span className="text-2xl sm:text-3xl">🛒</span>
                            </div>
                            <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                                {userName ? `${userName}'s Invite` : 'Join SellHubShop'}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600">Scan to register & earn rewards</p>
                        </div>

                        {/* QR Code */}
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-1 rounded-2xl shadow-lg">
                            <div className="bg-white p-3 sm:p-4 rounded-xl">
                                <QRCodeSVG
                                    value={referralLink}
                                    size={180}
                                    level="H"
                                    includeMargin={false}
                                    fgColor="#064e3b"
                                />
                            </div>
                        </div>

                        {/* Referral Code */}
                        <div className="mt-4 sm:mt-6 text-center">
                            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Referral Code</p>
                            <div className="inline-flex items-center bg-gradient-to-r from-green-100 to-emerald-100 px-4 sm:px-6 py-2 sm:py-3 rounded-xl border-2 border-green-200">
                                <span className="text-lg sm:text-xl font-mono font-black text-green-700 tracking-wider">
                                    {referralCode}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mt-4 sm:mt-6 max-w-sm">
                        <Button
                            onClick={downloadQRCode}
                            disabled={downloading}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl sm:rounded-2xl h-12 sm:h-14 shadow-lg text-xs sm:text-sm"
                        >
                            <Download className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{downloading ? 'Saving...' : 'Download'}</span>
                            <span className="sm:hidden">{downloading ? '...' : 'Save'}</span>
                        </Button>

                        <Button
                            onClick={shareQRCode}
                            variant="outline"
                            className="border-2 border-green-500 text-green-600 hover:bg-green-50 rounded-xl sm:rounded-2xl h-12 sm:h-14 text-xs sm:text-sm"
                        >
                            <Share2 className="w-4 h-4 mr-1 sm:mr-2" />
                            Share
                        </Button>

                        <Button
                            onClick={copyLink}
                            variant="outline"
                            className="border-2 border-gray-300 hover:bg-gray-50 rounded-xl sm:rounded-2xl h-12 sm:h-14 text-xs sm:text-sm"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 mr-1 sm:mr-2 text-green-600" />
                                    <span className="text-green-600">Done!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-1 sm:mr-2" />
                                    Copy
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Usage Ideas */}
                <div className="space-y-4 sm:space-y-6">
                    <div>
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                            <span className="text-lg sm:text-xl">💡</span>
                            How to Use Your QR Code
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {useCases.map((useCase, idx) => {
                                const Icon = useCase.icon;
                                return (
                                    <div
                                        key={idx}
                                        className="p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
                                    >
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                        </div>
                                        <p className="font-semibold text-gray-900 text-xs sm:text-sm mb-0.5">{useCase.title}</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">{useCase.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pro Tips */}
                    <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl border border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                            🚀 Pro Marketing Tips
                        </h4>
                        <ul className="text-xs sm:text-sm text-blue-800 space-y-2">
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span>Place near checkout counters for maximum visibility</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span>Add incentive text: "Scan for KES 50 off!"</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span>Include in WhatsApp group announcements</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span>Print on product packaging or receipts</span>
                            </li>
                        </ul>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="text-center p-3 sm:p-4 bg-white rounded-xl border border-gray-200">
                            <p className="text-lg sm:text-2xl font-bold text-green-600">2x</p>
                            <p className="text-[10px] sm:text-xs text-gray-600">Higher Conversion</p>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-white rounded-xl border border-gray-200">
                            <p className="text-lg sm:text-2xl font-bold text-green-600">1 sec</p>
                            <p className="text-[10px] sm:text-xs text-gray-600">Scan Time</p>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-white rounded-xl border border-gray-200">
                            <p className="text-lg sm:text-2xl font-bold text-green-600">∞</p>
                            <p className="text-[10px] sm:text-xs text-gray-600">No Expiry</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
