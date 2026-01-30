import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";

export type PaymentMethod = 'mpesa';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  onMethodChange,
  disabled = false
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-slate-300 text-sm font-medium">Payment Method</label>
      <div className="grid grid-cols-1">
        {/* M-Pesa Option */}
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => onMethodChange('mpesa')}
          className={`relative h-20 flex flex-col items-center justify-center gap-2 rounded-xl transition-all duration-200 border-green-500 text-green-400 bg-green-500/10 ring-2 ring-green-500/30`}
        >
          <div className="bg-green-500/20 p-2 rounded-full">
            <Smartphone className="w-5 h-5 font-bold" />
          </div>
          <span className="text-sm font-bold">Pay with M-Pesa</span>
          <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full" />
        </Button>
      </div>
    </div>
  );
}
