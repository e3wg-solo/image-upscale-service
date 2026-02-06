import type { GenerationSettings } from '../components/SettingsPanel';

export interface ImageResponse {
  imageUrl: string;
  seed?: number;
  id?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

// Получаем API ключ из переменных окружения
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_NANOBANANA_API_KEY || '';
// Используем proxy в dev режиме для обхода CORS, в production нужен бэкенд
const USE_PROXY = import.meta.env.DEV;
// Правильный endpoint для Google Gemini API (Nano Banana)
// Используем gemini-3-pro-image-preview для лучшего качества или gemini-2.5-flash-image для скорости
const BASE_URL = USE_PROXY 
  ? '/api/google'
  : 'https://generativelanguage.googleapis.com';

// Выбираем модель в зависимости от разрешения
function getModelName(resolution: '2K' | '4K'): string {
  // Для 4K используем Pro версию, для 2K можно использовать Flash
  return resolution === '4K' 
    ? 'gemini-3-pro-image-preview' 
    : 'gemini-2.5-flash-image';
}

function getApiEndpoint(modelName: string): string {
  return `${BASE_URL}/v1beta/models/${modelName}:generateContent`;
}

/**
 * Преобразует соотношение сторон в формат Gemini API
 * Поддерживаемые форматы: "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
 */
function getAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (Math.abs(ratio - 0.666) < 0.1) return '2:3';
  if (Math.abs(ratio - 1.5) < 0.1) return '3:2';
  if (Math.abs(ratio - 0.75) < 0.1) return '3:4';
  if (Math.abs(ratio - 1.33) < 0.1) return '4:3';
  if (Math.abs(ratio - 0.8) < 0.1) return '4:5';
  if (Math.abs(ratio - 1.25) < 0.1) return '5:4';
  if (Math.abs(ratio - 0.5625) < 0.1) return '9:16';
  if (Math.abs(ratio - 1.777) < 0.1) return '16:9';
  if (Math.abs(ratio - 2.333) < 0.1) return '21:9';
  
  // По умолчанию возвращаем ближайшее
  if (ratio < 0.7) return '2:3';
  if (ratio < 0.85) return '3:4';
  if (ratio < 0.9) return '4:5';
  if (ratio < 1.1) return '1:1';
  if (ratio < 1.3) return '4:3';
  if (ratio < 1.4) return '5:4';
  if (ratio < 1.6) return '3:2';
  if (ratio < 2) return '16:9';
  return '21:9';
}

/**
 * Определяет размер изображения для Gemini API
 * Поддерживаемые форматы: "1K", "2K", "4K" (только для gemini-3-pro-image-preview)
 */
function getImageSize(resolution: '2K' | '4K', modelName: string): string {
  if (modelName === 'gemini-3-pro-image-preview') {
    return resolution === '4K' ? '4K' : resolution === '2K' ? '2K' : '1K';
  }
  // gemini-2.5-flash-image всегда генерирует 1K
  return '1K';
}

/**
 * Конвертирует base64 в blob URL
 */
function base64ToBlobUrl(base64: string, mimeType: string = 'image/png'): string {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Генерирует изображение через Google Gemini API (Nano Banana)
 */
export async function generateImage(
  prompt: string,
  settings: GenerationSettings,
  negativePrompt?: string,
  style?: string
): Promise<ImageResponse> {
  if (!API_KEY) {
    throw new Error('API ключ не настроен. Пожалуйста, установите VITE_GOOGLE_API_KEY в .env файле');
  }

  // Формируем полный промпт с учетом стиля и негативного промпта
  let fullPrompt = style ? `${prompt}, ${style}` : prompt;
  if (negativePrompt || settings.negativePrompt) {
    const negPrompt = negativePrompt || settings.negativePrompt || '';
    if (negPrompt) {
      fullPrompt = `${fullPrompt}. Avoid: ${negPrompt}`;
    }
  }

  // Определяем модель и параметры
  const resolution = settings.resolution || '2K';
  const modelName = getModelName(resolution);
  const aspectRatio = getAspectRatio(settings.width, settings.height);
  const imageSize = getImageSize(resolution, modelName);
  const endpoint = getApiEndpoint(modelName);

  try {
    // Формируем тело запроса согласно документации Gemini API
    const requestBody: any = {
      contents: [{
        parts: [
          { text: fullPrompt }
        ]
      }],
      generationConfig: {
        responseModalities: ['IMAGE'], // Только изображения, без текста
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      }
    };

    // Добавляем imageSize только для gemini-3-pro-image-preview
    if (modelName === 'gemini-3-pro-image-preview') {
      requestBody.generationConfig.imageConfig.imageSize = imageSize;
    }

    console.log('Making request to:', endpoint);
    console.log('Model:', modelName);
    console.log('Request body:', requestBody);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY, // API ключ в заголовке, не в query параметре!
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch {
        errorData = {};
      }
      
      const errorMessage = errorData.error?.message || errorData.message || `Ошибка API: ${response.status} ${response.statusText}`;
      
      // Специальная обработка 404 ошибки
      if (response.status === 404) {
        throw new Error(
          `Endpoint не найден (404). Возможные причины:\n` +
          `1. Модель "${modelName}" недоступна\n` +
          `2. Endpoint изменился\n` +
          `3. API ключ не имеет доступа к Gemini API\n\n` +
          `Попробуйте:\n` +
          `- Проверить доступность модели в Google AI Studio\n` +
          `- Использовать gemini-2.5-flash-image вместо gemini-3-pro-image-preview\n` +
          `- Проверить, что API ключ имеет права на Gemini API\n\n` +
          `Детали ошибки: ${errorMessage}`
        );
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Обрабатываем ответ согласно формату Gemini API
    // Формат: data.candidates[0].content.parts[] где каждый part может быть inlineData
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // Ищем часть с изображением
          if (part.inlineData && part.inlineData.data) {
            const imageUrl = base64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType || 'image/png');
            return {
              imageUrl,
              id: `img-${Date.now()}-${Math.random()}`,
            };
          }
        }
      }
    }

    // Логируем ответ для отладки
    console.error('Неожиданный формат ответа от API:', data);
    throw new Error('Не удалось найти изображение в ответе API. Проверьте консоль для деталей.');
  } catch (error) {
    // Обработка CORS и сетевых ошибок
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Ошибка CORS: Google API не поддерживает прямые запросы из браузера. ' +
        'Необходимо использовать бэкенд-прокси или серверное приложение. ' +
        'Проверьте консоль браузера (F12) для деталей.'
      );
    }
    
    if (error instanceof Error) {
      // Улучшаем сообщение об ошибке
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        throw new Error(
          'Ошибка подключения к API. Возможные причины:\n' +
          '1. CORS блокировка (Google API не поддерживает прямые запросы из браузера)\n' +
          '2. Неверный API ключ\n' +
          '3. Проблемы с сетью\n\n' +
          'Решение: Используйте бэкенд-сервер для проксирования запросов к Google API.'
        );
      }
      throw error;
    }
    throw new Error('Неизвестная ошибка при генерации изображения');
  }
}

