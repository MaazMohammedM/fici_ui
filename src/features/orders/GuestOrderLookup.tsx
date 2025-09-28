import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OrderService } from '@/lib/services/orderService';
import { Loader2, Search } from 'lucide-react';

// Simple toast hook
const useToast = () => {
  const showToast = (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
    const { title, description, variant = 'default' } = options;
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 flex items-start gap-3 max-w-sm ${
      variant === 'destructive' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
    }`;
    
    toast.innerHTML = `
      <div class="flex-1">
        <h3 class="font-medium">${title}</h3>
        ${description ? `<p class="text-sm mt-1">${description}</p>` : ''}
      </div>
      <button class="text-current opacity-70 hover:opacity-100" onclick="this.parentElement.remove()">
        <X className="h-4 w-4" />
      </button>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 5000);
  };

  return { toast: showToast };
};

interface GuestOrderLookupProps {}

interface GuestOrderLookupState {
  email: string;
  phone: string;
  orderNumber: string;
  isLoading: boolean;
  error: string | null;
}

const GuestOrderLookup: React.FC<GuestOrderLookupProps> = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<GuestOrderLookupState>({
    email: '',
    phone: '',
    orderNumber: '',
    isLoading: false,
    error: null,
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const emailParam = searchParams.get('email');
    const phoneParam = searchParams.get('phone');
    if (orderId) setState((prevState) => ({ ...prevState, orderNumber: orderId }));
    if (emailParam) setState((prevState) => ({ ...prevState, email: emailParam }));
    if (phoneParam) setState((prevState) => ({ ...prevState, phone: phoneParam }));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!state.orderNumber) {
      setState((prevState) => ({ ...prevState, error: 'Please enter your order number' }));
      return;
    }
    
    if (!state.email && !state.phone) {
      setState((prevState) => ({ ...prevState, error: 'Please provide either your email or phone number' }));
      return;
    }

    setState((prevState) => ({ ...prevState, isLoading: true, error: null }));

    try {
      await OrderService.lookupGuestOrder({
        orderId: state.orderNumber,
        email: state.email || undefined,
        phone: state.phone || undefined
      });

      // If successful, navigate to order details
      const params = new URLSearchParams();
      if (state.email) params.set('email', state.email);
      if (state.phone) params.set('phone', state.phone);
      
      navigate(`/guest/orders/${state.orderNumber}?${params.toString()}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while looking up your order';
      setState((prevState) => ({ ...prevState, error: errorMessage }));
      toast({
        title: 'Order Not Found',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setState((prevState) => ({ ...prevState, isLoading: false }));
    }
  };

  const handleOrderNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prevState) => ({ ...prevState, orderNumber: e.target.value.trim() }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prevState) => ({ ...prevState, email: e.target.value.trim() }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prevState) => ({ ...prevState, phone: e.target.value.trim() }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 text-center space-y-2">
          <h2 className="text-2xl font-bold">Track Your Order</h2>
          <p className="text-gray-500">
            Enter your order details to view your order status and tracking information
          </p>
        </div>
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="orderNumber" className="text-sm font-medium">
                Order Number <span className="text-red-500">*</span>
              </label>
              <input
                id="orderNumber"
                type="text"
                value={state.orderNumber}
                onChange={handleOrderNumberChange}
                placeholder="e.g., ORD-123456"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="text-xs text-gray-500 mb-1">
                Enter your email <span className="font-medium">OR</span> phone number
              </div>
              <input
                id="email"
                type="email"
                value={state.email}
                onChange={handleEmailChange}
                placeholder="your.email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="relative flex items-center my-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="px-3 text-sm text-gray-400">OR</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>
              <input
                id="phone"
                type="tel"
                value={state.phone}
                onChange={handlePhoneChange}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {state.error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {state.error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={state.isLoading || !state.orderNumber || (!state.email && !state.phone)}
              className={`w-full mt-2 px-4 py-2 rounded-md font-medium text-white ${
                state.isLoading || !state.orderNumber || (!state.email && !state.phone)
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {state.isLoading ? (
                <>
                  <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="inline mr-2 h-4 w-4" />
                  Track Order
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Having trouble finding your order?</p>
            <a 
              href="mailto:support@example.com" 
              className="text-blue-600 hover:underline"
            >
              Contact our support team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestOrderLookup;
