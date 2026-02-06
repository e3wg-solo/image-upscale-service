import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Получаем путь из параметров
  const path = Array.isArray(req.query.path) 
    ? req.query.path.join('/') 
    : req.query.path || '';

  // Получаем API ключ из переменных окружения
  // В Vercel переменные окружения доступны без префикса VITE_
  const apiKey = process.env.VITE_GOOGLE_API_KEY || 
                 process.env.VITE_NANOBANANA_API_KEY ||
                 process.env.GOOGLE_API_KEY ||
                 process.env.NANOBANANA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API ключ не настроен. Установите VITE_GOOGLE_API_KEY в переменных окружения Vercel.' 
    });
  }

  // Формируем URL для Google API
  const targetUrl = `https://generativelanguage.googleapis.com/v1beta/${path}`;

  try {
    // Получаем тело запроса
    const body = req.method === 'POST' || req.method === 'PUT' 
      ? JSON.stringify(req.body) 
      : undefined;

    // Формируем заголовки для проксирования
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    };

    // Проксируем запрос к Google API
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    // Получаем данные ответа
    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    // Устанавливаем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');

    // Возвращаем ответ
    res.status(response.status).json(jsonData);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Ошибка при проксировании запроса к Google API',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
