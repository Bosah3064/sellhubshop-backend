import React from 'react';

interface PiLogoProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    className?: string;
}

export const PiLogo: React.FC<PiLogoProps> = ({
    size = 'md',
    showText = false,
    className = '',
}) => {
    const sizeClasses = {
        xs: 'w-4 h-4',
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    const textSizes = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Pi Symbol with gradient */}
            <div
                className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center text-white font-bold shadow-md`}
                style={{ fontFamily: 'serif' }}
            >
                <span className={size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : size === 'md' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-3xl'}>
                    π
                </span>
            </div>
            {showText && (
                <span className={`font-semibold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent ${textSizes[size]}`}>
                    Pi Network
                </span>
            )}
        </div>
    );
};

// Compact Pi icon for inline use
export const PiIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 text-white text-xs font-bold ${className}`}
            style={{ fontFamily: 'serif' }}
        >
            π
        </span>
    );
};
