# SurgiCoach Training App

Собственное кроссплатформенное мобильное приложение для когнитивной тренировки.
Проект разработан и поддерживается автором репозитория.

## О проекте

`SurgiCoach` включает игровые когнитивные модули и аналитику по сессиям:

- `Найди точный` - тренировка внимания к деталям
- `Восстанови горизонт` - тренировка пространственной ориентации
- адаптивная сложность по качеству прохождения
- статистика, история и профиль пользователя
- локальное хранение прогресса в `AsyncStorage`

## Технологии

- `React Native`
- `Expo`
- `Expo Router`
- `TypeScript`
- `@tanstack/react-query`
- `AsyncStorage`
- `lucide-react-native`

## Структура проекта

```text
app/
  _layout.tsx
  +not-found.tsx
  (tabs)/
    _layout.tsx
    (home)/index.tsx
    stats/index.tsx
    profile/index.tsx
  game/
    find-exact.tsx
    restore-horizon.tsx
    results.tsx
components/
constants/
providers/
types/
utils/
assets/
```

## Требования

- `Node.js` 20+
- `npm` 10+
- `Expo Go` (для запуска на реальном устройстве, опционально)

## Установка и запуск

```bash
# 1. Установить зависимости
npm install

# 2. Запустить dev-сервер Expo
npx expo start
```

Дополнительные варианты запуска:

```bash
# Web
npx expo start --web

# Android emulator
npx expo start --android

# iOS simulator (только на macOS)
npx expo start --ios
```

## Проверка качества

```bash
# TypeScript
npx tsc --noEmit

# ESLint
npx eslint . --ext .ts,.tsx,.js

# Unit tests
npm run test
```

## Деплой

Для сборок и публикации используйте `EAS`:

```bash
# Установить EAS CLI
npm install -g eas-cli

# Подготовить проект
eas build:configure

# Сборка
eas build --platform ios
eas build --platform android
```

## Хранение данных

Ключи локального хранилища:

- `surgicoach_sessions`
- `surgicoach_progress`

## Лицензия

Добавьте подходящую лицензию в репозиторий (например, `MIT`), если проект планируется к публичному распространению.
