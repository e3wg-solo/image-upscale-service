import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Обработка CORS preflight запросов
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');
    return res.status(200).end();
  }

  // Получаем путь из параметров (исключаем сам path из query)
  const pathSegments = Array.isArray(req.query.path) 
    ? req.query.path 
    : req.query.path ? [req.query.path] : [];
  
  const path = pathSegments.join('/');

  // Логирование для отладки
  console.log('[Serverless Function] Request method:', req.method);
  console.log('[Serverless Function] Path segments:', pathSegments);
  console.log('[Serverless Function] Full path:', path);
  console.log('[Serverless Function] Query params:', req.query);

  // Формируем query параметры (исключаем path)
  const queryParams = new URLSearchParams();
  Object.entries(req.query).forEach(([key, value]) => {
    if (key !== 'path' && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => queryParams.append(key, String(v)));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });
  
  const queryString = queryParams.toString();
  const pathWithQuery = queryString ? `${path}?${queryString}` : path;

  // Получаем API ключ из переменных окружения
  // В Vercel переменные окружения доступны без префикса VITE_
  const apiKey = process.env.VITE_GOOGLE_API_KEY || 
                 process.env.VITE_NANOBANANA_API_KEY ||
                 process.env.GOOGLE_API_KEY ||
                 process.env.NANOBANANA_API_KEY;

  console.log('[Serverless Function] API key present:', !!apiKey);
  console.log('[Serverless Function] API key length:', apiKey ? apiKey.length : 0);

  if (!apiKey) {
    console.error('[Serverless Function] API key missing!');
    return res.status(500).json({ 
      error: 'API ключ не настроен. Установите VITE_GOOGLE_API_KEY в переменных окружения Vercel.' 
    });
  }

  // Формируем URL для Google API
  const targetUrl = `https://generativelanguage.googleapis.com/v1beta/${pathWithQuery}`;
  console.log('[Serverless Function] Target URL:', targetUrl);

  try {
    // Получаем тело запроса (только для методов с телом)
    let body: string | undefined = undefined;
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // Формируем заголовки для проксирования
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    };

    // Проксируем запрос к Google API
    console.log('[Serverless Function] Making request to:', targetUrl);
    console.log('[Serverless Function] Request headers:', headers);
    console.log('[Serverless Function] Request body length:', body ? body.length : 0);
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    console.log('[Serverless Function] Response status:', response.status);
    console.log('[Serverless Function] Response headers:', Object.fromEntries(response.headers.entries()));

    // Получаем данные ответа
    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
      console.log('[Serverless Function] Response data keys:', Object.keys(jsonData));
    } catch {
      jsonData = data;
      console.log('[Serverless Function] Response is not JSON, length:', data.length);
    }

    // Устанавливаем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');

    // Возвращаем ответ
    console.log('[Serverless Function] Returning response with status:', response.status);
    res.status(response.status).json(jsonData);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Ошибка при проксировании запроса к Google API',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
