import { useState, useEffect } from 'react';
import { cartService } from '@/services/cartService';
import { useAuth } from '@/contexts/AuthContext';

export const useCart = () => {
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const refreshCartCount = async () => {
    if (!user) {
      setItemCount(0);
      return;
    }

    try {
      setLoading(true);
      const count = await cartService.getCartItemCount();
      setItemCount(count);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
      setItemCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCartCount();
  }, [user]);

  return {
    itemCount,
    loading,
    refreshCartCount,
  };
};
