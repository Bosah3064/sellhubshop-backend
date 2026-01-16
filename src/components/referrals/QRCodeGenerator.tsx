import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Share2, Copy, Check } from 'lucide-react';
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
            link.download = `referral-qr-${referralCode}.png`;
            link.href = dataUrl;
            link.click();

            toast.success('QR code downloaded!');
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
                    text: `Use my referral code: ${referralCode}`,
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

    return (
        <Card className="p-6 bg-gradient-to-br from-white to-green-50 border-2 border-green-200">
            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    📱 QR Code for Easy Sharing
                </h3>
                <p className="text-gray-600">
                    Let people scan to join instantly - perfect for offline marketing!
                </p>
            </div>

            {/* QR Code Display */}
            <div
                id="qr-code-container"
                className="bg-white p-8 rounded-2xl shadow-xl mx-auto w-fit mb-6"
            >
                <div className="text-center mb-4">
                    <h4 className="text-xl font-bold text-gray-900 mb-1">
                        {userName ? `${userName}'s Referral` : 'Join SellHubShop'}
                    </h4>
                    <p className="text-sm text-gray-600">Scan to register & earn rewards</p>
                </div>

                <div className="bg-white p-4 rounded-xl border-4 border-green-500">
                    <QRCodeSVG
                        value={referralLink}
                        size={256}
                        level="H"
                        includeMargin={false}
                        imageSettings={{
                            src: "/logo.png",
                            height: 40,
                            width: 40,
                            excavate: true,
                        }}
                    />
                </div>

                <div className="mt-4 text-center">
                    <p className="text-xs font-mono text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                        Code: {referralCode}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                    onClick={downloadQRCode}
                    disabled={downloading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    <Download className="w-4 h-4 mr-2" />
                    {downloading ? 'Downloading...' : 'Download'}
                </Button>

                <Button
                    onClick={shareQRCode}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                </Button>

                <Button
                    onClick={copyLink}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                        </>
                    )}
                </Button>
            </div>

            {/* Usage Tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <span>💡</span> How to Use Your QR Code
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Print on business cards or flyers</li>
                    <li>• Display at your store or events</li>
                    <li>• Share on social media stories</li>
                    <li>• Add to email signatures</li>
                    <li>• Include in presentations</li>
                </ul>
            </div>
        </Card>
    );
};
