import React from 'react';

interface PriceDisplayProps {
    kesAmount: number;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
    kesAmount,
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
            <div className={kesClass}>KES {kesAmount.toLocaleString()}</div>
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
