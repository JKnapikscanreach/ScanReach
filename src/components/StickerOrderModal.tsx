import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Truck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/utils/supabase/client';

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
  id: number;
  title: string;
  description: string;
  image: string;
  variants: ProductVariant[];
  type: string;
  type_name: string;
}

interface CustomerInfo {
  name: string;
  email: string;
}

interface ShippingAddress {
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
];

export const StickerOrderModal: React.FC<StickerOrderModalProps> = ({
  isOpen,
  onClose,
  qrDataUrl,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
  });
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    address1: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
  });

  const currentProduct = products.find(p => p.id === selectedProduct);
  const availableVariants = currentProduct?.variants?.filter(v => v.in_stock) || [];

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setErrors([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentProduct && availableVariants.length > 0) {
      setSelectedVariant(availableVariants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('printful-products');
      
      if (error) {
        throw error;
      }
      
      setProducts(data?.products || []);
      if (data?.products?.length > 0) {
        setSelectedProduct(data.products[0].id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrors([`Failed to fetch available products: ${errorMessage}`]);
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
    return parseFloat(selectedVariant.price);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!selectedProduct) newErrors.push('Please select a product');
    if (!selectedVariant) newErrors.push('Please select a variant');
    if (!customerInfo.name.trim()) newErrors.push('Name is required');
    if (!customerInfo.email.trim()) newErrors.push('Email is required');
    if (customerInfo.email && !/\S+@\S+\.\S+/.test(customerInfo.email)) newErrors.push('Please enter a valid email address');
    if (!shippingAddress.address1.trim()) newErrors.push('Address line 1 is required');
    if (!shippingAddress.city.trim()) newErrors.push('City is required');
    if (!shippingAddress.state.trim()) newErrors.push('State is required');
    if (!shippingAddress.zip.trim()) newErrors.push('ZIP code is required');
    if (quantity < 1 || quantity > 10) newErrors.push('Quantity must be between 1 and 10');
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setUploading(true);
    
    try {
      const supabase = createClient();
      
      // Upload QR code
      const uploadResponse = await supabase.functions.invoke('printful-upload-file', {
        body: { 
          imageDataUrl: qrDataUrl, 
          filename: `qr-code-${Date.now()}.png` 
        }
      });

      if (uploadResponse.error) {
        throw new Error(uploadResponse.error.message || 'Failed to upload QR code');
      }

      const { fileId } = uploadResponse.data;
      if (!fileId) {
        throw new Error('Upload succeeded but no file ID returned');
      }

      setLoading(true);
      
      const orderData = {
        customer: {
          firstName: customerInfo.name.split(' ')[0] || customerInfo.name,
          lastName: customerInfo.name.split(' ').slice(1).join(' ') || '',
          email: customerInfo.email.trim().toLowerCase(),
          phone: shippingAddress.phone || '',
        },
        orderItems: [{
          productId: selectedProduct?.toString(),
          variantId: selectedVariant?.id.toString(),
          quantity: parseInt(quantity.toString()),
          size: selectedVariant?.size || '',
          material: selectedVariant?.color || '',
          unitPrice: parseFloat(calculatePrice().toFixed(2)),
        }],
        fileId,
        qrDataUrl,
        shippingAddress: {
          address1: shippingAddress.address1.trim(),
          address2: '',
          city: shippingAddress.city.trim(),
          state: shippingAddress.state.trim(),
          country: shippingAddress.country.trim(),
          zip: shippingAddress.zip.trim(),
        }
      };
      
      const orderResponse = await supabase.functions.invoke('printful-create-order', {
        body: orderData
      });

      if (orderResponse.error) {
        throw new Error(orderResponse.error.message || 'Failed to create order');
      }

      const { orderId } = orderResponse.data;

      toast({
        title: "Order placed successfully!",
        description: `Your sticker order has been submitted. Order ID: ${orderId}`,
      });

      // Reset form
      setCustomerInfo({ name: '', email: '' });
      setShippingAddress({
        address1: '', city: '', state: '', country: 'US', zip: '', phone: ''
      });
      setQuantity(1);
      onClose();
      
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred while placing your order";
      
      toast({
        title: "Order failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading products...</span>
                </div>
              )}
              
              {!loading && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="product">Product</Label>
                    <Select 
                      value={selectedProduct?.toString() || ''} 
                      onValueChange={(value) => setSelectedProduct(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
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
              )}

              <div>
                <Label htmlFor="quantity">Quantity (1-10)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value))))}
                />
              </div>

              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Order Total</span>
                  <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {quantity} × ${selectedVariant?.price || '0.00'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Shipping Address</h4>
                
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select 
                    value={shippingAddress.country} 
                    onValueChange={(value) => setShippingAddress({ ...shippingAddress, country: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="address1">Address Line 1 *</Label>
                  <Input
                    id="address1"
                    value={shippingAddress.address1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address1: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input
                      id="zip"
                      value={shippingAddress.zip}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={uploading || loading}
              className="min-w-32"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                `Place Order - $${totalPrice.toFixed(2)}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};