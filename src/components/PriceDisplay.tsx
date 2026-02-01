import React from 'react';

interface PriceDisplayProps {
    kesAmount: number;
    originalAmount?: number | null;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
    kesAmount,
    originalAmount,
    className = '',
    size = 'md',
}) => {
    const sizeClasses = {
        sm: 'text-sm font-semibold',
        md: 'text-lg font-bold',
        lg: 'text-2xl font-bold',
    };

    const kesClass = sizeClasses[size];

    return (
        <div className={`space-y-1 ${className}`}>
             {originalAmount && originalAmount > kesAmount && (
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-red-100 bg-red-600 px-2 py-0.5 rounded-lg shadow-sm animate-pulse">
                        -{Math.round(((originalAmount - kesAmount) / originalAmount) * 100)}% OFF
                    </span>
                    <span className="text-xs opacity-70 line-through decoration-current/50 font-medium whitespace-nowrap">
                        KES {originalAmount.toLocaleString()}
                    </span>
                </div>
            )}
            <div className={`${kesClass} tracking-tight`}>KES {kesAmount.toLocaleString()}</div>
        </div>
    );
};

// Compact version for small spaces
export const CompactPriceDisplay: React.FC<{ kesAmount: number; className?: string }> = ({
    kesAmount,
    className = '',
}) => {
    return (
        <div className={`flex flex-col ${className}`}>
            <span className="text-sm font-semibold">KES {kesAmount.toLocaleString()}</span>
        </div>
    );
};
