import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, Plus, Minus, Trash2, CreditCard, ShoppingCart } from 'lucide-react';
import { cartService } from '@/services/cartService';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { createDebugClient } from '@/integrations/supabase/debugClient';
import { useDebug } from '@/contexts/DebugContext';

export const CartPage: React.FC = () => {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const { toast } = useToast();
  const { refreshCartCount } = useCart();
  const { addEntry } = useDebug();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await cartService.getCartWithItems();
      setCart(cartData);
    } catch (error) {
      toast({
        title: "Error loading cart",
        description: error instanceof Error ? error.message : "Failed to load cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      setUpdating(itemId);
      await cartService.updateCartItemQuantity(itemId, newQuantity);
      await loadCart(); // Refresh cart
      
      if (newQuantity === 0) {
        toast({
          title: "Item removed",
          description: "Item has been removed from your cart",
        });
      }
    } catch (error) {
      toast({
        title: "Error updating cart",
        description: error instanceof Error ? error.message : "Failed to update cart",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdating(itemId);
      await cartService.removeCartItem(itemId);
      await loadCart(); // Refresh cart
      
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      toast({
        title: "Error removing item",
        description: error instanceof Error ? error.message : "Failed to remove item",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleCheckout = async () => {
    if (!cart?.id) {
      toast({
        title: 'Error',
        description: 'No cart found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCheckingOut(true);
      const supabase = createDebugClient(addEntry);
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          cartId: cart.id,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/cart`
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Error',
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setCheckingOut(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      await cartService.clearCart();
      await loadCart(); // Refresh cart
      
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    } catch (error) {
      toast({
        title: "Error clearing cart",
        description: error instanceof Error ? error.message : "Failed to clear cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!cart?.cart_line_items) return 0;
    return cart.cart_line_items.reduce(
      (total, item) => total + (item.unit_price * item.quantity),
      0
    );
  };

  const getTotalItems = () => {
    if (!cart?.cart_line_items) return 0;
    return cart.cart_line_items.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Package className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const cartItems = cart?.cart_line_items || [];
  const isEmpty = cartItems.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            Your Cart
          </h1>
          {!isEmpty && (
            <Button variant="outline" onClick={clearCart} disabled={loading}>
              Clear Cart
            </Button>
          )}
        </div>

        {isEmpty ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">
                Add some items to your cart to get started
              </p>
              <Button onClick={() => window.history.back()}>
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {item.product_image_url && (
                        <img
                          src={item.product_image_url}
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg">{item.product_name}</h3>
                        <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Size: {item.size} • Material: {item.material}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          From: {(item as { microsites?: { name: string } }).microsites?.name || 'Unknown Microsite'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={updating === item.id || item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQty = Math.max(1, parseInt(e.target.value) || 1);
                            updateQuantity(item.id, newQty);
                          }}
                          className="w-16 text-center"
                          min="1"
                          disabled={updating === item.id}
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={updating === item.id}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${item.unit_price.toFixed(2)} each
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={updating === item.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cart Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Items ({getTotalItems()})</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={checkingOut || cartItems.length === 0}
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Checkout...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Proceed to Checkout
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                Items from multiple microsites will be processed as separate orders during checkout.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
};
