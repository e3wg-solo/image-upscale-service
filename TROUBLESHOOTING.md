# Troubleshooting Guide

## Проблема: 404 ошибка при запросе к `/api/google/...`

### Шаги для диагностики:

1. **Проверьте логи Vercel Serverless Function:**
   - Откройте проект в Vercel
   - Перейдите в раздел "Functions"
   - Найдите функцию `api/google/[...path]`
   - Откройте логи и проверьте вывод `console.log`

2. **Проверьте переменные окружения:**
   - Убедитесь, что `VITE_GOOGLE_API_KEY` установлена в Vercel
   - Проверьте, что она доступна для всех окружений (Production, Preview, Development)

3. **Проверьте формат пути:**
   - Путь должен быть: `/api/google/v1beta/models/gemini-2.5-flash-image:generateContent`
   - Двоеточие `:` в пути может вызывать проблемы в некоторых случаях

### Возможные решения:

#### Решение 1: Проверьте логи serverless function
После деплоя проверьте логи в Vercel. Вы должны увидеть:
```
[Serverless Function] Request method: POST
[Serverless Function] Path segments: [...]
[Serverless Function] Full path: v1beta/models/gemini-3-pro-image-preview:generateContent
[Serverless Function] Target URL: https://generativelanguage.googleapis.com/v1beta/...
```

#### Решение 2: Проверьте переменные окружения
Убедитесь, что в Vercel установлена переменная `VITE_GOOGLE_API_KEY` со значением вашего API ключа.

#### Решение 3: Если проблема с двоеточием в пути
Если проблема связана с двоеточием, можно попробовать использовать другой формат endpoint или экранировать двоеточие.

### Что проверить в логах:

1. **Path segments** - должны содержать части пути
2. **Full path** - должен быть полным путем без `/api/google`
3. **Target URL** - должен быть правильным URL к Google API
4. **API key present** - должен быть `true`
5. **Response status** - если 404, значит проблема в Google API или пути

### Если проблема сохраняется:

1. Проверьте, что serverless function вызывается (должны быть логи)
2. Проверьте, что путь формируется правильно
3. Проверьте, что API ключ передается в заголовках
4. Проверьте ответ от Google API в логах
