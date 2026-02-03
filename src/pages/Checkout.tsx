import React, { useState, useEffect } from "react";
import confetti from 'canvas-confetti';
import { useNavigate } from "react-router-dom";
import { SuccessView } from "./SuccessView";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react"; // Import CheckCircle2 here explicitly if not present
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MapPin, Truck, ShieldCheck, CreditCard, ChevronRight, Plus, Check, History, MessageCircle, PartyPopper } from "lucide-react";
import { toast } from "sonner";

interface Address {
  id: string;
  full_name: string;
  phone_number: string;
  region: string;
  city: string;
  address_details: string;
  is_default: boolean;
}

interface LocationNode {
  id: string;
  name: string;
  type: 'county' | 'location';
}

export default function Checkout() {
  const navigate = useNavigate();


  const { cart, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: "",
    phone_number: "",
    region: "Nairobi",
    city: "",
    address_details: "",
  });
  
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "wallet">("mpesa");
  const [isProcessing, setIsProcessing] = useState(false);
  const [counties, setCounties] = useState<LocationNode[]>([]);
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [selectedCounty, setSelectedCounty] = useState("");
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [isManualCity, setIsManualCity] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);

  /* -------------------------------------------------------------------------- */
  /*                        Multi-Seller Logic Implementation                   */
  /* -------------------------------------------------------------------------- */
  
  // Group cart items by seller
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, typeof cart> = {};
    cart.forEach(item => {
      if (!groups[item.seller_id]) groups[item.seller_id] = [];
      groups[item.seller_id].push(item);
    });
    return groups;
  }, [cart]);

  const [sellerProfiles, setSellerProfiles] = useState<Record<string, any>>({});
  const [deliveryFees, setDeliveryFees] = useState<Record<string, number>>({});

  const fetchAllSellerProfiles = async () => {
    const sellerIds = Object.keys(groupedItems);
    if (sellerIds.length === 0) return;

    console.log("Fetching profiles for sellers:", sellerIds);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', sellerIds);
    
    if (error) {
      console.error("Error fetching seller profiles:", error);
    }
      
    if (data) {
      const profilesMap: Record<string, any> = {};
      data.forEach(p => profilesMap[p.id] = p);
      setSellerProfiles(profilesMap);
    }
  };

  const calculateAllDeliveryFees = (buyerRegion: string) => {
    const newFees: Record<string, number> = {};
    const normalizedBuyerRegion = buyerRegion.toLowerCase().trim();

    Object.keys(groupedItems).forEach(sellerId => {
       const profile = sellerProfiles[sellerId];
       if (!profile) {
           // Fallback if profile not loaded
           newFees[sellerId] = buyerRegion === "Nairobi" ? 200 : 450;
           return;
       }

       const businessLocation = profile.business_location || "Nairobi";
       const localFee = Number(profile.local_delivery_fee) || 200;
       const outsideFee = Number(profile.outside_delivery_fee) || 350;
       const normalizedBizLoc = businessLocation.toLowerCase().trim();

       if (normalizedBuyerRegion.includes(normalizedBizLoc) || normalizedBizLoc.includes(normalizedBuyerRegion)) {
           newFees[sellerId] = localFee;
       } else {
           newFees[sellerId] = outsideFee;
       }
    });

    setDeliveryFees(newFees);
  };

  const getTotalDeliveryFee = () => Object.values(deliveryFees).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
      return;
    }
    fetchAddresses();
    fetchCounties();
    fetchSellerProfile(); // Keep for backward compatibility
    fetchAllSellerProfiles(); // Multi-seller
  }, [cart, navigate]);

  // Re-calculate fees whenever address or profiles change
  useEffect(() => {
    if (selectedAddressId && Object.keys(sellerProfiles).length > 0) {
       const addr = addresses.find(a => a.id === selectedAddressId);
       if (addr) {
         calculateAllDeliveryFees(addr.region);
         calculateDeliveryFee(addr.region); // Keep for backward compatibility
       }
    }
  }, [selectedAddressId, sellerProfiles, sellerProfile, addresses]);

  const fetchCounties = async () => {
    const { data, error } = await supabase
      .from('location_nodes')
      .select('*')
      .eq('type', 'county')
      .order('name');
    
    if (data) setCounties(data as any);
  };

  const fetchLocations = async (countyId: string) => {
    if (!countyId || countyId === 'other') {
      setLocations([]);
      return;
    }
    const { data, error } = await supabase
      .from('location_nodes')
      .select('*')
      .eq('parent_id', countyId)
      .order('name');
    
    if (data) setLocations(data as any);
  };

  const fetchSellerProfile = async () => {
    if (cart.length > 0 && cart[0].seller_id) {
      console.log("Fetching seller profile for:", cart[0].seller_id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', cart[0].seller_id)
        .single();
      
      if (error) {
        console.error("Error fetching seller profile:", error);
      }
      
      if (data) {
        console.log("Seller profile loaded:", data);
        setSellerProfile(data);
      }
    } else {
      console.warn("No seller ID found in cart items");
    }
  };

  const calculateDeliveryFee = (region: string, profile: any = sellerProfile) => {
    console.log("Calculating delivery fee for region:", region, "Profile:", profile);
    
    if (!profile) {
      console.warn("Seller profile not loaded yet, using default fallback fees");
      // Fallback
      if (region === "Nairobi") setDeliveryFee(200);
      else setDeliveryFee(450);
      return;
    }

    const businessLocation = profile.business_location || "Nairobi";
    const localFee = Number(profile.local_delivery_fee) || 200;
    const outsideFee = Number(profile.outside_delivery_fee) || 350;

    console.log(`Fees - Local: ${localFee}, Outside: ${outsideFee}, Biz Loc: ${businessLocation}`);

    const normalizedRegion = region.toLowerCase().trim();
    const normalizedBizLoc = businessLocation.toLowerCase().trim();

    console.log(`[Fee Calc] Region: "${normalizedRegion}"`);
    console.log(`[Fee Calc] Business Location: "${normalizedBizLoc}"`);
    console.log(`[Fee Calc] Configured Fees - Local: ${localFee}, Outside: ${outsideFee}`);

    if (normalizedRegion.includes(normalizedBizLoc) || normalizedBizLoc.includes(normalizedRegion)) {
      console.log("[Fee Calc] MATCH: Applying local delivery fee:", localFee);
      setDeliveryFee(localFee);
    } else {
      console.log("[Fee Calc] NO MATCH: Applying outside delivery fee:", outsideFee);
      setDeliveryFee(outsideFee);
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;
    const { data, error } = await (supabase
      .from("user_addresses") as any)
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (error) {
      console.error("Error fetching addresses:", error);
    } else {
      setAddresses(data || []);
      const defaultAddr = data?.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        calculateDeliveryFee(defaultAddr.region);
      }
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsProcessing(true);
    const { data, error } = await (supabase
      .from("user_addresses") as any)
      .insert([{
        user_id: user.id,
        ...newAddress,
        is_default: addresses.length === 0
      }])
      .select();

    setIsProcessing(false);
    if (error) {
      toast.error("Failed to add address: " + error.message);
    } else {
      toast.success("Address added successfully");
      fetchAddresses();
      setIsAddingAddress(false);
      if (data && data[0]) {
        setSelectedAddressId(data[0].id);
        calculateDeliveryFee(data[0].region);
      }
    }
  };

  const handleSelectAddress = (id: string, region: string) => {
    setSelectedAddressId(id);
    calculateDeliveryFee(region);
  };

  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');

  // SMART POLLING: Check for payment status while modal is open
  useEffect(() => {
    if (!waitingForPayment || !currentOrderId) return;
    
    const checkPayment = async () => {
       try {
          const { data } = await supabase
             .from('marketplace_orders')
             .select('payment_status')
             .eq('id', currentOrderId)
             .single();
             
          if (data && data.payment_status === 'paid') {
              toast.success("Payment Received!");
              setPaymentStatus('success');
              setWaitingForPayment(false);
          }
       } catch (e) {
         // Silent fail on poll error
       }
    };
    
    const interval = setInterval(checkPayment, 3000); // Check every 3s
    return () => clearInterval(interval);
  }, [waitingForPayment, currentOrderId]);


  useEffect(() => {
    if (!waitingForPayment || !currentOrderId) return;

    console.log("Listening for payment updates on order:", currentOrderId);
    
    const channel = supabase
      .channel(`order_updates_${currentOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_orders',
          filter: `id=eq.${currentOrderId}`,
        },
        (payload) => {
          console.log("Order update received:", payload);
          const newStatus = payload.new.status;
          
          if (newStatus === 'paid' || newStatus === 'completed' || payload.new.payment_status === 'paid') {
            toast.success("Payment Received! Completing order...");
            setWaitingForPayment(false);
            setPaymentStatus('success');
            clearCart();
          } else if (newStatus === 'failed' || newStatus === 'cancelled') {
             setWaitingForPayment(false);
             setPaymentStatus('failed');
             toast.error("Payment failed or was cancelled.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [waitingForPayment, currentOrderId, navigate, clearCart]);

  // Manual payment check fallback
  const checkPaymentStatus = async () => {
    if (!currentOrderId || !checkoutRequestId) {
        toast.error("Missing transaction details.");
        return;
    }
    
    toast.info("Verifying with M-Pesa...");
    
    try {
        // 1. Call Backend Query Endpoint to force-check Safaricom
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/v1/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkoutRequestID: checkoutRequestId })
        });
        
        const result = await response.json();
        console.log("Manual Query Result:", result);

        if (result.ResultCode === "0") {
             toast.success("Payment confirmed! Completing order...");
             setWaitingForPayment(false);
             setPaymentStatus('success');
             clearCart();
             return;
        } else if (result.errorCode) {
             // Safaricom logic has not completed yet or error
             toast.info("Payment not yet detected. Please wait a moment and try again.");
        } else {
             toast.warning("Payment status: " + (result.ResultDesc || "Pending"));
        }

    } catch (err) {
        console.error("Verification failed", err);
    }

    // 2. Fallback: Check Supabase directly (in case callback worked but query failed)
    const { data: order, error } = await supabase
      .from("marketplace_orders")
      .select("status, payment_status")
      .eq("id", currentOrderId)
      .single();

    if (error) return;

    if (order.status === 'paid' || order.payment_status === 'paid') {
        toast.success("Payment confirmed!");
        setWaitingForPayment(false);
        setPaymentStatus('success');
        clearCart();
        navigate("/dashboard");
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddressId) return;

    setIsProcessing(true);
    setPaymentStatus('processing');
    
    try {
      const sellerIds = Object.keys(groupedItems);
      const createdOrderIds: string[] = [];

      // 1. Create Multiple Orders (One per Seller)
      for (const sellerId of sellerIds) {
          const items = groupedItems[sellerId];
          const sellerFee = deliveryFees[sellerId] || 0;
          const subtotal = items.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
          const totalForSeller = Math.ceil(subtotal + sellerFee);

          const { data: order, error: orderError } = await (supabase
            .from("marketplace_orders") as any)
            .insert([{
              buyer_id: user.id,
              total_amount: totalForSeller,
              delivery_address_id: selectedAddressId,
              delivery_fee: sellerFee,
              payment_method: paymentMethod,
              status: 'pending' // Initial status
            }])
            .select()
            .single();

          if (orderError) throw orderError;
          createdOrderIds.push(order.id);

          // 2. Create Order Items for this Seller's Order
          const orderItems = items.map(item => ({
            order_id: order.id,
            product_id: item.id,
            seller_id: item.seller_id,
            quantity: item.quantity || 1,
            price_at_purchase: item.price,
            total_price: item.price * (item.quantity || 1)
          }));

          const { error: itemsError } = await (supabase
            .from("order_items") as any)
            .insert(orderItems);

          if (itemsError) throw itemsError;
      }
      
      if (createdOrderIds.length > 0) {
          setCurrentOrderId(createdOrderIds[0]); // Listen to the first one for updates
      }

      // 3. Handle Payment Initiation
      if (paymentMethod === 'mpesa') {
        toast.info("Orders placed! Initiating M-Pesa STK Push...");
        
        // Get phone number from address
        const addr = addresses.find(a => a.id === selectedAddressId);
        const phoneToBill = addr?.phone_number || ""; 
        const grandTotal = Math.ceil(getTotal() + getTotalDeliveryFee());

        try {
            // Call Backend for STK Push - Using the First Order ID as the Reference
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/v1/stk-push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: grandTotal, 
                    phone: phoneToBill,
                    accountRef: createdOrderIds[0], // Only one ref allowed
                    description: `Order Bundle (${createdOrderIds.length})`,
                    orderId: createdOrderIds[0] 
                })
            });

            const result = await response.json();
            console.log("STK Push Result:", result);

            if (result.ResponseCode === "0") {
                toast.success("STK Push sent! Please check your phone.");
                setCheckoutRequestId(result.CheckoutRequestID); 
                setWaitingForPayment(true);
            } else {
                toast.error("M-Pesa request failed: " + (result.errorMessage || "Unknown error"));
                setPaymentStatus('failed');
            }
        } catch (apiError) {
            console.error(apiError);
            toast.error("Failed to contact payment server.");
            setPaymentStatus('failed');
        }

      } else {
        // Wallet payment logic - Pay EACH order individually
        toast.info("Processing wallet payment...");
        let successCount = 0;

        for (const oId of createdOrderIds) {
            const { data: rpcData, error: rpcError } = await supabase.rpc('pay_order_via_wallet', {
                p_order_id: oId,
                p_buyer_id: user.id
            });

            const response: any = rpcData; // Handle 'unknown' type
            
            if (!rpcError && response?.success) {
                successCount++;
            } else {
                console.error(`Wallet Payment Failed for Order ${oId}`, rpcError || response);
            }
        }

        if (successCount === createdOrderIds.length) {
            toast.success("Payment confirmed! Sellers notified.");
            setPaymentStatus('success');
            
            // Update Order Status to 'processing' so it appears as "Completed/Paid" to seller
            await Promise.all(createdOrderIds.map(oId => 
               supabase.from('marketplace_orders').update({ 
                 status: 'processing', 
                 payment_status: 'paid' 
               }).eq('id', oId)
            ));

            // Notify Sellers Automatically (Real Insert)
            const sellers = Object.keys(groupedItems);
            Promise.all(sellers.map(async (sellerId) => {
               try {
                   await supabase.from('notifications').insert({
                       user_id: sellerId,
                       title: 'New Order Received!',
                       message: `Order #${createdOrderIds[0]?.slice(0,8)} has been placed. Check your orders tab.`,
                       type: 'order', // Assuming 'type' column exists, otherwise 'system'
                       is_read: false
                   });
                   console.log(`[System] Notification inserted for seller ${sellerId}`);
               } catch (err) {
                   console.error("Failed to insert notification", err);
               }
            }));

            // Play Success Sound
            try {
               const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"); // Success chime
               audio.volume = 0.6;
               audio.play();
            } catch(e) {}
        } else if (successCount > 0) {
            toast.warning(`Partial payment success (${successCount}/${createdOrderIds.length} orders). Contact support.`);
            setPaymentStatus('failed'); // Show fail or partial state
        } else {
             toast.error("Wallet payment failed completely.");
             setPaymentStatus('failed');
        }
      }
    } catch (error: any) {
      console.error("Order processing error:", error);
      toast.error("Order failed: " + error.message);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  return (
    <div className="min-h-screen bg-gray-50 py-12 relative animate-fade-in">
      {/* Payment Processing Modal Overlay */}
      {waitingForPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <Card className="max-w-md w-full animate-in zoom-in-95 shadow-2xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto relative w-24 h-24 mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                        <div className="absolute inset-2 bg-green-500/30 rounded-full animate-pulse"></div>
                        <div className="relative bg-white rounded-full p-4 shadow-xl border-4 border-green-500">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-black text-green-700">Scanning Network...</CardTitle>
                    <CardDescription className="text-base font-medium text-gray-600">
                        Connecting to {addresses.find(a => a.id === selectedAddressId)?.phone_number}...
                        <br/>
                        <span className="text-xs text-muted-foreground font-mono mt-1 block">ID: {currentOrderId?.slice(0,8).toUpperCase()}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-sm text-center">
                        <p className="font-semibold text-green-800 mb-1">Please enter your M-Pesa PIN</p>
                        <p className="text-green-600 text-xs">Waiting for confirmation signal...</p>
                    </div>
                    
                    <Button 
                        onClick={checkPaymentStatus} 
                        className="w-full" 
                        variant="secondary"
                    >
                        I have paid (Check Status)
                    </Button>
                    <Button 
                        onClick={() => setWaitingForPayment(false)} 
                        variant="ghost" 
                        className="w-full text-muted-foreground hover:text-destructive"
                    >
                        Cancel / I didn't verify
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}
      {/* SUCCESS VIEW - Smart Celebration & WhatsApp */}
      {paymentStatus === 'success' ? (
                    <div className="container mx-auto px-4 max-w-2xl py-12 text-center animate-in zoom-in-95 duration-500">
                        <SuccessView 
                            cart={cart}
                            currentOrderId={currentOrderId} 
                            paymentMethod={paymentMethod}
                            groupedItems={groupedItems}
                            user={user}
                            getTotal={getTotal}
                            getTotalDeliveryFee={getTotalDeliveryFee}
                            navigate={navigate}
                            clearCart={clearCart}
                        />
                    </div>
                ) : (
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-black mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Delivery Address */}
            <Card className={step === 1 ? "border-primary ring-1 ring-primary shadow-lg" : "shadow-sm"}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Delivery Address
                  </CardTitle>
                  <CardDescription>Where should we send your items?</CardDescription>
                </div>
                {step > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-primary hover:bg-primary/5">
                    Change
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {step === 1 ? (
                  <div className="space-y-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr.id, addr.region)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? "border-primary bg-primary/5 shadow-md scale-[1.01]"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold">{addr.full_name}</p>
                            <p className="text-sm text-gray-600 font-medium">{addr.phone_number}</p>
                            <p className="text-sm mt-1 text-muted-foreground">
                              {addr.address_details}, {addr.city}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {addr.region}
                                </span>
                                {addr.is_default && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Default</span>}
                            </div>
                          </div>
                          {selectedAddressId === addr.id && (
                            <div className="bg-primary text-white p-1 rounded-full shadow-sm">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isAddingAddress ? (
                      <form onSubmit={handleAddAddress} className="space-y-4 p-6 border-2 border-dashed border-primary/20 bg-primary/5 rounded-xl animate-in fade-in-50">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                              id="full_name"
                              required
                              value={newAddress.full_name}
                              onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                              className="bg-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              required
                              placeholder="07..."
                              value={newAddress.phone_number}
                              onChange={(e) => setNewAddress({ ...newAddress, phone_number: e.target.value })}
                               className="bg-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="region">County</Label>
                            <select
                              id="region"
                              className="w-full p-2 border rounded-md text-sm bg-white"
                              value={selectedCounty}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedCounty(val);
                                if (val === 'other') {
                                  setNewAddress({ ...newAddress, region: "Other", city: "" });
                                  setIsManualCity(true);
                                } else {
                                  const countyName = counties.find(c => c.id === val)?.name || "";
                                  setNewAddress({ ...newAddress, region: countyName });
                                  fetchLocations(val);
                                  setIsManualCity(false);
                                }
                              }}
                            >
                              <option value="">Select County</option>
                              {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              <option value="other">Other (Type manually)</option>
                            </select>
                            {selectedCounty === 'other' && (
                              <Input
                                className="mt-2"
                                placeholder="Enter County name"
                                onChange={(e) => setNewAddress({ ...newAddress, region: e.target.value })}
                              />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city">City/Area</Label>
                            {!isManualCity && locations.length > 0 ? (
                               <select
                                 id="city"
                                 className="w-full p-2 border rounded-md text-sm bg-white"
                                 value={newAddress.city}
                                 onChange={(e) => {
                                   const val = e.target.value;
                                   if (val === 'other') {
                                     setIsManualCity(true);
                                     setNewAddress({ ...newAddress, city: "" });
                                   } else {
                                     setNewAddress({ ...newAddress, city: val });
                                   }
                                 }}
                               >
                                 <option value="">Select City</option>
                                 {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                 <option value="other">Other (Type manually)</option>
                               </select>
                            ) : (
                              <Input
                                id="city"
                                required
                                value={newAddress.city}
                                placeholder="Enter City/Area name"
                                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                 className="bg-white"
                              />
                            )}
                            {isManualCity && selectedCounty !== 'other' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-[10px] h-6 px-1 text-primary hover:text-primary/80"
                                  onClick={() => setIsManualCity(false)}
                                >
                                  Back to list
                                </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="details">Specific Address Details</Label>
                          <Input
                            id="details"
                            required
                            placeholder="Building, Floor, Room Number..."
                            value={newAddress.address_details}
                            onChange={(e) => setNewAddress({ ...newAddress, address_details: e.target.value })}
                             className="bg-white"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                          <Button type="button" variant="ghost" onClick={() => setIsAddingAddress(false)}>Cancel</Button>
                          <Button type="submit" disabled={isProcessing}>Save Address</Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full border-dashed py-8 h-auto flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                        onClick={() => setIsAddingAddress(true)}
                      >
                        <Plus className="h-6 w-6 text-primary" />
                        <span className="font-semibold">Add New Address</span>
                      </Button>
                    )}

                    <Button
                      className="w-full mt-4 font-bold text-lg h-12"
                      disabled={!selectedAddressId}
                      onClick={() => setStep(2)}
                    >
                      Use this address
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm border-l-4 border-primary pl-4 py-1">
                    <p className="font-bold text-base">{selectedAddress?.full_name}</p>
                    <p className="text-gray-600">{selectedAddress?.address_details}, {selectedAddress?.city}</p>
                    <p className="text-gray-400 text-xs mt-1">{selectedAddress?.phone_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Payment Method */}
            <Card className={step === 2 ? "border-primary ring-1 ring-primary shadow-lg" : "shadow-sm opacity-90"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
                <CardDescription>Choose how you want to pay</CardDescription>
              </CardHeader>
              <CardContent>
                {step >= 2 && (
                  <div className="space-y-4">
                    <div
                      onClick={() => setPaymentMethod("mpesa")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                        paymentMethod === "mpesa"
                          ? "border-primary bg-primary/5 shadow-md scale-[1.01]"
                          : "border-gray-100 opacity-60 hover:opacity-100 hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-700 shadow-sm">M</div>
                      <div className="flex-1">
                        <p className="font-bold">M-Pesa</p>
                        <p className="text-xs text-gray-500">Secure mobile payment</p>
                      </div>
                      {paymentMethod === "mpesa" && <Check className="h-5 w-5 text-primary" />}
                    </div>

                    <div
                      onClick={() => setPaymentMethod("wallet")}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                        paymentMethod === "wallet"
                          ? "border-primary bg-primary/5 shadow-md scale-[1.01]"
                          : "border-gray-100 opacity-60 hover:opacity-100 hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 shadow-sm">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">SellHub Wallet</p>
                        <p className="text-xs text-gray-500">Pay using your earnings</p>
                      </div>
                      {paymentMethod === "wallet" && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24 border-0 shadow-xl overflow-hidden">
              <div className="bg-primary p-4 text-white">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items Total ({cart.length})</span>
                    <span className="font-bold">KES {getTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1 group relative">
                       <span className="text-gray-600">
                         Delivery Fee 
                         <span className="text-xs text-muted-foreground ml-1">
                           ({deliveryFee === (sellerProfile?.local_delivery_fee || 200) ? "Local" : "Standard"})
                         </span>
                      </span>
                      <Truck className="h-3 w-3 text-gray-400" />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 ml-1 rounded-full hover:bg-muted"
                        onClick={() => {
                          toast.info("Updating delivery fees...");
                          fetchSellerProfile();
                          if (selectedAddressId && addresses.find(a => a.id === selectedAddressId)) {
                             calculateDeliveryFee(addresses.find(a => a.id === selectedAddressId)!.region);
                          }
                        }}
                        title="Refresh delivery fees"
                      >
                        <History className="h-3 w-3 text-primary" />
                      </Button>
                    </div>
                    <span className="font-bold">KES {deliveryFee.toLocaleString()}</span>
                  </div>
                  
                  {/* Debug Info for User */}
                  <div className="text-[10px] text-gray-400 bg-gray-100 p-2 rounded border border-gray-200 mt-1">
                    <p><strong>Debug Info (Dev Only):</strong></p>
                    <p>Seller: {sellerProfile?.full_name || "Loading..."} ({cart[0]?.seller_id?.substring(0,6)}...)</p>
                    <p>Biz Loc: "{sellerProfile?.business_location}" | Your Region: "{addresses.find(a => a.id === selectedAddressId)?.region}"</p>
                    <p>Fee Config: Local={sellerProfile?.local_delivery_fee}, Out={sellerProfile?.outside_delivery_fee}</p>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total Amount</span>
                    <span className="font-black text-primary">KES {(getTotal() + deliveryFee).toLocaleString()}</span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-2 mt-4">
                    <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-[10px] text-gray-500 leading-tight">
                      Your payment is held securely in escrow until you confirm receipt of your items.
                    </p>
                  </div>

                  <Button
                    className="w-full py-6 text-lg font-bold shadow-lg shadow-primary/25 mt-4 group"
                    disabled={step < 2 || isProcessing || !selectedAddressId}
                    onClick={handlePlaceOrder}
                  >
                    {isProcessing ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            Pay Now
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
