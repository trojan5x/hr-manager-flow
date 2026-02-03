import React, { useEffect } from 'react';

interface RazorpayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (paymentId: string) => void;
    onError: (error: string) => void;
    amount: number;
    description: string;
}

const RazorpayModal: React.FC<RazorpayModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    onError,
    amount,
    description
}) => {
    useEffect(() => {
        if (isOpen) {
            // Mock Razorpay implementation
            const timer = setTimeout(() => {
                // Simulate payment processing
                const success = Math.random() > 0.1; // 90% success rate for demo
                
                if (success) {
                    const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    onSuccess(mockPaymentId);
                } else {
                    onError('Payment failed. Please try again.');
                    onClose();
                }
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isOpen, onSuccess, onError, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0C2451] rounded flex items-center justify-center">
                            <span className="text-white text-sm font-bold">R</span>
                        </div>
                        <span className="text-[#0C2451] font-bold text-lg">Razorpay</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>

                {/* Payment Details */}
                <div className="mb-6">
                    <div className="text-gray-600 text-sm mb-2">Pay to</div>
                    <div className="text-black font-semibold mb-4">LearnTube.ai</div>
                    
                    <div className="text-gray-600 text-sm mb-2">Amount</div>
                    <div className="text-2xl font-bold text-black mb-4">₹{amount.toLocaleString('en-IN')}</div>
                    
                    <div className="text-gray-600 text-sm mb-2">Description</div>
                    <div className="text-black">{description}</div>
                </div>

                {/* Processing Animation */}
                <div className="flex flex-col items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C2451] mb-4"></div>
                    <div className="text-[#0C2451] font-medium">Processing Payment...</div>
                    <div className="text-gray-500 text-sm mt-2">Please wait while we process your payment</div>
                </div>

                {/* Security Notice */}
                <div className="bg-gray-50 rounded-lg p-3 mt-6">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-green-500">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="currentColor"/>
                        </svg>
                        <span>Your payment is secured by 256-bit SSL encryption</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RazorpayModal;
