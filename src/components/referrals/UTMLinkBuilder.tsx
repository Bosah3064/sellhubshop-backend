import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Copy, Check, Link as LinkIcon, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface UTMLinkBuilderProps {
    referralCode: string;
}

export const UTMLinkBuilder = ({ referralCode }: UTMLinkBuilderProps) => {
    const [copied, setCopied] = useState(false);
    const [utmParams, setUtmParams] = useState({
        source: '',
        medium: '',
        campaign: '',
        term: '',
        content: '',
    });

    const baseUrl = `${window.location.origin}/register?ref=${referralCode}`;

    const generateUTMLink = () => {
        const params = new URLSearchParams();

        if (utmParams.source) params.append('utm_source', utmParams.source);
        if (utmParams.medium) params.append('utm_medium', utmParams.medium);
        if (utmParams.campaign) params.append('utm_campaign', utmParams.campaign);
        if (utmParams.term) params.append('utm_term', utmParams.term);
        if (utmParams.content) params.append('utm_content', utmParams.content);

        return params.toString() ? `${baseUrl}&${params.toString()}` : baseUrl;
    };

    const utmLink = generateUTMLink();

    const copyUTMLink = () => {
        navigator.clipboard.writeText(utmLink).then(() => {
            setCopied(true);
            toast.success('UTM link copied!');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const utmPresets = [
        { name: 'Facebook Ad', source: 'facebook', medium: 'paid', campaign: 'referral_campaign' },
        { name: 'Instagram Story', source: 'instagram', medium: 'social', campaign: 'story_share' },
        { name: 'Twitter Post', source: 'twitter', medium: 'social', campaign: 'tweet' },
        { name: 'Email Newsletter', source: 'email', medium: 'newsletter', campaign: 'monthly' },
        { name: 'WhatsApp', source: 'whatsapp', medium: 'messaging', campaign: 'direct_share' },
        { name: 'LinkedIn', source: 'linkedin', medium: 'social', campaign: 'professional' },
    ];

    const applyPreset = (preset: typeof utmPresets[0]) => {
        setUtmParams({
            source: preset.source,
            medium: preset.medium,
            campaign: preset.campaign,
            term: '',
            content: '',
        });
        toast.success(`Applied ${preset.name} preset!`);
    };

    return (
        <Card className="p-6 bg-white border-2 border-purple-200">
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                    UTM Link Builder
                </h3>
                <p className="text-gray-600">
                    Track where your referrals come from with custom UTM parameters
                </p>
            </div>

            {/* Quick Presets */}
            <div className="mb-6">
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Quick Presets
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {utmPresets.map((preset) => (
                        <Button
                            key={preset.name}
                            onClick={() => applyPreset(preset)}
                            variant="outline"
                            size="sm"
                            className="text-xs hover:bg-purple-50 hover:border-purple-300"
                        >
                            {preset.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* UTM Parameters */}
            <div className="space-y-4 mb-6">
                <div>
                    <Label htmlFor="utm_source" className="text-sm font-medium">
                        Source * <span className="text-gray-500">(e.g., facebook, google, newsletter)</span>
                    </Label>
                    <Input
                        id="utm_source"
                        value={utmParams.source}
                        onChange={(e) => setUtmParams({ ...utmParams, source: e.target.value })}
                        placeholder="facebook"
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="utm_medium" className="text-sm font-medium">
                        Medium * <span className="text-gray-500">(e.g., social, email, paid)</span>
                    </Label>
                    <Input
                        id="utm_medium"
                        value={utmParams.medium}
                        onChange={(e) => setUtmParams({ ...utmParams, medium: e.target.value })}
                        placeholder="social"
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="utm_campaign" className="text-sm font-medium">
                        Campaign * <span className="text-gray-500">(e.g., summer_sale, referral_boost)</span>
                    </Label>
                    <Input
                        id="utm_campaign"
                        value={utmParams.campaign}
                        onChange={(e) => setUtmParams({ ...utmParams, campaign: e.target.value })}
                        placeholder="referral_campaign"
                        className="mt-1"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="utm_term" className="text-sm font-medium">
                            Term <span className="text-gray-500">(optional)</span>
                        </Label>
                        <Input
                            id="utm_term"
                            value={utmParams.term}
                            onChange={(e) => setUtmParams({ ...utmParams, term: e.target.value })}
                            placeholder="keywords"
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="utm_content" className="text-sm font-medium">
                            Content <span className="text-gray-500">(optional)</span>
                        </Label>
                        <Input
                            id="utm_content"
                            value={utmParams.content}
                            onChange={(e) => setUtmParams({ ...utmParams, content: e.target.value })}
                            placeholder="banner_ad"
                            className="mt-1"
                        />
                    </div>
                </div>
            </div>

            {/* Generated Link */}
            <div className="mb-6">
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Your Tracking Link
                </Label>
                <div className="flex gap-2">
                    <Input
                        value={utmLink}
                        readOnly
                        className="font-mono text-sm bg-gray-50"
                    />
                    <Button
                        onClick={copyUTMLink}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Why Use UTM Parameters?
                </h4>
                <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Track which channels bring the most referrals</li>
                    <li>• Measure campaign performance accurately</li>
                    <li>• Optimize your marketing spend</li>
                    <li>• See detailed analytics in your dashboard</li>
                </ul>
            </div>
        </Card>
    );
};
