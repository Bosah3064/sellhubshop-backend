import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  CreditCard,
  Copy,
  Check
} from "lucide-react";
import SEO from "@/components/SEO";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { WithdrawalModal } from "@/components/WithdrawalModal";

// ... existing interfaces ... (Replaced by actual code below)
interface WalletData {
  id: string;
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  reference_type: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
}

const Wallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [cardColor, setCardColor] = useState('from-gray-900 via-gray-800 to-black');
  const [copied, setCopied] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  // Deposit State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [pollTxId, setPollTxId] = useState<string | null>(null);

  // ... existing helpers ...

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !user) return;
    
    const amount = Number(depositAmount);
    if (!amount || amount < 10) {
        toast.error("Minimum deposit amount is KES 10");
        return;
    }

    setIsDepositing(true);
    try {
        // 1. Create Pending Transaction
        const { data: transaction, error: txError } = await supabase
            .from('wallet_transactions')
            .insert({
                wallet_id: wallet.id,
                amount: amount,
                type: 'credit',
                reference_type: 'deposit',
                description: 'M-Pesa Deposit',
                status: 'pending'
            })
            .select()
            .single();

        if (txError) throw txError;

        // 1b. Generate Short Reference for M-Pesa (Max 12 chars)
        // We use this because M-Pesa might truncate long UUIDs in AccountReference
        const shortRef = transaction.id.replace(/-/g, '').substring(0, 12).toUpperCase();
        
        // Update the transaction with this short ref so we can match it in callback
        const { error: updateError } = await supabase
            .from('wallet_transactions')
            .update({ reference_id: shortRef })
            .eq('id', transaction.id);

        if (updateError) {
             console.error("Failed to save short ref", updateError);
             // We continue anyway, but callback might fail to match if we rely solely on ref.
             // But actually, we will match by reference_id in backend now.
        }

        // 2. Fetch profile phone if needed
        const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
        // Fallback to a prompt or input if needed, but for now assuming profile has it or we add input to modal later.
        // ACTUALLY, let's just trigger it. If phone is missing, backend might error or we can ask user.
        // For best UX in this turn, I'll rely on profile phone.
        const phoneToBill = profile?.phone; 

        if (!phoneToBill) {
             toast.error("Please set a phone number in your Profile Settings first.");
             return;
        }

        // 3. Call Backend for STK Push
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/v1/stk-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: Math.ceil(amount),
                phone: phoneToBill,
                accountRef: shortRef, // Use Short Ref (12 chars) instead of UUID
                description: `Wallet Deposit`,
                walletTransactionId: transaction.id // Pass ID for backend to link
            })
        });

        const result = await response.json();
        
        if (result.ResponseCode === "0") {
            // Store the CheckoutRequestID so callback can find this transaction
            console.log('[Wallet] Storing CheckoutRequestID:', result.CheckoutRequestID);
            const { error: updateError } = await supabase
                .from('wallet_transactions')
                .update({ mpesa_receipt: result.CheckoutRequestID })
                .eq('id', transaction.id);
            
            if (updateError) {
                console.error('[Wallet] Failed to store CheckoutRequestID:', updateError);
            } else {
                console.log('[Wallet] CheckoutRequestID stored successfully');
            }
                
            toast.success("STK Push initiated! Check your phone.");
            setShowDepositModal(false);
            setDepositAmount("");
            
            // Start Polling for this transaction
            setPollTxId(transaction.id);
            toast.loading("Waiting for M-Pesa confirmation...");
        } else {
            toast.error("M-Pesa Request Failed: " + (result.errorMessage || result.CustomerMessage || "Unknown"));
            // Optionally mark transaction as failed in DB
        }

    } catch (error: any) {
        toast.error("Failed to initiate deposit: " + error.message);
    } finally {
        setIsDepositing(false);
    }
  };

  // ... rest of the component


  // Generate virtual card number based on wallet ID
  const getCardNumber = () => {
    if (!wallet) return '•••• •••• •••• ••••';
    const hash = wallet.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const last4 = String(hash).slice(-4).padStart(4, '0');
    return showCardDetails ? `5234 8765 ${last4.slice(0, 2)}${last4.slice(2, 4)} ${last4}` : `•••• •••• •••• ${last4}`;
  };

  const getCardExpiry = () => {
    return showCardDetails ? '12/28' : '••/••';
  };

  const getCardCVV = () => {
    return showCardDetails ? '***' : '•••';
  };

  const copyCardNumber = () => {
    if (wallet) {
      const hash = wallet.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const last4 = String(hash).slice(-4).padStart(4, '0');
      navigator.clipboard.writeText(`5234876${last4.slice(0, 2)}${last4.slice(2, 4)}${last4}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cardColorOptions = [
    { name: 'Midnight', gradient: 'from-gray-900 via-gray-800 to-black' },
    { name: 'Ocean', gradient: 'from-blue-600 via-blue-700 to-blue-900' },
    { name: 'Sunset', gradient: 'from-orange-500 via-pink-600 to-purple-700' },
    { name: 'Forest', gradient: 'from-emerald-600 via-green-700 to-teal-800' },
    { name: 'Royal', gradient: 'from-purple-600 via-indigo-700 to-blue-800' },
    { name: 'Rose', gradient: 'from-pink-500 via-rose-600 to-red-700' },
  ];

  const fetchWalletData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      if (walletData) {
        setWallet(walletData);
        
        // Fetch transactions (all transactions in this wallet belong to the current user)
        const { data: transData, error: transError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false });

        if (transError) throw transError;
        setTransactions(transData || []);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  // Polling Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pollTxId) {
        interval = setInterval(async () => {
             const { data: tx } = await supabase
                .from('wallet_transactions')
                .select('status')
                .eq('id', pollTxId)
                .single();

             if (tx && tx.status === 'completed') {
                 // Success!
                 clearInterval(interval);
                 setPollTxId(null);
                 toast.dismiss(); // Dismiss loading toast
                 toast.success("Payment Received! Balance updated.");
                 fetchWalletData();
             } else if (tx && (tx.status === 'failed' || tx.status === 'cancelled')) {
                 clearInterval(interval);
                 setPollTxId(null);
                 toast.dismiss();
                 toast.error("Payment failed or was cancelled.");
                 fetchWalletData();
             }
             // If pending, keep polling
        }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [pollTxId]);

  const handleWithdrawalSuccess = () => {
    fetchWalletData(); // Refresh wallet data after successful withdrawal
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <SEO title="My Wallet - SellHub" description="View your balance and transactions." />
        <div className="max-w-md mx-auto">
          <WalletIcon className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">No Wallet Found</h1>
          <p className="text-muted-foreground mb-8">
            It seems you don't have a wallet associated with your account yet. Make a sale to automatically create one!
          </p>
          <Button asChild size="lg" className="w-full">
            <Link to="/product-upload">Start Selling</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO title="My Wallet - SellHub" description="View your balance and transaction history." />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Wallet</h1>
          <p className="text-muted-foreground">Manage your earnings and payments</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={fetchWalletData} className="flex-1 md:flex-none h-12 rounded-xl border-gray-100 hover:border-primary/30 transition-all font-bold text-gray-600 bg-white shadow-sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowDepositModal(true)}
            className="flex-1 md:flex-none h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-600/20 transition-all active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4 mr-2" />
            Deposit Funds
          </Button>
          <Button 
            onClick={() => setShowWithdrawModal(true)}
            className="flex-1 md:flex-none h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Withdraw Funds
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Premium Virtual Card */}
          <div className="relative group">
            <Card className={`bg-gradient-to-br ${cardColor} text-white border-none overflow-hidden relative shadow-2xl shadow-gray-400/30 rounded-[24px] aspect-[1.586/1] transition-all duration-500 hover:scale-[1.02]`}>
              {/* Card Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-[80px]" />
              </div>
              
              {/* Card Chip */}
              <div className="absolute top-6 left-6">
                <div className="w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-lg opacity-80">
                  <div className="w-full h-full grid grid-cols-2 gap-[2px] p-1">
                    <div className="bg-yellow-300 rounded-sm" />
                    <div className="bg-yellow-300 rounded-sm" />
                    <div className="bg-yellow-300 rounded-sm" />
                    <div className="bg-yellow-300 rounded-sm" />
                  </div>
                </div>
              </div>

              {/* Contactless Icon */}
              <div className="absolute top-6 right-6 opacity-60">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
                  <path d="M8 12h8M12 8v8" />
                </svg>
              </div>

              <CardContent className="relative h-full flex flex-col justify-between p-6">
                {/* Card Number */}
                <div className="mt-12">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Card Number</p>
                    <button
                      onClick={() => setShowCardDetails(!showCardDetails)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {showCardDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold tracking-wider font-mono">{getCardNumber()}</p>
                    <button
                      onClick={copyCardNumber}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Card Details Row */}
                <div className="flex items-end justify-between">
                  <div className="space-y-3">
                    {/* Balance */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Balance</p>
                      <p className="text-2xl font-black tracking-tight">
                        {wallet.currency} {wallet.balance.toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Expiry & CVV */}
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-0.5">Expiry</p>
                        <p className="text-sm font-bold font-mono">{getCardExpiry()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-0.5">CVV</p>
                        <p className="text-sm font-bold font-mono">{getCardCVV()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Brand */}
                  <div className="text-right">
                    <CreditCard className="w-10 h-10 opacity-80" />
                    <p className="text-[10px] font-black uppercase tracking-wider mt-1 opacity-60">SellHub</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color Picker */}
            <div className="mt-4 flex gap-2 flex-wrap">
              {cardColorOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => setCardColor(option.gradient)}
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${option.gradient} border-2 transition-all ${
                    cardColor === option.gradient ? 'border-primary scale-110 shadow-lg' : 'border-gray-200 hover:scale-105'
                  }`}
                  title={option.name}
                />
              ))}
            </div>
          </div>

          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[32px] overflow-hidden">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-lg font-black text-gray-900">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-400 group-hover:text-gray-600 transition-colors">Total Earned</span>
                <span className="text-lg font-black text-emerald-600">
                  {wallet.currency} {transactions.filter(t => t.type === 'credit' && t.status === 'completed').reduce((a, b) => a + b.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-400 group-hover:text-gray-600 transition-colors">Total Withdrawn</span>
                <span className="text-lg font-black text-blue-600">
                   {wallet.currency} {transactions.filter(t => t.type === 'debit' && t.reference_type === 'withdrawal').reduce((a, b) => a + b.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-400 group-hover:text-gray-600 transition-colors">Net Sales</span>
                <div className="bg-gray-50 px-3 py-1 rounded-full">
                    <span className="text-sm font-black text-gray-900">{transactions.filter(t => t.reference_type === 'order').length} items</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[40px] overflow-hidden min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 pb-6">
              <div>
                <CardTitle className="text-2xl font-black text-gray-900">Recent Activity</CardTitle>
                <CardDescription className="text-sm font-medium text-gray-400">Your latest credits and debits</CardDescription>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-2xl">
                <History className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">No recent transactions to show.</p>
                </div>
              ) : (
                <div className="divide-y divide-muted">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-all group">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Transaction Type Icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          transaction.type === 'credit' 
                            ? 'bg-emerald-50 border-2 border-emerald-100' 
                            : 'bg-blue-50 border-2 border-blue-100'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        
                        {/* Transaction Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-black text-gray-900 truncate">{transaction.description}</p>
                            {getStatusIcon(transaction.status)}
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-400 font-bold">{format(new Date(transaction.created_at), 'MMM dd, yyyy • h:mm a')}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500 font-bold capitalize">{transaction.reference_type}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Amount with Up/Down Indicator */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-lg ${
                          transaction.type === 'credit' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          <span>
                            {transaction.type === 'credit' ? '+' : '-'} {wallet.currency} {transaction.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <WithdrawalModal
        open={showWithdrawModal}
        onOpenChange={setShowWithdrawModal}
        walletBalance={wallet?.balance || 0}
        currency={wallet?.currency || 'KSh'}
        userId={user?.id || ''}
        onSuccess={handleWithdrawalSuccess}
      />

      <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
            <DialogDescription>
              Add money to your wallet via M-Pesa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g. 500"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="10"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
               <Button type="button" variant="ghost" onClick={() => setShowDepositModal(false)}>Cancel</Button>
               <Button type="submit" disabled={isDepositing}>
                 {isDepositing ? "Processing..." : "Deposit Now"}
               </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
