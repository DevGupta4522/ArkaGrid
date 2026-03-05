import { useState, useCallback } from 'react';
import { useToast } from './useContext';
import { useAuth } from './useContext';

export function useRazorpay() {
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      // If already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const openPaymentModal = useCallback(async ({ amount, orderId, tradeId, onSuccess, onError }) => {
    try {
      setIsProcessing(true);
      const res = await loadRazorpayScript();

      if (!res) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        setIsProcessing(false);
        if (onError) onError(new Error('SDK load failed'));
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_change_me',
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'ArkaGrid',
        description: 'Secure Peer-to-Peer Energy Trade',
        image: 'https://cdn-icons-png.flaticon.com/512/3594/3594770.png', // Temporary sun icon
        order_id: orderId,
        handler: async function (response) {
          try {
            // Send signature to backend for verification
            const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                tradeId
              })
            });

            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              if (onSuccess) onSuccess(response);
            } else {
              if (onError) onError(new Error(verifyData.message || 'Signature verification failed'));
            }
          } catch (err) {
            if (onError) onError(err);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || 'ArkaGrid User',
          email: user?.email || '',
        },
        theme: {
          color: '#00FF94', // Volt Green
          backdrop_color: '#0F172A'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            if (onError) onError(new Error('Payment window closed'));
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        setIsProcessing(false);
        if (onError) onError(new Error(response.error.description || 'Payment Failed'));
      });

      paymentObject.open();

    } catch (err) {
      console.error('[Razorpay Hook] Error:', err);
      setIsProcessing(false);
      toast.error('Could not initialize payment');
      if (onError) onError(err);
    }
  }, [loadRazorpayScript, toast, user]);

  return {
    openPaymentModal,
    isProcessing
  };
}
