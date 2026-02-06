import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { Preset } from '../data/presets';

interface PresetCardProps {
  preset: Preset;
  index: number;
  onClick: () => void;
}

export function PresetCard({ preset, index, onClick }: PresetCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-xl hover:shadow-gray-200/50"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${preset.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
      
      <div className="relative z-10">
        <div className="mb-3 flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${preset.color} text-2xl shadow-md`}>
            {preset.icon}
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${
            preset.resolution === '4K'
              ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {preset.resolution}
          </span>
        </div>

        <h3 className="mb-1 text-sm font-bold text-gray-900">{preset.nameRu}</h3>
        <p className="mb-3 text-xs leading-relaxed text-gray-500">{preset.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              {preset.width}×{preset.height}
            </span>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              {preset.aspectRatio}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-600" />
        </div>
      </div>
    </motion.button>
  );
}
