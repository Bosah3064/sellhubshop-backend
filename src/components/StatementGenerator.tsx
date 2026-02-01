import React, { useState } from 'react';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Printer,
  Image as ImageIcon
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import logo from '@/assets/logo.png';
import './statement-print.css';

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  reference_type: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
}

interface StatementGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  walletBalance: number;
  userName: string;
  walletId: string;
}

export const StatementGenerator: React.FC<StatementGeneratorProps> = ({
  isOpen,
  onClose,
  transactions,
  walletBalance,
  userName,
  walletId
}) => {
  const [period, setPeriod] = useState('30');
  const [isGenerating, setIsGenerating] = useState(false);
  const [colorMode, setColorMode] = useState<'color' | 'bw'>('color');

  const filterTransactionsByPeriod = () => {
    const days = parseInt(period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return transactions.filter(tx => 
      new Date(tx.created_at) >= cutoffDate
    ).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  const filteredTransactions = filterTransactionsByPeriod();

  const calculateSummary = () => {
    const totalCredits = filteredTransactions
      .filter(tx => tx.type === 'credit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalDebits = filteredTransactions
      .filter(tx => tx.type === 'debit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const pendingAmount = filteredTransactions
      .filter(tx => tx.status === 'pending')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return { totalCredits, totalDebits, pendingAmount };
  };

  const summary = calculateSummary();

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('statement-content');
      if (!element) return;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `SellHubShop_Statement_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('statement-content');
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const bwStyles = colorMode === 'bw' ? `
      .text-emerald-600, .text-emerald-700, .text-emerald-800 { color: #000 !important; }
      .text-red-600, .text-red-700, .text-red-800 { color: #000 !important; }
      .text-yellow-800 { color: #000 !important; }
      .bg-emerald-100, .bg-emerald-600, .bg-emerald-50 { background: #f3f4f6 !important; }
      .bg-red-100 { background: #f3f4f6 !important; }
      .bg-yellow-100 { background: #f3f4f6 !important; }
      .bg-gray-900, .bg-gray-800 { background: #000 !important; }
      .border-emerald-600, .border-emerald-200 { border-color: #000 !important; }
      .from-emerald-50, .to-emerald-100, .from-gray-50, .to-white { background: #fff !important; }
      .from-gray-900, .to-gray-800 { background: #000 !important; }
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SellHubShop Statement</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              margin: 0; 
              padding: 20px;
              background: white;
              color: #000;
            }
            * { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            
            /* Table Styling */
            table { 
              width: 100%; 
              border-collapse: collapse;
              margin: 1rem 0;
            }
            
            thead tr {
              background: linear-gradient(to right, #1f2937, #374151) !important;
              color: white !important;
            }
            
            th {
              padding: 12px;
              text-align: left;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
              color: white !important;
            }
            
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
            }
            
            tbody tr:nth-child(even) {
              background-color: #f9fafb;
            }
            
            tbody tr:hover {
              background-color: #f3f4f6;
            }
            
            /* Color badges and text */
            .text-emerald-600, .text-emerald-700, .text-emerald-800 {
              color: #059669 !important;
            }
            
            .text-red-600, .text-red-700, .text-red-800 {
              color: #dc2626 !important;
            }
            
            .bg-emerald-100 {
              background-color: #d1fae5 !important;
              color: #065f46 !important;
            }
            
            .bg-emerald-600 {
              background-color: #059669 !important;
              color: white !important;
            }
            
            .bg-red-100 {
              background-color: #fee2e2 !important;
              color: #991b1b !important;
            }
            
            .bg-yellow-100 {
              background-color: #fef3c7 !important;
              color: #92400e !important;
            }
            
            /* Borders */
            .border-emerald-600 {
              border-color: #059669 !important;
            }
            
            .border-4 {
              border-width: 4px !important;
            }
            
            /* Gradients */
            .from-gray-900.to-gray-800 {
              background: linear-gradient(to right, #1f2937, #374151) !important;
            }
            
            .from-emerald-50.to-emerald-100 {
              background: linear-gradient(to bottom right, #ecfdf5, #d1fae5) !important;
            }
            
            /* Remove shadows for print */
            .shadow-lg, .shadow-xl, .shadow-2xl, .shadow-md, .shadow-sm {
              box-shadow: none !important;
            }
            
            /* Rounded corners */
            .rounded-full {
              border-radius: 9999px !important;
            }
            
            .rounded-xl {
              border-radius: 12px !important;
            }
            
            .rounded-lg {
              border-radius: 8px !important;
            }
            
            /* Page breaks */
            h1, h2, h3, table {
              page-break-inside: avoid;
            }
            
            ${bwStyles}
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const exportAsImage = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('statement-content');
      if (!element) return;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `SellHubShop_Statement_${format(new Date(), 'yyyy-MM-dd')}.png`,
        image: { type: 'png' as const, quality: 1 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).outputImg().then((img: any) => {
        const link = document.createElement('a');
        link.download = `SellHubShop_Statement_${format(new Date(), 'yyyy-MM-dd')}.png`;
        link.href = img.src;
        link.click();
      });
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const statementId = `STMT-${Date.now().toString().slice(-8)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Download Statement</DialogTitle>
          <DialogDescription>
            Generate a professional statement of your wallet transactions
          </DialogDescription>
        </DialogHeader>

        {/* Selectors */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="period">Statement Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="period" className="w-full mt-2">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="colorMode">Print Mode</Label>
            <Select value={colorMode} onValueChange={(value) => setColorMode(value as 'color' | 'bw')}>
              <SelectTrigger id="colorMode" className="w-full mt-2">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="color">🎨 Color (Recommended)</SelectItem>
                <SelectItem value="bw">⚫ Black & White</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview */}
        <div id="statement-content" className="bg-white p-8 border rounded-lg">
          {/* Header */}
          <div className="border-b-2 border-gray-900 pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img src={logo} alt="SellHubShop Logo" className="h-16 w-16 object-contain" />
                <div>
                  <h1 className="text-3xl font-black text-gray-900">SellHubShop</h1>
                  <p className="text-sm text-gray-600 mt-1">Your Trusted Marketplace</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-2">
                  OFFICIAL STATEMENT
                </div>
                <p className="text-xs text-gray-600">Statement ID: {statementId}</p>
                <p className="text-xs text-gray-600">Generated: {format(new Date(), 'PPpp')}</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Account Holder</p>
              <p className="text-sm font-semibold text-gray-900">{userName}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Wallet ID</p>
              <p className="text-sm font-mono text-gray-900">{walletId.slice(0, 16)}...</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Statement Period</p>
              <p className="text-sm text-gray-900">
                {format(new Date(new Date().setDate(new Date().getDate() - parseInt(period))), 'PP')} - {format(new Date(), 'PP')}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Current Balance</p>
              <p className="text-sm font-bold text-emerald-600">KES {walletBalance.toLocaleString()}</p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Transaction History</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-right p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-4 text-gray-500">
                      No transactions in this period
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, index) => (
                    <tr key={tx.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2">{format(new Date(tx.created_at), 'PPp')}</td>
                      <td className="p-2">{tx.description}</td>
                      <td className="p-2">
                        <span className={`inline-flex items-center gap-1 ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          tx.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className={`p-2 text-right font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? '+' : '-'}KES {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Total Credits</p>
              <p className="text-lg font-bold text-emerald-600">KES {summary.totalCredits.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Total Debits</p>
              <p className="text-lg font-bold text-red-600">KES {summary.totalDebits.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Transactions</p>
              <p className="text-lg font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-900 pt-4">
            <div className="text-center text-xs text-gray-600 space-y-2">
              <p className="font-bold uppercase">Official Stamp & Seal</p>
              <div className="inline-block relative">
                <div className="border-4 border-emerald-600 rounded-full px-8 py-4 my-2 bg-gradient-to-br from-emerald-50 to-white shadow-lg">
                  <img src={logo} alt="SellHubShop Stamp" className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-black text-gray-900 text-sm">SellHubShop</p>
                  <p className="text-[10px] text-emerald-600 font-bold">CERTIFIED MARKETPLACE</p>
                  <p className="text-[8px] text-gray-500 mt-1">{format(new Date(), 'PP')}</p>
                </div>
              </div>
              <p className="italic">This is a computer-generated statement and does not require a signature.</p>
              <p className="mt-2">
                <span className="font-bold">Policy:</span> All transactions are subject to our Terms & Conditions.
              </p>
              <p>For inquiries: support@sellhubshop.co.ke | +254 700 000 000</p>
              <p className="text-[10px] mt-4 text-gray-400">
                Generated on {format(new Date(), 'PPpp')} | Statement ID: {statementId}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handlePrint}
            variant="outline"
            disabled={isGenerating}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button 
            onClick={exportAsImage}
            variant="outline"
            disabled={isGenerating}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Image
          </Button>
          <Button 
            onClick={generatePDF} 
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isGenerating ? (
              <Clock className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
