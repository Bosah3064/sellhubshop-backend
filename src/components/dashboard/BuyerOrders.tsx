import { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  MapPin,
  ChevronRight,
  Receipt,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderItem {
  id: string;
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
  payment_status: string;
  payment_method: string;
  seller_id: string;
  items: OrderItem[];
  seller?: {
      username: string;
      full_name: string;
  }
}

export function BuyerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const currentOrder = orders.find(o => o.id === selectedOrderId);

  useEffect(() => {
    fetchOrders();

    // ======= REALTIME SUBSCRIPTION =======
    const channel = supabase
      .channel('buyer-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_orders'
        },
        () => {
          console.log("Realtime update: Refreshing buyer orders");
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Orders placed by this user
      const { data, error } = await supabase
        .from("marketplace_orders")
        .select(`
          id,
          created_at,
          status,
          total_amount,
          delivery_fee,
          payment_method,
          payment_status,
          items:order_items(
            id,
            quantity,
            price_at_purchase,
            total_price,
            product:products(name, images)
          )
        `)
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match interface
      const parsedOrders = (data || []).map(o => ({
          ...o,
          items: o.items || []
      })) as Order[];

      setOrders(parsedOrders);
    } catch (error) {
      console.error("Error fetching my orders:", error);
      toast.error("Failed to load your orders");
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
      
      toast.success(newStatus === 'completed' ? "Order confirmed! Thank you." : `Order marked as ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const getStatusStep = (status: string, paymentStatus: string) => {
      if (status === 'cancelled') return -1;
      if (status === 'delivered' || status === 'completed') return 4;
      if (status === 'shipped') return 3;
      if (status === 'processing' || paymentStatus === 'paid') return 2;
      return 1; // Pending
  };

  const filteredOrders = orders.filter(order => 
     order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
     order.items.some(i => i.product.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <CardTitle>My Purchases</CardTitle>
                <CardDescription>Track and manage your orders</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No orders found</p>
                    <p className="text-sm text-gray-400">Time to go shopping!</p>
                </div>
            ) : (
                <div className="rounded-md border bg-white overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-gray-50/50">
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        #{order.id.slice(0, 8).toUpperCase()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {order.items.slice(0, 2).map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm">
                                                    <span className="text-gray-500">{item.quantity}x</span>
                                                    <span className="font-medium truncate max-w-[150px]">{item.product.name}</span>
                                                </div>
                                            ))}
                                            {order.items.length > 2 && (
                                                <span className="text-xs text-muted-foreground">+{order.items.length - 2} more...</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {format(new Date(order.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="font-bold text-gray-900">
                                        KES {order.total_amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={
                                                order.status === 'completed' || order.status === 'delivered' ? 'default' :
                                                order.status === 'shipped' ? 'secondary' :
                                                order.status === 'processing' || order.payment_status === 'paid' ? 'secondary' :
                                                order.status === 'cancelled' ? 'destructive' : 'outline'
                                            }
                                            className={
                                                order.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' :
                                                order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' :
                                                order.status === 'processing' || order.payment_status === 'paid' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' : 
                                                order.status === 'shipped' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200' : ''
                                            }
                                        >
                                            {order.status === 'processing' || order.payment_status === 'paid' ? 'In Progress' :
                                             order.status === 'shipped' ? 'Shipped' :
                                             order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => setSelectedOrderId(order.id)}>
                                                    Track Order
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                {!currentOrder ? (
                                                    <div className="p-8 text-center text-muted-foreground animate-pulse">Updating tracking data...</div>
                                                ) : (
                                                    <>
                                                        <DialogHeader>
                                                            <DialogTitle className="flex items-center justify-between">
                                                                <span>Order Tracking</span>
                                                                <Badge variant="outline" className="font-mono">#{currentOrder.id.slice(0, 8).toUpperCase()}</Badge>
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        
                                                        <div className="py-6">
                                                            {/* Stepper */}
                                                            <div className="relative flex items-center justify-between px-4 mb-8">
                                                                {/* Progress Line */}
                                                                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10"></div>
                                                                <div 
                                                                    className="absolute top-1/2 left-0 h-1 bg-green-500 transition-all duration-500 -z-10"
                                                                    style={{ width: `${((getStatusStep(currentOrder.status, currentOrder.payment_status) - 1) / 3) * 100}%` }}
                                                                ></div>

                                                                {[
                                                                    { step: 1, label: "Placed", icon: Receipt },
                                                                    { step: 2, label: "Paid/Processing", icon: CheckCircle2 },
                                                                    { step: 3, label: "Shipped", icon: Truck },
                                                                    { step: 4, label: "Delivered", icon: Package },
                                                                ].map((s) => {
                                                                    const currentStep = getStatusStep(currentOrder.status, currentOrder.payment_status);
                                                                    const isCompleted = currentStep >= s.step;
                                                                    const isCurrent = currentStep === s.step;

                                                                    return (
                                                                        <div key={s.step} className="flex flex-col items-center bg-white px-2">
                                                                            <div className={`
                                                                                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                                                                ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-300'}
                                                                                ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}
                                                                            `}>
                                                                                <s.icon className="w-5 h-5" />
                                                                            </div>
                                                                            <span className={`text-xs mt-2 font-medium ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                                                                {s.label}
                                                                            </span>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>

                                                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">Status:</span>
                                                                    <span className="font-bold text-gray-900 border-b-2 border-green-200 uppercase tracking-tighter">
                                                                        {currentOrder.status}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500">Estimated Delivery:</span>
                                                                    <span className="font-medium text-gray-900">
                                                                        {currentOrder.status === 'delivered' || currentOrder.status === 'completed' ? 'Arrived!' : 'Within 3-5 Business Days'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                                                            {(currentOrder.status === 'delivered' || currentOrder.status === 'shipped') && (
                                                                <Button 
                                                                    className="bg-green-600 hover:bg-green-700 text-white font-black px-6 shadow-lg shadow-green-100"
                                                                    onClick={() => updateOrderStatus(currentOrder.id, 'completed')}
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                                    Confirm Received
                                                                </Button>
                                                            )}
                                                            <Button variant="ghost" onClick={() => window.open(`https://wa.me/?text=Hi, inquiring about my order #${currentOrder.id.slice(0,8)}`, '_blank')}>
                                                                Contact Seller
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
