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

// Получаем API ключ из переменных окружения и очищаем от недопустимых символов
function getApiKey(): string {
  const rawKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_NANOBANANA_API_KEY || '';
  
  // Проверяем наличие недопустимых символов (не ISO-8859-1)
  const invalidChars = rawKey.match(/[^\x20-\x7E]/g);
  if (invalidChars && invalidChars.length > 0) {
    console.warn('⚠️ Обнаружены недопустимые символы в API ключе:', invalidChars);
    console.warn('⚠️ Эти символы будут удалены. Убедитесь, что API ключ скопирован правильно.');
  }
  
  // Удаляем все символы, которые не являются допустимыми для HTTP заголовков (ISO-8859-1)
  // Оставляем только печатные ASCII символы (буквы, цифры, дефисы, подчеркивания, точки и т.д.)
  const cleanedKey = rawKey.replace(/[^\x20-\x7E]/g, '').trim();
  
  if (rawKey !== cleanedKey) {
    console.warn('⚠️ API ключ был очищен от недопустимых символов');
    console.warn('⚠️ Оригинальная длина:', rawKey.length, '→ Очищенная длина:', cleanedKey.length);
  }
  
  return cleanedKey;
}

const API_KEY = getApiKey();

// Определяем, использовать ли прокси
// В dev режиме используем Vite proxy, в production используем Vercel serverless function
const USE_PROXY = true; // Всегда используем прокси через /api/google (Vite proxy в dev, serverless function в prod)
const BASE_URL = '/api/google';

// Выбираем модель в зависимости от разрешения
function getModelName(resolution: '2K' | '4K'): string {
  // Для 4K используем Pro версию, для 2K можно использовать Flash
  return resolution === '4K' 
    ? 'gemini-3-pro-image-preview' 
    : 'gemini-2.5-flash-image';
}

