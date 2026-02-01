import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Wallet, 
  Search, 
  Plus, 
  Minus, 
  Eye, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Users,
  DollarSign,
  Activity
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  user_avatar?: string;
  transaction_count?: number;
  last_activity?: string;
}

interface Transaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'credit' | 'debit';
  reference_type: string;
  description: string;
  status: string;
  created_at: string;
  mpesa_receipt?: string;
}

export default function AdminWallets() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [filteredWallets, setFilteredWallets] = useState<WalletData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalBalance: 0,
    activeWallets: 0,
    todayTransactions: 0
  });

  useEffect(() => {
    fetchWallets();

    // Real-time subscriptions
    const walletsChannel = supabase
      .channel('admin-wallets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets' },
        (payload) => {
          console.log('Wallet update received:', payload);
          fetchWallets();
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel('admin-transactions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions' },
        (payload) => {
           console.log('Transaction update received:', payload);
           fetchWallets(); // Refresh stats and balances
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletsChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, []);

  const fetchWallets = async () => {
    setIsLoading(true);
    try {
      // Fetch all wallets with user profiles
      const { data: walletsData, error: walletsError } = await supabase
        .from('wallets')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name,
            avatar_url
          )
        `)
        .order('balance', { ascending: false });

      if (walletsError) throw walletsError;

      // Fetch transaction counts for each wallet
      const walletsWithCounts = await Promise.all(
        (walletsData || []).map(async (wallet) => {
          const { count } = await supabase
            .from('wallet_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('wallet_id', wallet.id);

          const { data: lastTx } = await supabase
            .from('wallet_transactions')
            .select('created_at')
            .eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...wallet,
            user_email: wallet.profiles?.email,
            user_name: wallet.profiles?.full_name,
            user_avatar: wallet.profiles?.avatar_url,
            transaction_count: count || 0,
            last_activity: lastTx?.created_at
          };
        })
      );

      setWallets(walletsWithCounts);
      setFilteredWallets(walletsWithCounts);

      // Calculate stats
      const totalBalance = walletsWithCounts.reduce((sum, w) => sum + w.balance, 0);
      const activeWallets = walletsWithCounts.filter(w => (w.transaction_count || 0) > 0).length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
       .from('wallet_transactions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        totalWallets: walletsWithCounts.length,
        totalBalance,
        activeWallets,
        todayTransactions: todayCount || 0
      });

    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error('Failed to load wallets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Filter wallets based on search
    if (searchTerm.trim() === "") {
      setFilteredWallets(wallets);
    } else {
      const filtered = wallets.filter(wallet => 
        wallet.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wallet.balance.toString().includes(searchTerm)
      );
      setFilteredWallets(filtered);
    }
  }, [searchTerm, wallets]);


  const fetchTransactions = async (walletId: string) => {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const handleViewWallet = async (wallet: WalletData) => {
    setSelectedWallet(wallet);
    await fetchTransactions(wallet.id);
    setShowTransactionsDialog(true);
  };

  const handleAdjustWallet = (wallet: WalletData, type: 'credit' | 'debit') => {
    setSelectedWallet(wallet);
    setAdjustmentType(type);
    setAdjustmentAmount("");
    setAdjustmentReason("");
    setShowAdjustDialog(true);
  };

  const processAdjustment = async () => {
    if (!selectedWallet || !adjustmentAmount || !adjustmentReason) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      // Get current admin user ID for audit logging
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Admin user not authenticated');

      // Create transaction record
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: selectedWallet.id,
          amount: amount,
          type: adjustmentType,
          reference_type: 'admin_adjustment',
          description: `Admin ${adjustmentType}: ${adjustmentReason}`,
          status: 'completed'
        });

      if (txError) throw txError;

      // Update wallet balance
      const newBalance = adjustmentType === 'credit' 
        ? selectedWallet.balance + amount 
        : selectedWallet.balance - amount;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', selectedWallet.id);

      if (walletError) throw walletError;

      // 🔒 CRITICAL: Log admin action for audit trail
      const { error: logError } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: user.id,
          action_type: `wallet_${adjustmentType}`,
          target_type: 'wallet',
          target_id: selectedWallet.id,
          details: {
            user_id: selectedWallet.user_id,
            user_email: selectedWallet.user_email,
            amount: amount,
            currency: selectedWallet.currency,
            previous_balance: selectedWallet.balance,
            new_balance: newBalance,
            reason: adjustmentReason,
            adjustment_type: adjustmentType
          },
          ip_address: null, // Could be enhanced with IP tracking
          user_agent: navigator.userAgent,
          status: 'success'
        });

      if (logError) {
        console.error('Failed to log admin action:', logError);
        // Don't fail the transaction if logging fails, but warn
        toast.error('Warning: Action completed but audit log failed');
      }

      toast.success(`Wallet ${adjustmentType}ed successfully`);
      setShowAdjustDialog(false);
      fetchWallets();
    } catch (error: any) {
      console.error('Error adjusting wallet:', error);
      
      // Log failed attempt
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('admin_actions').insert({
            admin_id: user.id,
            action_type: `wallet_${adjustmentType}_failed`,
            target_type: 'wallet',
            target_id: selectedWallet.id,
            details: {
              error: error.message,
              amount: amount,
              reason: adjustmentReason
            },
            status: 'failed'
          });
        }
      } catch (logErr) {
        console.error('Failed to log error:', logErr);
      }
      
      toast.error('Failed to adjust wallet: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };


  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-black text-gray-900">Wallet Management</h1>
          <p className="text-muted-foreground mt-2">Monitor and manage user wallets</p>
        </div>
        <Button onClick={fetchWallets} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass hover:glass-strong transition-smooth hover-lift border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Wallets</p>
                <h3 className="text-3xl font-black mt-2">{stats.totalWallets}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-2xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover:glass-strong transition-smooth hover-lift border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                <h3 className="text-3xl font-black mt-2">KES {stats.totalBalance.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-green-100 rounded-2xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover:glass-strong transition-smooth hover-lift border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Wallets</p>
                <h3 className="text-3xl font-black mt-2">{stats.activeWallets}</h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-2xl">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover:glass-strong transition-smooth hover-lift border-white/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Transactions</p>
                <h3 className="text-3xl font-black mt-2">{stats.todayTransactions}</h3>
              </div>
              <div className="p-3 bg-orange-100 rounded-2xl">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search by email, name, or balance..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-14 rounded-2xl glass-strong"
        />
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWallets.map((wallet) => (
          <Card 
            key={wallet.id} 
            className="glass hover:glass-strong transition-smooth hover-lift cursor-pointer group border-white/20"
            onClick={() => handleViewWallet(wallet)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={wallet.user_avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-green-600 text-white font-bold">
                    {getInitials(wallet.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h4 className="font-heading font-bold text-sm truncate">{wallet.user_name || 'Unknown User'}</h4>
                  <p className="text-xs text-muted-foreground truncate">{wallet.user_email}</p>
                </div>
              </div>
              <Wallet className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Balance</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-primary">{wallet.currency}</h3>
                  <h3 className="text-3xl font-black">{wallet.balance.toLocaleString()}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="font-bold mt-1">{wallet.transaction_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Activity</p>
                  <p className="font-bold mt-1 text-xs">
                    {wallet.last_activity ? format(new Date(wallet.last_activity), 'MMM dd') : 'Never'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 gap-1 hover-glow-primary"
                  onClick={() => handleAdjustWallet(wallet, 'credit')}
                >
                  <Plus className="w-3 h-3" />
                  Credit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() => handleAdjustWallet(wallet, 'debit')}
                >
                  <Minus className="w-3 h-3" />
                  Debit
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleViewWallet(wallet)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWallets.length === 0 && (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No wallets found</p>
        </div>
      )}

      {/* Transactions Dialog */}
      <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedWallet?.user_avatar} />
                <AvatarFallback>{getInitials(selectedWallet?.user_name)}</AvatarFallback>
              </Avatar>
              <div>
                <div>{selectedWallet?.user_name}'s Wallet</div>
                <div className="text-sm font-normal text-muted-foreground">{selectedWallet?.user_email}</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="font-medium">Current Balance:</span>
              <span className="text-2xl font-black text-primary">
                {selectedWallet?.currency} {selectedWallet?.balance.toLocaleString()}
              </span>
            </div>

            <div>
              <h4 className="font-bold mb-3">Transaction History</h4>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tx.type === 'credit' ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {tx.type === 'credit' ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black ${tx.type === 'credit' ? 'text-green-600' : 'text-blue-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'} {tx.amount.toLocaleString()}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust Wallet Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === 'credit' ? 'Credit' : 'Debit'} Wallet
            </DialogTitle>
            <DialogDescription>
              {adjustmentType === 'credit' ? 'Add funds to' : 'Remove funds from'} {selectedWallet?.user_name}'s wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this adjustment..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Current Balance:</p>
              <p className="text-lg font-black">{selectedWallet?.currency} {selectedWallet?.balance.toLocaleString()}</p>
              {adjustmentAmount && (
                <>
                  <p className="text-sm text-muted-foreground mt-2">New Balance:</p>
                  <p className={`text-lg font-black ${adjustmentType === 'credit' ? 'text-green-600' : 'text-blue-600'}`}>
                    {selectedWallet?.currency} {(
                      selectedWallet?.balance + 
                      (adjustmentType === 'credit' ? 1 : -1) * parseFloat(adjustmentAmount || '0')
                    ).toLocaleString()}
                  </p>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processAdjustment} 
              disabled={isProcessing}
              className={adjustmentType === 'credit' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {isProcessing ? 'Processing...' : `${adjustmentType === 'credit' ? 'Credit' : 'Debit'} Wallet`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
