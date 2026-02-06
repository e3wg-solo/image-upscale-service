import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
}

export function Header({ onReset }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-yellow-200/50 bg-white/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <button onClick={onReset} className="flex items-center gap-3 transition-transform hover:scale-105">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-2xl shadow-lg shadow-yellow-200">
            🍌
          </div>
          <div className="hidden sm:block">
            <h1 className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-lg font-bold text-transparent">
              Нана Банана
            </h1>
            <p className="text-[10px] font-medium tracking-wider text-yellow-600/60 uppercase">
              AI Photo Studio
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>2K — 4K HD</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
