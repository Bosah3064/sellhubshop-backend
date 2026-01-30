import React from "react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getGroupedItems, getTotal, getItemCount } = useCart();
  const groupedItems = getGroupedItems();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <SEO title="Your Cart - SellHub" description="Your shopping cart is empty." />
        <div className="max-w-md mx-auto">
          <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added anything to your cart yet. Browse our marketplace to find amazing products.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link to="/marketplace">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO title="Your Cart - SellHub" description="Review items in your cart and proceed to checkout." />
      <h1 className="text-3xl font-bold mb-8">Shopping Cart ({getItemCount()} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {Object.entries(groupedItems).map(([sellerId, group]) => (
            <Card key={sellerId} className="overflow-hidden border-none shadow-sm bg-muted/30">
              <div className="bg-muted px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Seller:</span>
                  <span className="font-semibold text-primary">{group.sellerName}</span>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                  {group.items.length} items
                </Badge>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-muted">
                  {group.items.map((item) => (
                    <div key={item.id} className="p-6 flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="text-muted-foreground w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-primary font-bold mt-1">
                            KSh {item.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-sm text-muted-foreground">Subtotal</p>
                            <p className="font-semibold">
                              KSh {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-none shadow-lg overflow-hidden">
            <div className="bg-primary/5 p-6 border-b border-primary/10">
              <h2 className="text-xl font-bold">Order Summary</h2>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>KSh {getTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600 font-medium">Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">KSh {getTotal().toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                By proceeding to checkout, you agree to our Terms of Service and Privacy Policy.
              </p>
              <Button className="w-full h-12 text-lg mt-6 group" onClick={() => navigate('/checkout')}>
                Proceed to Checkout
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="ghost" className="w-full mt-2" asChild>
                <Link to="/marketplace">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
