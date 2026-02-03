
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Facebook, Linkedin, MessageCircle, Share2, Twitter, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareProductProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    image?: string;
  };
  trigger?: React.ReactNode;
}

export function ShareProductDialog({ product, trigger }: ShareProductProps) {
  const [copied, setCopied] = useState(false);
  
  // Base URL construction
  const baseUrl = window.location.origin;
  const productUrl = `${baseUrl}/product/${product.id}`;
  
  // Share content
  const title = `Check out ${product.name}`;
  const text = `I found this amazing deal on SellHub: ${product.name} for KES ${product.price.toLocaleString()}.`;
  
  // Social Share Links
  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${productUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Product</DialogTitle>
          <DialogDescription>
            Share this product with your network to boost visibility.
          </DialogDescription>
        </DialogHeader>
        
        {/* Preview Card */}
        <div className="flex gap-4 p-4 border rounded-lg bg-muted/30 mt-2">
          <div className="h-16 w-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
            {product.image && (
              <img 
                src={product.image} 
                alt={product.name} 
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{product.name}</h4>
            <p className="text-sm text-green-600 font-bold">KES {product.price.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground truncate">{productUrl}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 py-4">
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-all">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">WhatsApp</span>
          </a>
          
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#1877F2]/10 text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white transition-all">
              <Facebook className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">Facebook</span>
          </a>

          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] group-hover:bg-[#1DA1F2] group-hover:text-white transition-all">
              <Twitter className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">Twitter</span>
          </a>

          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#0A66C2]/10 text-[#0A66C2] group-hover:bg-[#0A66C2] group-hover:text-white transition-all">
              <Linkedin className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">LinkedIn</span>
          </a>
        </div>

        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              defaultValue={productUrl}
              readOnly
              className="h-9"
            />
          </div>
          <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
