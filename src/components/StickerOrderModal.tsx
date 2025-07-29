import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Package, Truck } from 'lucide-react';

interface StickerOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string;
}

interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  size: string;
  color: string;
  color_code: string;
  image?: string;
  price: string;
  in_stock: boolean;
  availability_regions: any;
  availability_status: any[];
}

interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  variants: ProductVariant[];
  type: string;
  type_name: string;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ShippingAddress {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export const StickerOrderModal: React.FC<StickerOrderModalProps> = ({
  isOpen,
  onClose,
  qrDataUrl,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(25);
  const [customer, setCustomer] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [shipping, setShipping] = useState<ShippingAddress>({
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  const quantities = [25, 50, 100, 250, 500];

  const currentProduct = products.find(p => p.id === selectedProduct);
  const availableVariants = currentProduct?.variants?.filter(v => v.in_stock) || [];

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-select first available variant when product changes
    if (currentProduct && availableVariants.length > 0 && !selectedVariant) {
      setSelectedVariant(availableVariants[0]);
    }
  }, [currentProduct, availableVariants, selectedVariant]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('printful-products');
      
      if (error) throw error;
      
      setProducts(data.products || []);
      if (data.products?.length > 0) {
        setSelectedProduct(data.products[0].id);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch available products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!selectedVariant) return 0;
    
    let basePrice = parseFloat(selectedVariant.price);
    
    // Quantity discounts (same as before for now)
    if (quantity >= 500) basePrice *= 0.7;
    else if (quantity >= 250) basePrice *= 0.75;
    else if (quantity >= 100) basePrice *= 0.8;
    else if (quantity >= 50) basePrice *= 0.85;
    
    // Add markup (50%)
    return Math.ceil(basePrice * 1.5 * 100) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !customer.firstName || !customer.email || !shipping.address1) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      // First upload the QR code image to Printful
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
        'printful-upload-file',
        {
          body: {
            imageDataUrl: qrDataUrl,
            filename: 'qr-code.png',
          },
        }
      );

      if (uploadError) throw uploadError;

      // Create the order
      const orderItems = [{
        productId: selectedProduct,
        variantId: selectedVariant?.id.toString() || '',
        quantity,
        size: selectedVariant?.size || '',
        material: selectedVariant?.color || '',
        unitPrice: calculatePrice(),
      }];

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        'printful-create-order',
        {
          body: {
            customer,
            orderItems,
            fileId: uploadData.fileId,
            qrDataUrl,
            shippingAddress: shipping,
          },
        }
      );

      if (orderError) throw orderError;

      toast({
        title: 'Order Created!',
        description: `Your sticker order has been submitted. Order ID: ${orderData.orderId}`,
      });

      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Order Failed',
        description: 'Failed to create your sticker order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = calculatePrice() * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Custom QR Code Stickers
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Product Options</CardTitle>
              <CardDescription>
                Choose your sticker specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="variant">Variant</Label>
                  <Select 
                    value={selectedVariant?.id.toString() || ''} 
                    onValueChange={(value) => {
                      const variant = availableVariants.find(v => v.id.toString() === value);
                      setSelectedVariant(variant || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVariants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id.toString()}>
                          {variant.name} - {variant.size} - ${variant.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Select value={quantity.toString()} onValueChange={(value) => setQuantity(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quantities.map((q) => (
                      <SelectItem key={q} value={q.toString()}>
                        {q} stickers
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-accent rounded-lg">
                <div className="text-lg font-semibold">
                  Total: ${totalPrice.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  ${calculatePrice().toFixed(2)} per sticker × {quantity} stickers
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={customer.firstName}
                    onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={customer.lastName}
                    onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address1">Address Line 1 *</Label>
                <Input
                  id="address1"
                  value={shipping.address1}
                  onChange={(e) => setShipping({ ...shipping, address1: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  value={shipping.address2}
                  onChange={(e) => setShipping({ ...shipping, address2: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={shipping.state}
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={shipping.zip}
                    onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Order Stickers - $${totalPrice.toFixed(2)}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};