# AKD Image — Документация проекта

## Описание

AKD Image — бесплатный веб-сервис для работы с изображениями прямо в браузере.
Все операции выполняются на стороне клиента (JavaScript + Canvas API).
Файлы **не передаются на сервер** — полная приватность.

---

## Структура проекта

```
akd-image/
│
├── index.html              # Главная страница со списком инструментов
│
├── css/
│   └── main.css            # Вся система дизайна (переменные, компоненты, утилиты)
│
├── js/
│   ├── core.js             # Утилиты: Toast, Modal, FileUtils, Dropzone, FileListManager
│   └── layout.js           # Динамический header и footer (инжектируются на каждую страницу)
│
├── pages/
│   ├── compress.html       # Сжатие изображений
│   ├── resize.html         # Изменение размера
│   ├── watermark.html      # Добавление водяного знака
│   └── html-to-img.html    # Конвертация HTML в изображение
│
└── assets/
    └── icons/              # Папка для SVG-иконок (пока пустая, для будущего использования)
```

---

## Инструменты

### 1. Сжать изображение (`compress.html`)
- Форматы: JPG, PNG, GIF, SVG, WebP
- Настраиваемое качество (10–100%)
- Выбор формата вывода
- Удаление EXIF-данных
- Пакетная обработка
- Скачивание ZIP-архива

### 2. Изменить размер (`resize.html`)
- Форматы: JPG, PNG, GIF, WebP
- 3 режима: пиксели, проценты, по длинной стороне
- Сохранение пропорций
- Опция «не увеличивать маленькие»
- Пакетная обработка + ZIP

### 3. Водяной знак (`watermark.html`)
- 2 типа: текст и изображение/логотип
- 9 позиций размещения
- Настройка прозрачности, отступа, размера
- Режим «замостить» по всему изображению
- Живой предпросмотр
- Пакетная обработка + ZIP

### 4. HTML в изображение (`html-to-img.html`)
- Готовые шаблоны (баннер, карточка, цитата и др.)
- Редактор с подсветкой синтаксиса
- Настройка размера, масштаба (1×/2×/3× Retina)
- Форматы: PNG, JPG, WebP
- Копирование в буфер обмена
- Использует библиотеку html2canvas

---

## Технологии

| Технология | Назначение |
|---|---|
| HTML5 Canvas API | Обработка растровых изображений |
| FileReader API | Чтение загружаемых файлов |
| Blob / URL.createObjectURL | Генерация ссылок для скачивания |
| html2canvas (CDN) | Рендеринг HTML в Canvas |
| JSZip (CDN, lazy-load) | Создание ZIP-архивов |
| Google Fonts (Inter) | Типографика |

**Никаких npm, никаких сборщиков.** Открываете `index.html` в браузере — всё работает.

---

## Как добавить новый инструмент

1. Создайте `pages/my-tool.html`
2. Подключите `../css/main.css`, `../js/layout.js`, `../js/core.js`
3. Используйте готовые компоненты: `Dropzone`, `FileListManager`, `Toast`, `FileUtils`
4. Добавьте ссылку в `js/layout.js` в массив `tools`
5. Добавьте карточку в `index.html` в секцию `.tools-grid`

### Минимальный шаблон страницы инструмента:

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Мой инструмент — AKD Image</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/main.css">
</head>
<body>
<script src="../js/layout.js"></script>
<main>
  <div class="container container--narrow tool-page">
    <div class="tool-page__header">
      <a href="../index.html" class="tool-page__back">← Все инструменты</a>
      <h1 class="tool-page__title">🔧 Мой инструмент</h1>
      <p class="tool-page__subtitle">Описание инструмента.</p>
    </div>
    <!-- Ваш контент -->
  </div>
</main>
<script src="../js/core.js"></script>
<script>
  // Ваша логика
</script>
</body>
</html>
```

---

## CSS Переменные (Design Tokens)

```css
--bg           /* Фон страницы #F7F8FA */
--surface      /* Белые блоки #FFFFFF */
--border       /* Границы #E2E6ED */
--text         /* Основной текст #1A1D23 */
--muted        /* Второстепенный #6B7280 */
--accent       /* Синий акцент #2563EB */
--accent-hover /* Тёмный акцент #1D4ED8 */
--accent-light /* Светлый фон #EFF6FF */
--success      /* Зелёный #16A34A */
--warn         /* Оранжевый #D97706 */
--danger       /* Красный #DC2626 */
```

---

## Готовые CSS-компоненты

- `.dropzone` — зона перетаскивания файлов
- `.tool-panel` — панель настроек
- `.file-item` — строка файла в очереди
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-success` — кнопки
- `.form-group` — группа формы с лейблом
- `.toggle` — переключатель
- `.radio-option` — радио-кнопка в стиле кнопки
- `.alert` — предупреждение (info / success / warn / danger)
- `.stat-card` — карточка статистики
- `.result-area` — область результатов

---

## Планируемые инструменты (заглушки на главной)

- ✂️ Обрезать изображение
- 🔄 Конвертер форматов (JPG ↔ PNG ↔ WebP ↔ BMP)
- 🔃 Повернуть / Отразить
- 🎨 Фотоэффекты (яркость, контраст, фильтры)
