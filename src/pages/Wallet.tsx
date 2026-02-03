import React, { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Check,
  Search,
  Filter,
  ArrowRight,
  Zap
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area
} from "recharts";
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
import { StatementGenerator } from "@/components/StatementGenerator";
import { FileText } from "lucide-react";
import { TransactionSkeleton, WalletCardSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { SuccessAnimation, ConfettiAnimation } from "@/components/ui/success-animation";
import logo from "@/assets/logo.png";

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
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  // Advanced Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Filtered Transactions Logic
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.created_at);
    const txMonth = format(txDate, 'MMMM yyyy');
    
    const matchesSearch = tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         tx.reference_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesMonth = selectedMonth === 'all' || txMonth === selectedMonth;
    
    return matchesSearch && matchesType && matchesStatus && matchesMonth;
  });

  // Extract available months from transactions
  const availableMonths = Array.from(new Set(
    transactions.map(tx => format(new Date(tx.created_at), 'MMMM yyyy'))
  )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Chart Data Generation
  const getChartData = () => {
    if (!transactions.length) {
      return [{ date: format(new Date(), 'MMM dd'), balance: wallet?.balance || 0 }];
    }

    const sorted = [...transactions]
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b).getTime());
    
    const data: { date: string; balance: number }[] = [];
    let runningBalance = (wallet?.balance || 0);
    
    // To show a trend, we'll start from the current balance and work backwards,
    // then reverse the array to show it forward-moving.
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, 'MMM dd');
    }).reverse();

    return last7Days.map(day => {
      // Find transactions for this day
      const dayTxs = transactions.filter(tx => 
        tx.status === 'completed' && 
        format(new Date(tx.created_at), 'MMM dd') === day
      );
      
      // Calculate net change for this day
      const netChange = dayTxs.reduce((acc, tx) => 
        tx.type === 'credit' ? acc + tx.amount : acc - tx.amount, 0
      );
      
      return {
        date: day,
        balance: Math.max(0, runningBalance + netChange) // Simplification for UX
      };
    });
  };

  const chartData = getChartData();

  const totalCredited = transactions
    .filter(tx => tx.type === 'credit' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalDebited = transactions
    .filter(tx => tx.type === 'debit' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'failed':
      case 'cancelled': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getTransactionIcon = (type: string, refType: string) => {
    if (type === 'credit') {
        if (refType === 'order') return <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><Zap className="w-4 h-4" /></div>;
        return <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><ArrowDownLeft className="w-4 h-4" /></div>;
    }
    if (refType === 'withdrawal') return <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><ArrowUpRight className="w-4 h-4" /></div>;
    return <div className="p-2 bg-gray-100 rounded-xl text-gray-600"><CreditCard className="w-4 h-4" /></div>;
  };

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
    if (!wallet) return '•••';
    if (!showCardDetails) return '•••';
    // Generate a deterministic CVV based on wallet ID
    const hash = wallet.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return String((hash % 899) + 100); // Always 3 digits between 100-999
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

  // ======= SMART BALANCE CALCULATIONS =======
  const calculateBalances = () => {
    if (!wallet || !transactions) {
      return {
        totalBalance: 0,
        pendingWithdrawals: 0,
        availableBalance: 0
      };
    }

    // Calculate pending withdrawal amount (type = debit, status = pending/processing)
    const pendingWithdrawals = transactions
      .filter(tx => 
        tx.type === 'debit' && 
        (tx.status === 'pending' || tx.status === 'processing')
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Available balance = Total balance (Pending withdrawals don't reduce it)
    const totalBalance = wallet.balance;
    const availableBalance = totalBalance; // DB balance already excludes pending

    return {
      totalBalance,
      pendingWithdrawals,
      availableBalance
    };
  };

  const balances = calculateBalances();
  // ==========================================


  useEffect(() => {
    fetchWalletData();

    // Subscribe to real-time wallet transactions
    if (user) {
      const channel = supabase
        .channel('wallet_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_transactions'
          },
          () => {
            console.log("Real-time update detected!");
            fetchWalletData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wallets'
          },
          () => {
            fetchWalletData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Polling Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pollTxId) {
        console.log("Starting polling for transaction:", pollTxId);
        interval = setInterval(async () => {
             const { data: tx, error } = await supabase
                .from('wallet_transactions')
                .select('status, id, amount')
                .eq('id', pollTxId)
                .single();

             console.log("Polling result:", { id: pollTxId, status: tx?.status, error });

             if (tx && tx.status === 'completed') {
                 // Success!
                 console.log("Transaction completed detected!");
                 clearInterval(interval);
                 setPollTxId(null);
                 toast.dismiss(); // Dismiss loading toast
                 
                 // Success Animation & Confetti
                 setSuccessMessage("Deposit of KES " + tx.amount.toLocaleString() + " Successful!");
                 setShowSuccessAnimation(true);
                 setShowConfetti(true);
                 setTimeout(() => setShowConfetti(false), 5000);
                 
                 fetchWalletData();
             } else if (tx && (tx.status === 'failed' || tx.status === 'cancelled')) {
                 console.log("Transaction failed detected!");
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
    setSuccessMessage("Withdrawal Request Submitted Successfully!");
    setShowSuccessAnimation(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'd':
          e.preventDefault();
          setShowDepositModal(true);
          break;
        case 'w':
          e.preventDefault();
          setShowWithdrawModal(true);
          break;
        case 's':
          e.preventDefault();
          setShowStatementModal(true);
          break;
        case 'r':
          e.preventDefault();
          fetchWalletData();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchWalletData]);

   if (isLoading && !wallet) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-12 w-32 rounded-xl" />
            <Skeleton className="h-12 w-32 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <WalletCardSkeleton />
          </div>
          <div className="lg:col-span-2">
            <TransactionSkeleton />
          </div>
        </div>
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
          <Button 
            onClick={() => setShowStatementModal(true)}
            variant="outline"
            className="flex-1 md:flex-none h-12 rounded-xl border-gray-200 hover:border-primary transition-all font-bold text-gray-700 bg-white shadow-sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Statement
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
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-2xl backdrop-blur-md border border-white/30 shadow-sm">
                        <img src={logo} alt="SellHub Logo" className="w-6 h-6 object-contain" />
                        <span className="text-sm font-black tracking-tighter uppercase italic">SellHubShop</span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-60">Digital Premium</p>
                    </div>
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

          <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-none rounded-[32px] overflow-hidden dark:bg-slate-900/50 dark:border dark:border-slate-800">
            <CardHeader className="border-b border-gray-50 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg font-black text-gray-900 dark:text-white">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">Total Earned</span>
                <span className="text-lg font-black text-emerald-600">
                  {wallet.currency} {transactions.filter(t => t.type === 'credit' && t.status === 'completed').reduce((a, b) => a + b.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">Total Withdrawn</span>
                <span className="text-lg font-black text-blue-600">
                   {wallet.currency} {transactions.filter(t => t.type === 'debit' && t.reference_type === 'withdrawal').reduce((a, b) => a + b.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">Net Sales</span>
                <div className="bg-gray-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <span className="text-sm font-black text-gray-900 dark:text-gray-100">{transactions.filter(t => t.reference_type === 'order').length} items</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[40px] overflow-hidden min-h-[500px]">
            <CardHeader className="border-b border-gray-50 pb-6 space-y-4">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-gray-900">Recent Activity</CardTitle>
                  <CardDescription className="text-sm font-medium text-gray-400">Your latest transactions</CardDescription>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-2xl flex items-center gap-2">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Advanced View</span>
                  <History className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Filters & Search Bar */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Search by description..." 
                    className="pl-11 h-12 bg-gray-50 dark:bg-slate-800 border-none rounded-2xl font-bold placeholder:text-gray-300 dark:placeholder:text-gray-500 focus-visible:ring-gray-200 dark:focus-visible:ring-slate-700 transition-all dark:text-gray-100"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <select 
                    className="bg-gray-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-2 font-black text-xs text-gray-600 dark:text-gray-300 focus:ring-0 cursor-pointer appearance-none hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors h-12 min-w-[140px]"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="all">All Months</option>
                    {availableMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>

                  <div className="flex bg-gray-50 dark:bg-slate-800 p-1.5 rounded-2xl gap-1 h-12 items-center">
                    <button 
                      onClick={() => setTypeFilter('all')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${typeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setTypeFilter('credit')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${typeFilter === 'credit' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-emerald-500'}`}
                    >
                      Credits
                    </button>
                    <button 
                      onClick={() => setTypeFilter('debit')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${typeFilter === 'debit' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-blue-500'}`}
                    >
                      Debits
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Summary Row with Digital Sparklines */}
              {!isLoading && filteredTransactions.length > 0 && (
                <div className="grid grid-cols-2 bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-50 dark:border-slate-800 p-4 gap-4">
                  <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-4 border border-white/60 dark:border-slate-700/50 flex flex-col group transition-all hover:bg-emerald-50/30 dark:hover:bg-emerald-500/10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Digital Inflow</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{wallet?.currency} {totalCredited.toLocaleString()}</span>
                    </div>
                    <div className="h-12 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="credits" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCredits)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-4 border border-white/60 dark:border-slate-700/50 flex flex-col group transition-all hover:bg-blue-50/30 dark:hover:bg-blue-500/10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Digital Outflow</span>
                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">{wallet?.currency} {totalDebited.toLocaleString()}</span>
                    </div>
                    <div className="h-12 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorDebits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="debits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDebits)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="p-6">
                  <TransactionSkeleton />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    {searchQuery ? <Search className="w-8 h-8 text-gray-200 dark:text-gray-700" /> : <Clock className="w-8 h-8 text-gray-200 dark:text-gray-700" />}
                  </div>
                  <p className="text-gray-900 dark:text-white font-black text-lg mb-1">{searchQuery ? 'No matches found' : 'No transactions yet'}</p>
                  <p className="text-gray-400 text-sm font-medium">
                    {searchQuery ? `We couldn't find anything for "${searchQuery}"` : 'Your recent activity will appear here.'}
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="ghost" 
                      className="mt-4 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader className="bg-gray-50/50 border-none">
                        <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-gray-400 pl-8">Transaction</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-gray-400">Date</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-gray-400">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-gray-400 text-right pr-8">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.map((tx) => (
                        <TableRow key={tx.id} className="group border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <TableCell className="pl-8 py-4">
                            <div className="flex items-center gap-4">
                                {getTransactionIcon(tx.type, tx.reference_type)}
                                <div>
                                <p className="text-sm font-black text-gray-900 leading-none mb-1">{tx.description || (tx.type === 'credit' ? 'Deposit' : 'Withdrawal')}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{tx.reference_type}</p>
                                </div>
                            </div>
                            </TableCell>
                            <TableCell>
                            <p className="text-xs font-bold text-gray-600">{format(new Date(tx.created_at), 'MMM dd, yyyy')}</p>
                            <p className="text-[10px] text-gray-400">{format(new Date(tx.created_at), 'HH:mm')}</p>
                            </TableCell>
                            <TableCell>
                            <Badge className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border pointer-events-none shadow-none ${getStatusColor(tx.status)}`}>
                                {tx.status}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                            <p className={`text-sm font-black ${tx.type === 'credit' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {tx.type === 'credit' ? '+' : '-'}{wallet.currency} {tx.amount.toLocaleString()}
                            </p>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
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

      <StatementGenerator
        isOpen={showStatementModal}
        onClose={() => setShowStatementModal(false)}
        transactions={transactions}
        walletBalance={wallet?.balance || 0}
        userName={user?.email?.split('@')[0] || 'User'}
        walletId={wallet?.id || ''}
      />

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <Dialog open={showSuccessAnimation} onOpenChange={setShowSuccessAnimation}>
          <DialogContent className="sm:max-w-md">
            <SuccessAnimation 
              type="success" 
              message={successMessage}
              onComplete={() => {
                setTimeout(() => setShowSuccessAnimation(false), 1500);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Confetti Effect */}
      {showConfetti && <ConfettiAnimation />}
    </div>
  );
};

export default Wallet;
