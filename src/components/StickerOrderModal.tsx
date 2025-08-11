import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useDebug } from '@/contexts/DebugContext';
import { createDebugClient } from '@/integrations/supabase/debugClient';
import { Package, Loader2, ShoppingCart } from 'lucide-react';
import { cartService } from '@/services/cartService';
import { useCart } from '@/hooks/useCart';

interface StickerOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string;
  micrositeId?: string;
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



export const StickerOrderModal: React.FC<StickerOrderModalProps> = ({
  isOpen,
  onClose,
  qrDataUrl,
  micrositeId,
}) => {
  const { toast } = useToast();
  const { addEntry } = useDebug();
  const { refreshCartCount } = useCart();
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);



  const currentProduct = products.find(p => p.id === selectedProduct);
  const availableVariants = useMemo(() => 
    currentProduct?.variants?.filter(v => v.in_stock) || [], 
    [currentProduct]
  );

  useEffect(() => {
    if (isOpen) {
      const fetchProducts = async () => {
        try {
          setLoading(true);
          const supabase = createDebugClient(addEntry);
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
          toast({
            title: 'Error',
            description: `Failed to fetch available products: ${errorMessage}`,
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (currentProduct && availableVariants.length > 0) {
      setSelectedVariant(availableVariants[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedProduct, currentProduct, availableVariants]);

  const calculatePrice = () => {
    if (!selectedVariant) return 0;
    return parseFloat(selectedVariant.price);
  };





  const totalPrice = calculatePrice() * quantity;

  const handleAddToCart = async () => {
    if (!selectedProduct || !selectedVariant) {
      toast({
        title: "Selection required",
        description: "Please select a product and variant before adding to cart",
        variant: "destructive",
      });
      return;
    }

    if (!micrositeId) {
      toast({
        title: "Microsite required",
        description: "Cannot add to cart without microsite context",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingToCart(true);
      
      await cartService.addToCart({
        micrositeId,
        productId: selectedProduct.toString(),
        variantId: selectedVariant.id.toString(),
        quantity,
        size: selectedVariant.size,
        material: selectedVariant.color,
        unitPrice: calculatePrice(),
        currency: 'USD',
        qrDataUrl,
        productName: currentProduct?.title || 'Custom Sticker',
        variantName: selectedVariant.name,
        productImageUrl: selectedVariant.image || currentProduct?.image,
      });

      toast({
        title: "Added to cart!",
        description: `${quantity} item(s) added to your cart`,
      });

      // Refresh cart count in header
      await refreshCartCount();

      // Reset selection but keep modal open
      setQuantity(1);
      
    } catch (error) {
      toast({
        title: "Failed to add to cart",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Custom QR Code Stickers
          </DialogTitle>
        </DialogHeader>



        <div className="space-y-6">
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



          <div className="flex justify-between items-center">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleAddToCart}
              disabled={!micrositeId || addingToCart || !selectedProduct || !selectedVariant}
              className="min-w-48"
            >
              {addingToCart ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding to Cart...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart - ${totalPrice.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};