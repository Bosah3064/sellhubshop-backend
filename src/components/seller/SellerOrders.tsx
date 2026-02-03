import { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  MessageCircle,
  MoreHorizontal,
  Eye,
  AlertCircle
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  total_price: number;
  product: {
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  delivery_fee: number;
  payment_method: string;
  payment_status: string;
  buyer: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  delivery_address: {
    full_name: string;
    phone_number: string;
    region: string;
    city: string;
    address_details: string;
  } | null;
  items: OrderItem[];
}

export function SellerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Correct Query: Fetch Order Items for this seller, including parent Order details

      let query = supabase
        .from("order_items")
        .select(`
          id,
          product_id,
          quantity,
          price_at_purchase,
          total_price,
          seller_id,
          product:products(name, images),
          order:marketplace_orders!inner(
            id,
            created_at,
            status,
            total_amount,
            delivery_fee,
            payment_method,
            payment_status,
            buyer:profiles(full_name, email, avatar_url),
            delivery_address:user_addresses(full_name, phone_number, region, city, address_details)
          )
        `)
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Transform flat items into grouped Orders
      const items = data as any[] || [];
      const ordersMap = new Map<string, Order>();

      items.forEach((item) => {
        const orderData = item.order;
        if (!orderData) return;
        
        if (!ordersMap.has(orderData.id)) {
          ordersMap.set(orderData.id, { ...orderData, items: [] });
        }
        
        const { order, ...cleanItem } = item;
        ordersMap.get(orderData.id)!.items.push(cleanItem);
      });

      let parsedOrders = Array.from(ordersMap.values());
      
      // AUTO-CANCEL LOGIC: Check for pending orders older than 24h
      const now = new Date();
      const expiredOrders = parsedOrders.filter(o => 
        o.status === 'pending' && 
        o.payment_status !== 'paid' && 
        (now.getTime() - new Date(o.created_at).getTime() > 24 * 60 * 60 * 1000)
      );

      if (expiredOrders.length > 0) {
        console.log("Auto-cancelling expired orders:", expiredOrders.map(o => o.id));
        await Promise.all(expiredOrders.map(o => 
           supabase.from('marketplace_orders').update({ status: 'cancelled' }).eq('id', o.id)
        ));
        // Update local state to reflect cancellation immediately
        parsedOrders = parsedOrders.map(o => 
           expiredOrders.find(eo => eo.id === o.id) ? { ...o, status: 'cancelled' } : o
        );
      }
      
      // Tab Filtering Logic:
      // PENDING: Status 'pending' (Unpaid)
      // COMPLETED: Status 'processing' OR 'completed' (Paid) OR 'shipped'
      // CANCELLED: Status 'cancelled'
      if (activeTab !== "all") {
         if (activeTab === 'completed') {
             // User Request: "Completed is the one paid"
             parsedOrders = parsedOrders.filter(o => o.status === 'completed' || o.status === 'processing' || o.payment_status === 'paid');
         } else if (activeTab === 'pending') {
             parsedOrders = parsedOrders.filter(o => o.status === 'pending' && o.payment_status !== 'paid');
         } else {
             parsedOrders = parsedOrders.filter(o => o.status === activeTab);
         }
      }

      setOrders(parsedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("marketplace_orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders(); // Refresh list
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const toggleRow = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.buyer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 rounded-full px-3">Completed</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 rounded-full px-3">Pending</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 rounded-full px-3">Cancelled</Badge>;
      case 'processing': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 rounded-full px-3">Paid (Processing)</Badge>;
      case 'shipped': return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 rounded-full px-3">Shipped</Badge>;
      default: return <Badge variant="secondary" className="capitalize">{status}</Badge>;
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const handleWhatsAppCustomer = (order: Order) => {
    if (!order.delivery_address?.phone_number) {
       toast.error("No phone number available");
       return;
    }
    const message = `Hi ${order.delivery_address.full_name}, regarding your order #${order.id.slice(0, 8)} on MarketHub...`;
    const url = `https://wa.me/${order.delivery_address.phone_number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading orders table...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter orders..."
            className="pl-8 bg-white border-muted shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px] mb-4 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
          <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg">Completed</TabsTrigger>
          <TabsTrigger value="cancelled" className="rounded-lg">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card className="border-0 shadow-sm ring-1 ring-gray-100 bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[100px]">Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-[400px] text-center">
                       <div className="flex flex-col items-center justify-center gap-3">
                         <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300" />
                         </div>
                         <h3 className="text-lg font-semibold text-gray-900">No {activeTab === 'all' ? '' : activeTab} orders found</h3>
                         <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                           {activeTab === 'all' 
                             ? "When you receive orders, they will appear here nicely formatted." 
                             : `You're all caught up! No ${activeTab} orders to display.`}
                         </p>
                       </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <>
                      <TableRow 
                        key={order.id} 
                        className={`cursor-pointer hover:bg-blue-50/30 transition-colors ${expandedOrders.has(order.id) ? 'bg-blue-50/50' : ''}`}
                        onClick={() => toggleRow(order.id)}
                      >
                        <TableCell className="font-mono text-xs font-medium">#{order.id.slice(0, 8)}</TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={order.buyer?.avatar_url || ""} />
                                <AvatarFallback>{order.buyer?.full_name?.charAt(0) || "U"}</AvatarFallback>
                             </Avatar>
                             <div className="flex flex-col">
                               <span className="text-sm font-medium">{order.buyer?.full_name || "Guest"}</span>
                               <span className="text-[10px] text-muted-foreground">{order.delivery_address?.city || "Local"}</span>
                             </div>
                           </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(order.created_at), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPrice(order.total_amount)}
                        </TableCell>
                        <TableCell>
                          {expandedOrders.has(order.id) ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Details Row */}
                      {expandedOrders.has(order.id) && (
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableCell colSpan={6} className="p-0">
                            <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                               <div className="grid md:grid-cols-2 gap-6">
                                  {/* Order Items */}
                                  <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                     <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Items Ordered</h4>
                                     {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0 border-gray-50">
                                           <img src={item.product?.images?.[0] || "/placeholder.svg"} className="h-10 w-10 rounded object-cover border" />
                                           <div className="flex-1">
                                              <p className="text-sm font-medium">{item.product?.name}</p>
                                              <p className="text-xs text-muted-foreground">{item.quantity} x {formatPrice(item.price_at_purchase)}</p>
                                           </div>
                                           <p className="text-sm font-semibold">{formatPrice(item.total_price)}</p>
                                        </div>
                                     ))}
                                     <div className="flex justify-between pt-2 text-sm font-medium border-t">
                                        <span>Delivery Fee</span>
                                        <span>{formatPrice(order.delivery_fee)}</span>
                                     </div>
                                  </div>

                                  {/* Actions & Info */}
                                  <div className="space-y-4">
                                     <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Delivery Details</h4>
                                        {order.delivery_address ? (
                                           <div className="text-sm space-y-1">
                                              <p className="font-medium">{order.delivery_address.full_name}</p>
                                              <p>{order.delivery_address.phone_number}</p>
                                              <p className="text-muted-foreground">{order.delivery_address.address_details}, {order.delivery_address.city}</p>
                                           </div>
                                        ) : <p className="text-sm italic text-muted-foreground">No address provided</p>}
                                        
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="w-full mt-3 text-green-600 border-green-200 hover:bg-green-50"
                                          onClick={() => handleWhatsAppCustomer(order)}
                                        >
                                           <MessageCircle className="h-4 w-4 mr-2" />
                                           WhatsApp Customer
                                        </Button>
                                     </div>

                                     <div className="flex gap-2">
                                        {order.status === 'pending' && (
                                           <>
                                             <Button 
                                                variant="outline" 
                                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" 
                                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                             >
                                                Cancel
                                             </Button>
                                             <Button 
                                                className="flex-1 bg-blue-600 hover:bg-blue-700" 
                                                onClick={() => updateOrderStatus(order.id, 'processing')}
                                             >
                                                Accept Order
                                             </Button>
                                           </>
                                        )}
                                        {order.status === 'processing' && (
                                            <Button 
                                              className="w-full bg-green-600 hover:bg-green-700" 
                                              onClick={() => updateOrderStatus(order.id, 'completed')}
                                            >
                                               <Truck className="h-4 w-4 mr-2" />
                                               Mark as Delivered
                                            </Button>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
