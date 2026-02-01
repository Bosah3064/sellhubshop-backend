import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletBalance: number;
  currency: string;
  userId: string;
  onSuccess: () => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  open,
  onOpenChange,
  walletBalance,
  currency,
  userId,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm' | 'processing'>('input');
  const { toast } = useToast();

  const MIN_WITHDRAWAL = 10;
  const withdrawalAmount = parseFloat(amount) || 0;

  // Format phone number as user types
  const handlePhoneChange = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as user types
    if (digits.startsWith('254')) {
      setPhone(digits);
    } else if (digits.startsWith('0')) {
      setPhone('254' + digits.substring(1));
    } else if (digits.startsWith('7') || digits.startsWith('1')) {
      setPhone('254' + digits);
    } else {
      setPhone(digits);
    }
  };

  const formatPhoneDisplay = (phoneNum: string) => {
    if (phoneNum.length === 12 && phoneNum.startsWith('254')) {
      return `+${phoneNum.substring(0, 3)} ${phoneNum.substring(3, 6)} ${phoneNum.substring(6, 9)} ${phoneNum.substring(9)}`;
    }
    return phoneNum;
  };

  const isValidPhone = phone.startsWith('254') && phone.length === 12;
  const isValidAmount = withdrawalAmount >= MIN_WITHDRAWAL && withdrawalAmount <= walletBalance;

  const handleSubmit = async () => {
    if (!isValidAmount || !isValidPhone) return;

    if (step === 'input') {
      setStep('confirm');
      return;
    }

    setIsLoading(true);
    setStep('processing');

    try {
      // Get Supabase session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('[Withdrawal] Session:', session ? 'Found' : 'Not found');
      console.log('[Withdrawal] User ID from session:', session?.user?.id);
      console.log('[Withdrawal] User ID from props:', userId);
      
      if (!session) {
        throw new Error('You must be logged in to withdraw');
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://sellhubshop-backend.onrender.com';
      console.log('[Withdrawal] Calling:', `${backendUrl}/api/b2c`);
      
      const response = await fetch(`${backendUrl}/api/b2c`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // Add auth token
        },
        body: JSON.stringify({
          amount: withdrawalAmount,
          phone: phone,
          userId: userId,
        }),
      });

      const data = await response.json();
      console.log('[Withdrawal] Response status:', response.status);
      console.log('[Withdrawal] Response data:', data);

      if (response.ok && data.success) {
        toast({
          title: 'Withdrawal Initiated!',
          description: `KSh ${withdrawalAmount.toLocaleString()} will be sent to ${formatPhoneDisplay(phone)}`,
          duration: 5000,
        });
        onSuccess();
        handleClose();
      } else {
        const detailMsg = data.details ? (typeof data.details === 'string' ? data.details : JSON.stringify(data.details)) : '';
        throw new Error((data.error || 'Withdrawal failed') + (detailMsg ? `: ${detailMsg}` : ''));
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
      setStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setPhone('');
    setStep('input');
    setIsLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            {step === 'input' && 'Withdraw Funds'}
            {step === 'confirm' && 'Confirm Withdrawal'}
            {step === 'processing' && 'Processing...'}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && 'Enter amount and M-Pesa number'}
            {step === 'confirm' && 'Please review your withdrawal details'}
            {step === 'processing' && 'Sending withdrawal request to M-Pesa'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-6 py-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-bold">
                Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  {currency}
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-16 text-lg font-bold h-14"
                  min={MIN_WITHDRAWAL}
                  max={walletBalance}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">
                  Min: {currency} {MIN_WITHDRAWAL}
                </span>
                <span className="text-gray-500">
                  Available: {currency} {walletBalance.toLocaleString()}
                </span>
              </div>
              {withdrawalAmount > 0 && !isValidAmount && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {withdrawalAmount < MIN_WITHDRAWAL
                    ? `Minimum withdrawal is ${currency} ${MIN_WITHDRAWAL}`
                    : 'Insufficient balance'}
                </p>
              )}
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-bold">
                M-Pesa Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="254712345678"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="text-lg font-mono h-14"
              />
              <p className="text-xs text-gray-500">
                {phone && isValidPhone ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {formatPhoneDisplay(phone)}
                  </span>
                ) : (
                  'Enter number in format: 254712345678'
                )}
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500">Quick Select</Label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 2000].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(String(Math.min(quickAmount, walletBalance)))}
                    disabled={walletBalance < quickAmount}
                    className="font-bold"
                  >
                    {quickAmount}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6 py-4">
            <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500">Amount</span>
                <span className="text-2xl font-black">
                  {currency} {withdrawalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500">To</span>
                <span className="text-lg font-bold font-mono">{formatPhoneDisplay(phone)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm font-bold text-gray-500">New Balance</span>
                <span className="text-lg font-bold">
                  {currency} {(walletBalance - withdrawalAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
              <p className="font-bold mb-1">📱 M-Pesa Prompt</p>
              <p className="text-xs">
                You'll receive an M-Pesa confirmation on your phone. The money will be sent to{' '}
                {formatPhoneDisplay(phone)} once processed.
              </p>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-sm text-gray-500">Contacting M-Pesa...</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {step === 'confirm' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('input')}
              className="flex-1"
              disabled={isLoading}
            >
              Back
            </Button>
          )}
          {step !== 'processing' && (
            <Button
              onClick={handleSubmit}
              disabled={!isValidAmount || !isValidPhone || isLoading}
              className="flex-1 h-12 font-bold"
            >
              {step === 'input' && (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
              {step === 'confirm' && 'Confirm Withdrawal'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
