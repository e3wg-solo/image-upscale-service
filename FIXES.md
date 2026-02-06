# Исправления для Production

## Проблемы, которые были исправлены:

### 1. Ошибка с недопустимыми символами в заголовках
**Проблема**: `Failed to execute 'fetch' on 'Window': Failed to read the 'headers' property from 'RequestInit': String contains non ISO-8859-1 code point.`

**Решение**: 
- Добавлена автоматическая очистка API ключа от недопустимых символов
- API ключ теперь валидируется перед использованием в HTTP заголовках

### 2. Ошибка "Не удалось найти изображение в ответе API"
**Проблема**: В production на Vercel прокси не передавал заголовки правильно

**Решение**:
- Создан Vercel serverless function (`api/google/[...path].ts`) для корректного проксирования запросов
- Добавлено детальное логирование ответов API для отладки
- API ключ теперь берется из переменных окружения сервера, а не передается от клиента

## Что нужно сделать для деплоя:

### 1. Установить зависимости
```bash
npm install
```

### 2. Настроить переменные окружения в Vercel

В настройках проекта Vercel (Settings → Environment Variables) добавьте:

- **Name**: `VITE_GOOGLE_API_KEY`
- **Value**: ваш API ключ от Google
- **Environment**: Production, Preview, Development (все три)

⚠️ **Важно**: Убедитесь, что API ключ не содержит недопустимых символов (только ASCII символы).

### 3. Передеплоить проект

После добавления переменных окружения передеплойте проект:
- Через веб-интерфейс Vercel: нажмите "Redeploy"
- Или через CLI: `vercel --prod`

### 4. Проверить логи

Если ошибки продолжаются:
1. Откройте консоль браузера (F12)
2. Проверьте детальные логи ответов API
3. Проверьте логи Vercel serverless function в панели Vercel

## Структура проксирования:

- **Development**: Используется Vite proxy (`vite.config.ts`)
- **Production**: Используется Vercel serverless function (`api/google/[...path].ts`)

Оба метода проксируют запросы к `https://generativelanguage.googleapis.com` и добавляют API ключ из переменных окружения сервера.
