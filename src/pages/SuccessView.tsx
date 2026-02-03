
import { useEffect } from "react";
import { Check, CheckCircle2, MessageCircle, Truck } from "lucide-react";
import confetti from "canvas-confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SuccessView({ cart, currentOrderId, paymentMethod, groupedItems, user, getTotal, getTotalDeliveryFee, navigate, clearCart }: any) {
  
  // Trigger effects on mount of this view
  useEffect(() => {
    // 1. Immediately clear cart to reset bag to zero
    if (clearCart) {
        clearCart();
        console.log("[Success] Cart cleared automatically");
    }

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Auto-notify backend
    const notifyBackend = async () => {
        try {
            const total = Math.ceil(getTotal() + getTotalDeliveryFee());
            
            await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/whatsapp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: "0700000000", 
                    orderId: currentOrderId,
                    message: `New Order! ${cart?.length || 0} items. Total: ${total}`
                })
            });
            console.log("Backend notification sent");
        } catch (e) {
            console.error("Backend notify failed", e);
        }
    };
    notifyBackend();
    
    // Play sound
    try {
       const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"); 
       audio.volume = 0.6;
       audio.play();
    } catch(e) {}

  }, []);

  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-green-50 overflow-hidden relative">
       {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      <div className="h-40 bg-gradient-to-b from-green-500 to-green-600 flex flex-col items-center justify-center relative overflow-hidden text-white">
         <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm mb-2 shadow-inner">
            <CheckCircle2 className="h-16 w-16 text-white animate-bounce" />
         </div>
         <h2 className="text-3xl font-black tracking-tight">Order Placed!</h2>
         <p className="opacity-90 font-medium">Confirmation #{currentOrderId?.slice(0,8).toUpperCase()}</p>
      </div>
      
      <CardContent className="space-y-6 pt-8 pb-8 px-8">
        {/* Status Steps */}
        <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500">
                  <Check className="h-6 w-6 text-green-700" />
               </div>
               <div className="text-left">
                  <p className="font-bold text-gray-900">Payment Verified</p>
                  <p className="text-xs text-gray-500">Transaction confirmed via {paymentMethod === 'mpesa' ? 'M-Pesa' : 'Wallet'}</p>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500">
                  <Truck className="h-5 w-5 text-blue-700" />
               </div>
               <div className="text-left">
                  <p className="font-bold text-gray-900">Order Dispatched</p>
                  <p className="text-xs text-gray-500">Seller has been notified to prepare your items</p>
               </div>
            </div>
            
            <div className="h-px bg-gray-100 my-2"></div>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
               <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-500">Total Paid</span>
                  <span className="text-xl font-black text-gray-900">
                    {new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(getTotal() + getTotalDeliveryFee())}
                  </span>
               </div>
               <p className="text-[10px] text-gray-400 text-center italic">
                  Your shopping bag has been cleared for your next purchase.
               </p>
            </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 shadow-lg text-lg rounded-xl"
              onClick={() => navigate('/dashboard?tab=purchases')}
            >
               Track My Order 🚚
            </Button>
            
            <Button 
                variant="outline" 
                className="w-full h-12 border-gray-200 hover:bg-gray-100 rounded-xl font-semibold"
                onClick={() => navigate('/')}
            >
                Continue Shopping 🛍️
            </Button>

            <Button 
                variant="ghost" 
                size="sm"
                className="text-xs text-muted-foreground mt-2"
                onClick={() => {
                    try {
                        const total = Math.ceil(getTotal() + getTotalDeliveryFee());
                        const itemsList = cart?.map((i: any) => `➡️ ${i.quantity}x ${i.name}`).join('%0A') || "Items";
                        const message = `*👋 Hi! I just placed an order on SellHub!*%0A%0A*Order ID:* #${currentOrderId?.slice(0,8).toUpperCase()}%0A*Total:* KES ${total}%0A%0A*Items:*%0A${itemsList}%0A%0A_Please let me know once you've received it!_`;
                        window.open(`https://wa.me/?text=${message}`, '_blank');
                    } catch(e) {}
                }}
            >
                Manual proof (WhatsApp)
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
