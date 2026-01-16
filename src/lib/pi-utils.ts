// Pi Network Currency Utilities
// Pi Price: $314,159 USD per Pi
// Exchange rate: 1 USD ≈ 130 KES (approximate)

const PI_PRICE_USD = 314159; // $314,159 per Pi
const USD_TO_KES = 130; // Approximate exchange rate
const PI_PRICE_KES = PI_PRICE_USD * USD_TO_KES; // KES per Pi

/**
 * Convert KES amount to Pi Network cryptocurrency
 * @param kesAmount - Amount in Kenyan Shillings
 * @returns Amount in Pi (rounded to 6 decimal places)
 */
export const convertKESToPi = (kesAmount: number): number => {
    if (!kesAmount || kesAmount <= 0) return 0;
    const piAmount = kesAmount / PI_PRICE_KES;
    return Number(piAmount.toFixed(6));
};

/**
 * Convert Pi amount to KES
 * @param piAmount - Amount in Pi
 * @returns Amount in Kenyan Shillings
 */
export const convertPiToKES = (piAmount: number): number => {
    if (!piAmount || piAmount <= 0) return 0;
    return Math.round(piAmount * PI_PRICE_KES);
};

/**
 * Format Pi amount for display
 * @param piAmount - Amount in Pi
 * @param showSymbol - Whether to show the π symbol
 * @returns Formatted Pi string
 */
export const formatPi = (piAmount: number, showSymbol: boolean = true): string => {
    if (!piAmount || piAmount <= 0) return showSymbol ? 'π 0' : '0';

    // For very small amounts, show more decimal places
    if (piAmount < 0.000001) {
        return showSymbol ? `π ${piAmount.toExponential(2)}` : piAmount.toExponential(2);
    }

    // For small amounts, show 6 decimal places
    if (piAmount < 0.01) {
        return showSymbol ? `π ${piAmount.toFixed(6)}` : piAmount.toFixed(6);
    }

    // For medium amounts, show 4 decimal places
    if (piAmount < 1) {
        return showSymbol ? `π ${piAmount.toFixed(4)}` : piAmount.toFixed(4);
    }

    // For larger amounts, show 2 decimal places
    return showSymbol ? `π ${piAmount.toFixed(2)}` : piAmount.toFixed(2);
};

/**
 * Get Pi price information
 * @returns Object with Pi pricing details
 */
export const getPiPriceInfo = () => ({
    piPriceUSD: PI_PRICE_USD,
    piPriceKES: PI_PRICE_KES,
    usdToKes: USD_TO_KES,
    formattedPiPriceUSD: `$${PI_PRICE_USD.toLocaleString()}`,
    formattedPiPriceKES: `KES ${PI_PRICE_KES.toLocaleString()}`,
});

/**
 * Check if Pi payment is available (currently false, coming soon)
 * @returns boolean indicating if Pi payments are enabled
 */
export const isPiPaymentAvailable = (): boolean => {
    return false; // Coming soon
};