function getApiEndpoint(modelName: string): string {
  // В production на Vercel используем относительный путь к serverless function
  // В development используем Vite proxy
  const endpoint = `${BASE_URL}/v1beta/models/${modelName}:generateContent`;
  console.log('[getApiEndpoint] BASE_URL:', BASE_URL, '→ endpoint:', endpoint);
  return endpoint;
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
    console.log('BASE_URL:', BASE_URL);
    console.log('USE_PROXY:', USE_PROXY);
    console.log('Model:', modelName);
    console.log('Request body:', requestBody);

    // При использовании прокси не передаем API ключ - он будет взят из переменных окружения сервера
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Только если не используем прокси (прямой запрос), добавляем API ключ
    if (!USE_PROXY && API_KEY) {
      headers['x-goog-api-key'] = API_KEY;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
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

    // Детальное логирование для отладки
    console.log('[Single Request] Response status:', response.status);
    console.log('[Single Request] Response data structure:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length || 0,
      hasContent: !!data.candidates?.[0]?.content,
      hasParts: !!data.candidates?.[0]?.content?.parts,
      partsLength: data.candidates?.[0]?.content?.parts?.length || 0,
    });

    // Обрабатываем ответ согласно формату Gemini API
    // Формат: data.candidates[0].content.parts[] где каждый part может быть inlineData
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      
      // Проверяем наличие ошибки в ответе
      if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        console.warn('[Single Request] Finish reason:', candidate.finishReason);
        if (candidate.finishReason === 'SAFETY') {
          throw new Error('Генерация изображения была заблокирована системой безопасности. Попробуйте изменить промпт.');
        }
        if (candidate.finishReason === 'RECITATION') {
          throw new Error('Промпт содержит защищенный контент. Попробуйте изменить промпт.');
        }
      }
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // Ищем часть с изображением
          if (part.inlineData && part.inlineData.data) {
            const imageUrl = base64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType || 'image/png');
            console.log('[Single Request] Image found, size:', part.inlineData.data.length);
            return {
              imageUrl,
              id: `img-${Date.now()}-${Math.random()}`,
            };
          }
          
          // Если есть текстовая часть, логируем её
          if (part.text) {
            console.log('[Single Request] Text part found:', part.text.substring(0, 100));
          }
        }
      }
    }

    // Детальное логирование структуры ответа при ошибке
    console.error('[Single Request] Full response data:', JSON.stringify(data, null, 2));
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
    console.log('BASE_URL:', BASE_URL);
    console.log('USE_PROXY:', USE_PROXY);
    console.log('Model:', modelName);
    console.log('Number of images:', numberOfImages);

    // Делаем несколько запросов параллельно
    const promises = Array.from({ length: numberOfImages }, async (_, index) => {
      // При использовании прокси не передаем API ключ - он будет взят из переменных окружения сервера
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Только если не используем прокси (прямой запрос), добавляем API ключ
      if (!USE_PROXY && API_KEY) {
        headers['x-goog-api-key'] = API_KEY;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorData: any = {};
        let responseText = '';
        try {
          responseText = await response.text();
          errorData = responseText ? JSON.parse(responseText) : {};
        } catch {
          errorData = {};
        }
        
        // Детальное логирование ошибки
        console.error(`[Batch Request ${index + 1}] Error response:`, {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData,
          responseText: responseText.substring(0, 500), // Первые 500 символов
        });
        
        const errorMessage = errorData.error?.message || errorData.message || `Ошибка API: ${response.status} ${response.statusText}`;
        
        // Специальная обработка 404
        if (response.status === 404) {
          throw new Error(
            `404 Not Found при запросе к ${endpoint}.\n` +
            `Возможные причины:\n` +
            `1. Serverless function не найдена (проверьте логи Vercel)\n` +
            `2. Неправильный путь к Google API\n` +
            `3. Модель недоступна\n\n` +
            `Детали: ${errorMessage}\n` +
            `Response: ${responseText.substring(0, 200)}`
          );
        }
        
        throw new Error(`Ошибка при генерации изображения ${index + 1}: ${errorMessage}`);
      }

      const data = await response.json();

      // Детальное логирование для отладки
      console.log(`[Batch Request ${index + 1}] Response status:`, response.status);
      console.log(`[Batch Request ${index + 1}] Response data structure:`, {
        hasCandidates: !!data.candidates,
        candidatesLength: data.candidates?.length || 0,
        hasContent: !!data.candidates?.[0]?.content,
        hasParts: !!data.candidates?.[0]?.content?.parts,
        partsLength: data.candidates?.[0]?.content?.parts?.length || 0,
        partsTypes: data.candidates?.[0]?.content?.parts?.map((p: any) => ({
          hasText: !!p.text,
          hasInlineData: !!p.inlineData,
          inlineDataType: p.inlineData?.mimeType,
          inlineDataLength: p.inlineData?.data?.length || 0,
        })) || [],
      });

      // Обрабатываем ответ согласно формату Gemini API
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        
        // Проверяем наличие ошибки в ответе
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          console.warn(`[Batch Request ${index + 1}] Finish reason:`, candidate.finishReason);
        }
        
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            // Ищем часть с изображением
            if (part.inlineData && part.inlineData.data) {
              const imageUrl = base64ToBlobUrl(part.inlineData.data, part.inlineData.mimeType || 'image/png');
              console.log(`[Batch Request ${index + 1}] Image found, size:`, part.inlineData.data.length);
              return {
                imageUrl,
                id: `img-${Date.now()}-${index}`,
              };
            }
            
            // Если есть текстовая часть, логируем её
            if (part.text) {
              console.log(`[Batch Request ${index + 1}] Text part found:`, part.text.substring(0, 100));
            }
          }
        }
      }

      // Детальное логирование структуры ответа при ошибке
      console.error(`[Batch Request ${index + 1}] Full response data:`, JSON.stringify(data, null, 2));
      throw new Error(`Не удалось найти изображение в ответе API для запроса ${index + 1}. Проверьте консоль для деталей.`);
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
