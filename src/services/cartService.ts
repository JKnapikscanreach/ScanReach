import { supabase } from '@/integrations/supabase/client';

export interface CartLineItem {
  id: string;
  cart_id: string;
  microsite_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  size: string;
  material: string;
  unit_price: number;
  currency: string;
  qr_data_url: string;
  product_name: string;
  variant_name: string;
  product_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  cart_line_items?: CartLineItem[];
}

export interface AddToCartParams {
  micrositeId: string;
  productId: string;
  variantId: string;
  quantity: number;
  size: string;
  material: string;
  unitPrice: number;
  currency?: string;
  qrDataUrl: string;
  productName: string;
  variantName: string;
  productImageUrl?: string;
}

class CartService {
  private supabase = supabase;

  /**
   * Get or create a cart for the current user
   */
  async getOrCreateCart(): Promise<Cart> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to access cart');
    }

    // Try to get existing cart
    const { data: existingCart, error: fetchError } = await this.supabase
      .from('carts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingCart && !fetchError) {
      return existingCart;
    }

    // Create new cart if none exists
    const { data: newCart, error: createError } = await this.supabase
      .from('carts')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create cart: ${createError.message}`);
    }

    return newCart;
  }

  /**
   * Add an item to the cart
   */
  async addToCart(params: AddToCartParams): Promise<CartLineItem> {
    const cart = await this.getOrCreateCart();

    // Check if item already exists in cart (same product, variant, microsite)
    const { data: existingItem } = await this.supabase
      .from('cart_line_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('microsite_id', params.micrositeId)
      .eq('product_id', params.productId)
      .eq('variant_id', params.variantId)
      .single();

    if (existingItem) {
      // Update quantity if item exists
      const newQuantity = existingItem.quantity + params.quantity;
      const { data: updatedItem, error } = await this.supabase
        .from('cart_line_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update cart item: ${error.message}`);
      }

      return updatedItem;
    }

    // Add new item to cart
    const { data: newItem, error } = await this.supabase
      .from('cart_line_items')
      .insert({
        cart_id: cart.id,
        microsite_id: params.micrositeId,
        product_id: params.productId,
        variant_id: params.variantId,
        quantity: params.quantity,
        size: params.size,
        material: params.material,
        unit_price: params.unitPrice,
        currency: params.currency || 'USD',
        qr_data_url: params.qrDataUrl,
        product_name: params.productName,
        variant_name: params.variantName,
        product_image_url: params.productImageUrl,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add item to cart: ${error.message}`);
    }

    return newItem;
  }

  /**
   * Get cart with all line items
   */
  async getCartWithItems(): Promise<Cart | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to access cart');
    }

    const { data: cart, error } = await this.supabase
      .from('carts')
      .select(`
        *,
        cart_line_items (
          *,
          microsites (
            id,
            name,
            url
          )
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to fetch cart: ${error.message}`);
    }

    return cart;
  }

  /**
   * Update cart line item quantity
   */
  async updateCartItemQuantity(itemId: string, quantity: number): Promise<CartLineItem | void> {
    if (quantity <= 0) {
      await this.removeCartItem(itemId);
      return;
    }

    const { data: updatedItem, error } = await this.supabase
      .from('cart_line_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update cart item quantity: ${error.message}`);
    }

    return updatedItem;
  }

  /**
   * Remove an item from the cart
   */
  async removeCartItem(itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('cart_line_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to remove cart item: ${error.message}`);
    }
  }

  /**
   * Clear all items from the cart
   */
  async clearCart(): Promise<void> {
    const cart = await this.getOrCreateCart();

    const { error } = await this.supabase
      .from('cart_line_items')
      .delete()
      .eq('cart_id', cart.id);

    if (error) {
      throw new Error(`Failed to clear cart: ${error.message}`);
    }
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(): Promise<number> {
    const cart = await this.getCartWithItems();
    
    if (!cart?.cart_line_items) {
      return 0;
    }

    return cart.cart_line_items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Get cart total price
   */
  async getCartTotal(): Promise<number> {
    const cart = await this.getCartWithItems();
    
    if (!cart?.cart_line_items) {
      return 0;
    }

    return cart.cart_line_items.reduce(
      (total, item) => total + (item.unit_price * item.quantity), 
      0
    );
  }
}

export const cartService = new CartService();
