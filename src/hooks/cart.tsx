import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { wait } from '@testing-library/react-native';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem('@appStore:products');
      if(storageProducts){
        setProducts(JSON.parse(storageProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async (product:Product) => {
    let newProducts: Product[];
    if(products){
      const productIndex = products.findIndex (item => item.id===product.id)
      if(productIndex<0){
        const newProduct = {...product};
        newProduct.quantity = 1;
        newProducts = [...products,newProduct];
        setProducts(newProducts);
      }else{
        newProducts = [...products]
        newProducts[productIndex].quantity+=1;
        setProducts(newProducts);
      }
    }else{
      const newProduct = {...product};
      newProduct.quantity = 1;
      newProducts = [newProduct];
      setProducts(newProducts);
    }

    await AsyncStorage.setItem(
      '@appStore:products',
      JSON.stringify(products)
    );

  }, [products]);

  const increment = useCallback(async id => {
    const productIndex = products.findIndex (item => item.id===id)
    if(productIndex<0){
      return;
    }

    const newProducts = [...products]
    newProducts[productIndex].quantity+=1;
    setProducts(newProducts);
    await AsyncStorage.setItem(
      '@appStore:products',
      JSON.stringify(products)
    );
  }, [products]);

  const decrement = useCallback(async id => {
    const productIndex = products.findIndex (item => item.id===id)
    if(productIndex<0){
      return;
    }
    const total = products[productIndex].quantity;
    if(total<=0)
      return;

    const newProducts = [...products]
    newProducts[productIndex].quantity-=1;
    setProducts(newProducts);
    await AsyncStorage.setItem(
      '@appStore:products',
      JSON.stringify(products)
    );
  }, [products]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
