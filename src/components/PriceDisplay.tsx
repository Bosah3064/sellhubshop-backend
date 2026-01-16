import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { convertKESToPi, formatPi } from '@/lib/pi-utils';
import { PiIcon } from '@/components/PiLogo';

interface PriceDisplayProps {
    kesAmount: number;
    showPi?: boolean;
    className?: string;
    piClassName?: string;
    layout?: 'horizontal' | 'vertical';
    size?: 'sm' | 'md' | 'lg';
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
    kesAmount,
    showPi = true,
    className = '',
    piClassName = '',
    layout = 'vertical',
    size = 'md',
}) => {
    const piAmount = convertKESToPi(kesAmount);

    const sizeClasses = {
        sm: {
            kes: 'text-sm font-semibold',
            pi: 'text-xs',
            badge: 'text-[10px] px-1 py-0',
        },
        md: {
            kes: 'text-lg font-bold',
            pi: 'text-sm',
            badge: 'text-xs px-1.5 py-0.5',
        },
        lg: {
            kes: 'text-2xl font-bold',
            pi: 'text-base',
            badge: 'text-xs px-2 py-1',
        },
    };

    const classes = sizeClasses[size];

    if (!showPi) {
        return (
            <div className={className}>
                <span className={classes.kes}>KES {kesAmount.toLocaleString()}</span>
            </div>
        );
    }

    if (layout === 'horizontal') {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <span className={classes.kes}>KES {kesAmount.toLocaleString()}</span>
                <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">•</span>
                    <PiIcon className="flex-shrink-0" />
                    <span className={`text-purple-600 font-medium ${classes.pi} ${piClassName}`}>
                        {formatPi(kesAmount > 0 ? piAmount : 0, false)}
                    </span>
                    <Badge
                        variant="outline"
                        className={`bg-gradient-to-r from-purple-50 to-amber-50 text-purple-700 border-purple-200 ${classes.badge}`}
                    >
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        Coming Soon
                    </Badge>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-1 ${className}`}>
            <div className={classes.kes}>KES {kesAmount.toLocaleString()}</div>
            <div className="flex items-center gap-1.5">
                <PiIcon className="flex-shrink-0" />
                <span className={`text-purple-600 font-medium ${classes.pi} ${piClassName}`}>
                    {formatPi(kesAmount > 0 ? piAmount : 0, false)}
                </span>
                <Badge
                    variant="outline"
                    className={`bg-gradient-to-r from-purple-50 to-amber-50 text-purple-700 border-purple-200 ${classes.badge}`}
                >
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    Coming Soon
                </Badge>
            </div>
        </div>
    );
};

// Compact version for small spaces
export const CompactPriceDisplay: React.FC<{ kesAmount: number; className?: string }> = ({
    kesAmount,
    className = '',
}) => {
    const piAmount = convertKESToPi(kesAmount);

    return (
        <div className={`flex flex-col ${className}`}>
            <span className="text-sm font-semibold">KES {kesAmount.toLocaleString()}</span>
            <div className="flex items-center gap-1">
                <PiIcon className="w-3 h-3" />
                <span className="text-xs text-purple-600">
                    {formatPi(kesAmount > 0 ? piAmount : 0, false)} <span className="text-[10px] text-slate-400">(Soon)</span>
                </span>
            </div>
        </div>
    );
};
