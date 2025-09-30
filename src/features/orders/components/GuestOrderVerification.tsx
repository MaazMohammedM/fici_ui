import React, { useState } from 'react';
import type { ChangeEvent,ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '@store/orderStore';

// Type definitions
interface Toast {
  success: (message: string) => void;
  error: (message: string) => void;
}

interface InputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline';
}

interface CardProps {
  children: ReactNode;
  className?: string;
}

// Simple toast implementation
const toast: Toast = {
  success: (message: string) => alert(`Success: ${message}`),
  error: (message: string) => alert(`Error: ${message}`)
};

// Simple UI components with proper TypeScript types
const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  className = '',
  disabled = false,
  id
}) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full px-3 py-2 border rounded-md ${className}`}
  />
);

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className = '',
  variant = 'default'
}) => {
  const baseStyles = 'px-4 py-2 rounded-md transition-colors';
  const variantStyles = variant === 'outline'
    ? 'border border-gray-300 hover:bg-gray-50'
    : 'bg-blue-500 text-white hover:bg-blue-600';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// Simple card components with proper TypeScript types
const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`border-b pb-4 mb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold ${className}`}>
    {children}
  </h3>
);

const CardDescription: React.FC<CardProps> = ({ children, className = '' }) => (
  <p className={`text-gray-600 text-sm ${className}`}>
    {children}
  </p>
);

const CardContent: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`my-4 ${className}`}>
    {children}
  </div>
);

const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`border-t pt-4 mt-4 ${className}`}>
    {children}
  </div>
);

interface GuestOrderVerificationProps {
  onVerificationSuccess: (email: string, phone: string) => void;
}

export const GuestOrderVerification: React.FC<GuestOrderVerificationProps> = ({ onVerificationSuccess }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [storedCode, setStoredCode] = useState('');
  const { fetchGuestOrders } = useOrderStore();
  const navigate = useNavigate();

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };

  const handleVerificationCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
  };

  const handleSendVerification = async () => {
    if (!email && !phone) {
      toast.error('Please provide either email or phone number');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, this would be an API call to send OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setStoredCode(code);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Verification code sent to ${email || phone}`);
      setVerificationSent(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode !== storedCode) {
      toast.error('Invalid verification code');
      return;
    }

    try {
      setIsLoading(true);
      // Store guest email/phone in localStorage for persistence
      if (email) localStorage.setItem('guest_email', email);
      if (phone) localStorage.setItem('guest_phone', phone);
      
      // Fetch guest orders with the verified email/phone
      await fetchGuestOrders(email, phone);
      
      // Notify parent component about successful verification
      onVerificationSuccess(email, phone);
      toast.success('Verification successful! Loading your orders...');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
      console.error('Verification error:', error);
      toast.error(errorMessage);
      
      // Clear invalid guest session on error
      localStorage.removeItem('guest_email');
      localStorage.removeItem('guest_phone');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>View Guest Orders</CardTitle>
        <CardDescription>
          Enter your email or phone number to view your order history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!verificationSent ? (
          <>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  OR
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 XXXXXXXXXX"
                value={phone}
                onChange={handlePhoneChange}
                disabled={isLoading}
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label htmlFor="verificationCode" className="text-sm font-medium">
              Enter Verification Code
            </label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              We've sent a verification code to {email || phone}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {!verificationSent ? (
          <Button 
            onClick={handleSendVerification} 
            className="w-full"
            disabled={isLoading || (!email && !phone)}
          >
            {isLoading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        ) : (
          <Button 
            onClick={handleVerifyCode}
            className="w-full"
            disabled={isLoading || !verificationCode}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>
        )}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/auth/signin')}
        >
          Sign In to Your Account
        </Button>
      </CardFooter>
    </Card>
  );

};

export default GuestOrderVerification;
