import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Package, Truck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  const currentProduct = products.find(p => p.id === selectedProduct);
  const availableVariants = currentProduct?.variants?.filter(v => v.in_stock) || [];
  
  console.log('Current state:', { selectedProduct, currentProduct, availableVariants: availableVariants.length });

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setErrors([]);
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset and auto-select first available variant when product changes
    if (currentProduct && availableVariants.length > 0) {
      console.log('Setting first variant for product:', currentProduct.title);
      setSelectedVariant(availableVariants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedProduct]); // Only depend on selectedProduct to avoid race conditions

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products from Printful...');
      const { data, error } = await supabase.functions.invoke('printful-products');
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('Fetched products:', data?.products);
      setProducts(data?.products || []);
      if (data?.products?.length > 0) {
        console.log('Auto-selecting first product:', data.products[0]);
        setSelectedProduct(data.products[0].id);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
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
    console.log('calculatePrice called', { selectedVariant, quantity });
    if (!selectedVariant) {
      console.log('No selectedVariant, returning 0');
      return 0;
    }
    
    // Use the actual Printful price without arbitrary markups
    const basePrice = parseFloat(selectedVariant.price);
    console.log('Base price from variant:', basePrice);
    
    // Return the actual price - no artificial markups
    console.log('Final calculated price:', basePrice);
    return basePrice;
  };

  const validateForm = (): string[] => {
    const newErrors: string[] = [];
    
    if (!selectedProduct) newErrors.push('Please select a product');
    if (!selectedVariant) newErrors.push('Please select a variant');
    if (!customer.firstName.trim()) newErrors.push('First name is required');
    if (!customer.lastName.trim()) newErrors.push('Last name is required');
    if (!customer.email.trim()) newErrors.push('Email is required');
    if (customer.email && !/\S+@\S+\.\S+/.test(customer.email)) newErrors.push('Please enter a valid email address');
    if (!shipping.address1.trim()) newErrors.push('Address line 1 is required');
    if (!shipping.city.trim()) newErrors.push('City is required');
    if (!shipping.state.trim()) newErrors.push('State is required');
    if (!shipping.zip.trim()) newErrors.push('ZIP code is required');
    if (quantity < 1 || quantity > 10) newErrors.push('Quantity must be between 1 and 10');
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    
    const formErrors = validateForm();
    if (formErrors.length > 0) {
      setErrors(formErrors);
      toast({
        title: 'Form Validation Error',
        description: `Please fix the following issues: ${formErrors.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    setErrors([]);

    try {
      setLoading(true);
      setUploading(true);
      
      console.log('Uploading QR code to Printful...');
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

      setUploading(false);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`File upload failed: ${uploadError.message || 'Unknown upload error'}`);
      }

      if (!uploadData?.fileId) {
        throw new Error('File upload failed: No file ID returned');
      }

      console.log('File uploaded successfully, file ID:', uploadData.fileId);

      // Validate variant ID before proceeding
      if (!selectedVariant || !selectedVariant.id) {
        throw new Error('Invalid variant selection');
      }

      // Create the order
      const orderItems = [{
        productId: selectedProduct?.toString() || '',
        variantId: selectedVariant.id.toString(),
        quantity,
        size: selectedVariant.size || '',
        material: selectedVariant.color || '',
        unitPrice: calculatePrice(),
      }];

      console.log('Creating order with items:', orderItems);

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

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(`Order creation failed: ${orderError.message || 'Unknown order error'}`);
      }

      console.log('Order created successfully:', orderData);

      toast({
        title: 'Order Created!',
        description: `Your sticker order has been submitted. Order ID: ${orderData.orderId}`,
      });

      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrors([errorMessage]);
      toast({
        title: 'Order Failed',
        description: `Failed to create your sticker order: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploading(false);
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
          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Product Options</CardTitle>
              <CardDescription>
                Choose your sticker specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading products...</span>
                </div>
              )}
              
              {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product">Product</Label>
                    <Select 
                      value={selectedProduct?.toString() || ''} 
                      onValueChange={(value) => {
                        const productId = Number(value);
                        console.log('Product selected:', productId);
                        setSelectedProduct(productId);
                      }}
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
                        console.log('Variant selected:', variant);
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
                  onChange={(e) => {
                    const value = Math.max(1, Math.min(10, Number(e.target.value)));
                    setQuantity(value);
                  }}
                  className="w-full"
                />
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
                <Label htmlFor="country">Country *</Label>
                <Select 
                  value={shipping.country} 
                  onValueChange={(value) => setShipping({ ...shipping, country: value })}
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
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    value={shipping.state}
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP/Postal Code *</Label>
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
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading QR Code...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Order...
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