import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertBannerProps {
  messages: string[];
}

export function AlertBanner({ messages }: AlertBannerProps) {
  return (
    <AnimatePresence>
      {messages.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 overflow-hidden"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              {messages.map((msg, i) => (
                <p key={i} className="text-sm text-red-300">{msg}</p>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
