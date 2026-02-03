import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { type Certification } from '../constants/certifications';

interface CartItem {
    id: string;
    certification: Certification;
    quantity: number;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (certification: Certification) => void;
    removeFromCart: (certificationId: string) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
    isInCart: (certificationId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const addToCart = (certification: Certification) => {
        setCartItems(prev => {
            const existingItem = prev.find(item => item.id === certification.id);
            if (existingItem) {
                return prev; // Don't allow duplicate certifications
            }
            return [...prev, { id: certification.id, certification, quantity: 1 }];
        });
    };

    const removeFromCart = (certificationId: string) => {
        setCartItems(prev => prev.filter(item => item.id !== certificationId));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    const getTotalPrice = () => {
        return cartItems.reduce((total, item) => total + (item.certification.price * item.quantity), 0);
    };

    const isInCart = (certificationId: string) => {
        return cartItems.some(item => item.id === certificationId);
    };

    const value: CartContextType = {
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isInCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
