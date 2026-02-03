import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import Button from './Button';
import RazorpayModal from './RazorpayModal';

interface CartStickyBarProps {
    className?: string;
}

const CartStickyBar: React.FC<CartStickyBarProps> = ({ className = '' }) => {
    const { cartItems, getTotalItems, getTotalPrice, clearCart, removeFromCart } = useCart();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const navigate = useNavigate();

    if (cartItems.length === 0) return null;

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();

    const handleCheckout = () => {
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = (paymentId: string) => {
        console.log('Payment successful:', paymentId);
        
        // Get purchased certificate names for navigation
        const purchasedCerts = cartItems.map(item => item.certification.name);
        
        // Close the modal first
        setShowPaymentModal(false);
        
        // Navigate to payment loading page with order details
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const navigationUrl = `/payment-loading?orderId=${orderId}&certs=${purchasedCerts.join(',')}&paymentId=${paymentId}`;
        
        console.log('About to navigate to:', navigationUrl);
        console.log('Navigate function:', navigate);
        
        // Try immediate navigation first
        try {
            navigate(navigationUrl);
            console.log('Navigation attempted');
        } catch (error) {
            console.error('Navigation failed:', error);
            // Fallback to window.location
            window.location.href = navigationUrl;
        }
        
        // Clear cart after navigation attempt
        clearCart();
    };

    const handlePaymentError = (error: string) => {
        console.error('Payment failed:', error);
        alert(`Payment failed: ${error}`);
    };

    return (
        <>
            <div className={`fixed bottom-0 left-0 w-full z-50 animate-fade-in-up ${className}`}>
                {/* Expandable Cart Items */}
                {isExpanded && (
                    <div className="bg-[#001C2C]/95 backdrop-blur-xl border-t border-white/10 px-3 sm:px-4 py-2 sm:py-4 max-h-48 sm:max-h-64 overflow-y-auto">
                        <div className="max-w-4xl mx-auto">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">Selected Certifications:</h4>
                            <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between bg-[#98D048]/10 border border-[#98D048]/30 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs sm:text-sm text-white font-medium truncate pr-2">{item.certification.name}</span>
                                                <span className="text-xs sm:text-sm text-[#98D048] font-bold flex-shrink-0">₹{item.certification.price.toLocaleString('en-IN')}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 hidden sm:block">{item.certification.testedSkill}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="ml-2 sm:ml-3 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 sm:w-4 sm:h-4">
                                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Cart Bar */}
                <div className="bg-[#001C2C]/95 backdrop-blur-xl border-t border-white/10 px-3 sm:px-4 py-2 sm:py-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4">
                            {/* Cart Summary and Toggle */}
                            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-300">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="flex items-center gap-1 sm:gap-2 hover:text-white transition-colors"
                                >
                                    <span className="hidden sm:inline">{totalItems} certification{totalItems !== 1 ? 's' : ''} selected</span>
                                    <span className="sm:hidden">{totalItems} cert{totalItems !== 1 ? 's' : ''}</span>
                                    <svg 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    >
                                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                <div className="hidden md:block w-px h-4 bg-gray-600"></div>
                                <span className="hidden md:inline">Total: ₹{totalPrice.toLocaleString('en-IN')}</span>
                            </div>

                            {/* Checkout Button */}
                            <div className="w-full">
                                <Button 
                                    variant="primary" 
                                    className="w-full text-sm sm:text-lg py-1.5 px-4 sm:py-2 sm:px-6 md:py-3 md:px-8 shadow-[0_0_20px_rgba(152,208,72,0.3)]" 
                                    onClick={handleCheckout}
                                >
                                    <span className="hidden sm:inline">Checkout - ₹{totalPrice.toLocaleString('en-IN')}</span>
                                    <span className="sm:hidden">₹{totalPrice.toLocaleString('en-IN')}</span>
                                </Button>
                            </div>

                            {/* Clear Cart */}
                            <div className="hidden md:flex items-center">
                                <button
                                    onClick={clearCart}
                                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                                >
                                    Clear Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <RazorpayModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                amount={totalPrice}
                description={`${totalItems} Professional Certification${totalItems !== 1 ? 's' : ''}`}
            />
        </>
    );
};

export default CartStickyBar;
