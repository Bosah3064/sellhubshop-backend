import { useCartContext } from '@/providers/CartProvider';

export const useCart = () => {
  return useCartContext();
};
