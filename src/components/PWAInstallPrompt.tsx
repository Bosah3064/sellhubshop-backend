import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleClose = () => {
      setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl border border-border z-50 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
             <div className="bg-primary/10 p-2 rounded-full">
               <Download className="h-6 w-6 text-primary" />
             </div>
             <div>
               <h4 className="font-semibold text-sm">Install SellHub App</h4>
               <p className="text-xs text-muted-foreground">Add to home screen for better experience</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleInstallClick}>Install</Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
