import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MapPin, Truck, ShieldCheck, CreditCard, ChevronRight, Plus, Check } from "lucide-react";
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
  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
      return;
    }
    fetchAddresses();
    fetchCounties();
    fetchSellerProfile();
  }, [cart, navigate]);

  // Re-calculate fee whenever address or profile changes
  useEffect(() => {
    if (selectedAddressId) {
       const addr = addresses.find(a => a.id === selectedAddressId);
       if (addr) {
         calculateDeliveryFee(addr.region);
       }
    }
  }, [selectedAddressId, sellerProfile, addresses]);

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

    if (region.toLowerCase().includes(businessLocation.toLowerCase()) || businessLocation.toLowerCase().includes(region.toLowerCase())) {
      console.log("Applying local delivery fee");
      setDeliveryFee(localFee);
    } else {
      console.log("Applying outside delivery fee");
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

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  // Poll for order status updates when expecting M-Pesa payment
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (paymentStatus === 'processing' && paymentMethod === 'mpesa') {
      interval = setInterval(async () => {
         // Check order status
         // We need the order ID. Since we don't have it in state easily without refactoring, 
         // let's just rely on the user checking or a manual refresh for now to avoid complexity,
         // OR better: save currentOrderId in state.
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [paymentStatus, paymentMethod]);

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddressId) return;

    setIsProcessing(true);
    setPaymentStatus('processing');
    
    try {
      // 1. Create Order
      const { data: order, error: orderError } = await (supabase
        .from("marketplace_orders") as any)
        .insert([{
          buyer_id: user.id,
          total_amount: getTotal() + deliveryFee,
          delivery_address_id: selectedAddressId,
          delivery_fee: deliveryFee,
          payment_method: paymentMethod,
          status: 'pending' // Initial status
        }])
        .select()
        .single();

      if (orderError) throw orderError;
      console.log("Order created:", order.id);

      // 2. Create Order Items
      const orderItems = cart.map(item => ({
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

      // 3. Handle Payment Initiation
      if (paymentMethod === 'mpesa') {
        toast.info("Order placed! Initiating M-Pesa STK Push...");
        
        // Get phone number from address or profile
        const addr = addresses.find(a => a.id === selectedAddressId);
        const phoneToBill = addr?.phone_number || ""; // Should ideally validate format

        try {
            // Call Backend for STK Push
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/v1/stk-push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Math.ceil(getTotal() + deliveryFee), // Ensure integer
                    phone: phoneToBill,
                    accountRef: order.id, // CRITICAL: Pass Order ID as Reference
                    description: `Order #${order.id.substring(0, 8)}`,
                    orderId: order.id // Pass ID for backend to link
                })
            });

            const result = await response.json();
            console.log("STK Push Result:", result);

            if (result.ResponseCode === "0") {
                toast.success("STK Push sent! Please check your phone.");
                // Redirect to dashboard or order status page after short delay
                setTimeout(() => {
                    clearCart();
                    navigate("/dashboard"); 
                }, 3000);
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
        // Wallet payment logic
        toast.info("Processing wallet payment...");
        
        const { data: rpcData, error: rpcError } = await supabase.rpc('pay_order_via_wallet', {
            p_order_id: order.id,
            p_buyer_id: user.id
        });

        if (rpcError) {
             console.error("Wallet Payment Error:", rpcError);
             toast.error("Wallet payment failed. Please try again.");
             setPaymentStatus('failed');
        } else {
            console.log("Wallet Payment Result:", rpcData);
            if (rpcData.success) {
                toast.success("Payment successful! Order completed.");
                clearCart();
                navigate("/dashboard");
            } else {
                toast.error("Payment failed: " + rpcData.message);
                setPaymentStatus('failed');
            }
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-black mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Delivery Address */}
            <Card className={step === 1 ? "border-primary ring-1 ring-primary" : ""}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Delivery Address
                  </CardTitle>
                  <CardDescription>Where should we send your items?</CardDescription>
                </div>
                {step > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-primary">
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
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold">{addr.full_name}</p>
                            <p className="text-sm text-gray-600">{addr.phone_number}</p>
                            <p className="text-sm mt-1">
                              {addr.address_details}, {addr.city}
                            </p>
                            <p className="text-sm font-medium text-primary uppercase text-[10px] tracking-wider mt-1">
                              {addr.region}
                            </p>
                          </div>
                          {selectedAddressId === addr.id && (
                            <div className="bg-primary text-white p-1 rounded-full">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {isAddingAddress ? (
                      <form onSubmit={handleAddAddress} className="space-y-4 p-4 border-2 border-dashed border-gray-200 rounded-xl">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                              id="full_name"
                              required
                              value={newAddress.full_name}
                              onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
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
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="region">County</Label>
                            <select
                              id="region"
                              className="w-full p-2 border rounded-md text-sm"
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
                                 className="w-full p-2 border rounded-md text-sm"
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
                              />
                            )}
                            {isManualCity && selectedCounty !== 'other' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-[10px] h-6 px-1"
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
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="ghost" onClick={() => setIsAddingAddress(false)}>Cancel</Button>
                          <Button type="submit" disabled={isProcessing}>Save Address</Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full border-dashed py-8 h-auto flex flex-col gap-2"
                        onClick={() => setIsAddingAddress(true)}
                      >
                        <Plus className="h-6 w-6" />
                        Add New Address
                      </Button>
                    )}

                    <Button
                      className="w-full mt-4"
                      disabled={!selectedAddressId}
                      onClick={() => setStep(2)}
                    >
                      Use this address
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p className="font-bold">{selectedAddress?.full_name}</p>
                    <p className="text-gray-600">{selectedAddress?.address_details}, {selectedAddress?.city}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Payment Method */}
            <Card className={step === 2 ? "border-primary ring-1 ring-primary" : ""}>
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
                          ? "border-primary bg-primary/5"
                          : "border-gray-100 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-700">M</div>
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
                          ? "border-primary bg-primary/5"
                          : "border-gray-100 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700">
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
                      <span className="text-gray-600">Delivery Fee</span>
                      <Truck className="h-3 w-3 text-gray-400" />
                    </div>
                    <span className="font-bold">KES {deliveryFee.toLocaleString()}</span>
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
                    className="w-full py-6 text-lg font-bold shadow-lg shadow-primary/25 mt-4"
                    disabled={step < 2 || isProcessing || !selectedAddressId}
                    onClick={handlePlaceOrder}
                  >
                    {isProcessing ? "Processing..." : "Pay Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
