export interface StyleOption {
  id: string;
  label: string;
  description: string;
  value: string;
  icon: string;
}

export const styleOptions: StyleOption[] = [
  {
    id: 'cinematic',
    label: 'Кинематографический',
    description: 'Драматичное освещение, глубина резкости',
    value: 'cinematic portrait, professional lighting, bokeh background, sharp focus, detailed skin texture',
    icon: '🎬',
  },
  {
    id: 'professional',
    label: 'Профессиональный',
    description: 'Студийное качество, идеальное освещение',
    value: 'professional photography, studio lighting, high quality, sharp details, perfect composition',
    icon: '📸',
  },
  {
    id: 'artistic',
    label: 'Художественный',
    description: 'Креативный подход, уникальный стиль',
    value: 'artistic, creative composition, unique style, artistic lighting, masterpiece',
    icon: '🎨',
  },
  {
    id: 'natural',
    label: 'Естественный',
    description: 'Натуральные цвета, естественное освещение',
    value: 'natural lighting, natural colors, realistic, authentic, lifelike',
    icon: '🌿',
  },
  {
    id: 'dramatic',
    label: 'Драматичный',
    description: 'Контрастное освещение, выразительные тени',
    value: 'dramatic lighting, high contrast, expressive shadows, moody atmosphere',
    icon: '⚡',
  },
  {
    id: 'soft',
    label: 'Мягкий',
    description: 'Нежное освещение, пастельные тона',
    value: 'soft lighting, gentle colors, pastel tones, dreamy atmosphere, delicate',
    icon: '💫',
  },
  {
    id: 'vibrant',
    label: 'Яркий',
    description: 'Насыщенные цвета, энергичная композиция',
    value: 'vibrant colors, energetic composition, bold, dynamic, eye-catching',
    icon: '🌈',
  },
  {
    id: 'minimalist',
    label: 'Минималистичный',
    description: 'Чистые линии, простые формы',
    value: 'minimalist, clean lines, simple composition, elegant, refined',
    icon: '✨',
  },
];
