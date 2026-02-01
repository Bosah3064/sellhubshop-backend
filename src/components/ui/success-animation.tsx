import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface SuccessAnimationProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  onComplete?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ 
  type, 
  message, 
  onComplete 
}) => {
  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle
  };

  const colors = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-yellow-500'
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', duration: 0.5 }}
      onAnimationComplete={onComplete}
      className="flex flex-col items-center justify-center p-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.6, times: [0, 0.6, 1] }}
      >
        <Icon className={`w-20 h-20 ${colors[type]}`} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-lg font-semibold text-center"
      >
        {message}
      </motion.p>
    </motion.div>
  );
};

export const ConfettiAnimation = () => {
  const confetti = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ['bg-emerald-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'][Math.floor(Math.random() * 5)]
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          className={`absolute w-2 h-2 ${piece.color} rounded-full`}
          style={{ left: `${piece.x}%`, top: '-10px' }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{ 
            y: window.innerHeight + 100, 
            opacity: [1, 1, 0],
            rotate: 360 * 3
          }}
          transition={{ 
            duration: piece.duration, 
            delay: piece.delay,
            ease: 'easeIn'
          }}
        />
      ))}
    </div>
  );
};

export const PulseAnimation: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
};
