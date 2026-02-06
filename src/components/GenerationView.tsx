import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, ArrowLeft, Copy, Check, ZoomIn, X, AlertCircle } from 'lucide-react';
import type { GenerationSettings } from './SettingsPanel';
import type { Preset } from '../data/presets';
import { generateBatchImages } from '../services/nanobananaApi';

interface GenerationViewProps {
  preset: Preset;
  prompt: string;
  settings: GenerationSettings;
  onBack: () => void;
  onReset: () => void;
}

interface GeneratedImage {
  id: string | number;
  seed?: number;
  imageUrl: string;
  loading?: boolean;
}

// Функция для скачивания изображения
const downloadImage = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Ошибка при скачивании изображения:', error);
  }
};

export function GenerationView({ preset, prompt, settings, onBack, onReset }: GenerationViewProps) {
  const [phase, setPhase] = useState<'generating' | 'done' | 'error'>('generating');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = settings.steps;

  // Генерация изображений через API
  useEffect(() => {
    let cancelled = false;
    let progressInterval: NodeJS.Timeout | null = null;

    const generateImages = async () => {
      try {
        setError(null);
        setPhase('generating');
        setProgress(0);
        setCurrentStep(0);
        setImages([]);

        // Симуляция прогресса (так как API может не возвращать прогресс в реальном времени)
        progressInterval = setInterval(() => {
          setCurrentStep((prev) => {
            if (prev >= totalSteps) {
              return prev;
            }
            const next = prev + 1;
            setProgress((next / totalSteps) * 100);
            return next;
          });
        }, 200);

        // Формируем полный промпт с учетом стиля
        const fullPrompt = settings.style ? `${prompt}, ${settings.style}` : prompt;
        const negativePrompt = settings.negativePrompt || preset.negativePrompt;

        // Генерируем изображения через API
        const results = await generateBatchImages(
          fullPrompt,
          settings,
          negativePrompt,
          settings.style
        );

        if (cancelled) return;

        // Преобразуем результаты API в формат для отображения
        const generatedImages: GeneratedImage[] = results.map((result, index) => ({
          id: result.id || `img-${index}`,
          seed: result.seed,
          imageUrl: result.imageUrl,
        }));

        if (progressInterval) {
          clearInterval(progressInterval);
        }

        setProgress(100);
        setCurrentStep(totalSteps);
        setImages(generatedImages);
        setPhase('done');
      } catch (err) {
        if (cancelled) return;

        if (progressInterval) {
          clearInterval(progressInterval);
        }

        const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при генерации изображения';
        setError(errorMessage);
        setPhase('error');
        console.error('Ошибка генерации:', err);
      }
    };

    generateImages();

    return () => {
      cancelled = true;
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [prompt, settings, preset, totalSteps]);

  const handleCopySeed = useCallback((seed: number | undefined, id: string | number) => {
    if (seed !== undefined) {
      navigator.clipboard.writeText(String(seed));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleDownload = useCallback(async (imageUrl: string, index: number) => {
    const filename = `nanabanana-${Date.now()}-${index + 1}.png`;
    await downloadImage(imageUrl, filename);
  }, []);

  const handleRegenerate = useCallback(async () => {
    setPhase('generating');
    setProgress(0);
    setCurrentStep(0);
    setImages([]);
    setError(null);

    try {
      let progressInterval: NodeJS.Timeout | null = null;

      // Симуляция прогресса
      progressInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps) {
            return prev;
          }
          const next = prev + 1;
          setProgress((next / totalSteps) * 100);
          return next;
        });
      }, 200);

      // Формируем полный промпт с учетом стиля
      const fullPrompt = settings.style ? `${prompt}, ${settings.style}` : prompt;
      const negativePrompt = settings.negativePrompt || preset.negativePrompt;

      // Генерируем изображения через API
      const results = await generateBatchImages(
        fullPrompt,
        settings,
        negativePrompt,
        settings.style
      );

      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // Преобразуем результаты API в формат для отображения
      const generatedImages: GeneratedImage[] = results.map((result, index) => ({
        id: result.id || `img-${index}`,
        seed: result.seed,
        imageUrl: result.imageUrl,
      }));

      setProgress(100);
      setCurrentStep(totalSteps);
      setImages(generatedImages);
      setPhase('done');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка при генерации изображения';
      setError(errorMessage);
      setPhase('error');
      console.error('Ошибка генерации:', err);
    }
  }, [prompt, settings, preset, totalSteps]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-5xl px-4 py-6"
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </motion.button>
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {preset.icon} {preset.nameRu}
          </h2>
          <p className="text-xs text-gray-500 truncate max-w-md">«{prompt}»</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="mb-6 rounded-full bg-red-100 p-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-800">Ошибка генерации</h3>
            <p className="mb-6 max-w-md text-center text-sm text-gray-600">
              {error || 'Произошла ошибка при генерации изображения'}
            </p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRegenerate}
                className="rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-3 text-sm font-bold text-white shadow-lg"
              >
                <RefreshCw className="mr-2 inline h-4 w-4" />
                Попробовать снова
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onBack}
                className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 shadow-sm"
              >
                Вернуться к настройкам
              </motion.button>
            </div>
            {error?.includes('API ключ') && (
              <div className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 max-w-md">
                <p className="text-xs text-yellow-800">
                  💡 Убедитесь, что вы настроили Google API ключ в файле .env. 
                  Получите ключ на <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>.
                  Смотрите .env.example для примера конфигурации.
                </p>
              </div>
            )}
            {error?.includes('CORS') || error?.includes('Failed to fetch') ? (
              <div className="mt-6 rounded-lg bg-red-50 border border-red-200 p-4 max-w-md">
                <p className="text-xs text-red-800 whitespace-pre-line">
                  ⚠️ <strong>Проблема CORS:</strong> Google Generative AI API не поддерживает прямые запросы из браузера из-за политики безопасности.
                  {'\n\n'}
                  <strong>Решения:</strong>
                  {'\n'}1. Используйте бэкенд-сервер (Node.js, Python) для проксирования запросов
                  {'\n'}2. Или используйте другой API, который поддерживает CORS
                  {'\n\n'}
                  Проверьте консоль браузера (F12) для подробностей об ошибке.
                </p>
              </div>
            ) : null}
          </motion.div>
        )}

        {phase === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20"
          >
            {/* Animated banana */}
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mb-8 text-7xl"
            >
              🍌
            </motion.div>

            <h3 className="mb-2 text-lg font-bold text-gray-800">Генерация изображения...</h3>
            <p className="mb-6 text-sm text-gray-500">
              Шаг {currentStep} из {totalSteps} · {settings.sampler}
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-md">
              <div className="mb-2 h-3 overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500"
                  style={{ width: `${progress}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{settings.width}×{settings.height}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Info cards */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                { label: 'Разрешение', value: `${settings.width}×${settings.height}` },
                { label: 'CFG', value: String(settings.cfgScale) },
                { label: 'Кол-во', value: String(settings.batchSize) },
              ].map((info) => (
                <div key={info.label} className="rounded-xl bg-gray-50 px-4 py-2 text-center">
                  <div className="text-[10px] font-medium text-gray-400">{info.label}</div>
                  <div className="text-sm font-bold text-gray-700">{info.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Success banner */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="text-sm font-bold text-green-800">
                    Генерация завершена!
                  </h3>
                  <p className="text-xs text-green-600">
                    {settings.batchSize} {settings.batchSize === 1 ? 'изображение' : settings.batchSize < 5 ? 'изображения' : 'изображений'} · {settings.width}×{settings.height} · {settings.steps} шагов
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Images Grid */}
            <div className={`grid gap-4 ${
              settings.batchSize === 1
                ? 'grid-cols-1 max-w-2xl mx-auto'
                : settings.batchSize === 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-2'
            }`}>
              {images.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.15 }}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  {/* Generated Image */}
                  <div
                    className="relative w-full cursor-pointer overflow-hidden bg-gray-100"
                    style={{
                      aspectRatio: `${settings.width}/${settings.height}`,
                    }}
                    onClick={() => setZoomedImage(img)}
                  >
                    {img.loading ? (
                      <div className="flex h-full items-center justify-center bg-gray-100">
                        <div className="text-gray-400">Загрузка...</div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={img.imageUrl}
                          alt={`Сгенерированное изображение ${i + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            console.error('Ошибка загрузки изображения:', img.imageUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {/* Watermark */}
                        <div className="absolute bottom-3 left-3 rounded-lg bg-black/30 px-2.5 py-1 backdrop-blur-sm">
                          <span className="text-[10px] font-bold text-white/80">🍌 Нана Банана</span>
                        </div>

                        {/* Zoom icon */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
                          <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {img.seed !== undefined && (
                          <>
                            <span className="text-[10px] font-medium text-gray-400">
                              Seed: {img.seed}
                            </span>
                            <button
                              onClick={() => handleCopySeed(img.seed, img.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {copiedId === img.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleDownload(img.imageUrl, i)}
                        className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 transition-colors hover:bg-gray-200"
                      >
                        <Download className="h-3 w-3" />
                        Скачать
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRegenerate}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200"
              >
                <RefreshCw className="h-4 w-4" />
                Перегенерировать
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onBack}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 shadow-sm"
              >
                Изменить настройки
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onReset}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 shadow-sm"
              >
                Новый проект
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative w-[80vw] max-w-3xl overflow-hidden bg-gray-100"
                style={{
                  aspectRatio: `${settings.width}/${settings.height}`,
                }}
              >
                <img
                  src={zoomedImage.imageUrl}
                  alt="Увеличенное изображение"
                  className="h-full w-full object-contain"
                />
                <div className="absolute bottom-4 left-4 rounded-lg bg-black/40 px-3 py-1.5 backdrop-blur-sm">
                  <span className="text-xs font-bold text-white/90">🍌 Нана Банана · {settings.width}×{settings.height}</span>
                </div>
              </div>
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
