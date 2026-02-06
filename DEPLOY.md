# Инструкции по деплою

## 1. Создание репозитория на GitHub

### Вариант A: Через веб-интерфейс GitHub

1. Перейдите на https://github.com/new
2. Заполните:
   - **Repository name**: `image-upscale-service`
   - **Description**: `AI-powered image generation service using Google Gemini API`
   - **Visibility**: Public или Private (на ваше усмотрение)
   - **НЕ** добавляйте README, .gitignore или лицензию (они уже есть)
3. Нажмите "Create repository"

### Вариант B: Через GitHub CLI (если установлен)

```bash
gh repo create image-upscale-service --public --source=. --remote=origin --push
```

## 2. Подключение к GitHub и push кода

После создания репозитория выполните:

```bash
# Добавьте remote (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/image-upscale-service.git

# Или если используете SSH:
# git remote add origin git@github.com:YOUR_USERNAME/image-upscale-service.git

# Запушьте код
git branch -M main
git push -u origin main
```

## 3. Деплой в Vercel

### Вариант A: Через веб-интерфейс Vercel

1. Перейдите на https://vercel.com/new
2. Импортируйте ваш GitHub репозиторий `image-upscale-service`
3. Настройки проекта:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (по умолчанию)
   - **Build Command**: `npm run build` (по умолчанию)
   - **Output Directory**: `dist` (по умолчанию)
   - **Install Command**: `npm install` (по умолчанию)
4. Добавьте переменные окружения:
   - **VITE_GOOGLE_API_KEY**: ваш API ключ от Google
5. Нажмите "Deploy"

### Вариант B: Через Vercel CLI

```bash
# Установите Vercel CLI (если еще не установлен)
npm i -g vercel

# Войдите в Vercel
vercel login

# Задеплойте проект
vercel

# Для production деплоя
vercel --prod
```

## 4. Настройка переменных окружения в Vercel

После деплоя:

1. Перейдите в настройки проекта на Vercel
2. Откройте раздел "Environment Variables"
3. Добавьте:
   - **Name**: `VITE_GOOGLE_API_KEY`
   - **Value**: ваш API ключ от Google
   - **Environment**: Production, Preview, Development (все три)
4. Сохраните и передеплойте проект

## 5. Важные замечания

⚠️ **CORS и API прокси**: 
- В development режиме используется Vite proxy для обхода CORS
- В production на Vercel используется `vercel.json` с rewrites
- Если rewrites не работают, может потребоваться создать Vercel serverless function для проксирования API запросов

⚠️ **API ключ**:
- Никогда не коммитьте `.env` файл с реальным API ключом
- Используйте переменные окружения Vercel для production
- Для локальной разработки используйте `.env` файл (он уже в .gitignore)

## 6. Проверка деплоя

После успешного деплоя:
1. Откройте URL вашего проекта на Vercel
2. Проверьте, что приложение загружается
3. Попробуйте сгенерировать изображение
4. Если возникают ошибки CORS, проверьте консоль браузера и логи Vercel
