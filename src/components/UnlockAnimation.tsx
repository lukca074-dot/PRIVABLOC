import React from 'react';
import { Lock, LockKeyholeOpen, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface UnlockAnimationProps {
  onAnimationComplete: () => void;
  reason?: string;
  confidence?: number;
}

export const UnlockAnimation: React.FC<UnlockAnimationProps> = ({
  onAnimationComplete,
  reason,
  confidence,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#0c0d10] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.1, opacity: 0 }}
        onAnimationComplete={() => {
          setTimeout(onAnimationComplete, 1600);
        }}
        className="text-center max-w-sm w-full space-y-6"
      >
        <div className="relative inline-block">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-24 h-24 rounded-3xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto shadow-2xl shadow-blue-500/20"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -15, 0] }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <LockKeyholeOpen className="w-12 h-12 text-blue-400" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1.5 rounded-full border-2 border-[#0c0d10]"
          >
            <CheckCircle2 className="w-5 h-5" />
          </motion.div>
        </div>

        <div className="space-y-2">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white"
          >
            ¡Acceso Aprobado!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-blue-300 font-medium"
          >
            {reason || 'Fotografía verificada por la IA.'}
          </motion.p>

          {typeof confidence === 'number' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-300 mt-2"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Certeza de IA: {(confidence * 100).toFixed(0)}%
            </motion.div>
          )}
        </div>

        <div className="pt-4">
          <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Desbloqueando editor privado...
          </p>
        </div>
      </motion.div>
    </div>
  );
};
