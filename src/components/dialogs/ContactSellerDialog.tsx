import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, Phone, MessageSquare, MessageCircle, Shield, Check, Eye, Lock, Copy } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface ContactSellerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sellerProfile: {
        full_name?: string;
        username?: string;
        profile_image?: string;
        rating?: number;
        total_reviews?: number;
        phone?: string;
        whatsapp?: string;
    } | null;
    product?: {
        name: string;
        price: number;
        currency?: string;
    };
}

export function ContactSellerDialog({
    open,
    onOpenChange,
    sellerProfile,
    product,
}: ContactSellerDialogProps) {
    const [isRevealed, setIsRevealed] = useState(false);

    // Reset revealed state when dialog opens/closes or seller changes
    useEffect(() => {
        if (!open) {
            setIsRevealed(false);
        }
    }, [open, sellerProfile]);

    if (!sellerProfile) return null;

    const maskPhoneNumber = (phone: string | undefined) => {
        if (!phone) return "N/A";
        if (phone.length < 8) return phone;
        return `${phone.slice(0, 6)} **** ${phone.slice(-3)}`;
    };

    const handleReveal = () => {
        setIsRevealed(true);
    };

    const displayName = sellerProfile.full_name || sellerProfile.username || "Seller";
    const displayPhone = sellerProfile.phone || "N/A";
    const whatsappNumber = sellerProfile.whatsapp || sellerProfile.phone;
    const productName = product?.name || "Product";
    const productPrice = product?.price?.toLocaleString() || "0";
    const currency = product?.currency || "KES";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">
                        Contact Seller
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center pt-2 pb-6 space-y-6">
                    {/* Seller Info */}
                    <div className="flex flex-col items-center">
                        <Avatar className="w-20 h-20 border-4 border-green-50 mb-3">
                            <AvatarImage src={sellerProfile.profile_image} />
                            <AvatarFallback className="text-2xl bg-green-100 text-green-700">
                                {displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-xl text-gray-900">{displayName}</h3>
                        {sellerProfile.rating !== undefined && (
                            <div className="flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium text-sm">
                                    {sellerProfile.rating.toFixed(1)}
                                </span>
                                <span className="text-gray-400 text-sm">
                                    ({sellerProfile.total_reviews || 0} reviews)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Phone Number Display */}
                    <div className="w-full bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100 relative overflow-hidden">
                        <div className="flex flex-col z-10">
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                Phone Number
                            </span>
                            <span className="text-xl font-mono font-bold text-gray-800 mt-0.5">
                                {isRevealed ? displayPhone : maskPhoneNumber(displayPhone)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 z-10">
                            {!isRevealed ? (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleReveal}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 gap-1.5"
                                >
                                    <Eye className="w-4 h-4" />
                                    Show
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        navigator.clipboard.writeText(displayPhone);
                                        toast.success("Number copied to clipboard");
                                    }}
                                    className="hover:bg-white hover:text-green-600 transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons Grid */}
                    {!isRevealed ? (
                        <div className="w-full">
                            <Button
                                className="w-full py-6 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-md transition-all gap-2"
                                onClick={handleReveal}
                            >
                                <Lock className="w-5 h-5" />
                                Reveal Contact Details
                            </Button>
                            <p className="text-xs text-center text-gray-400 mt-3">
                                Click to reveal phone number and contact options
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <a
                                href={`tel:${displayPhone}`}
                                className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-green-600 hover:text-green-600 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <Phone className="w-5 h-5" />
                                Call Now
                            </a>
                            <a
                                href={`sms:${displayPhone}`}
                                className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-500 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                <MessageSquare className="w-5 h-5" />
                                Send SMS
                            </a>
                            <a
                                href={`https://wa.me/${whatsappNumber}?text=Hi! I'm interested in your product: ${productName} - ${currency} ${productPrice}`}
                                target="_blank"
                                rel="noreferrer"
                                className="col-span-2 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                <MessageCircle className="w-5 h-5" />
                                Chat on WhatsApp
                            </a>
                        </div>
                    )}

                    {/* Safety Tip */}
                    <div className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-lg text-xs text-blue-700 w-full">
                        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>
                            <span className="font-semibold">Safety Tip:</span> For your protection, try to keep transactions within SellHub. Meet in public places for local pickups.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
