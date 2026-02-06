export interface Preset {
  id: string;
  name: string;
  nameRu: string;
  description: string;
  icon: string;
  resolution: '2K' | '4K';
  width: number;
  height: number;
  aspectRatio: string;
  style: string;
  negativePrompt: string;
  steps: number;
  cfgScale: number;
  sampler: string;
  color: string;
  gradient: string;
  examplePrompt?: string;
}

export const presets: Preset[] = [
  {
    id: 'portrait-4k',
    name: 'Portrait 4K',
    nameRu: 'Портрет 4K',
    description: 'Профессиональные портреты с кинематографическим светом',
    icon: '👤',
    resolution: '4K',
    width: 2560,
    height: 3840,
    aspectRatio: '2:3',
    style: 'cinematic portrait, professional lighting, bokeh background, sharp focus, detailed skin texture',
    negativePrompt: 'размыто, низкое качество, деформированное, уродливое, плохая анатомия',
    steps: 40,
    cfgScale: 7.5,
    sampler: 'DPM++ 2M Karras',
    color: 'from-rose-500 to-pink-600',
    gradient: 'from-rose-50 to-pink-50',
    examplePrompt: 'Например: красивая девушка с длинными волосами, улыбается, мягкий свет из окна, размытый фон',
  },
  {
    id: 'landscape-4k',
    name: 'Landscape 4K',
    nameRu: 'Пейзаж 4K',
    description: 'Эпические пейзажи с невероятной детализацией',
    icon: '🏔️',
    resolution: '4K',
    width: 3840,
    height: 2160,
    aspectRatio: '16:9',
    style: 'epic landscape, golden hour, dramatic sky, ultra detailed, award winning photography',
    negativePrompt: 'размыто, пересвечено, низкое разрешение, водяной знак',
    steps: 50,
    cfgScale: 8,
    sampler: 'Euler a',
    color: 'from-emerald-500 to-teal-600',
    gradient: 'from-emerald-50 to-teal-50',
    examplePrompt: 'Например: горный пейзаж на закате, озеро в долине, драматичное небо с облаками',
  },
  {
    id: 'product-2k',
    name: 'Product 2K',
    nameRu: 'Продукт 2K',
    description: 'Студийная съёмка товаров для маркетплейсов',
    icon: '📦',
    resolution: '2K',
    width: 2048,
    height: 2048,
    aspectRatio: '1:1',
    style: 'product photography, studio lighting, white background, commercial, clean, minimalist',
    negativePrompt: 'тени, грязный фон, низкое качество, текст',
    steps: 35,
    cfgScale: 7,
    sampler: 'DPM++ SDE Karras',
    color: 'from-blue-500 to-indigo-600',
    gradient: 'from-blue-50 to-indigo-50',
    examplePrompt: 'Например: современные беспроводные наушники на белом фоне, студийное освещение',
  },
  {
    id: 'art-4k',
    name: 'Digital Art 4K',
    nameRu: 'Цифровое искусство 4K',
    description: 'Арт в стиле концепт-арта и цифровой живописи',
    icon: '🎨',
    resolution: '4K',
    width: 3840,
    height: 2160,
    aspectRatio: '16:9',
    style: 'digital art, concept art, trending on artstation, highly detailed, vibrant colors, masterpiece',
    negativePrompt: 'фото, реалистично, размыто, низкое качество, любительское',
    steps: 45,
    cfgScale: 9,
    sampler: 'DPM++ 2M Karras',
    color: 'from-violet-500 to-purple-600',
    gradient: 'from-violet-50 to-purple-50',
    examplePrompt: 'Например: фантастический город будущего, неоновые огни, летающие машины, концепт-арт',
  },
  {
    id: 'food-2k',
    name: 'Food 2K',
    nameRu: 'Еда 2K',
    description: 'Аппетитные фотографии блюд для ресторанов',
    icon: '🍕',
    resolution: '2K',
    width: 2048,
    height: 1536,
    aspectRatio: '4:3',
    style: 'food photography, appetizing, warm lighting, shallow depth of field, restaurant quality',
    negativePrompt: 'неаппетитно, холодный свет, размыто, низкое качество',
    steps: 35,
    cfgScale: 7,
    sampler: 'Euler a',
    color: 'from-orange-500 to-amber-600',
    gradient: 'from-orange-50 to-amber-50',
    examplePrompt: 'Например: аппетитная пицца с моцареллой и базиликом, теплый свет, размытый фон',
  },
  {
    id: 'fashion-4k',
    name: 'Fashion 4K',
    nameRu: 'Мода 4K',
    description: 'Фэшн-фотография для журналов и каталогов',
    icon: '👗',
    resolution: '4K',
    width: 2560,
    height: 3840,
    aspectRatio: '2:3',
    style: 'fashion photography, vogue style, editorial, high fashion, studio lighting, glamour',
    negativePrompt: 'любительское, низкое качество, плохие пропорции, деформированное',
    steps: 45,
    cfgScale: 8,
    sampler: 'DPM++ 2M Karras',
    color: 'from-fuchsia-500 to-pink-600',
    gradient: 'from-fuchsia-50 to-pink-50',
    examplePrompt: 'Например: элегантная модель в вечернем платье, студийное освещение, глянцевый стиль',
  },
  {
    id: 'architecture-4k',
    name: 'Architecture 4K',
    nameRu: 'Архитектура 4K',
    description: 'Архитектурная визуализация и экстерьеры',
    icon: '🏛️',
    resolution: '4K',
    width: 3840,
    height: 2560,
    aspectRatio: '3:2',
    style: 'architectural photography, modern design, dramatic lighting, professional, HDR, detailed',
    negativePrompt: 'размыто, искаженное, низкое качество, рыбий глаз',
    steps: 40,
    cfgScale: 7.5,
    sampler: 'DPM++ SDE Karras',
    color: 'from-slate-500 to-gray-600',
    gradient: 'from-slate-50 to-gray-50',
    examplePrompt: 'Например: современный небоскреб в стиле хай-тек, драматичное освещение, городской пейзаж',
  },
  {
    id: 'anime-2k',
    name: 'Anime 2K',
    nameRu: 'Аниме 2K',
    description: 'Высококачественные иллюстрации в стиле аниме',
    icon: '✨',
    resolution: '2K',
    width: 2048,
    height: 2048,
    aspectRatio: '1:1',
    style: 'anime style, highly detailed, beautiful lighting, masterpiece, best quality, illustration',
    negativePrompt: 'низкое качество, худшее качество, плохая анатомия, размыто, текст',
    steps: 30,
    cfgScale: 8,
    sampler: 'Euler a',
    color: 'from-cyan-500 to-sky-600',
    gradient: 'from-cyan-50 to-sky-50',
    examplePrompt: 'Например: милая аниме девушка с розовыми волосами, сакура на фоне, мягкое освещение',
  },
];

export const resolutions = {
  '2K': { label: '2K (2048px)', maxWidth: 2048, maxHeight: 2048 },
  '4K': { label: '4K (3840px)', maxWidth: 3840, maxHeight: 3840 },
};

export const aspectRatios = [
  { label: '1:1', value: '1:1', icon: '⬜' },
  { label: '2:3', value: '2:3', icon: '📱' },
  { label: '3:2', value: '3:2', icon: '🖼️' },
  { label: '4:3', value: '4:3', icon: '📺' },
  { label: '16:9', value: '16:9', icon: '🎬' },
];

export const samplers = [
  'Euler a',
  'DPM++ 2M Karras',
  'DPM++ SDE Karras',
  'DDIM',
  'UniPC',
];
