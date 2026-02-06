import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Zap, Image, Shield, Star } from 'lucide-react';
import { Header } from './components/Header';
import { PresetCard } from './components/PresetCard';
import { SettingsPanel, type GenerationSettings } from './components/SettingsPanel';
import { GenerationView } from './components/GenerationView';
import { presets, type Preset } from './data/presets';

type AppPhase = 'presets' | 'settings' | 'generating';

export function App() {
  const [phase, setPhase] = useState<AppPhase>('presets');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [prompt, setPrompt] = useState('');
  const [settings, setSettings] = useState<GenerationSettings>({
    width: 2048,
    height: 2048,
    steps: 35,
    cfgScale: 7,
    sampler: 'DPM++ 2M Karras',
    negativePrompt: '',
    style: '',
    batchSize: 1,
    selectedStyles: [],
    aspectRatio: 'auto',
    resolution: '2K',
  });

  const handleSelectPreset = useCallback((preset: Preset) => {
    setSelectedPreset(preset);
    setSettings({
      width: preset.width,
      height: preset.height,
      steps: preset.steps,
      cfgScale: preset.cfgScale,
      sampler: preset.sampler,
      negativePrompt: preset.negativePrompt,
      style: preset.style,
      batchSize: 1,
      selectedStyles: [], // Сбрасываем выбранные стили при выборе нового пресета
      aspectRatio: 'auto', // По умолчанию авто (использует из пресета)
      resolution: preset.resolution, // Используем разрешение из пресета
    });
    setPhase('settings');
    // Прокручиваем страницу в начало при открытии пресета
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Прокручиваем в начало при переключении на фазу настроек
  useEffect(() => {
    if (phase === 'settings') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [phase]);

  const handleReset = useCallback(() => {
    setPhase('presets');
    setSelectedPreset(null);
    setPrompt('');
  }, []);

  const handleGenerate = useCallback(() => {
    setPhase('generating');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50/40 via-white to-orange-50/30">
      <Header onReset={handleReset} />

      <main className="pb-12">
        <AnimatePresence mode="wait">
          {phase === 'presets' && (
            <motion.div
              key="presets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Hero */}
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-100/40 to-transparent" />
                <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 text-xs font-semibold text-orange-700"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Генерация HD фотографий с помощью AI
                  </motion.div>

                  <motion.h1
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
                  >
                    <span className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                      Нана Банана
                    </span>
                    <br />
                    <span className="text-gray-800">Фото-студия AI</span>
                  </motion.h1>

                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mx-auto mb-8 max-w-xl text-base text-gray-500 sm:text-lg"
                  >
                    Создавайте потрясающие фотографии в разрешении 2K и 4K
                    с помощью заранее настроенных пресетов. Быстро, просто, красиво!
                  </motion.p>

                  {/* Stats */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mx-auto flex max-w-md flex-wrap justify-center gap-4 sm:gap-6"
                  >
                    {[
                      { icon: <Image className="h-4 w-4" />, label: '4K Ultra HD', sublabel: 'до 3840×3840' },
                      { icon: <Zap className="h-4 w-4" />, label: '8 пресетов', sublabel: 'готовых стилей' },
                      { icon: <Shield className="h-4 w-4" />, label: 'Быстро', sublabel: '~10 сек' },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm border border-gray-100">
                        <div className="text-orange-500">{stat.icon}</div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-gray-800">{stat.label}</div>
                          <div className="text-[10px] text-gray-400">{stat.sublabel}</div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="mb-6 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-lg font-bold text-gray-800">Выберите пресет</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {presets.map((preset, index) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      index={index}
                      onClick={() => handleSelectPreset(preset)}
                    />
                  ))}
                </div>

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-12 rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 p-6 sm:p-8"
                >
                  <h3 className="mb-4 text-center text-lg font-bold text-gray-800">
                    🍌 Как это работает?
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        step: '1',
                        title: 'Выберите пресет',
                        desc: 'Выберите подходящий стиль из готовых пресетов с оптимальными настройками',
                      },
                      {
                        step: '2',
                        title: 'Опишите фото',
                        desc: 'Напишите промпт — описание того, что хотите увидеть на изображении',
                      },
                      {
                        step: '3',
                        title: 'Получите результат',
                        desc: 'Нажмите кнопку и получите HD фотографию за несколько секунд!',
                      },
                    ].map((item) => (
                      <div key={item.step} className="rounded-xl bg-white/70 p-4 text-center">
                        <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-sm font-bold text-white">
                          {item.step}
                        </div>
                        <h4 className="mb-1 text-sm font-bold text-gray-800">{item.title}</h4>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {phase === 'settings' && selectedPreset && (
            <SettingsPanel
              key="settings"
              preset={selectedPreset}
              settings={settings}
              onSettingsChange={setSettings}
              onBack={() => setPhase('presets')}
              onGenerate={handleGenerate}
              prompt={prompt}
              onPromptChange={setPrompt}
            />
          )}

          {phase === 'generating' && selectedPreset && (
            <GenerationView
              key="generating"
              preset={selectedPreset}
              prompt={prompt}
              settings={settings}
              onBack={() => setPhase('settings')}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white/50 py-6 text-center">
        <p className="text-xs text-gray-400">
          🍌 Нана Банана AI Photo Studio · © {new Date().getFullYear()} · Генерация 2K—4K фотографий · Все права защищены · <a href="https://t.me/atsolovyev" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Связь с разработчиком</a>
        </p>
      </footer>
    </div>
  );
}
