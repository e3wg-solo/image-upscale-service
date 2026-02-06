#!/bin/bash

# Скрипт для создания GitHub репозитория и подключения remote

echo "🚀 Настройка GitHub репозитория для image-upscale-service"
echo ""

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден. Убедитесь, что вы находитесь в корне проекта."
    exit 1
fi

# Проверяем git
if [ ! -d ".git" ]; then
    echo "❌ Ошибка: Git репозиторий не инициализирован."
    exit 1
fi

echo "📝 Введите ваш GitHub username:"
read GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Username не может быть пустым"
    exit 1
fi

echo ""
echo "🔗 Выберите тип подключения:"
echo "1) HTTPS (рекомендуется)"
echo "2) SSH"
read -p "Ваш выбор (1 или 2): " CONNECTION_TYPE

if [ "$CONNECTION_TYPE" = "1" ]; then
    REMOTE_URL="https://github.com/${GITHUB_USERNAME}/image-upscale-service.git"
elif [ "$CONNECTION_TYPE" = "2" ]; then
    REMOTE_URL="git@github.com:${GITHUB_USERNAME}/image-upscale-service.git"
else
    echo "❌ Неверный выбор"
    exit 1
fi

echo ""
echo "📋 Инструкции:"
echo "1. Откройте https://github.com/new в браузере"
echo "2. Название репозитория: image-upscale-service"
echo "3. Описание: AI-powered image generation service using Google Gemini API"
echo "4. Выберите Public или Private"
echo "5. НЕ добавляйте README, .gitignore или лицензию (они уже есть)"
echo "6. Нажмите 'Create repository'"
echo ""
read -p "Нажмите Enter после создания репозитория на GitHub..."

# Проверяем, не добавлен ли уже remote
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  Remote 'origin' уже существует. Удаляем старый..."
    git remote remove origin
fi

# Добавляем remote
echo "🔗 Добавляем remote origin..."
git remote add origin "$REMOTE_URL"

# Устанавливаем ветку main
echo "🌿 Устанавливаем ветку main..."
git branch -M main

echo ""
echo "✅ Готово! Теперь выполните:"
echo "   git push -u origin main"
echo ""
echo "После этого вы сможете задеплоить проект в Vercel через веб-интерфейс:"
echo "   https://vercel.com/new"
echo "   (импортируйте репозиторий ${GITHUB_USERNAME}/image-upscale-service)"
