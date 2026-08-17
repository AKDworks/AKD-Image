/* Shared English/Russian localization */
(function () {
  const STORAGE_KEY = 'akd-image-language';
  const CIS_LANGUAGES = new Set([
    'ru', 'uk', 'be', 'kk', 'ky', 'uz', 'tg', 'tk', 'hy', 'az', 'ka', 'mo'
  ]);

  const ENGLISH = {
    /* Shared navigation and controls */
    'Выбор темы': 'Theme',
    'Системная тема': 'System theme',
    'Светлая тема': 'Light theme',
    'Темная тема': 'Dark theme',
    'Главная': 'Home',
    'О проекте': 'About',
    'Конфиденциальность': 'Privacy',
    'Лицензии': 'Licenses',
    'Английский язык': 'English language',
    'Русский язык': 'Russian language',
    'Бесплатные инструменты для работы с изображениями. Все права защищены.': 'Free tools for working with images. All rights reserved.',
    '© 2026 AKD Image – Бесплатные инструменты для работы с изображениями. Все права защищены.': '© 2026 AKD Image – Free tools for working with images. All rights reserved.',
    'Выбрать формат': 'Select format',
    'Выбор цвета': 'Color picker',
    'Насыщенность и яркость': 'Saturation and brightness',
    'Оттенок': 'Hue',
    'Удалить': 'Remove',
    'Закрыть': 'Close',
    'Назад': 'Back',
    'Подтвердить': 'Apply',
    'Добавить': 'Add',
    'Скачать': 'Download',
    'Копировать': 'Copy',
    'Сбросить': 'Reset',
    'Результат': 'Result',
    'Настройки': 'Settings',
    'Предпросмотр': 'Preview',
    'Формат': 'Format',
    'Качество': 'Quality',
    'Размер': 'Size',
    'Длительность': 'Duration',
    '0,00 с': '0.00 s',
    'Кадров': 'Frames',
    'Файл': 'File',
    'Локально': 'Local',
    'Обработка': 'Processing',
    'Готово': 'Done',
    'Ошибка': 'Error',
    'Не удалось': 'Failed',
    'Готов к обработке': 'Ready to process',
    'Определяем параметры файла...': 'Reading file details...',
    'Обработка...': 'Processing...',
    'Скачать всё (ZIP)': 'Download all (ZIP)',
    'Добавить файлы': 'Add files',
    'Заменить файл': 'Replace file',
    'Заменить файлы': 'Replace files',
    'Выбрать файл': 'Choose file',
    'Выбрать другой файл': 'Choose another file',

    /* Home page */
    'AKD Image – Бесплатные инструменты для изображений': 'AKD Image – Free online image tools',
    '100% бесплатно · Работает в браузере': '100% free · Works in your browser',
    'Инструменты для работы': 'Tools for working',
    'с изображениями': 'with images',
    'Работайте с JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG и BMP, включая покадровую обработку анимированных GIF прямо в браузере. Результаты пакетной обработки можно скачать одним ZIP-архивом.': 'Work with JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG and BMP, including frame-by-frame animated GIF processing, directly in your browser. Batch results can be downloaded as a single ZIP archive.',
    'Все': 'All',
    'Оптимизация': 'Optimization',
    'Геометрия': 'Geometry',
    'Творчество': 'Creative',
    'Каталог инструментов': 'Tool catalog',
    'Все инструменты': 'All tools',
    'Избранные': 'Favorites',
    'Настроить избранное': 'Manage favorites',
    'Открыть поиск инструментов': 'Open tool search',
    'Закрыть поиск': 'Close search',
    'Найти инструмент': 'Find a tool',
    'Сортировка: По умолчанию': 'Sort: Default',
    'По умолчанию': 'Default',
    'Популярные': 'Popular',
    'Новые': 'New',
    'По алфавиту': 'Alphabetical',
    'В избранном пока нет инструментов.': 'You have no favorite tools yet.',
    'Добавить инструменты': 'Add tools',
    'Инструменты не найдены.': 'No tools found.',
    'Сжать изображение': 'Compress image',
    'Сократите размер популярных форматов, включая HEIC, BMP и анимированные GIF, сохранив чёткость изображения.': 'Reduce the size of popular formats, including HEIC, BMP and animated GIF, while preserving image clarity.',
    'Изменить размер': 'Resize image',
    'Меняйте размеры в пикселях, процентах или по длинной стороне сразу для нескольких изображений.': 'Resize multiple images by pixels, percentage or longest side.',
    'Водяной знак': 'Watermark',
    'Разместите текст или логотип, настройте позицию, размер и прозрачность, затем обработайте файлы пакетом.': 'Add text or a logo, adjust its position, size and opacity, then process files in a batch.',
    'Обрезать изображение': 'Crop image',
    'Выделите нужную область рамкой или задайте точные координаты и размеры в пикселях.': 'Select an area with the crop box or enter exact pixel coordinates and dimensions.',
    'Оставьте нужную часть изображения с помощью рамки, готового соотношения сторон или точных координат.': 'Keep the part you need using the crop box, a preset aspect ratio or exact coordinates.',
    'Конвертировать': 'Convert images',
    'Преобразуйте изображения между JPG, PNG, WebP, AVIF, HEIC и BMP с настройкой качества результата.': 'Convert images between JPG, PNG, WebP, AVIF, HEIC and BMP with adjustable output quality.',
    'Повернуть / Отразить': 'Rotate / Flip',
    'Поворачивайте и зеркально отражайте одно или несколько изображений без сложных редакторов.': 'Rotate or mirror one or multiple images without a complex editor.',
    'Фотоэффекты': 'Photo effects',
    'Настройте яркость, контраст, цвет и размытие с моментальным предпросмотром результата.': 'Adjust brightness, contrast, color and blur with an instant result preview.',
    'Генератор мемов': 'Meme generator',
    'Добавьте выразительный текст сверху и снизу изображения и сохраните готовый мем.': 'Add bold text above and below an image and save the finished meme.',
    'Разделить изображение': 'Split image',
    'Разделите длинный скриншот на части или нарежьте изображение сеткой с выгрузкой в ZIP.': 'Split a long screenshot into sections or cut an image into a grid and download it as ZIP.',
    'Очистите изображения от геолокации, данных камеры и другой скрытой информации перед публикацией.': 'Remove location, camera and other hidden metadata from images before publishing.',
    'Объедините одно или несколько изображений в PDF с выбранным форматом страниц, отступами и режимом размещения.': 'Combine one or more images into a PDF with your chosen page size, margins and placement mode.',
    'Скругление углов': 'Round corners',
    'Настройте радиус углов и получите PNG или анимированный GIF с прозрачными краями.': 'Adjust the corner radius and export a PNG or animated GIF with transparent corners.',
    'Пикселизатор': 'Pixelate image',
    'Превратите изображения в пиксель-арт, управляя размером цветовых блоков.': 'Turn images into pixel art by controlling the size of the color blocks.',
    'Удалить EXIF': 'Remove EXIF',
    'Удалите геолокацию, данные камеры и другие скрытые метаданные перед публикацией.': 'Remove location, camera details and other hidden metadata before publishing.',
    'Изображение в Base64': 'Image to Base64',
    'Кодируйте изображение в Data URL или Base64 и восстанавливайте файл из готовой строки.': 'Encode an image as a Data URL or Base64 string and restore a file from the encoded text.',
    'Создать favicon': 'Create favicon',
    'Подготовьте favicon.ico и полный набор PNG-иконок для браузеров, iOS и Android.': 'Create favicon.ico and a complete set of PNG icons for browsers, iOS and Android.',
    'Генератор палитры': 'Palette generator',
    'Соберите выразительную палитру с HEX, RGB и долей каждого найденного цвета.': 'Extract a color palette with HEX, RGB and the share of every detected color.',
    'Размытие области': 'Blur area',
    'Скройте лицо, номер, логин или фрагмент скриншота с настраиваемой силой размытия.': 'Hide a face, number, username or screenshot area with adjustable blur strength.',
    'Изображения в PDF': 'Images to PDF',
    'Соберите изображения популярных форматов в один PDF с настройкой страниц и отступов.': 'Combine images in popular formats into one PDF with page and margin settings.',
    'Коллаж': 'Collage',
    'Соберите несколько изображений в сетку, ленту или авто-макет с фоном и отступами.': 'Combine multiple images into a grid, strip or automatic layout with a background and spacing.',
    'Пометки на изображении': 'Annotate image',
    'Добавьте текст, кисть, стрелку, круг, овал или рамку и перемещайте готовые пометки.': 'Add text, brush strokes, arrows, circles, ellipses or rectangles and reposition finished annotations.',
    'Вырезать GIF': 'Trim GIF',
    'Оставьте нужный фрагмент анимации: задайте начало и конец в секундах, затем скачайте новый GIF.': 'Keep the part of an animation you need: set the start and end time, then download a new GIF.',
    'Видео ↔ GIF': 'Video ↔ GIF',
    'Создайте GIF из MP4 или WebM либо преобразуйте GIF в видео с настройкой качества.': 'Create a GIF from MP4 or WebM, or convert a GIF to video with adjustable quality.',
    'GIF в кадры': 'GIF to frames',
    'Извлеките все кадры GIF в PNG или JPG и скачайте их отдельно либо одним ZIP-архивом.': 'Extract every GIF frame as PNG or JPG and download them separately or in one ZIP archive.',
    'Открыть': 'Open',
    'Обработка в браузере': 'Processed in your browser',
    'На любом устройстве': 'Works on any device',
    'Полностью бесплатно': 'Completely free',
    'Файлы не покидают устройство': 'Files never leave your device',

    /* Upload areas and common image controls */
    'Добавьте изображения': 'Add images',
    'Добавьте изображение': 'Add an image',
    'Выберите файлы, вставьте из буфера или перетащите сюда': 'Choose files, paste from the clipboard or drag them here',
    'Выберите файл, вставьте из буфера или перетащите сюда': 'Choose a file, paste from the clipboard or drag it here',
    'Выберите файл или перетащите его сюда': 'Choose a file or drag it here',
    'Предпросмотр выбранного изображения': 'Preview selected image',
    'Формат вывода': 'Output format',
    'Оставить оригинал': 'Keep original format',
    'Автоматически (WebP)': 'Automatic (WebP)',
    'Для статичных изображений будет выбран WebP: обычно он заметно уменьшает размер файла.': 'Static images will use WebP, which usually reduces file size significantly.',
    'Качество / количество цветов GIF': 'Quality / GIF color count',

    /* Compression */
    'Сжать изображение – AKD Image': 'Compress image – AKD Image',
    'Уменьшайте вес одного или нескольких изображений, выбирая подходящее качество и формат результата.': 'Reduce the size of one or multiple images by choosing the right quality and output format.',
    'Настройки сжатия': 'Compression settings',
    'Сжать всё': 'Compress all',

    /* Resize */
    'Изменить размер изображения – AKD Image': 'Resize image – AKD Image',
    'Масштабируйте изображения по точным размерам, процентам или длинной стороне без лишних действий.': 'Scale images by exact dimensions, percentage or longest side.',
    'Параметры размера': 'Resize settings',
    'Режим изменения размера': 'Resize mode',
    'В пикселях': 'Pixels',
    'В процентах': 'Percentage',
    'По длинной стороне': 'Longest side',
    'Ширина (px)': 'Width (px)',
    'Высота (px)': 'Height (px)',
    'Масштаб (%)': 'Scale (%)',
    'Длинная сторона (px)': 'Longest side (px)',
    'Сохранять пропорции': 'Preserve aspect ratio',
    'При изменении ширины высота пересчитывается автоматически': 'Height is recalculated automatically when width changes',
    'Пропорции сохраняются автоматически.': 'Aspect ratio is preserved automatically.',
    'Не увеличивать маленькие изображения': 'Do not upscale small images',
    'Если исходник меньше заданного размера – оставить как есть': 'Keep the original size when the image is smaller than the target',
    'Изменить размер всех': 'Resize all',

    /* Watermark */
    'Водяной знак – AKD Image': 'Watermark – AKD Image',
    'Защитите изображения текстом или логотипом и примените одинаковые настройки ко всему набору файлов.': 'Protect images with text or a logo and apply the same settings to the entire batch.',
    'Текст': 'Text',
    'Изображение / Логотип': 'Image / Logo',
    'Текст водяного знака': 'Watermark text',
    'Введите текст...': 'Enter text...',
    'Шрифт': 'Font',
    'Inter (по умолчанию)': 'Inter (default)',
    'Размер шрифта (px)': 'Font size (px)',
    'Цвет текста': 'Text color',
    'Стиль': 'Style',
    'Жирный': 'Bold',
    'Курсив': 'Italic',
    'Загрузите файл водяного знака': 'Upload a watermark file',
    'Или вставьте ссылку на SVG / картинку': 'Or paste a link to an SVG / image',
    'Мои ссылки': 'My links',
    'Размер логотипа (% от ширины)': 'Logo size (% of width)',
    'Прозрачность': 'Opacity',
    'Позиция': 'Position',
    'Верх лево': 'Top left',
    'Верх центр': 'Top center',
    'Верх право': 'Top right',
    'Середина лево': 'Middle left',
    'Центр': 'Center',
    'Середина право': 'Middle right',
    'Низ лево': 'Bottom left',
    'Низ центр': 'Bottom center',
    'Низ право': 'Bottom right',
    'Замостить по всему изображению': 'Tile across the image',
    'Водяной знак повторяется по диагонали': 'Repeat watermark diagonally',
    'Добавить водяной знак': 'Add watermark',

    /* Crop */
    'Обрезать изображение – AKD Image': 'Crop image – AKD Image',
    'Настройки обрезки': 'Crop settings',
    'Пропорции (Aspect Ratio)': 'Aspect ratio',
    'Свободно': 'Free',
    '1:1 (Квадрат)': '1:1 (Square)',
    '9:16 (Story)': '9:16 (Story)',
    'X (слева, px)': 'X (left, px)',
    'Y (сверху, px)': 'Y (top, px)',
    'Область обрезки': 'Crop area',
    'Редактируемое изображение': 'Image being edited',
    'Обрезать изображение': 'Crop image',
    'Скачать результат': 'Download result',
    'Результат обрезки': 'Crop result',

    /* Conversion */
    'Конвертировать изображение – AKD Image': 'Convert image – AKD Image',
    'Преобразуйте JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG и BMP, сохраняя удобный баланс качества и размера.': 'Convert JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG and BMP while balancing quality and file size.',
    'Целевой формат': 'Target format',
    'Качество (JPG / WebP / AVIF / HEIC)': 'Quality (JPG / WebP / AVIF / HEIC)',
    'Конвертировать всё': 'Convert all',

    /* Rotate */
    'Повернуть / Отразить – AKD Image': 'Rotate / Flip – AKD Image',
    'Исправляйте ориентацию и зеркально отражайте сразу несколько изображений.': 'Correct orientation and mirror multiple images at once.',
    'Действия': 'Actions',
    '↔ Отразить по горизонтали': '↔ Flip horizontally',
    '↕ Отразить по вертикали': '↕ Flip vertically',
    'Применить и скачать': 'Apply and download',

    /* Effects */
    'Фотоэффекты – AKD Image': 'Photo effects – AKD Image',
    'Настройте свет, цвет и резкость изображения, наблюдая изменения прямо в рабочей области.': 'Adjust light, color and sharpness while viewing changes directly in the workspace.',
    'Фильтры': 'Filters',
    'Яркость': 'Brightness',
    'Контраст': 'Contrast',
    'Насыщенность': 'Saturation',
    'Размытие (Blur)': 'Blur',
    'Сепия': 'Sepia',
    'Grayscale (Ч/Б)': 'Grayscale',
    'Инверсия': 'Invert',
    'Сохранить изображение': 'Save image',

    /* Blur */
    'Размытие области – AKD Image': 'Blur area – AKD Image',
    'Выделите часть изображения и скройте ее мягким размытием. Файл обрабатывается локально в браузере.': 'Select part of an image and hide it with a soft blur. The file is processed locally in your browser.',
    'Настройки размытия': 'Blur settings',
    'Область размытия': 'Blur area',
    'Сила размытия': 'Blur strength',
    'Размыть область': 'Blur area',
    'Результат размытия': 'Blur result',

    /* Meme */
    'Генератор мемов – AKD Image': 'Meme generator – AKD Image',
    'Создавайте классические мемы с крупными подписями сверху и снизу изображения.': 'Create classic memes with large captions above and below an image.',
    'Верхний текст': 'Top text',
    'Нижний текст': 'Bottom text',
    'Создать мем': 'Create meme',

    /* Split */
    'Разделить изображение – AKD Image': 'Split image – AKD Image',
    'Нарежьте длинный скриншот на равные части или подготовьте сетку изображений для публикации.': 'Cut a long screenshot into equal sections or prepare an image grid for publishing.',
    'Настройки нарезки': 'Split settings',
    'Режим нарезки': 'Split mode',
    'Количество частей': 'Number of sections',
    'Сетка (X на Y)': 'Grid (X by Y)',
    'Столбцы (по горизонтали)': 'Columns (horizontal)',
    'Строки (по вертикали)': 'Rows (vertical)',
    'Предпросмотр сетки': 'Grid preview',
    'Нарезать и скачать (ZIP)': 'Split and download (ZIP)',

    /* Rounded corners */
    'Скругление углов – AKD Image': 'Round corners – AKD Image',
    'Задайте степень скругления и сохраните изображения как PNG с прозрачными краями.': 'Set the corner radius and save images as PNG with transparent corners.',
    'Радиус скругления (%)': 'Corner radius (%)',
    'Скруглить углы': 'Round corners',

    /* Pixelate and EXIF */
    'Пикселизатор – AKD Image': 'Pixelate image – AKD Image',
    'Создайте эффект пиксель-арта и подберите размер блоков с помощью предпросмотра.': 'Create a pixel-art effect and choose the block size using the preview.',
    'Размер пикселя': 'Pixel size',
    'Пикселизировать': 'Pixelate',
    'Удаление метаданных (EXIF)': 'Remove metadata (EXIF)',
    'Удаление метаданных (EXIF) – AKD Image': 'Remove metadata (EXIF) – AKD Image',
    'Настройки сохранения': 'Save settings',
    'EXIF удаляется автоматически при пересохранении изображения.': 'EXIF is removed automatically when the image is re-saved.',
    'Удалить метаданные': 'Remove metadata',

    /* Base64 */
    'Изображение в Base64 – AKD Image': 'Image to Base64 – AKD Image',
    'Получите Data URL или чистую Base64-строку либо восстановите из неё исходное изображение.': 'Create a Data URL or plain Base64 string, or restore the original image from one.',
    'Изображение → Base64': 'Image → Base64',
    'Base64 → изображение': 'Base64 → image',
    'Режим конвертации': 'Conversion mode',
    'Формат строки': 'String format',
    'Data URL или чистая строка Base64': 'Data URL or plain Base64 string',
    'Только Base64': 'Base64 only',
    'Строка Base64': 'Base64 string',
    'Формат чистой строки Base64': 'Plain Base64 string format',
    'До 3 МБ исходных данных для плавной работы.': 'Up to 3 MB of source data for smooth performance.',
    'Для более крупных файлов рекомендуется сначала': 'For larger files, we recommend that you first',
    'сжать изображение': 'compress the image',
    'Выберите файл до 3 МБ, вставьте из буфера или перетащите сюда': 'Choose a file up to 3 MB, paste from the clipboard or drag it here',
    'Преобразовать': 'Convert',
    'Скачать TXT': 'Download TXT',
    'Скачать изображение': 'Download image',
    'Восстановленное изображение': 'Restored image',

    /* Favicon */
    'Генератор favicon – AKD Image': 'Favicon generator – AKD Image',
    'Создайте favicon.ico и PNG-иконки нужных размеров, затем скачайте их отдельно или одним ZIP.': 'Create favicon.ico and PNG icons in the required sizes, then download them separately or in one ZIP.',
    'Размещение изображения': 'Image placement',
    'Обрезать до квадрата': 'Crop to square',
    'Вписать целиком': 'Fit entire image',
    'Размеры': 'Sizes',
    'Создать favicon': 'Create favicon',
    'PNG-иконки': 'PNG icons',
    'Предпросмотр favicon': 'Favicon preview',
    'Закрыть предпросмотр': 'Close preview',
    'Скачать всё (ZIP)': 'Download all (ZIP)',

    /* Palette */
    'Генератор палитры – AKD Image': 'Palette generator – AKD Image',
    'Извлеките визуально отличающиеся цвета, скопируйте их значения или сохраните палитру как PNG.': 'Extract visually distinct colors, copy their values or save the palette as PNG.',
    'Нажмите на цвет, чтобы скопировать HEX': 'Select a color to copy its HEX value',
    'Создать палитру': 'Create palette',
    'Скачать палитру PNG': 'Download palette PNG',

    /* PDF */
    'Изображения в PDF – AKD Image': 'Images to PDF – AKD Image',
    'Соберите несколько JPG, PNG или WebP в один PDF с настройкой страниц и отступов.': 'Combine multiple JPG, PNG or WebP images into one PDF with page and margin settings.',
    'Настройки PDF': 'PDF settings',
    'Формат страницы': 'Page size',
    'Авто': 'Auto',
    'Портрет': 'Portrait',
    'Альбом': 'Landscape',
    'Размещение': 'Placement',
    'Заполнить страницу': 'Fill page',
    'Качество изображений': 'Image quality',
    'Создать PDF': 'Create PDF',
    'Скачать PDF': 'Download PDF',

    /* Collage */
    'Коллаж – AKD Image': 'Collage – AKD Image',
    'Соберите несколько изображений в один аккуратный коллаж с сеткой, фоном и настраиваемыми промежутками.': 'Combine multiple images into a clean collage with a grid, background and adjustable spacing.',
    'Настройки коллажа': 'Collage settings',
    'Макет': 'Layout',
    'Авто-сетка': 'Automatic grid',
    'Своя сетка': 'Custom grid',
    'Горизонтальная лента': 'Horizontal strip',
    'Вертикальная лента': 'Vertical strip',
    'Колонки': 'Columns',
    'Промежуток': 'Spacing',
    'Фон': 'Background',
    'Заполнить ячейку': 'Fill cell',
    'Предпросмотр коллажа': 'Collage preview',
    'Создать коллаж': 'Create collage',
    'Скачать коллаж': 'Download collage',

    /* Annotations */
    'Пометки на изображении – AKD Image': 'Annotate image – AKD Image',
    'Добавьте текст, обводку, стрелку, круг, овал или свободную пометку на фото и скриншот. Готовые пометки можно перемещать.': 'Add text, outlines, arrows, circles, ellipses or freehand marks to a photo or screenshot. Finished annotations can be moved.',
    'Разметка': 'Annotation',
    'Инструменты': 'Tools',
    'Кисть': 'Brush',
    'Стрелка': 'Arrow',
    'Круг': 'Circle',
    'Овал': 'Ellipse',
    'Рамка': 'Rectangle',
    'Переместить': 'Move',
    'Введите текст': 'Enter text',
    'Цвет': 'Color',
    'Толщина': 'Thickness',
    'Размер текста': 'Text size',
    'Назад': 'Undo',
    'Очистить разметку': 'Clear annotations',
    'Сохранить разметку': 'Save annotated image',
    'Копировать в буфер': 'Copy to clipboard',
    'Размеченное изображение': 'Annotated image',

    /* GIF trim */
    'Вырезать GIF – AKD Image': 'Trim GIF – AKD Image',
    'Оставьте нужный фрагмент анимации: выберите начало и конец в секундах, затем скачайте новый GIF.': 'Keep the part of the animation you need: choose the start and end time, then download a new GIF.',
    'Фрагмент анимации': 'Animation segment',
    'Добавьте GIF': 'Add a GIF',
    'Выберите фрагмент': 'Choose a segment',
    'Начало (с)': 'Start (s)',
    'Конец (с)': 'End (s)',
    'Начало фрагмента': 'Segment start',
    'Конец фрагмента': 'Segment end',
    'Границы автоматически привязываются к ближайшим кадрам, чтобы сохранить анимацию без повреждений.': 'The boundaries snap to the nearest frames to keep the animation intact.',
    'Предпросмотр выбранного фрагмента GIF': 'Selected GIF segment preview',
    'Скачать GIF': 'Download GIF',
    'Обрезанный GIF': 'Trimmed GIF',

    /* GIF frames */
    'GIF в кадры – AKD Image': 'GIF to frames – AKD Image',
    'Извлеките все кадры анимации в PNG или JPG, просмотрите их и скачайте отдельно либо одним ZIP-архивом.': 'Extract every animation frame as PNG or JPG, preview it and download frames separately or in one ZIP archive.',
    'Выбрать GIF': 'Choose GIF',
    'Предпросмотр исходного GIF': 'Original GIF preview',
    'Формат кадров': 'Frame format',
    'PNG – прозрачный фон': 'PNG – transparent background',
    'JPG – меньший размер': 'JPG – smaller files',
    'Качество JPG': 'JPG quality',
    'PNG сохраняет прозрачность. При выборе JPG прозрачные области получат белый фон.': 'PNG preserves transparency. With JPG, transparent areas will receive a white background.',
    'Извлечь кадры': 'Extract frames',
    'Извлечённые кадры': 'Extracted frames',

    /* Video and GIF */
    'Видео в GIF и GIF в видео – AKD Image': 'Video to GIF and GIF to video – AKD Image',
    'Создайте GIF из фрагмента видео или преобразуйте GIF в MP4 либо WebM прямо в браузере.': 'Create a GIF from a video clip or convert a GIF to MP4 or WebM directly in your browser.',
    'Направление конвертации': 'Conversion direction',
    'Видео → GIF': 'Video → GIF',
    'GIF → Видео': 'GIF → Video',
    'Добавьте видео': 'Add a video',
    'Добавьте GIF': 'Add a GIF',
    'Локальная обработка': 'Local processing',
    'Файл не отправляется на сервер. Лимиты: видео до 100 МБ, GIF до 25 МБ и длительность до 60 секунд. При первом запуске браузер загрузит модуль FFmpeg размером около 31 МБ.': 'The file is not uploaded to a server. Limits: video up to 100 MB, GIF up to 25 MB and duration up to 60 seconds. On first use, the browser will load an FFmpeg module of about 31 MB.',
    'Частота кадров': 'Frame rate',
    '8 кадров/с': '8 fps',
    '12 кадров/с': '12 fps',
    '15 кадров/с': '15 fps',
    '20 кадров/с': '20 fps',
    'Ширина GIF': 'GIF width',
    'Количество цветов': 'Color count',
    '64 – меньший файл': '64 – smaller file',
    '128 – сбалансированно': '128 – balanced',
    '256 – больше деталей': '256 – more detail',
    'Формат видео': 'Video format',
    'Сбалансированное': 'Balanced',
    'Высокое': 'High',
    'Видео не поддерживает прозрачность GIF. Прозрачные области будут отображаться на черном фоне.': 'Video does not support GIF transparency. Transparent areas will appear on a black background.',
    'Создать GIF': 'Create GIF',
    'Создать видео': 'Create video',
    'Результат конвертации': 'Conversion result',

    /* Favorites */
    'Настройка избранного – AKD Image': 'Manage favorites – AKD Image',
    'Настройка избранного': 'Manage favorites',
    'Добавляйте и убирайте инструменты, чтобы быстро открывать их на главной странице. Выбор сохраняется локально в этом браузере и не передаётся на сервер. Изменения применяются после нажатия «Подтвердить».': 'Add or remove tools for quick access from the home page. Your selection is stored locally in this browser and is never sent to a server. Changes are applied after you select “Apply”.',
    'Убрать из избранного': 'Remove from favorites',
    'Добавить в избранное': 'Add to favorites',

    /* Static information pages */
    'О проекте – AKD Image': 'About – AKD Image',
    'AKD Image – бесплатный браузерный сервис для повседневной работы с изображениями. Здесь можно узнать, как он устроен и какие технологии использует.': 'AKD Image is a free browser-based service for everyday image tasks. This page explains how it works and which technologies it uses.',
    'Что делает сервис': 'What the service does',
    'Как обрабатываются изображения': 'How images are processed',
    'Технологии проекта': 'Project technologies',
    'Локально подключенные библиотеки': 'Locally bundled libraries',
    'Конфиденциальность и хранение данных': 'Privacy and data storage',
    'Совместимость и ограничения': 'Compatibility and limitations',
    'Исходный код и права': 'Source code and rights',
    'Автор': 'Author',
    'Конфиденциальность – AKD Image': 'Privacy – AKD Image',
    'Эта политика написана понятным языком. Здесь коротко объяснено, как AKD Image работает с файлами, что хранится в браузере и в каких случаях может появиться внешний запрос.': 'This policy uses plain language to explain how AKD Image handles files, what is stored in the browser and when an external request may occur.',
    '1. Локальная обработка файлов': '1. Local file processing',
    '2. Нет серверной загрузки изображений': '2. No server uploads',
    '3. Локальные зависимости': '3. Local dependencies',
    '4. Буфер обмена': '4. Clipboard',
    '5. Внешние ссылки в водяных знаках': '5. External watermark links',
    '6. Локальное хранение настроек': '6. Local settings storage',
    '7. Cookies, статистика и хостинг': '7. Cookies, analytics and hosting',
    '8. Изменения в политике': '8. Policy changes',
    'Лицензии и компоненты – AKD Image': 'Licenses and components – AKD Image',
    'Лицензии и компоненты': 'Licenses and components',
    'Условия использования AKD Image и лицензии сторонних компонентов, на которых работает сервис.': 'Terms for using AKD Image and licenses for the third-party components that power the service.',
    'Лицензия AKD Image': 'AKD Image license',
    'Сторонние компоненты': 'Third-party components',
    'Исходный проект': 'Original project',
    'Текст лицензии': 'License text',
    'Сведения о лицензии': 'License information',
    'Как читать эту страницу': 'How to read this page',
    'Исходный код и сборка': 'Source code and build',
    'Локальный шрифт интерфейса, созданный Rasmus Andersson.': 'A locally bundled interface font created by Rasmus Andersson.',
    'Создание ZIP-архивов с результатами пакетной обработки. В AKD Image компонент используется на условиях MIT.': 'Creates ZIP archives containing batch-processing results. AKD Image uses this component under the MIT License.',
    'Формирование PDF-файлов из выбранных изображений непосредственно в браузере.': 'Creates PDF files from selected images directly in the browser.',
    'Чтение, покадровая обработка, построение палитры и кодирование GIF-анимаций.': 'Reads, processes frame by frame, builds palettes and encodes GIF animations.',
    'JavaScript-оболочка для запуска локальной конвертации видео и GIF в браузере.': 'A JavaScript wrapper for local video and GIF conversion in the browser.',
    'WebAssembly-сборка FFmpeg для локального преобразования MP4, WebM и GIF. Модуль загружается с сайта AKD Image только при запуске инструмента.': 'A WebAssembly build of FFmpeg for local MP4, WebM and GIF conversion. The module is loaded from AKD Image only when the tool is launched.',
    'WebAssembly-кодек для локального экспорта изображений в AVIF.': 'A WebAssembly codec for local AVIF image export.',
    'Чтение и создание контейнеров HEIC и HEIF в локальном WebAssembly-модуле.': 'Reads and creates HEIC and HEIF containers in a local WebAssembly module.',
    'Декодирование HEVC-изображений внутри файлов HEIC и HEIF.': 'Decodes HEVC images contained in HEIC and HEIF files.',
    'Кодирование HEVC для локального экспорта изображений в HEIC.': 'Encodes HEVC for local HEIC image export.',
    'Стандартные возможности браузера, включая Canvas API, File API, Web Workers, WebAssembly и localStorage, являются веб-платформой и не входят в список сторонних библиотек проекта.': 'Standard browser features such as Canvas API, File API, Web Workers, WebAssembly and localStorage are part of the web platform and are not listed as third-party project libraries.',

    /* Search, metadata and additional interface labels */
    'Язык интерфейса': 'Interface language',
    'Выбрать язык': 'Select language',
    'Поиск инструментов': 'Search tools',
    'Поиск по названию и описанию инструмента': 'Search by tool name or description',
    'Обрабатывайте JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и анимированные GIF локально в браузере с помощью AKD Image.': 'Process JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and animated GIF files locally in your browser with AKD Image.',
    'Как устроен AKD Image: локальная обработка изображений в браузере, технологии проекта, используемые библиотеки и условия использования исходного кода.': 'How AKD Image works: local browser processing, project technologies, bundled libraries and source code terms.',
    'Как AKD Image обрабатывает изображения локально в браузере, не загружает файлы на сервер и использует только локальные зависимости.': 'How AKD Image processes images locally in the browser without uploading files and uses locally bundled dependencies.',
    'Условия использования AKD Image и сведения о лицензиях сторонних библиотек, кодеков и шрифта, включённых в проект.': 'AKD Image terms of use and license information for the third-party libraries, codecs and font bundled with the project.',
    'Подготовить результат': 'Prepare result',
    'Пометок': 'Annotations',
    'Очистить': 'Clear',
    'Изображение': 'Image',
    'Область': 'Area',
    'Размытие': 'Blur',
    'Размер файла': 'File size',
    'Отступ от края': 'Edge padding',
    'Сетка': 'Grid',
    'До': 'Before',
    'После': 'After',
    'Изменение': 'Change',
    'Конвертировать изображение': 'Convert image',
    'Параметры конвертации': 'Conversion settings',
    'Конвертировано': 'Converted',
    'Статус': 'Status',
    'Очищено': 'Cleaned',
    'Генератор favicon': 'Favicon generator',
    'Цвет фона': 'Background color',
    'Параметры извлечения': 'Extraction settings',
    'Подготовка кадров...': 'Preparing frames...',
    'Фрагмент': 'Segment',
    'Обработано': 'Processed',
    'ВЕРХНИЙ ТЕКСТ': 'TOP TEXT',
    'НИЖНИЙ ТЕКСТ': 'BOTTOM TEXT',
    'По размеру изображения': 'Match image size',
    'Ориентация': 'Orientation',
    'Отступы': 'Margins',
    'Страниц': 'Pages',
    'Готов': 'Ready',
    'от наименьшей стороны': 'of the shortest side',
    'По вертикали (скриншоты)': 'Vertically (screenshots)',
    'Фрагментов': 'Segments',
    'Скачано': 'Downloaded',
    'ZIP-архив': 'ZIP archive',
    'Меньший файл': 'Smaller file',
    'Подготовка...': 'Preparing...',
    'Предпросмотр GIF': 'GIF preview',
    'Обычный': 'Regular',
    'Отступ от края (px)': 'Edge padding (px)',

    /* Full About page */
    'AKD Image создан AKDworks как набор практичных инструментов для обработки статичных изображений и анимированных GIF. Проект работает без регистрации и стремится оставить важное на устройстве пользователя: файлы, настройки и сам процесс обработки.': 'AKD Image was created by AKDworks as a practical toolkit for static images and animated GIFs. It works without registration and keeps what matters on your device: your files, settings and the processing itself.',
    'AKD Image объединяет популярные задачи в одном интерфейсе: сжатие, изменение размера, конвертацию, обрезку, эффекты, подготовку PDF и favicon, работу с GIF, разметку изображений и другие операции. В зависимости от инструмента можно обрабатывать один файл или целую подборку и скачивать результат отдельными файлами либо ZIP-архивом.': 'AKD Image brings common tasks into one interface: compression, resizing, conversion, cropping, effects, PDF and favicon creation, GIF processing, image annotation and more. Depending on the tool, you can process one file or a complete batch and download separate results or a ZIP archive.',
    'После выбора, перетаскивания или вставки изображения из буфера браузер читает файл локально. Для большинства операций AKD Image создает временное изображение в памяти вкладки, применяет нужные изменения через Canvas API и формирует итоговый файл как Blob. SVG перед редактированием безопасно растрируется, а HEIC и HEIF декодируются локальным WebAssembly-модулем. Готовый файл скачивается напрямую в браузере.': 'After you select, drop or paste an image, the browser reads it locally. For most operations, AKD Image creates a temporary image in the tab memory, applies changes through the Canvas API and produces the result as a Blob. SVG is safely rasterized before editing, while HEIC and HEIF are decoded by a local WebAssembly module. The finished file is downloaded directly by the browser.',
    'GIF-анимации обрабатываются покадрово: сохраняются порядок кадров, длительность и параметры повторения. При закрытии вкладки выбранные изображения и промежуточные данные исчезают из ее оперативной памяти.': 'GIF animations are processed frame by frame while preserving frame order, timing and loop settings. When the tab is closed, selected images and temporary data disappear from its memory.',
    'В проекте нет собственного backend-сервера, базы данных или облачного хранилища для пользовательских изображений. AKD Image не получает и не сохраняет файлы, которые вы добавляете для обработки.': 'The project has no backend server, database or cloud storage for user images. AKD Image does not receive or retain files that you add for processing.',
    'В браузере могут храниться только настройки интерфейса, например выбранные язык и тема, а также сохраненные вами HTTPS-ссылки на логотипы для водяных знаков. Подробные условия описаны в': 'The browser may store only interface preferences such as your selected language and theme, along with HTTPS logo links that you save for watermarks. Full details are available in the',
    'политике конфиденциальности': 'privacy policy',
    'Интерфейс построен на HTML, CSS и JavaScript без тяжелого клиентского фреймворка. В основе обработки лежат стандартные возможности современных браузеров: File API, FileReader, Canvas API, Blob, Object URL, Drag and Drop API, Clipboard API и localStorage.': 'The interface is built with HTML, CSS and JavaScript without a heavy client framework. Processing relies on standard modern browser capabilities: File API, FileReader, Canvas API, Blob, Object URL, Drag and Drop API, Clipboard API and localStorage.',
    'Для крупных задач AKD Image использует Web Workers и OffscreenCanvas, если браузер их поддерживает. Это помогает выполнять обработку в фоне и сохранять отзывчивость интерфейса. Если такие возможности недоступны, сервис использует совместимый запасной вариант в основной вкладке.': 'For demanding tasks, AKD Image uses Web Workers and OffscreenCanvas when supported by the browser. This allows processing to run in the background while the interface remains responsive. A compatible main-thread fallback is used when those features are unavailable.',
    'Сторонние зависимости находятся в репозитории и не загружаются с внешних CDN во время обычной работы сайта:': 'Third-party dependencies are stored in the repository and are not loaded from external CDNs during normal use:',
    '– создание ZIP-архивов с результатами пакетной обработки;': '– creates ZIP archives with batch-processing results;',
    '– формирование PDF из изображений;': '– creates PDF documents from images;',
    '– чтение, покадровая обработка и кодирование GIF-анимаций, включая работу через Worker;': '– reads, processes and encodes GIF animations frame by frame, including Worker-based processing;',
    '– локальное преобразование видео MP4/WebM в GIF и GIF-анимаций в MP4/WebM;': '– locally converts MP4/WebM video to GIF and GIF animations to MP4/WebM;',
    '– создание изображений в формате AVIF;': '– creates AVIF images;',
    '– чтение и создание контейнеров HEIC/HEIF;': '– reads and creates HEIC/HEIF containers;',
    '– декодирование HEVC-изображений внутри HEIC/HEIF;': '– decodes HEVC images inside HEIC/HEIF;',
    '– кодирование HEVC для экспорта HEIC без зависимости от x265;': '– encodes HEVC for HEIC export without an x265 dependency;',
    '– локально подключенный шрифт интерфейса.': '– provides the locally bundled interface font.',
    'Лицензии сторонних компонентов находятся рядом с соответствующими файлами в каталоге': 'Third-party component licenses are stored next to their files in',
    'и применяются только к этим компонентам. Сводка с авторами, официальными источниками и полными текстами доступна на странице': 'and apply only to those components. A summary with authors, official sources and complete license texts is available on the',
    '«Лицензии и компоненты»': 'Licenses and components page',
    'AKD Image рассчитан на актуальные версии Chrome, Edge, Firefox и Safari. Скорость обработки зависит от мощности устройства, свободной памяти, размера изображения и количества кадров GIF. HEIC/HEIF и преобразование видео обрабатываются локально через WebAssembly и требуют больше памяти, поэтому для них действуют отдельные лимиты. Модуль FFmpeg загружается только при запуске конвертации видео и после первой загрузки может сохраняться в кэше браузера. Экспорт HEIC сохраняет один обычный 8-битный кадр без Live Photos, HDR, карт глубины и исходных метаданных.': 'AKD Image supports current versions of Chrome, Edge, Firefox and Safari. Processing speed depends on your device, available memory, image size and GIF frame count. HEIC/HEIF and video conversion run locally through WebAssembly and require more memory, so separate limits apply. The FFmpeg module is loaded only when video conversion starts and may then remain in the browser cache. HEIC export produces one standard 8-bit frame without Live Photos, HDR, depth maps or original metadata.',
    'Репозиторий AKD Image опубликован на GitHub, чтобы с проектом можно было ознакомиться и изучить его устройство. Публикация исходного кода не означает свободную лицензию: копирование кода, дизайна или создание производных проектов без письменного разрешения запрещено. Полные условия приведены в файле': 'The AKD Image repository is published on GitHub so the project and its architecture can be reviewed and studied. Publishing the source code does not grant an open license: copying the code or design, or creating derivative projects without written permission, is prohibited. Full terms are provided in the',
    ', а краткое пояснение – на странице': ', with a short explanation on the',
    'Проект развивается под брендом': 'The project is developed under the',
    '. AKD Image остается локальным браузерным сервисом, который можно использовать бесплатно для работы со своими изображениями.': 'brand. AKD Image remains a local browser-based service that you can use free of charge with your own images.',

    /* Full Privacy page */
    'AKD Image создан как набор простых инструментов для обработки изображений прямо в браузере. Главный принцип проекта: ваши изображения должны оставаться на вашем устройстве и не отправляться на сервер для обработки.': 'AKD Image is a set of straightforward tools that process images directly in your browser. Its main principle is that your images should remain on your device and never be uploaded to a server for processing.',
    'Сжатие, изменение размера, обрезка, конвертация изображений, видео и GIF, эффекты, водяные знаки и другие операции выполняются средствами вашего браузера: File API, FileReader, Canvas, Blob, Object URL, WebAssembly и похожими стандартными веб-возможностями. Загруженные файлы используются в памяти вкладки и не отправляются в AKD Image или сторонний сервис.': 'Compression, resizing, cropping, image, video and GIF conversion, effects, watermarks and other operations are performed by your browser using File API, FileReader, Canvas, Blob, Object URL, WebAssembly and similar standard web capabilities. Added files are used in the tab memory and are not sent to AKD Image or a third-party service.',
    'В проекте нет backend-части, базы данных или облачного хранилища для пользовательских файлов. После закрытия вкладки выбранные изображения исчезают из оперативной памяти браузера. Я не получаю ваши файлы и не могу передать их третьим лицам.': 'The project has no backend, database or cloud storage for user files. Selected images disappear from browser memory after the tab is closed. I do not receive your files and cannot share them with third parties.',
    'Шрифт Inter, а также библиотеки JSZip, jsPDF, modern-gif, ffmpeg.wasm, AVIF-энкодер, libheif, libde265 и Kvazaar подключаются из файлов проекта, а не с внешних CDN. HEIC, HEIF, видео и GIF обрабатываются локальными WebAssembly-модулями. Это позволяет формировать ZIP, PDF, GIF, видео, AVIF и HEIC без отправки пользовательского файла на сторонний библиотечный сервер. Сведения об авторах и условиях распространения собраны на странице': 'The Inter font and the JSZip, jsPDF, modern-gif, ffmpeg.wasm, AVIF encoder, libheif, libde265 and Kvazaar libraries are loaded from project files rather than external CDNs. HEIC, HEIF, video and GIF files are processed by local WebAssembly modules. This makes it possible to create ZIP, PDF, GIF, video, AVIF and HEIC output without sending user files to a third-party library server. Author and license details are listed on the',
    'Изображение из буфера обмена считывается только когда вы сами вставляете его через Ctrl+V или соответствующее действие в браузере. В отдельных инструментах можно по нажатию скопировать готовый результат в буфер обмена. AKD Image не считывает содержимое буфера автоматически и не отправляет его на сервер.': 'An image is read from the clipboard only when you paste it with Ctrl+V or the corresponding browser action. Some tools let you copy a finished result to the clipboard. AKD Image never reads clipboard contents automatically or sends them to a server.',
    'В инструменте водяных знаков можно вставить HTTPS-ссылку на логотип или SVG. Если вы сами укажете внешний URL, браузер обратится к указанному серверу, который может получить обычные технические сведения о подключении, например IP-адрес. Адрес текущей страницы не передается в заголовке Referer. Это действие инициируется вами; загруженные изображения для обработки по-прежнему не отправляются на сервер AKD Image.': 'The watermark tool accepts an HTTPS link to a logo or SVG. If you provide an external URL, the browser contacts that server, which may receive ordinary connection information such as your IP address. The current page address is not sent in the Referer header. You initiate this request; images selected for processing are still not uploaded to an AKD Image server.',
    'AKD Image использует localStorage для выбранного языка и режима темы, списка избранных инструментов и ограниченного списка HTTPS-ссылок на логотипы в инструменте водяных знаков. Эти данные остаются в вашем браузере и могут быть удалены через настройки сайта или очистку данных браузера.': 'AKD Image uses localStorage for the selected language and theme, favorite tools and a limited list of HTTPS logo links in the watermark tool. This data remains in your browser and can be removed through site settings or by clearing browser data.',
    'Сам проект не требует cookies для обработки изображений и не содержит рекламных трекеров или аналитических счетчиков. Сайт размещен на Vercel: хостинг может обрабатывать стандартные технические данные запросов для работы и диагностики сайта. Загруженные для обработки изображения в эти данные не попадают, так как не отправляются с устройства.': 'The project does not require cookies for image processing and contains no advertising trackers or analytics counters. The site is hosted on Vercel, which may process standard technical request data to operate and diagnose the site. Images selected for processing are not part of that data because they never leave your device.',
    'Политика может обновляться по мере развития проекта и добавления новых инструментов. Основной принцип остается прежним: обработка пользовательских изображений, GIF и видео выполняется локально в браузере.': 'This policy may be updated as the project evolves and new tools are added. The core principle remains unchanged: user images, GIFs and videos are processed locally in the browser.',
    'Если у вас есть вопросы по поводу безопасности данных или работы сайта, проверьте исходный код проекта или свяжитесь с автором через доступные каналы связи.': 'If you have questions about data safety or how the site works, review the project source code or contact the author through the available channels.',

    /* Full Licenses page */
    'Код, интерфейс, дизайн и документация AKD Image принадлежат AKDworks и распространяются на условиях собственной ограничительной лицензии. Репозиторий опубликован для просмотра и изучения устройства проекта, но это не даёт права копировать, переиздавать, продавать или использовать проект и его части в других продуктах без письменного разрешения автора.': 'The AKD Image code, interface, design and documentation belong to AKDworks and are distributed under a proprietary restrictive license. The repository is published for review and study, but this does not grant permission to copy, republish, sell or use the project or its parts in other products without the author’s written permission.',
    'Полные и юридически значимые условия находятся в файле': 'The complete legally binding terms are provided in the',
    'LICENSE репозитория AKD Image': 'AKD Image repository LICENSE file',
    'Перечисленные ниже библиотеки, кодеки и шрифт сохраняют собственные лицензии. Эти лицензии применяются только к соответствующим компонентам и не заменяют условия использования оригинального кода, интерфейса и дизайна AKD Image.': 'The libraries, codecs and font listed below retain their own licenses. Those licenses apply only to the corresponding components and do not replace the terms for the original AKD Image code, interface and design.',
    'MIT или GPL-3.0-or-later': 'MIT or GPL-3.0-or-later',
    'modern-gif и modern-palette': 'modern-gif and modern-palette',
    'Краткие описания помогают понять роль компонентов, но не заменяют полные тексты лицензий. При расхождении определяющими являются условия в соответствующем файле лицензии и в официальном репозитории компонента.': 'Short descriptions explain each component’s role but do not replace the full license texts. If wording differs, the corresponding license file and the component’s official repository take precedence.',

    /* Tool metadata and runtime messages */
    'Закрыть поиск инструментов': 'Close tool search',
    'Добавляйте пометки на JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и анимированные GIF прямо в браузере.': 'Annotate JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and animated GIF files directly in your browser.',
    'Не удалось загрузить изображение.': 'Could not load the image.',
    'Результат готов.': 'Result is ready.',
    'Не удалось подготовить результат.': 'Could not prepare the result.',
    'Изображение скопировано.': 'Image copied.',
    'Не удалось скопировать изображение.': 'Could not copy the image.',
    'Преобразуйте JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP или GIF в Base64 и восстановите файл локально в браузере.': 'Convert JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP or GIF to Base64 and restore the file locally in your browser.',
    'Не удалось прочитать изображение.': 'Could not read the image.',
    'Скопировано в буфер обмена.': 'Copied to the clipboard.',
    'Не удалось скопировать текст.': 'Could not copy the text.',
    'Пустая строка': 'Empty string',
    'Поддерживаются только JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и GIF': 'Only JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and GIF are supported',
    'Некорректная строка Base64': 'Invalid Base64 string',
    'Формат данных не совпадает с выбранным типом изображения': 'The data format does not match the selected image type',
    'Base64 не содержит корректное изображение.': 'Base64 does not contain a valid image.',
    'Проверьте строку Base64 и выбранный формат.': 'Check the Base64 string and selected format.',
    'Размывайте область JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP или GIF для скрытия лиц и личных данных.': 'Blur an area in JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP or GIF files to hide faces and private information.',
    'Размываю...': 'Blurring...',
    'Изображение скопировано в буфер.': 'Image copied to the clipboard.',
    'Копирование не поддерживается браузером, скачайте изображение.': 'Clipboard copying is not supported by this browser. Download the image instead.',
    'Область размыта.': 'Area blurred.',
    'Не удалось размыть область.': 'Could not blur the area.',
    'Создайте коллаж из JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG или BMP прямо в браузере без загрузки файлов на сервер.': 'Create a collage from JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG or BMP files directly in your browser without uploading them to a server.',
    'Загрузка...': 'Loading...',
    'Создаю коллаж...': 'Creating collage...',
    'Коллаж создан.': 'Collage created.',
    'Не удалось создать коллаж.': 'Could not create the collage.',
    'Сжимайте JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и анимированные GIF прямо в браузере без загрузки на сервер.': 'Compress JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and animated GIF files directly in your browser without uploading them to a server.',
    'Анимация сохраняется в GIF, чтобы не потерять кадры.': 'Animated output remains GIF so no frames are lost.',
    'PNG сохраняется без потерь: ползунок качества на него не влияет, а новый файл может получиться больше исходного.': 'PNG is saved losslessly: the quality slider does not affect it, and the new file may be larger than the original.',
    'PNG сохраняется без потерь: для уменьшения размера обычно лучше выбрать WebP или AVIF.': 'PNG is saved losslessly. WebP or AVIF is usually a better choice for reducing file size.',
    'BMP сохраняется без сжатия: ползунок качества на него не влияет, а файл обычно получается крупнее.': 'BMP is saved without compression: the quality slider does not affect it, and the file is usually larger.',
    'SVG при обработке растрируется и сохраняется как PNG. Для меньшего файла выберите WebP или AVIF.': 'SVG is rasterized during processing and saved as PNG. Choose WebP or AVIF for a smaller file.',
    'Предпросмотр и итоговый файл будут созданы с текущими настройками.': 'The preview and output file will use the current settings.',
    'Обновляю предпросмотр...': 'Updating preview...',
    '· показан первый кадр': '· first frame shown',
    '· оставлен оригинал: новая версия тяжелее': '· original kept: the new version is larger',
    'Сжимаю...': 'Compressing...',
    'Без изменений': 'No changes',
    'Не удалось обработать GIF': 'Could not process the GIF',
    'Сжатие завершено.': 'Compression complete.',
    'Не удалось обработать': 'Could not process',
    'Конвертируйте JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG и BMP локально в браузере без отправки файлов на сервер.': 'Convert JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG and BMP files locally in your browser without uploading them to a server.',
    'Конвертирую...': 'Converting...',
    'Конвертация завершена.': 'Conversion complete.',
    'Обрезайте JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и анимированные GIF по области или точным координатам.': 'Crop JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and animated GIF files by selecting an area or entering exact coordinates.',
    'Обрезаю...': 'Cropping...',
    'Обрезка завершена.': 'Cropping complete.',
    'Не удалось обрезать изображение.': 'Could not crop the image.',
    'Применяйте эффекты к JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и анимированным GIF прямо в браузере.': 'Apply effects to JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and animated GIF files directly in your browser.',
    'Сохранение...': 'Saving...',
    'Изображение сохранено.': 'Image saved.',
    'Не удалось сохранить изображение.': 'Could not save the image.',
    'Удаляйте метаданные из JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG и BMP путём локального пересохранения в браузере.': 'Remove metadata from JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG and BMP files by re-encoding them locally in your browser.',
    'Обработка...': 'Processing...',
    'Очистка...': 'Cleaning...',
    'EXIF очищен.': 'EXIF removed.',
    'Не удалось очистить': 'Could not clean',
    'Создайте favicon и набор PNG-иконок из JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG или BMP прямо в браузере.': 'Create a favicon and a PNG icon set from JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG or BMP files directly in your browser.',
    'Выберите хотя бы один размер.': 'Select at least one size.',
    'Создание...': 'Creating...',
    'Набор favicon создан.': 'Favicon set created.',
    'Не удалось создать favicon.': 'Could not create the favicon.',
    'Настройте список избранных инструментов AKD Image для быстрого доступа на главной странице.': 'Manage your favorite AKD Image tools for quick access from the home page.',
    'Извлекайте все кадры GIF в PNG или JPG прямо в браузере. Просматривайте и скачивайте кадры отдельно либо одним ZIP-архивом.': 'Extract every GIF frame as PNG or JPG directly in your browser. Preview and download frames individually or in one ZIP archive.',
    'Обрезайте анимированные GIF по времени прямо в браузере. Выберите начало и конец фрагмента, затем скачайте новый GIF без загрузки файла на сервер.': 'Trim animated GIF files by time directly in your browser. Choose the start and end of a segment, then download a new GIF without uploading it to a server.',
    'Не удалось открыть GIF.': 'Could not open the GIF.',
    'Фрагмент GIF подготовлен.': 'GIF segment is ready.',
    'Не удалось обрезать GIF.': 'Could not trim the GIF.',
    'Создавайте мемы из JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и анимированных GIF прямо в браузере.': 'Create memes from JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and animated GIF files directly in your browser.',
    'Мемы созданы.': 'Memes created.',
    'Извлеките основные цвета из JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG или BMP локально в браузере.': 'Extract dominant colors from JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG or BMP files locally in your browser.',
    'Не удалось скопировать цвет.': 'Could not copy the color.',
    'Анализ...': 'Analyzing...',
    'Нет непрозрачных пикселей': 'No opaque pixels found',
    'Палитра создана.': 'Palette created.',
    'Не удалось извлечь цвета из изображения.': 'Could not extract colors from the image.',
    'Соберите JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG и BMP в один PDF прямо в браузере без загрузки на сервер.': 'Combine JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG and BMP files into one PDF directly in your browser without uploading them to a server.',
    'Создаю PDF...': 'Creating PDF...',
    'PDF не создан': 'PDF was not created',
    'PDF создан.': 'PDF created.',
    'Не удалось добавить': 'Could not add',
    'Не удалось создать PDF.': 'Could not create the PDF.',
    'Пикселизируйте JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и анимированные GIF с настройкой размера пикселя.': 'Pixelate JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and animated GIF files with an adjustable pixel size.',
    'Пикселизация завершена.': 'Pixelation complete.',
    'Изменяйте размер JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и анимированных GIF без загрузки файлов на сервер.': 'Resize JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and animated GIF files without uploading them to a server.',
    'Размер изменён.': 'Resize complete.',
    'Повернуть и отразить – AKD Image': 'Rotate and flip – AKD Image',
    'Поворачивайте и отражайте JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и анимированные GIF прямо в браузере.': 'Rotate and flip JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and animated GIF files directly in your browser.',
    'отражение Г': 'horizontal flip',
    'отражение В': 'vertical flip',
    'нет изменений': 'no changes',
    'Выбрано:': 'Selected:',
    'Поворот завершён.': 'Rotation complete.',
    'Скругляйте углы JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и анимированных GIF прямо в браузере.': 'Round the corners of JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and animated GIF files directly in your browser.',
    'Скругление завершено.': 'Rounded corners applied.',
    'Разделяйте JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG и BMP на части или сетку и скачивайте результат ZIP-архивом.': 'Split JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG and BMP files into sections or a grid and download the result as a ZIP archive.',
    'Нарезка...': 'Splitting...',
    'Архивация...': 'Creating archive...',
    'ZIP-архив скачан.': 'ZIP archive downloaded.',
    'Не удалось разделить изображение.': 'Could not split the image.',
    'Конвертируйте MP4 и WebM в GIF либо преобразуйте GIF в MP4 или WebM локально в браузере без загрузки файлов на сервер.': 'Convert MP4 and WebM to GIF or turn GIF into MP4 or WebM locally in your browser without uploading files to a server.',
    'Добавляйте водяной знак на JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP и анимированные GIF с локальной обработкой.': 'Add a watermark to JPG, PNG, WebP, AVIF, HEIC/HEIF, SVG, BMP and animated GIF files with local processing.',
    'Используйте ссылку с HTTPS': 'Use an HTTPS link',
    'Ссылка не должна содержать логин или пароль': 'The link must not contain a username or password',
    'Не удалось сохранить список ссылок.': 'Could not save the link list.',
    'Список пуст': 'The list is empty',
    'Логотип загружен.': 'Logo loaded.',
    'Не удалось загрузить изображение по ссылке.': 'Could not load the image from the link.',
    'Введите корректную HTTPS-ссылку.': 'Enter a valid HTTPS link.',
    'Не удалось загрузить логотип.': 'Could not load the logo.',
    'Загрузите логотип для водяного знака.': 'Add a logo for the watermark.',
    'Водяной знак добавлен.': 'Watermark applied.',
    'Анимированный GIF сохраняется только как GIF': 'Animated GIF can only be saved as GIF',
    'Не удалось показать предпросмотр.': 'Could not show the preview.',
    'Не удалось обновить предпросмотр.': 'Could not update the preview.',
    'Некорректный файл': 'Invalid file',
    'Изображение не содержит корректных размеров': 'The image does not have valid dimensions',
    'Разрешение изображения превышает лимит 40 мегапикселей': 'Image resolution exceeds the 40 megapixel limit',
    'Не удалось сохранить избранное в браузере.': 'Could not save favorites in the browser.',
    'Не удалось загрузить список инструментов. Обновите страницу и попробуйте снова.': 'Could not load the tool list. Refresh the page and try again.',
    'Извлечение...': 'Extracting...',
    'Чтение GIF...': 'Reading GIF...',
    'Создание кадров...': 'Creating frames...',
    'Кадры готовы.': 'Frames are ready.',
    'Все кадры GIF извлечены.': 'All GIF frames extracted.',
    'Не удалось извлечь кадры GIF.': 'Could not extract GIF frames.',
    'ZIP с кадрами скачан.': 'Frame ZIP downloaded.',
    'Не удалось подготовить изображение для обработки.': 'Could not prepare the image for processing.',
    'Не удалось открыть SVG-изображение.': 'Could not open the SVG image.',
    'SVG содержит некорректную разметку.': 'The SVG contains invalid markup.',
    'Для выбранного формата не найден кодек.': 'No codec is available for the selected format.',
    'Изображение содержит некорректные размеры': 'The image has invalid dimensions',
    'Canvas недоступен': 'Canvas is unavailable',
    'Браузер не поддерживает выбранный формат': 'The browser does not support the selected format',
    'Файл не выбран': 'No file selected',
    'Выберите видео MP4 или WebM': 'Choose an MP4 or WebM video',
    'Выберите GIF-анимацию': 'Choose a GIF animation',
    'Не удалось прочитать параметры видео': 'Could not read the video properties',
    'Браузер не смог открыть это видео': 'The browser could not open this video',
    'Не удалось определить длительность файла': 'Could not determine the file duration',
    'Длительность файла не должна превышать 60 секунд': 'File duration must not exceed 60 seconds',
    'Не удалось открыть файл': 'Could not open the file',
    'Не удалось загрузить модуль FFmpeg': 'Could not load the FFmpeg module',
    'Конвертация файла...': 'Converting file...',
    'Загрузка локального модуля FFmpeg...': 'Loading the local FFmpeg module...',
    'Подготовка файла...': 'Preparing file...',
    'Проверьте начало и конец фрагмента': 'Check the segment start and end times',
    'FFmpeg не смог преобразовать этот файл': 'FFmpeg could not convert this file',
    'Подготовка результата...': 'Preparing result...',
    'Конвертация завершена': 'Conversion complete',
    'Не удалось преобразовать файл': 'Could not convert the file'
  };

  const PATTERNS = [
    [/^По запросу «(.+)» инструменты не найдены\.$/, 'No tools found for “$1”.'],
    [/^В категории «(.+)» пока нет избранных инструментов\.$/, (match, category) => {
      const categories = {
        'Оптимизация': 'Optimization',
        'Геометрия': 'Geometry',
        'Творчество': 'Creative'
      };
      return `There are no favorite tools in the “${categories[category] || category}” category yet.`;
    }],
    [/^Предпросмотр: (.+)$/, (match, details) => {
      const translatedDetails = details
        .replace(' · показан первый кадр', ' · first frame shown')
        .replace(' · оставлен оригинал: новая версия тяжелее', ' · original kept: the new version is larger');
      return `Preview: ${translatedDetails}`;
    }],
    [/^(\d+) файл$/, '$1 file'],
    [/^(\d+) файла$/, '$1 files'],
    [/^(\d+) файлов$/, '$1 files'],
    [/^(\d+) кадр$/, '$1 frame'],
    [/^(\d+) кадра$/, '$1 frames'],
    [/^(\d+) кадров$/, '$1 frames'],
    [/^Кадр (\d+)$/, 'Frame $1'],
    [/^(\d+(?:[,.]\d+)?) с$/, '$1 s'],
    [/^(\d+(?:[,.]\d+)?) символ(?:а|ов)?$/, '$1 characters'],
    [/^Выбрано инструментов: (\d+)$/, '$1 tools selected'],
    [/^Цвет: (#[0-9A-Fa-f]{6})$/, 'Color: $1'],
    [/^Насыщенность (\d+)%, яркость (\d+)%$/, 'Saturation $1%, brightness $2%'],
    [/^Размер ZIP превышает лимит (.+)$/, 'ZIP size exceeds the $1 limit'],
    [/^Файл превышает лимит (.+)$/, 'File exceeds the $1 limit'],
    [/^Результат GIF превышает (.+)$/, 'GIF output exceeds $1'],
    [/^GIF содержит больше (\d+) кадров$/, 'GIF contains more than $1 frames'],
    [/^Сторона (?:изображения|GIF) не должна превышать (\d+) px\.?$/, 'Image dimensions must not exceed $1 px'],
    [/^Можно выбрать не более (\d+) файлов за один раз\.$/, 'You can select no more than $1 files at a time.'],
    [/^Общий размер файлов не должен превышать (.+)\.$/, 'The total file size must not exceed $1.'],
    [/^Обработка (\d+)%$/, 'Processing $1%'],
    [/^(\d+) кадров · ([A-Z]+) · (.+)$/, '$1 frames · $2 · $3']
  ];

  const originalText = new WeakMap();
  const renderedText = new WeakMap();
  const originalAttributes = new WeakMap();
  const renderedAttributes = new WeakMap();
  let observer = null;
  let language = detectLanguage();

  function storedLanguage() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'en' || value === 'ru' ? value : null;
    } catch {
      return null;
    }
  }

  function browserLanguage() {
    const locale = navigator.languages?.[0] || navigator.language || 'en';
    return String(locale).toLowerCase().split('-')[0];
  }

  function detectLanguage() {
    const stored = storedLanguage();
    if (stored) return stored;
    return CIS_LANGUAGES.has(browserLanguage()) ? 'ru' : 'en';
  }

  function translateNormalized(value) {
    if (language === 'ru' || !value) return value;
    if (ENGLISH[value]) return ENGLISH[value];
    for (const [pattern, replacement] of PATTERNS) {
      if (pattern.test(value)) return value.replace(pattern, replacement);
    }
    return value;
  }

  function translateValue(value) {
    if (typeof value !== 'string' || !value.trim()) return value;
    const leading = value.match(/^\s*/)?.[0] || '';
    const trailing = value.match(/\s*$/)?.[0] || '';
    const normalized = value.trim().replace(/\s+/g, ' ');
    return `${leading}${translateNormalized(normalized)}${trailing}`;
  }

  function localizeTextNode(node) {
    const current = node.nodeValue || '';
    const previousRendered = renderedText.get(node);
    if (!originalText.has(node) || (previousRendered !== undefined && current !== previousRendered)) {
      originalText.set(node, current);
    }
    const next = language === 'en' ? translateValue(originalText.get(node)) : originalText.get(node);
    renderedText.set(node, next);
    if (current !== next) node.nodeValue = next;
  }

  function localizeAttributes(element) {
    const attributes = ['aria-label', 'title', 'placeholder', 'alt'];
    if (element.tagName === 'META') attributes.push('content');
    let originals = originalAttributes.get(element);
    let rendered = renderedAttributes.get(element);
    if (!originals) {
      originals = {};
      rendered = {};
      originalAttributes.set(element, originals);
      renderedAttributes.set(element, rendered);
    }

    attributes.forEach(name => {
      if (!element.hasAttribute(name)) return;
      const current = element.getAttribute(name) || '';
      if (!(name in originals) || (name in rendered && current !== rendered[name])) originals[name] = current;
      const next = language === 'en' ? translateValue(originals[name]) : originals[name];
      rendered[name] = next;
      if (current !== next) element.setAttribute(name, next);
    });
  }

  function localizeTree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      localizeTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) localizeAttributes(root);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) localizeTextNode(node);
      else localizeAttributes(node);
      node = walker.nextNode();
    }
  }

  function updateDocumentLanguage() {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
  }

  function applyLanguage() {
    updateDocumentLanguage();
    localizeTree(document.head);
    localizeTree(document.body);
    document.querySelectorAll('.language-option[data-language]').forEach(button => {
      const active = button.dataset.language === language;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
    });
    window.dispatchEvent(new CustomEvent('akd-languagechange', { detail: { language } }));
  }

  function setLanguage(nextLanguage, persist = true) {
    if (nextLanguage !== 'en' && nextLanguage !== 'ru') return;
    language = nextLanguage;
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, language);
      } catch {
        /* The current page still changes language when storage is unavailable. */
      }
    }
    applyLanguage();
  }

  function startObserver() {
    observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'characterData') localizeTextNode(mutation.target);
        if (mutation.type === 'attributes') localizeAttributes(mutation.target);
        mutation.addedNodes.forEach(localizeTree);
      });
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-label', 'title', 'placeholder', 'alt', 'content']
    });
  }

  window.AKDI18n = {
    get language() { return language; },
    setLanguage,
    t(value) { return language === 'en' ? translateValue(value) : value; }
  };

  updateDocumentLanguage();
  document.documentElement.classList.add('i18n-pending');

  document.addEventListener('DOMContentLoaded', () => {
    applyLanguage();
    startObserver();
    requestAnimationFrame(() => {
      applyLanguage();
      document.documentElement.classList.remove('i18n-pending');
    });
  });
})();
