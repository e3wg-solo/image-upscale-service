import { motion } from 'framer-motion';
import { useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Settings2,
  Zap,
  Layers,
  Maximize,
  Info,
} from 'lucide-react';
import type { Preset } from '../data/presets';
import { styleOptions } from '../data/styleOptions';
import { aspectRatios } from '../data/presets';

interface SettingsPanelProps {
  preset: Preset;
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
  onBack: () => void;
  onGenerate: () => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

export interface GenerationSettings {
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  sampler: string;
  negativePrompt: string;
  style: string;
  batchSize: number;
  selectedStyles: string[]; // Массив ID выбранных стилей
  aspectRatio: string; // Соотношение сторон ('auto' или конкретное значение)
  resolution: '2K' | '4K'; // Разрешение
}

export function SettingsPanel({
  preset,
  settings,
  onSettingsChange,
  onBack,
  onGenerate,
  prompt,
  onPromptChange,
}: SettingsPanelProps) {
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Автофокус на промпт при открытии пресета
  useEffect(() => {
    setTimeout(() => {
      promptTextareaRef.current?.focus();
    }, 100);
  }, []);

  // Функция для вычисления размеров на основе соотношения сторон и разрешения
  const calculateDimensions = (aspectRatio: string, resolution: '2K' | '4K'): { width: number; height: number } => {
    const maxSize = resolution === '2K' ? 2048 : 3840;
    
    if (aspectRatio === 'auto') {
      return { width: preset.width, height: preset.height };
    }

    const [w, h] = aspectRatio.split(':').map(Number);
    const ratio = w / h;

    let width: number, height: number;
    
    if (ratio >= 1) {
      // Горизонтальное или квадратное
      width = maxSize;
      height = Math.round(maxSize / ratio);
    } else {
      // Вертикальное
      height = maxSize;
      width = Math.round(maxSize * ratio);
    }

    // Округляем до ближайшего кратного 64
    width = Math.round(width / 64) * 64;
    height = Math.round(height / 64) * 64;

    return { width, height };
  };

  // Вычисляем текущие размеры
  const currentDimensions = useMemo(() => {
    return calculateDimensions(settings.aspectRatio || 'auto', settings.resolution || preset.resolution);
  }, [settings.aspectRatio, settings.resolution, preset]);

  // Обработка выбора стилей
  const handleStyleToggle = (styleId: string) => {
    const currentStyles = settings.selectedStyles || [];
    const isSelected = currentStyles.includes(styleId);
    
    let newStyles: string[];
    if (isSelected) {
      newStyles = currentStyles.filter(id => id !== styleId);
    } else {
      newStyles = [...currentStyles, styleId];
    }

    // Объединяем значения выбранных стилей
    const styleValues = newStyles
      .map(id => styleOptions.find(s => s.id === id)?.value)
      .filter(Boolean)
      .join(', ');

    onSettingsChange({
      ...settings,
      selectedStyles: newStyles,
      style: styleValues || preset.style, // Если ничего не выбрано, используем стиль пресета
    });
  };

  // Обработка изменения соотношения сторон
  const handleAspectRatioChange = (ratio: string) => {
    const newDimensions = calculateDimensions(ratio, settings.resolution || preset.resolution);
    onSettingsChange({
      ...settings,
      aspectRatio: ratio,
      width: newDimensions.width,
      height: newDimensions.height,
    });
  };

  // Обработка изменения разрешения
  const handleResolutionChange = (resolution: '2K' | '4K') => {
    const newDimensions = calculateDimensions(settings.aspectRatio || 'auto', resolution);
    onSettingsChange({
      ...settings,
      resolution,
      width: newDimensions.width,
      height: newDimensions.height,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="mx-auto max-w-4xl px-4 py-6"
    >
      {/* Back + Title */}
      <div className="mb-6 flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </motion.button>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${preset.color} text-xl shadow-md`}>
            {preset.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{preset.nameRu}</h2>
            <p className="text-xs text-gray-500">{preset.description}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
        {/* Left: Prompt */}
        <div className="space-y-4">
          {/* Main Prompt */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Zap className="h-4 w-4 text-yellow-500" />
              Опишите, что хотите увидеть на фото
            </label>
            <textarea
              ref={promptTextareaRef}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={preset.examplePrompt || "Например: красивый закат над горами с озером на переднем плане"}
              rows={4}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-100"
            />
          </div>

          {/* Style Selection */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Layers className="h-4 w-4 text-purple-500" />
              Выберите стили (можно несколько)
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {styleOptions.map((style) => {
                const isSelected = (settings.selectedStyles || []).includes(style.id);
                return (
                  <motion.button
                    key={style.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStyleToggle(style.id)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      isSelected
                        ? 'border-purple-400 bg-purple-50 shadow-sm'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="mb-1 text-lg">{style.icon}</div>
                    <div className={`text-xs font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                      {style.label}
                    </div>
                    <div className="mt-0.5 text-[10px] text-gray-500">{style.description}</div>
                  </motion.button>
                );
              })}
            </div>
            {settings.selectedStyles && settings.selectedStyles.length === 0 && (
              <p className="mt-2 text-xs text-gray-400">
                💡 Стиль из пресета будет использован автоматически, если ничего не выбрано
              </p>
            )}
          </div>

          {/* Negative Prompt */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <span className="text-red-400">⛔</span>
              Негативный промпт
              <div className="group relative">
                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                <div className="absolute left-0 top-6 z-10 hidden w-64 rounded-lg bg-gray-900 p-3 text-xs text-white shadow-xl group-hover:block">
                  <p className="mb-1 font-semibold">Что это?</p>
                  <p>Опишите то, чего НЕ должно быть на изображении. Например: "размыто, низкое качество, водяной знак, текст". Это помогает избежать нежелательных элементов.</p>
                </div>
              </div>
            </label>
            <textarea
              value={settings.negativePrompt}
              onChange={(e) => onSettingsChange({ ...settings, negativePrompt: e.target.value })}
              placeholder={preset.negativePrompt || "Например: размыто, низкое качество, водяной знак, текст"}
              rows={2}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 placeholder-gray-400 outline-none transition-colors focus:border-red-300 focus:bg-white focus:ring-2 focus:ring-red-50"
            />
            <p className="mt-1 text-[10px] text-gray-400">
              Опишите то, чего НЕ должно быть на изображении (необязательно)
            </p>
          </div>
        </div>

        {/* Right: Settings */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Settings2 className="h-4 w-4 text-gray-400" />
              Настройки
            </h3>

            {/* Resolution */}
            <div className="mb-4">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Maximize className="h-3 w-3" />
                Разрешение
              </label>
              <div className="flex gap-1.5">
                {(['2K', '4K'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => handleResolutionChange(res)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                      (settings.resolution || preset.resolution) === res
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="mb-4">
              <label className="mb-1.5 text-xs font-medium text-gray-500">Соотношение сторон</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleAspectRatioChange('auto')}
                  className={`rounded-lg py-2 text-xs font-bold transition-all ${
                    (settings.aspectRatio || 'auto') === 'auto'
                      ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  Авто
                </button>
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => handleAspectRatioChange(ratio.value)}
                    className={`rounded-lg py-2 text-xs font-bold transition-all ${
                      settings.aspectRatio === ratio.value
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={ratio.label}
                  >
                    {ratio.icon}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2 rounded-xl bg-gray-50 p-1.5">
                <div className="flex-1 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-2 text-center text-xs font-bold text-white shadow-sm">
                  {currentDimensions.width} × {currentDimensions.height}
                </div>
              </div>
            </div>

            {/* Batch Size */}
            <div className="mb-4">
              <label className="mb-1.5 text-xs font-medium text-gray-500">Количество изображений</label>
              <div className="flex gap-1.5">
                {[1, 2, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => onSettingsChange({ ...settings, batchSize: n })}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                      settings.batchSize === n
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGenerate}
            disabled={!prompt.trim()}
            className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-2">
              🍌 Сгенерировать фото
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
