import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Calendar, DollarSign, MapPin, Truck } from 'lucide-react';
import { useOrderHistory } from '@/hooks/useOrderHistory';
import { useToast } from '@/hooks/use-toast';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);
  const { orders, loading, error, refetch, getOrderStatus } = useOrderHistory(searchAttempted ? email : '');
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to search for orders',
        variant: 'destructive',
      });
      return;
    }
    setSearchAttempted(true);
    refetch();
  };

  const handleUpdateStatus = async (orderId: string) => {
    setStatusLoading(orderId);
    try {
      const statusData = await getOrderStatus(orderId);
      if (statusData) {
        toast({
          title: 'Status Updated',
          description: `Order status: ${statusData.status}`,
        });
        refetch(); // Refresh the orders list
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch order status',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setStatusLoading(null);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'shipped':
        return 'outline';
      case 'fulfilled':
        return 'default';
      case 'canceled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle>Search Your Orders</CardTitle>
              <CardDescription>
                Enter your email address to view your order history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-email">Email Address</Label>
                  <Input
                    id="search-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      'Search Orders'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  Error: {error}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Orders Found */}
          {searchAttempted && !loading && !error && orders.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No orders found for this email address.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders List */}
          {orders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Orders ({orders.length})</h3>
              
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          Order #{order.id.slice(0, 8)}...
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ${order.total_cost.toFixed(2)}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id)}
                          disabled={statusLoading === order.id}
                        >
                          {statusLoading === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Truck className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Order Items */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Items:</h4>
                      <div className="space-y-1">
                        {order.order_items.map((item, index) => (
                          <div key={item.id} className="text-sm text-muted-foreground flex justify-between">
                            <span>
                              {item.size} sticker × {item.quantity}
                            </span>
                            <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div>
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Shipping Address:
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        {order.shipping_address.address1}
                        {order.shipping_address.address2 && `, ${order.shipping_address.address2}`}
                        <br />
                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
                        <br />
                        {order.shipping_address.country}
                      </div>
                    </div>

                    {/* Printful Order ID */}
                    {order.printful_order_id && (
                      <div className="text-xs text-muted-foreground">
                        Printful Order ID: {order.printful_order_id}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};