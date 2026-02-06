import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Логирование в самом начале
  console.log('[Generate Function] ===== FUNCTION CALLED =====');
  console.log('[Generate Function] Method:', req.method);
  console.log('[Generate Function] Query:', req.query);
  console.log('[Generate Function] Body:', req.body);
  
  // Обработка CORS preflight запросов
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');
    return res.status(200).end();
  }

  // Получаем модель из query параметров
  const model = req.query.model as string || 'gemini-2.5-flash-image';
  const action = req.query.action as string || 'generateContent';

  // Получаем API ключ из переменных окружения
  const apiKey = process.env.VITE_GOOGLE_API_KEY || 
                 process.env.VITE_NANOBANANA_API_KEY ||
                 process.env.GOOGLE_API_KEY ||
                 process.env.NANOBANANA_API_KEY;

  console.log('[Generate Function] Model:', model);
  console.log('[Generate Function] API key present:', !!apiKey);

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API ключ не настроен. Установите VITE_GOOGLE_API_KEY в переменных окружения Vercel.' 
    });
  }

  // Формируем URL для Google API
  const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}`;
  console.log('[Generate Function] Target URL:', targetUrl);

  try {
    // Получаем тело запроса
    let body: string | undefined = undefined;
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // Формируем заголовки для проксирования
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    };

    console.log('[Generate Function] Making request to:', targetUrl);
    console.log('[Generate Function] Request method:', req.method);
    console.log('[Generate Function] Request body length:', body ? body.length : 0);
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    console.log('[Generate Function] Response status:', response.status);
    console.log('[Generate Function] Response statusText:', response.statusText);

    // Получаем данные ответа
    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
      console.log('[Generate Function] Response data keys:', Object.keys(jsonData));
      if (response.status === 404) {
        console.error('[Generate Function] 404 Error - Full response:', JSON.stringify(jsonData, null, 2));
      }
    } catch {
      jsonData = data;
      console.log('[Generate Function] Response is not JSON, length:', data.length);
      if (response.status === 404) {
        console.error('[Generate Function] 404 Error - Response text:', data.substring(0, 500));
      }
    }

    // Устанавливаем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');

    // Возвращаем ответ
    console.log('[Generate Function] Returning response with status:', response.status);
    res.status(response.status).json(jsonData);
  } catch (error) {
    console.error('[Generate Function] Proxy error:', error);
    res.status(500).json({ 
      error: 'Ошибка при проксировании запроса к Google API',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
