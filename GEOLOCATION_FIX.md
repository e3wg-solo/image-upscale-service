# Решение проблемы с геоблокировкой Gemini API

## Проблема
Если Gemini API заблокирован в России, запросы с домена `.ru` могут блокироваться, даже если serverless function работает на серверах Vercel за пределами России.

## Решения

### Решение 1: Проверка логов Vercel (приоритетно)

1. Откройте проект в Vercel Dashboard
2. Перейдите в **Functions** → `api/google/[...path]` → **Logs**
3. Попробуйте сгенерировать изображение
4. Проверьте логи:
   - Если видите `[Serverless Function] ===== FUNCTION CALLED =====` - функция вызывается
   - Проверьте `[Serverless Function] Target URL` - должен быть правильный URL
   - Проверьте `[Serverless Function] Response status` - если 404, проблема в Google API

### Решение 2: Использование VPN или прокси

Если проблема действительно в геоблокировке:

1. **Используйте VPN** для доступа к сайту (но это не решит проблему для всех пользователей)
2. **Настройте прокси** на уровне Vercel (сложно)
3. **Используйте другой домен** не из `.ru` зоны (например, `.com`, `.app`)

### Решение 3: Проверка доступности API

Проверьте, доступен ли Gemini API из России:

```bash
# Проверка доступности API
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

### Решение 4: Альтернативный подход

Если Gemini API действительно заблокирован:

1. **Используйте другой API** для генерации изображений:
   - OpenAI DALL-E
   - Stability AI
   - Midjourney API
   - Replicate API

2. **Используйте прокси-сервер** вне России для проксирования запросов к Gemini API

3. **Используйте CDN или Edge Function** в регионе, где API доступен

## Важно

⚠️ **Serverless function на Vercel работает на серверах за пределами России**, поэтому запросы к Google API должны идти с IP адресов Vercel, а не с IP пользователя. Геоблокировка по домену `.ru` маловероятна.

⚠️ **Проверьте логи Vercel** - это самый надежный способ понять, в чем проблема:
- Если функция вызывается, но Google API возвращает 404 - проблема в API или пути
- Если функция не вызывается - проблема в роутинге Vercel

## Диагностика

После улучшенного логирования вы должны увидеть в логах Vercel:
- `[Serverless Function] Target URL` - куда идет запрос
- `[Serverless Function] Response status` - какой статус возвращает Google API
- `[Serverless Function] 404 Error - Full response` - детали ошибки от Google API

Это поможет точно определить источник проблемы.