/**
 * Генерирует несколько изображений (batch) через Gemini API
 * Примечание: Gemini API генерирует одно изображение за запрос, поэтому делаем несколько запросов
 */
export async function generateBatchImages(
  prompt: string,
  settings: GenerationSettings,
  negativePrompt?: string,
  style?: string
): Promise<ImageResponse[]> {
  if (!API_KEY) {
    throw new Error('API ключ не настроен. Пожалуйста, установите VITE_GOOGLE_API_KEY в .env файле');
  }

  // Формируем полный промпт с учетом стиля и негативного промпта
  let fullPrompt = style ? `${prompt}, ${style}` : prompt;
  if (negativePrompt || settings.negativePrompt) {
    const negPrompt = negativePrompt || settings.negativePrompt || '';
    if (negPrompt) {
      fullPrompt = `${fullPrompt}. Avoid: ${negPrompt}`;
    }
  }

  // Определяем модель и параметры
  const resolution = settings.resolution || '2K';
  const modelName = getModelName(resolution);
  const aspectRatio = getAspectRatio(settings.width, settings.height);
  const imageSize = getImageSize(resolution, modelName);
  const endpoint = getApiEndpoint(modelName);
  
  // Gemini API генерирует одно изображение за запрос, поэтому делаем несколько запросов параллельно
  const numberOfImages = Math.min(settings.batchSize, 4);

  try {
    // Формируем тело запроса согласно документации Gemini API
    const createRequestBody = () => ({
      contents: [{
        parts: [
          { text: fullPrompt }
        ]
      }],
      generationConfig: {
        responseModalities: ['IMAGE'], // Только изображения
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      }
    });

    // Добавляем imageSize только для gemini-3-pro-image-preview
    const requestBody: any = createRequestBody();
    if (modelName === 'gemini-3-pro-image-preview') {
      requestBody.generationConfig.imageConfig.imageSize = imageSize;
    }

    console.log('Making batch request to:', endpoint);
    console.log('Model:', modelName);
    console.log('Number of images:', numberOfImages);

    // Делаем несколько запросов параллельно
    const promises = Array.from({ length: numberOfImages }, async (_, index) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY, // API ключ в заголовке!
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch {
          errorData = {};
        }
        
        const errorMessage = errorData.error?.message || errorData.message || `Ошибка API: ${response.status} ${response.statusText}`;
        throw new Error(`Ошибка при генерации изображения ${index + 1}: ${errorMessage}`);
      }

      const data = await response.json();

      // Обрабатываем ответ согласно формату Gemini API
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              const imageUrl = base64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType || 'image/png');
              return {
                imageUrl,
                id: `img-${Date.now()}-${index}`,
              };
            }
          }
        }
      }

      throw new Error(`Не удалось найти изображение в ответе API для запроса ${index + 1}`);
    });

    const results = await Promise.all(promises);
    
    if (results.length === 0) {
      throw new Error('Не удалось получить изображения от API');
    }

    return results;
  } catch (error) {
    // Обработка CORS и сетевых ошибок
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Ошибка CORS: Google API не поддерживает прямые запросы из браузера. ' +
        'Необходимо использовать бэкенд-прокси или серверное приложение. ' +
        'Проверьте консоль браузера (F12) для деталей.'
      );
    }
    
    if (error instanceof Error) {
      // Улучшаем сообщение об ошибке
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        throw new Error(
          'Ошибка подключения к API. Возможные причины:\n' +
          '1. CORS блокировка (Google API не поддерживает прямые запросы из браузера)\n' +
          '2. Неверный API ключ\n' +
          '3. Проблемы с сетью\n\n' +
          'Решение: Используйте бэкенд-сервер для проксирования запросов к Google API.'
        );
      }
      throw error;
    }
    throw new Error('Неизвестная ошибка при генерации изображений');
  }
}

/**
 * Проверяет доступность API
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    if (!API_KEY) {
      return false;
    }
    
    // Простой запрос для проверки доступности модели
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`, {
      method: 'GET',
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
