/* ═══════════════════════════════════════════════════════════════════
   Kairozun Photo Editor — Standalone Window Logic
   ═══════════════════════════════════════════════════════════════════ */

// ── i18n ──────────────────────────────────────────────────────────
const i18n = {
  en: {
    editorTitle: 'Photo Editor',
    editorFilter: 'Filter',
    filterNone: 'None', filterBW: 'B&W', filterSepia: 'Sepia', filterWarm: 'Warm',
    filterCool: 'Cool', filterContrast: 'Contrast', filterBright: 'Bright',
    filterVintage: 'Vintage', filterVivid: 'Vivid', filterDim: 'Dim',
    filterInvert: 'Invert', filterBlur: 'Blur', filterSharp: 'Sharp',
    filterEmerald: 'Emerald', filterRose: 'Rose', filterSunset: 'Sunset',
    filterCyber: 'Cyber', filterNoir: 'Noir', filterFaded: 'Faded', filterDrama: 'Drama',
    filterMinimal: 'Minimal', filterArctic: 'Arctic', filterGolden: 'Golden', filterNeon: 'Neon',
    filterFilm: 'Film', filterPastel: 'Pastel', filterChrome: 'Chrome', filterHaze: 'Haze',
    filterMidnight: 'Midnight', filterLomo: 'Lomo',
    filterClarendon: 'Clarendon', filterMayfair: 'Mayfair', filterValencia: 'Valencia',
    filterNashville: 'Nashville', filterToaster: 'Toaster', filterWalden: 'Walden',
    filterHudson: 'Hudson', filterAmaro: 'Amaro', filterRise: 'Rise', filterXpro: 'X-Pro',
    filterSierra: 'Sierra', filterLowfi: 'Lo-Fi', filterEarlybird: 'Earlybird',
    filterBrannan: 'Brannan', filterInkwell: 'Inkwell', filterReyes: 'Reyes',
    filterStinson: 'Stinson', filterAden: 'Aden', filterPerpetuа: 'Perpetua',
    filterSlumber: 'Slumber', filterCrema: 'Crema', filterLudwig: 'Ludwig',
    filterJuno: 'Juno', filterGingham: 'Gingham', filterLark: 'Lark',
    filterMoon: 'Moon', filterKelvin: 'Kelvin', filterDogpatch: 'Dogpatch',
    filterGinza: 'Ginza', filterHelena: 'Helena', filterMaven: 'Maven',
    filterSkyline: 'Skyline', filterAshby: 'Ashby', filterCharmes: 'Charmes',
    filterCrescent: 'Crescent', filterHenry: 'Henry', filterBrooklyn: 'Brooklyn',
    filterSutro: 'Sutro', filterNormat: 'Normat', filterVesper: 'Vesper',
    filterMelody: 'Melody', filterPoprocket: 'Pop Rocket', filterWillow: 'Willow',
    filterSunshine: 'Sunshine', filterVelvet: 'Velvet',
    filterPolaroid: 'Polaroid', filterRedtone: 'Red Tone', filterBluetone: 'Blue Tone',
    filterGreentone: 'Green Tone', filterAmber: 'Amber', filterFrost: 'Frost',
    filterLavender: 'Lavender', filterCoral: 'Coral', filterOcean: 'Ocean',
    filterDesert: 'Desert', filterForest: 'Forest', filterCandy: 'Candy',
    filterSteel: 'Steel', filterCoffee: 'Coffee', filterElectric: 'Electric',
    filterMist: 'Mist', filterRuby: 'Ruby', filterSapphire: 'Sapphire',
    filterToxic: 'Toxic', filterShadow: 'Shadow',
    editorWatermark: 'Watermark',
    watermarkPlaceholder: 'Watermark text... (Enter to place)',
    watermarkHint: 'Enter to place text. Drag watermarks. Double-click to remove.',
    editorEmoji: 'Stickers',
    editorColor: 'Color',
    editorFont: 'Font',
    gameIconSticker: 'Game Icon',
    addGameIcon: '+ Game Icon',
    editorSave: 'Save',
    editorReset: 'Reset',
    editorDelete: 'Delete',
    helpTitle: 'How to Use',
    helpIntro: 'Welcome to the Kairozun Photo Editor!',
    helpFilter: '🎨 Filter — open the left panel to choose a filter for your photo',
    helpText: '✏️ Text — type in the watermark field, press Enter to place it, then type again for more',
    helpEmoji: '😀 Stickers — click an emoji to add it to text, or drag it onto the photo',
    helpColor: '🎨 Color — pick a color for your text watermark',
    helpFont: '🔤 Font — choose a font for your text',
    helpSize: '📏 Size — use +/− buttons to change text size',
    helpDrag: '✋ Drag — drag any watermark to reposition it on the photo',
    helpRemove: '❌ Remove — double-click any watermark to delete it',
    helpSave: '💾 Save — exports the edited photo to your PC',
    helpReset: '↺ Reset — clears all edits and starts over',
    editorCrop: 'Crop',
    helpCrop: '✂️ Crop — select an area to crop the photo',
    editorBlur: 'Blur',
    helpBlur: '💧 Blur — drag over an area to blur/hide sensitive information',
    editorImport: 'Import',
    importFromFile: 'From Computer',
    importFromGallery: 'From Gallery',
  },
  ru: {
    editorTitle: 'Редактор фото',
    editorFilter: 'Фильтр',
    filterNone: 'Без', filterBW: 'Ч/Б', filterSepia: 'Сепия', filterWarm: 'Тёплый',
    filterCool: 'Холодный', filterContrast: 'Контраст', filterBright: 'Яркий',
    filterVintage: 'Винтаж', filterVivid: 'Насыщ.', filterDim: 'Тусклый',
    filterInvert: 'Инверт', filterBlur: 'Размытие', filterSharp: 'Чёткий',
    filterEmerald: 'Изумруд', filterRose: 'Роза', filterSunset: 'Закат',
    filterCyber: 'Кибер', filterNoir: 'Нуар', filterFaded: 'Бледный', filterDrama: 'Драма',
    filterMinimal: 'Минимал', filterArctic: 'Арктика', filterGolden: 'Золотой', filterNeon: 'Неон',
    filterFilm: 'Плёнка', filterPastel: 'Пастель', filterChrome: 'Хром', filterHaze: 'Дымка',
    filterMidnight: 'Полночь', filterLomo: 'Ломо',
    filterClarendon: 'Кларендон', filterMayfair: 'Мейфэр', filterValencia: 'Валенсия',
    filterNashville: 'Нэшвилл', filterToaster: 'Тостер', filterWalden: 'Уолден',
    filterHudson: 'Хадсон', filterAmaro: 'Амаро', filterRise: 'Рассвет', filterXpro: 'Кс-Про',
    filterSierra: 'Сиерра', filterLowfi: 'Ло-Фай', filterEarlybird: 'Рань',
    filterBrannan: 'Бреннан', filterInkwell: 'Тушь', filterReyes: 'Рейес',
    filterStinson: 'Стинсон', filterAden: 'Аден', filterPerpetuа: 'Перпетуа',
    filterSlumber: 'Сон', filterCrema: 'Крема', filterLudwig: 'Людвиг',
    filterJuno: 'Юнона', filterGingham: 'Гингем', filterLark: 'Жаворонок',
    filterMoon: 'Луна', filterKelvin: 'Кельвин', filterDogpatch: 'Догпатч',
    filterGinza: 'Гинза', filterHelena: 'Хелена', filterMaven: 'Мэйвен',
    filterSkyline: 'Горизонт', filterAshby: 'Эшби', filterCharmes: 'Шарм',
    filterCrescent: 'Полумесяц', filterHenry: 'Генри', filterBrooklyn: 'Бруклин',
    filterSutro: 'Сутро', filterNormat: 'Нормат', filterVesper: 'Веспер',
    filterMelody: 'Мелодия', filterPoprocket: 'Поп-рокет', filterWillow: 'Ива',
    filterSunshine: 'Солнце', filterVelvet: 'Бархат',
    filterPolaroid: 'Полароид', filterRedtone: 'Красный', filterBluetone: 'Синий',
    filterGreentone: 'Зелёный', filterAmber: 'Янтарь', filterFrost: 'Мороз',
    filterLavender: 'Лаванда', filterCoral: 'Коралл', filterOcean: 'Океан',
    filterDesert: 'Пустыня', filterForest: 'Лес', filterCandy: 'Конфета',
    filterSteel: 'Сталь', filterCoffee: 'Кофе', filterElectric: 'Электро',
    filterMist: 'Туман', filterRuby: 'Рубин', filterSapphire: 'Сапфир',
    filterToxic: 'Токсик', filterShadow: 'Тень',
    editorWatermark: 'Водяной знак',
    watermarkPlaceholder: 'Текст... (Enter — поставить)',
    watermarkHint: 'Enter — поставить текст. Перетаскивайте. Двойной клик — удалить.',
    editorEmoji: 'Стикеры',
    editorColor: 'Цвет',
    editorFont: 'Шрифт',
    gameIconSticker: 'Иконка игры',
    addGameIcon: '+ Добавить',
    editorSave: 'Сохранить',
    editorReset: 'Сбросить',
    editorDelete: 'Удалить',
    helpTitle: 'Как пользоваться',
    helpIntro: 'Добро пожаловать в редактор фото Kairozun!',
    helpFilter: '🎨 Фильтр — откройте левую панель чтобы выбрать фильтр для фото',
    helpText: '✏️ Текст — введите текст, нажмите Enter чтобы поставить, затем печатайте ещё',
    helpEmoji: '😀 Стикеры — кликните на эмодзи чтобы добавить в текст, или перетащите на фото',
    helpColor: '🎨 Цвет — выберите цвет для текстового знака',
    helpFont: '🔤 Шрифт — выберите шрифт для текста',
    helpSize: '📏 Размер — кнопки +/− меняют размер текста',
    helpDrag: '✋ Перемещение — перетаскивайте любой знак по фото',
    helpRemove: '❌ Удаление — двойной клик по знаку удаляет его',
    helpSave: '💾 Сохранить — экспортирует отредактированное фото на ПК',
    helpReset: '↺ Сбросить — очищает все правки и начинает заново',
    editorCrop: 'Обрезка',
    helpCrop: '✂️ Обрезка — выберите область для обрезки фото',
    editorBlur: 'Размытие',
    helpBlur: '💧 Размытие — проведите по области чтобы скрыть информацию',
    editorImport: 'Импорт',
    importFromFile: 'С компьютера',
    importFromGallery: 'Из галереи',
  },
};

let currentLang = 'en';

function applyLang(lang) {
  currentLang = lang;
  const t = i18n[lang] || i18n.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });
}

// ── Init data from IPC ────────────────────────────────────────────
const initData = window.kairozun.getEditorInit();
const filePath = initData.filePath;
const fileName = initData.fileName;
const gameIconUrl = initData.gameIcon || null;
const gameName = initData.gameName || null;
currentLang = initData.lang || 'en';
applyLang(currentLang);

// Show game info in titlebar and sticker panel
if (gameIconUrl) {
  // Titlebar game info
  const titlebarInfo = document.getElementById('titlebar-game-info');
  const titlebarIcon = document.getElementById('titlebar-game-icon');
  const titlebarName = document.getElementById('titlebar-game-name');
  titlebarIcon.src = gameIconUrl;
  titlebarIcon.onload = () => {
    if (gameName) titlebarName.textContent = gameName;
    titlebarInfo.classList.remove('hidden');
  };

  // Game sticker options at top of emoji panel
  const stickerOpts = document.getElementById('game-sticker-options');
  const stickerIconImg = document.getElementById('game-sticker-icon-img');
  const stickerComboImg = document.getElementById('game-sticker-combo-img');
  const stickerComboName = document.getElementById('game-sticker-combo-name');
  stickerIconImg.src = gameIconUrl;
  stickerComboImg.src = gameIconUrl;
  if (gameName) stickerComboName.textContent = gameName;
  stickerOpts.classList.remove('hidden');

  // Helper: setup click + drag for a game sticker button
  function setupGameStickerDrag(btnId, wmData) {
    const btn = document.getElementById(btnId);
    btn.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const ghost = document.createElement('div');
      ghost.className = 'emoji-drag-ghost';
      const ghostImg = document.createElement('img');
      ghostImg.src = gameIconUrl;
      ghostImg.width = 32;
      ghostImg.height = 32;
      ghostImg.style.borderRadius = '6px';
      ghost.appendChild(ghostImg);
      ghost.style.left = e.clientX - 16 + 'px';
      ghost.style.top = e.clientY - 16 + 'px';
      document.body.appendChild(ghost);
      let isDragging = false;

      const onMove = (ev) => {
        isDragging = true;
        ghost.style.left = ev.clientX - 16 + 'px';
        ghost.style.top = ev.clientY - 16 + 'px';
      };

      const onUp = (ev) => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        ghost.remove();
        if (!isDragging) {
          // Was a click, not drag — place at random position
          const wm = Object.assign({ id: nextId++, x: 10 + Math.random() * 30, y: 10 + Math.random() * 30 }, wmData);
          watermarks.push(wm);
          createWmEl(wm);
          return;
        }
        // Check if dropped on canvas area
        const canvasWrap = document.getElementById('editor-canvas-wrap');
        const rect = canvasWrap.getBoundingClientRect();
        if (ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
          const dlRect = dragLayer.getBoundingClientRect();
          const x = ((ev.clientX - dlRect.left) / dlRect.width) * 100;
          const y = ((ev.clientY - dlRect.top) / dlRect.height) * 100;
          const wm = Object.assign({ id: nextId++, x, y }, wmData);
          watermarks.push(wm);
          createWmEl(wm);
        }
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  setupGameStickerDrag('game-sticker-icon', { type: 'gameicon', text: '', size: 48, iconUrl: gameIconUrl });
  setupGameStickerDrag('game-sticker-combo', { type: 'gameicon', text: '', size: 48, iconUrl: gameIconUrl, gameName: gameName || '' });
}

// ── DOM elements ──────────────────────────────────────────────────
const editorCanvas = document.getElementById('editor-canvas');
const editorCtx = editorCanvas.getContext('2d');
const dragLayer = document.getElementById('watermark-drag-layer');
const wmInput = document.getElementById('watermark-input');
const sizeValue = document.getElementById('size-value');

// Panels
const filterPanel = document.getElementById('filter-panel');
const filterPanelList = document.getElementById('filter-panel-list');
const rightPanel = document.getElementById('right-panel');
const rightPanelTitle = document.getElementById('right-panel-title');
const sectionEmoji = document.getElementById('section-emoji');
const sectionColor = document.getElementById('section-color');
const sectionFont = document.getElementById('section-font');

// Toolbar buttons
const filterToggle = document.getElementById('filter-toggle');
const emojiToggle = document.getElementById('emoji-toggle');
const colorToggle = document.getElementById('color-toggle');
const fontToggle = document.getElementById('font-toggle');
const filterActiveName = document.getElementById('filter-active-name');
const fontActiveName = document.getElementById('font-active-name');
const colorPreview = document.getElementById('color-preview');
const emojiToggleIcon = document.getElementById('emoji-toggle-icon');

let origImage = null;
let currentFilter = 'none';
let watermarks = [];
let nextId = 0;
let currentColor = '#ffffff';
let currentSize = 24;
let currentFont = 'Segoe UI';
let selectedWm = null; // currently selected watermark for resizing
let cropMode = false;
let cropRect = null; // {x, y, w, h} in original image pixels
let blurMode = false;
let blurRegions = []; // {x, y, w, h} in % of display canvas

// ── Filters (55 filters) ─────────────────────────────────────────
const FILTERS = {
  none: '',
  grayscale: 'grayscale(100%)',
  sepia: 'sepia(80%)',
  warm: 'saturate(130%) hue-rotate(-10deg) brightness(105%)',
  cool: 'saturate(110%) hue-rotate(15deg) brightness(98%)',
  contrast: 'contrast(130%) saturate(110%)',
  bright: 'brightness(125%) contrast(105%)',
  vintage: 'sepia(40%) contrast(90%) brightness(95%) saturate(85%)',
  saturate: 'saturate(180%) contrast(105%)',
  dim: 'brightness(70%) contrast(110%)',
  invert: 'invert(100%)',
  blur: 'blur(2px)',
  sharpen: 'contrast(150%) brightness(105%)',
  emerald: 'hue-rotate(100deg) saturate(140%) brightness(105%)',
  rose: 'hue-rotate(-40deg) saturate(130%) brightness(105%)',
  sunset: 'sepia(30%) saturate(180%) hue-rotate(-15deg) brightness(110%)',
  cyber: 'hue-rotate(180deg) saturate(200%) contrast(120%)',
  noir: 'grayscale(100%) contrast(140%) brightness(85%)',
  faded: 'saturate(50%) brightness(110%) contrast(85%)',
  dramatic: 'contrast(160%) saturate(130%) brightness(90%)',
  minimal: 'saturate(70%) brightness(108%) contrast(95%)',
  arctic: 'saturate(80%) hue-rotate(180deg) brightness(115%) contrast(90%)',
  golden: 'sepia(25%) saturate(160%) brightness(110%) hue-rotate(-5deg)',
  neon: 'saturate(250%) contrast(130%) brightness(110%)',
  film: 'sepia(15%) contrast(115%) brightness(95%) saturate(90%)',
  pastel: 'saturate(60%) brightness(120%) contrast(80%)',
  chrome: 'saturate(0%) contrast(140%) brightness(120%)',
  haze: 'brightness(115%) contrast(85%) saturate(75%)',
  midnight: 'brightness(60%) contrast(130%) saturate(120%) hue-rotate(200deg)',
  lomo: 'contrast(150%) saturate(130%) brightness(90%) sepia(10%)',
  clarendon: 'contrast(120%) saturate(130%) brightness(108%)',
  mayfair: 'contrast(110%) saturate(110%) brightness(105%) sepia(8%)',
  valencia: 'sepia(16%) saturate(140%) contrast(108%) brightness(105%)',
  nashville: 'sepia(22%) contrast(120%) brightness(108%) saturate(125%) hue-rotate(-5deg)',
  toaster: 'sepia(20%) contrast(140%) brightness(90%) saturate(150%)',
  walden: 'brightness(110%) saturate(130%) hue-rotate(10deg) sepia(10%)',
  hudson: 'brightness(115%) contrast(95%) saturate(130%) hue-rotate(5deg)',
  amaro: 'brightness(112%) contrast(95%) saturate(140%) hue-rotate(-2deg)',
  rise: 'brightness(110%) contrast(95%) saturate(105%) sepia(12%)',
  xpro: 'contrast(140%) saturate(160%) brightness(95%) hue-rotate(-5deg)',
  sierra: 'contrast(115%) saturate(90%) brightness(95%) sepia(18%)',
  lowfi: 'contrast(145%) saturate(140%) brightness(95%)',
  earlybird: 'sepia(25%) contrast(115%) brightness(100%) saturate(120%)',
  brannan: 'sepia(35%) contrast(130%) brightness(105%) saturate(80%)',
  inkwell: 'grayscale(100%) contrast(115%) brightness(105%)',
  reyes: 'brightness(115%) contrast(85%) saturate(85%) sepia(12%)',
  stinson: 'brightness(108%) contrast(88%) saturate(90%) sepia(5%)',
  aden: 'brightness(112%) contrast(90%) saturate(80%) hue-rotate(15deg)',
  perpetua: 'brightness(108%) contrast(95%) saturate(110%) hue-rotate(5deg)',
  slumber: 'brightness(90%) contrast(100%) saturate(80%) sepia(20%)',
  crema: 'brightness(105%) contrast(95%) saturate(90%) sepia(8%)',
  ludwig: 'contrast(105%) saturate(110%) brightness(105%)',
  juno: 'contrast(115%) saturate(150%) brightness(105%) hue-rotate(-3deg)',
  gingham: 'brightness(108%) contrast(95%) saturate(80%) hue-rotate(5deg)',
  lark: 'brightness(110%) contrast(95%) saturate(95%)',
  moon: 'grayscale(100%) brightness(110%) contrast(105%)',
  kelvin: 'sepia(15%) saturate(200%) brightness(110%) contrast(110%)',
  dogpatch: 'contrast(120%) saturate(90%) brightness(95%)',
  ginza: 'brightness(108%) contrast(105%) saturate(80%) sepia(10%)',
  helena: 'contrast(110%) saturate(120%) brightness(105%) hue-rotate(10deg)',
  maven: 'contrast(125%) saturate(85%) brightness(92%) sepia(15%)',
  skyline: 'brightness(115%) contrast(95%) saturate(110%) hue-rotate(8deg)',
  ashby: 'brightness(105%) contrast(88%) saturate(75%) sepia(20%)',
  charmes: 'contrast(108%) saturate(130%) brightness(105%) hue-rotate(-8deg)',
  crescent: 'brightness(92%) contrast(115%) saturate(100%) hue-rotate(15deg)',
  henry: 'contrast(120%) saturate(70%) brightness(98%) sepia(25%)',
  brooklyn: 'contrast(105%) saturate(85%) brightness(110%) sepia(12%)',
  sutro: 'brightness(85%) contrast(130%) saturate(110%) sepia(18%)',
  normat: 'contrast(100%) saturate(100%) brightness(100%)',
  vesper: 'brightness(95%) contrast(115%) saturate(90%) hue-rotate(-15deg)',
  melody: 'brightness(112%) contrast(98%) saturate(130%) hue-rotate(5deg)',
  poprocket: 'contrast(140%) saturate(180%) brightness(100%) hue-rotate(-10deg)',
  willow: 'grayscale(60%) contrast(95%) brightness(105%)',
  sunshine: 'brightness(120%) saturate(140%) hue-rotate(-8deg) contrast(105%)',
  velvet: 'brightness(90%) contrast(110%) saturate(85%) hue-rotate(20deg) sepia(10%)',
  // New filters
  polaroid: 'brightness(108%) contrast(95%) saturate(85%) sepia(18%)',
  redtone: 'sepia(60%) saturate(200%) hue-rotate(-30deg) brightness(95%)',
  bluetone: 'sepia(60%) saturate(200%) hue-rotate(180deg) brightness(100%)',
  greentone: 'sepia(60%) saturate(200%) hue-rotate(80deg) brightness(100%)',
  amber: 'sepia(35%) saturate(150%) brightness(110%) hue-rotate(-10deg) contrast(105%)',
  frost: 'brightness(115%) contrast(90%) saturate(70%) hue-rotate(190deg)',
  lavender: 'brightness(108%) contrast(95%) saturate(90%) hue-rotate(260deg)',
  coral: 'brightness(105%) contrast(110%) saturate(140%) hue-rotate(-20deg)',
  ocean: 'brightness(95%) contrast(110%) saturate(130%) hue-rotate(170deg)',
  desert: 'sepia(40%) saturate(130%) brightness(105%) contrast(110%)',
  forest: 'brightness(92%) contrast(115%) saturate(120%) hue-rotate(80deg)',
  candy: 'brightness(112%) contrast(90%) saturate(170%) hue-rotate(300deg)',
  steel: 'saturate(20%) contrast(120%) brightness(105%)',
  coffee: 'sepia(50%) saturate(100%) brightness(90%) contrast(115%)',
  electric: 'saturate(220%) contrast(140%) brightness(105%) hue-rotate(40deg)',
  mist: 'brightness(118%) contrast(80%) saturate(65%)',
  ruby: 'contrast(120%) saturate(160%) hue-rotate(-15deg) brightness(95%)',
  sapphire: 'contrast(115%) saturate(140%) hue-rotate(200deg) brightness(95%)',
  toxic: 'saturate(200%) hue-rotate(60deg) contrast(130%) brightness(100%)',
  shadow: 'brightness(70%) contrast(140%) saturate(90%)',
};

// Filter i18n keys mapping
const FILTER_I18N = {
  none: 'filterNone', grayscale: 'filterBW', sepia: 'filterSepia', warm: 'filterWarm',
  cool: 'filterCool', contrast: 'filterContrast', bright: 'filterBright',
  vintage: 'filterVintage', saturate: 'filterVivid', dim: 'filterDim',
  invert: 'filterInvert', blur: 'filterBlur', sharpen: 'filterSharp',
  emerald: 'filterEmerald', rose: 'filterRose', sunset: 'filterSunset',
  cyber: 'filterCyber', noir: 'filterNoir', faded: 'filterFaded', dramatic: 'filterDrama',
  minimal: 'filterMinimal', arctic: 'filterArctic', golden: 'filterGolden', neon: 'filterNeon',
  film: 'filterFilm', pastel: 'filterPastel', chrome: 'filterChrome', haze: 'filterHaze',
  midnight: 'filterMidnight', lomo: 'filterLomo',
  clarendon: 'filterClarendon', mayfair: 'filterMayfair', valencia: 'filterValencia',
  nashville: 'filterNashville', toaster: 'filterToaster', walden: 'filterWalden',
  hudson: 'filterHudson', amaro: 'filterAmaro', rise: 'filterRise', xpro: 'filterXpro',
  sierra: 'filterSierra', lowfi: 'filterLowfi', earlybird: 'filterEarlybird',
  brannan: 'filterBrannan', inkwell: 'filterInkwell', reyes: 'filterReyes',
  stinson: 'filterStinson', aden: 'filterAden', perpetua: 'filterPerpetuа',
  slumber: 'filterSlumber', crema: 'filterCrema', ludwig: 'filterLudwig',
  juno: 'filterJuno', gingham: 'filterGingham', lark: 'filterLark',
  moon: 'filterMoon', kelvin: 'filterKelvin', dogpatch: 'filterDogpatch',
  ginza: 'filterGinza', helena: 'filterHelena', maven: 'filterMaven',
  skyline: 'filterSkyline', ashby: 'filterAshby', charmes: 'filterCharmes',
  crescent: 'filterCrescent', henry: 'filterHenry', brooklyn: 'filterBrooklyn',
  sutro: 'filterSutro', normat: 'filterNormat', vesper: 'filterVesper',
  melody: 'filterMelody', poprocket: 'filterPoprocket', willow: 'filterWillow',
  sunshine: 'filterSunshine', velvet: 'filterVelvet',
  polaroid: 'filterPolaroid', redtone: 'filterRedtone', bluetone: 'filterBluetone',
  greentone: 'filterGreentone', amber: 'filterAmber', frost: 'filterFrost',
  lavender: 'filterLavender', coral: 'filterCoral', ocean: 'filterOcean',
  desert: 'filterDesert', forest: 'filterForest', candy: 'filterCandy',
  steel: 'filterSteel', coffee: 'filterCoffee', electric: 'filterElectric',
  mist: 'filterMist', ruby: 'filterRuby', sapphire: 'filterSapphire',
  toxic: 'filterToxic', shadow: 'filterShadow',
};

// Populate filter panel
const t = i18n[currentLang] || i18n.en;
for (const key of Object.keys(FILTERS)) {
  const btn = document.createElement('button');
  btn.className = 'filter-btn' + (key === 'none' ? ' active' : '');
  btn.dataset.filter = key;
  const i18nKey = FILTER_I18N[key];
  btn.textContent = (i18nKey && t[i18nKey]) || key;
  btn.addEventListener('click', () => {
    filterPanelList.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = key;
    filterActiveName.textContent = btn.textContent;
    drawCanvas();
  });
  filterPanelList.appendChild(btn);
}

// ── Color Palette (extended — 72 colors) ──────────────────────────
const COLOR_PALETTE = [
  // Whites → grays → blacks
  '#ffffff','#f5f5f5','#e0e0e0','#c0c0c0','#a0a0a0','#808080','#606060','#404040',
  '#303030','#202020','#101010','#000000',
  // Reds
  '#ff0000','#ee3333','#cc0000','#990000','#ff4444','#ff6666','#ff8888','#ffaaaa',
  // Oranges
  '#ff6600','#ff8800','#ffaa00','#cc6600',
  // Yellows
  '#ffcc00','#ffff00','#ffee44','#cccc00',
  // Greens
  '#00ff00','#33cc33','#66ff66','#009900','#99ff00','#00ff99','#228b22','#006400',
  // Cyans
  '#00ffff','#00cccc','#66ffff','#008b8b',
  // Blues
  '#0099ff','#0000ff','#3366ff','#000099','#6699ff','#3333cc','#87ceeb','#4169e1',
  // Purples
  '#9900ff','#7722cc','#cc66ff','#9933ff','#6600cc','#8b00ff',
  // Pinks / Magentas
  '#ff00ff','#ff0099','#ff66cc','#ff99cc','#cc0066','#ff1493',
  // Earth tones
  '#f5f5dc','#faebd7','#deb887','#d2b48c','#8b4513','#a0522d',
  // Pastels
  '#ffcccc','#ffe0cc','#ffffcc','#ccffcc','#ccffff','#cce0ff','#ccccff','#ffccff',
  '#e0ccff','#dda0dd','#ffc0cb','#b0e0e6',
];

const colorGrid = document.getElementById('color-grid');
for (const c of COLOR_PALETTE) {
  const el = document.createElement('div');
  el.className = 'color-swatch-opt' + (c === currentColor ? ' active' : '');
  el.style.background = c;
  el.dataset.color = c;
  el.addEventListener('click', () => pickColor(c));
  colorGrid.appendChild(el);
}

const colorHex = document.getElementById('color-hex-input');

function pickColor(c) {
  currentColor = c;
  colorPreview.style.background = c;
  colorHex.value = c.replace('#', '');
  colorGrid.querySelectorAll('.color-swatch-opt').forEach(el =>
    el.classList.toggle('active', el.dataset.color === c)
  );
  if (activeTextWm) { activeTextWm.color = c; updateWmEl(activeTextWm); }
}

colorHex.addEventListener('input', () => {
  const hex = colorHex.value.replace(/[^0-9a-fA-F]/g, '');
  if (hex.length === 6) pickColor('#' + hex);
});

// ── Font List ─────────────────────────────────────────────────────
const FONTS = [
  'Segoe UI', 'Arial', 'Arial Black', 'Georgia', 'Impact', 'Courier New',
  'Comic Sans MS', 'Trebuchet MS', 'Verdana', 'Times New Roman',
  'Lucida Console', 'Tahoma', 'Palatino Linotype', 'Candara', 'Consolas',
  'Cambria', 'Calibri', 'Century Gothic', 'Franklin Gothic Medium',
  'Garamond', 'Lucida Sans', 'Book Antiqua', 'Copperplate Gothic',
  'Rockwell', 'Segoe Print', 'Segoe Script', 'Bahnschrift',
  'Ink Free', 'Cascadia Code', 'MV Boli',
  'Sitka Text', 'Gabriola', 'Sylfaen', 'Myanmar Text',
  'Ebrima', 'Leelawadee UI', 'Nirmala UI', 'Microsoft Sans Serif',
  'Microsoft YaHei', 'Yu Gothic', 'Malgun Gothic', 'MS Gothic',
  'Segoe UI Black', 'Segoe UI Light', 'Segoe UI Semibold',
];

const fontList = document.getElementById('font-list');
for (const f of FONTS) {
  const btn = document.createElement('button');
  btn.className = 'font-option' + (f === currentFont ? ' active' : '');
  btn.textContent = f.replace(' MS', '').replace(' Medium', '').replace(' Linotype', '');
  btn.style.fontFamily = f + ', sans-serif';
  btn.dataset.font = f;
  btn.addEventListener('click', () => {
    currentFont = f;
    fontList.querySelectorAll('.font-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    fontActiveName.textContent = btn.textContent;
    if (activeTextWm) { activeTextWm.font = f; updateWmEl(activeTextWm); }
    // Apply font to selected game icon combo sticker name
    if (selectedWm && selectedWm.type === 'gameicon' && selectedWm.gameName) {
      selectedWm.font = f;
      updateWmEl(selectedWm);
    }
  });
  fontList.appendChild(btn);
}

// ── Emoji Grid ────────────────────────────────────────────────────
const STICKER_EMOJIS = [
  // Faces & emotions
  '😀','😂','😍','🥰','😎','🤩','🥳','😈','👻','💀',
  '😜','🤪','😇','🥺','😤','🤯','🥶','🥵','😱','🤠',
  '🤡','💩','😏','😬','�','😴','🥱','😵','🤫','🤭',
  '😶','🙄','😮','😲','😑','😷','🤒','🤕','🤢','🤮',
  '😠','😡','🤬','😳','😰','😥','😢','😭','😱','😨',
  '😓','🤗','🤔','😐','😑','😶','😣','😩','😫','🥴',
  // Hearts & symbols
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💯','💢',
  '💬','💥','⭐','✨','💫','🔥','⚡','💎','👑','🏆',
  '💝','💖','💗','💓','💞','💕','♥️','💘','💟','❣️',
  // Gaming & tech
  '🎮','🕹️','👾','🤖','👽','🎃','🎯','🎲','♟️','🧩',
  '🃏','🀄','🎰','💻','🖥️','📱','⌨️','🖱️','💾','📀',
  // Sports & trophies
  '🥇','🥈','🥉','🏅','🎖️','🏆','⚽','🏀','🏐','🎾',
  '🎳','🏓','🏒','🥊','🏄','🤺','🏇','⛷️','🏂','🥋',
  '⛳','🎣','🤿','🏋️','🤸','🤼','🤽','🤾','⛹️','🏊',
  // Animals
  '🐉','🦊','🦁','🐺','🦅','🐸','🐵','🐶','🐱','🐰',
  '🐻','🐼','🐨','🐯','🦄','🐝','🦋','🐢','🐟','🐬',
  '🦈','🐙','🦑','🦀','🐊','🦎','🐍','🦂','🕷️','🐾',
  '🦜','🦚','🦩','🐧','🦉','🦇','🐗','🦏','🐘','🦒',
  '🦘','🐪','🦙','🐐','🐏','🐄','🐖','🐓','🦃','🕊️',
  // Nature
  '🌸','🌺','🌻','🌹','🌷','🍀','🌲','🌴','🍁','🍂',
  '🌊','❄️','💧','☁️','⛈️','🌪️','🌏','🌕','🪐','🌈',
  '☀️','🌙','🌟','🍄','🌵','🌾','🌿','☘️','🌱','🌳',
  // Food & drink
  '🍕','🍔','🍩','🍭','🧁','☕','🥤','🍿','🎂','🍪',
  '🍦','🌮','🍣','🍱','🥐','🧀','🍫','🍬','🥧','🍰',
  '🍾','🥂','🍷','🍸','🧃','🥛','🍵','🍺','🍻','🥃',
  '🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍑',
  // Hands & gestures
  '👍','👎','✌️','🤟','🤘','✊','👊','🙌','💪','🤝',
  '👏','🤞','🤙','👋','🖐️','✋','🖖','👆','👇','👉',
  '👈','🤚','🖕','🤏','✍️','🙏','🤲','👐','🙌','💅',
  // Objects & tools
  '🎒','📷','📹','🔑','🧲','💡','🔔','📌','📎','✏️',
  '🖊️','📐','📏','🔒','🔓','🔨','⚙️','🔧','🧰','🔩',
  '🗡️','🛡️','🏹','🔮','🧸','🎸','🥁','🎻','🎺','🎷',
  '🎀','🎁','🎈','🎉','🎊','🎗️','🎫','🎟️','🎭','🎬',
  '💣','🧨','💊','💉','🩹','🩺','🔬','🔭','📡','🧬',
  // Transport & places
  '🚀','✈️','🚗','🏍️','🛸','🏠','🌍','🗺️','🧭','⛰️',
  '🏰','🗿','🗽','🎡','🎢','🎠','⛲','🌉','🏝️','🏔️',
  '🚁','🛥️','🚂','🛩️','🚲','🛴','🛹','⛵','🚤','🚢',
  '🚑','🚒','🚓','🚕','🚌','🚎','🏎️','🚜','🚛','🚐',
  // Music & entertainment
  '🎤','🎧','🎵','🎶','🎪','🎨','🎼','🎹','📻','📺',
  '📽️','🎞️','🎥','📸','🖼️','🎙️','📢','📣','🔊','🔉',
  // Flags & misc
  '🏳️‍🌈','🏴‍☠️','🚩','🏁','⚜️','☮️','☯️','✡️','⚛️','🔯',
  '🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔶',
  '🔷','🔸','🔹','▪️','▫️','◾','◽','🔲','🔳','💠',
  // Zodiac & symbols
  '♈','♉','♊','♋','♌','♍','♎','♏','♐','♑',
  '♒','♓','⚠️','🚫','⛔','🔞','❌','⭕','❗','❓',
];

const emojiGrid = document.getElementById('emoji-grid');
for (const emoji of STICKER_EMOJIS) {
  const btn = document.createElement('button');
  btn.className = 'emoji-btn';
  btn.textContent = emoji;
  // Click: insert into text input
  btn.addEventListener('click', () => {
    const start = wmInput.selectionStart;
    const end = wmInput.selectionEnd;
    const val = wmInput.value;
    wmInput.value = val.slice(0, start) + emoji + val.slice(end);
    wmInput.selectionStart = wmInput.selectionEnd = start + emoji.length;
    wmInput.focus();
    wmInput.dispatchEvent(new Event('input'));
  });
  // Drag: drag emoji onto photo
  btn.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const ghost = document.createElement('div');
    ghost.className = 'emoji-drag-ghost';
    ghost.textContent = emoji;
    ghost.style.left = e.clientX - 16 + 'px';
    ghost.style.top = e.clientY - 16 + 'px';
    document.body.appendChild(ghost);
    btn.classList.add('dragging');
    let isDragging = false;

    const onMove = (ev) => {
      isDragging = true;
      ghost.style.left = ev.clientX - 16 + 'px';
      ghost.style.top = ev.clientY - 16 + 'px';
    };

    const onUp = (ev) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      ghost.remove();
      btn.classList.remove('dragging');
      if (!isDragging) return; // was a click, not drag
      // Check if dropped on canvas area
      const canvasWrap = document.getElementById('editor-canvas-wrap');
      const rect = canvasWrap.getBoundingClientRect();
      if (ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
        const dlRect = dragLayer.getBoundingClientRect();
        const x = ((ev.clientX - dlRect.left) / dlRect.width) * 100;
        const y = ((ev.clientY - dlRect.top) / dlRect.height) * 100;
        const wm = { id: nextId++, type: 'emoji', text: emoji, x, y, size: currentSize };
        watermarks.push(wm);
        createWmEl(wm);
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  emojiGrid.appendChild(btn);
}

// ── Emoji button cycling animation ────────────────────────────────
let emojiCycleIdx = 0;
setInterval(() => {
  emojiCycleIdx = (emojiCycleIdx + 1) % STICKER_EMOJIS.length;
  emojiToggleIcon.textContent = STICKER_EMOJIS[emojiCycleIdx];
}, 1000);

// ── Panel Toggle Logic ────────────────────────────────────────────
let activeRightSection = null; // 'emoji' | 'color' | 'font' | null

function openRightPanel(section) {
  const titles = { emoji: 'editorEmoji', color: 'editorColor', font: 'editorFont' };
  const tt = i18n[currentLang] || i18n.en;
  rightPanelTitle.textContent = tt[titles[section]] || section;
  sectionEmoji.classList.toggle('hidden', section !== 'emoji');
  sectionColor.classList.toggle('hidden', section !== 'color');
  sectionFont.classList.toggle('hidden', section !== 'font');
  rightPanel.classList.remove('hidden');
  activeRightSection = section;
  // highlight active toolbar button
  emojiToggle.classList.toggle('active', section === 'emoji');
  colorToggle.classList.toggle('active', section === 'color');
  fontToggle.classList.toggle('active', section === 'font');
  setTimeout(drawCanvas, 280);
}

function closeRightPanel() {
  rightPanel.classList.add('hidden');
  activeRightSection = null;
  emojiToggle.classList.remove('active');
  colorToggle.classList.remove('active');
  fontToggle.classList.remove('active');
  setTimeout(drawCanvas, 280);
}

function toggleRightPanel(section) {
  if (activeRightSection === section) {
    closeRightPanel();
  } else {
    openRightPanel(section);
  }
}

// Filter panel toggle
filterToggle.addEventListener('click', () => {
  const isOpen = !filterPanel.classList.contains('hidden');
  filterPanel.classList.toggle('hidden');
  filterToggle.classList.toggle('active', !isOpen);
  setTimeout(drawCanvas, 280);
});

document.getElementById('filter-panel-close').addEventListener('click', () => {
  filterPanel.classList.add('hidden');
  filterToggle.classList.remove('active');
  setTimeout(drawCanvas, 280);
});

// Right panel toggles
emojiToggle.addEventListener('click', () => toggleRightPanel('emoji'));
colorToggle.addEventListener('click', () => toggleRightPanel('color'));
fontToggle.addEventListener('click', () => toggleRightPanel('font'));

document.getElementById('right-panel-close').addEventListener('click', () => {
  closeRightPanel();
});

// ── Load Image ────────────────────────────────────────────────────
(async function loadImage() {
  const base64 = await window.kairozun.readScreenshot(filePath);
  if (!base64) return;
  const img = new Image();
  img.onload = () => {
    origImage = img;
    drawCanvas();
  };
  img.src = 'data:image/png;base64,' + base64;
})();

function drawCanvas() {
  if (!origImage) return;
  const wrap = document.getElementById('editor-canvas-wrap');
  const maxW = wrap.clientWidth - 20;
  const maxH = wrap.clientHeight - 20;
  // Source region: cropped area or full image
  const sx = cropRect ? cropRect.x : 0;
  const sy = cropRect ? cropRect.y : 0;
  const sw = cropRect ? cropRect.w : origImage.naturalWidth;
  const sh = cropRect ? cropRect.h : origImage.naturalHeight;
  const scale = Math.min(maxW / sw, maxH / sh, 1);
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);
  editorCanvas.width = w;
  editorCanvas.height = h;
  editorCtx.filter = FILTERS[currentFilter] || 'none';
  editorCtx.drawImage(origImage, sx, sy, sw, sh, 0, 0, w, h);
  editorCtx.filter = 'none';

  // Apply blur/pixelate regions
  for (const br of blurRegions) {
    const bx = Math.round((br.x / 100) * w);
    const by = Math.round((br.y / 100) * h);
    const bw = Math.round((br.w / 100) * w);
    const bh = Math.round((br.h / 100) * h);
    if (bw < 1 || bh < 1) continue;
    const imgData = editorCtx.getImageData(bx, by, bw, bh);
    const pxSize = Math.max(4, Math.round(Math.min(bw, bh) / 8));
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = bw; tmpCanvas.height = bh;
    const tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.putImageData(imgData, 0, 0);
    const smallW = Math.max(1, Math.round(bw / pxSize));
    const smallH = Math.max(1, Math.round(bh / pxSize));
    editorCtx.imageSmoothingEnabled = false;
    const small = document.createElement('canvas');
    small.width = smallW; small.height = smallH;
    const sCtx = small.getContext('2d');
    sCtx.drawImage(tmpCanvas, 0, 0, smallW, smallH);
    editorCtx.drawImage(small, 0, 0, smallW, smallH, bx, by, bw, bh);
    editorCtx.imageSmoothingEnabled = true;
  }
}

// Redraw on window resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawCanvas, 80);
});

// Redraw during panel transitions for smooth canvas resize
const canvasWrap = document.getElementById('editor-canvas-wrap');
filterPanel.addEventListener('transitionend', drawCanvas);
rightPanel.addEventListener('transitionend', drawCanvas);

// ── Text Size Controls ────────────────────────────────────────────
sizeValue.textContent = currentSize;

function selectWm(wm) {
  selectedWm = wm;
  // Update size display to match selected element
  sizeValue.textContent = wm.size;
  // Visual highlight
  dragLayer.querySelectorAll('.watermark-draggable').forEach(el => el.classList.remove('selected'));
  const el = dragLayer.querySelector('[data-wm-id="' + wm.id + '"]');
  if (el) el.classList.add('selected');
}

function deselectWm() {
  selectedWm = null;
  sizeValue.textContent = currentSize;
  dragLayer.querySelectorAll('.watermark-draggable').forEach(el => el.classList.remove('selected'));
}

// Click on canvas area deselects
document.getElementById('editor-canvas-wrap').addEventListener('click', (e) => {
  if (e.target.closest('.watermark-draggable')) return;
  deselectWm();
});

document.getElementById('size-decrease').addEventListener('click', () => {
  if (selectedWm) {
    if (selectedWm.size > 8) {
      selectedWm.size -= 2;
      sizeValue.textContent = selectedWm.size;
      updateWmEl(selectedWm);
    }
  } else if (currentSize > 8) {
    currentSize -= 2;
    sizeValue.textContent = currentSize;
    if (activeTextWm) { activeTextWm.size = currentSize; updateWmEl(activeTextWm); }
  }
});

document.getElementById('size-increase').addEventListener('click', () => {
  if (selectedWm) {
    if (selectedWm.size < 120) {
      selectedWm.size += 2;
      sizeValue.textContent = selectedWm.size;
      updateWmEl(selectedWm);
    }
  } else if (currentSize < 120) {
    currentSize += 2;
    sizeValue.textContent = currentSize;
    if (activeTextWm) { activeTextWm.size = currentSize; updateWmEl(activeTextWm); }
  }
});

// ── Hold-to-repeat for size buttons ───────────────────────────────
function setupHoldRepeat(btnId, delta) {
  const btn = document.getElementById(btnId);
  let holdInterval = null;
  let holdTimeout = null;

  const doStep = () => {
    if (selectedWm) {
      const next = selectedWm.size + delta;
      if (next >= 8 && next <= 120) {
        selectedWm.size = next;
        sizeValue.textContent = selectedWm.size;
        updateWmEl(selectedWm);
      }
    } else {
      const next = currentSize + delta;
      if (next >= 8 && next <= 120) {
        currentSize = next;
        sizeValue.textContent = currentSize;
        if (activeTextWm) { activeTextWm.size = currentSize; updateWmEl(activeTextWm); }
      }
    }
  };

  const stopHold = () => {
    if (holdTimeout) { clearTimeout(holdTimeout); holdTimeout = null; }
    if (holdInterval) { clearInterval(holdInterval); holdInterval = null; }
  };

  btn.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    stopHold();
    holdTimeout = setTimeout(() => {
      holdInterval = setInterval(doStep, 70);
    }, 350);
  });

  btn.addEventListener('mouseup', stopHold);
  btn.addEventListener('mouseleave', stopHold);
}

setupHoldRepeat('size-decrease', -2);
setupHoldRepeat('size-increase', 2);

// ── Watermark Input (multiple texts — Enter to place) ─────────────
let activeTextWm = null; // the text wm currently linked to input

wmInput.addEventListener('input', () => {
  const text = wmInput.value.trim();
  if (text) {
    if (activeTextWm) {
      activeTextWm.text = text;
      activeTextWm.color = currentColor;
      activeTextWm.size = currentSize;
      activeTextWm.font = currentFont;
      updateWmEl(activeTextWm);
    } else {
      const wm = { id: nextId++, type: 'text', text, x: 50, y: 50, color: currentColor, size: currentSize, font: currentFont };
      watermarks.push(wm);
      createWmEl(wm);
      activeTextWm = wm;
    }
  } else if (activeTextWm) {
    removeWm(activeTextWm.id);
    activeTextWm = null;
  }
});

wmInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const text = wmInput.value.trim();
    if (!text) return;
    // Detach current text watermark from input (it stays on canvas)
    activeTextWm = null;
    wmInput.value = '';
    wmInput.focus();
  }
});

// ── Watermark Element Management ──────────────────────────────────
function createWmEl(wm) {
  const el = document.createElement('div');
  el.className = 'watermark-draggable';
  el.dataset.wmId = wm.id;

  if (wm.type === 'text') {
    el.textContent = wm.text;
    el.style.color = wm.color;
    el.style.fontSize = wm.size + 'px';
    el.style.fontFamily = (wm.font || 'Segoe UI') + ', "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  } else if (wm.type === 'emoji') {
    el.classList.add('emoji-sticker');
    el.textContent = wm.text;
    el.style.fontSize = wm.size + 'px';
  } else if (wm.type === 'gameicon') {
    el.classList.add('game-icon-sticker');
    if (wm.gameName) el.classList.add('game-icon-combo');
    const img = document.createElement('img');
    img.src = wm.iconUrl;
    img.width = wm.size;
    img.height = wm.size;
    el.appendChild(img);
    if (wm.gameName) {
      const nameSpan = document.createElement('span');
      nameSpan.className = 'game-icon-label';
      nameSpan.textContent = wm.gameName;
      nameSpan.style.fontSize = Math.max(10, Math.round(wm.size * 0.3)) + 'px';
      if (wm.font) nameSpan.style.fontFamily = wm.font + ', sans-serif';
      el.appendChild(nameSpan);
    }
  }

  el.style.left = wm.x + '%';
  el.style.top = wm.y + '%';

  // Optimized drag — use requestAnimationFrame
  let dragging = false;
  let startX, startY, elStartX, elStartY;
  let rafId = null;

  el.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    selectWm(wm);
    const rect = dragLayer.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    elStartX = (wm.x / 100) * rect.width;
    elStartY = (wm.y / 100) * rect.height;
    document.body.style.cursor = 'grabbing';
    el.style.cursor = 'grabbing';
  });

  const onMove = e => {
    if (!dragging) return;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (!dragging) return;
      const rect = dragLayer.getBoundingClientRect();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newX = Math.max(0, Math.min(rect.width, elStartX + dx));
      const newY = Math.max(0, Math.min(rect.height, elStartY + dy));
      wm.x = (newX / rect.width) * 100;
      wm.y = (newY / rect.height) * 100;
      el.style.left = wm.x + '%';
      el.style.top = wm.y + '%';
    });
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    el.style.cursor = 'grab';
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);

  el.addEventListener('dblclick', e => {
    e.preventDefault();
    e.stopPropagation();
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    removeWm(wm.id);
    if (selectedWm && selectedWm.id === wm.id) deselectWm();
    if (wm.type === 'text' && activeTextWm && activeTextWm.id === wm.id) {
      activeTextWm = null;
      wmInput.value = '';
    }
  });

  dragLayer.appendChild(el);
}

function updateWmEl(wm) {
  const el = dragLayer.querySelector('[data-wm-id="' + wm.id + '"]');
  if (!el) return;
  if (wm.type === 'text') {
    el.textContent = wm.text;
    el.style.color = wm.color;
    el.style.fontSize = wm.size + 'px';
    el.style.fontFamily = (wm.font || 'Segoe UI') + ', "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  } else if (wm.type === 'emoji') {
    el.style.fontSize = wm.size + 'px';
  } else if (wm.type === 'gameicon') {
    const img = el.querySelector('img');
    if (img) { img.width = wm.size; img.height = wm.size; }
    const label = el.querySelector('.game-icon-label');
    if (label) {
      label.style.fontSize = Math.max(10, Math.round(wm.size * 0.3)) + 'px';
      label.style.fontFamily = (wm.font || 'Segoe UI') + ', sans-serif';
    }
  }
}

function removeWm(id) {
  watermarks = watermarks.filter(w => w.id !== id);
  const el = dragLayer.querySelector('[data-wm-id="' + id + '"]');
  if (el) el.remove();
}

// ── Save ──────────────────────────────────────────────────────────
document.getElementById('editor-save').addEventListener('click', async () => {
  if (!origImage) return;
  const saveBtn = document.getElementById('editor-save');
  const saveBtnOrigHTML = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.textContent = '...';
  const tt = i18n[currentLang] || i18n.en;

  try {
    const offCanvas = document.createElement('canvas');
    // Use crop rect or full image dimensions
    const cx = cropRect ? cropRect.x : 0;
    const cy = cropRect ? cropRect.y : 0;
    const cw = cropRect ? cropRect.w : origImage.naturalWidth;
    const ch = cropRect ? cropRect.h : origImage.naturalHeight;
    offCanvas.width = cw;
    offCanvas.height = ch;
    const ctx = offCanvas.getContext('2d');

    ctx.filter = FILTERS[currentFilter] || 'none';
    ctx.drawImage(origImage, cx, cy, cw, ch, 0, 0, cw, ch);
    ctx.filter = 'none';

    // Apply blur/pixelate regions at full resolution
    for (const br of blurRegions) {
      const bx = Math.round((br.x / 100) * cw);
      const by = Math.round((br.y / 100) * ch);
      const bw = Math.round((br.w / 100) * cw);
      const bh = Math.round((br.h / 100) * ch);
      if (bw < 1 || bh < 1) continue;
      const imgData = ctx.getImageData(bx, by, bw, bh);
      const pxSize = Math.max(6, Math.round(Math.min(bw, bh) / 8));
      const tmpC = document.createElement('canvas');
      tmpC.width = bw; tmpC.height = bh;
      const tmpX = tmpC.getContext('2d');
      tmpX.putImageData(imgData, 0, 0);
      const sW = Math.max(1, Math.round(bw / pxSize));
      const sH = Math.max(1, Math.round(bh / pxSize));
      ctx.imageSmoothingEnabled = false;
      const sC = document.createElement('canvas');
      sC.width = sW; sC.height = sH;
      sC.getContext('2d').drawImage(tmpC, 0, 0, sW, sH);
      ctx.drawImage(sC, 0, 0, sW, sH, bx, by, bw, bh);
      ctx.imageSmoothingEnabled = true;
    }

    const scaleX = cw / editorCanvas.width;

    // Pre-load game icon images for saving
    const iconWms = watermarks.filter(w => w.type === 'gameicon' && !w._loadedImg);
    if (iconWms.length > 0) {
      await Promise.all(iconWms.map(wm => new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { wm._loadedImg = img; resolve(); };
        img.onerror = resolve;
        img.src = wm.iconUrl;
      })));
      ctx.filter = FILTERS[currentFilter] || 'none';
      ctx.clearRect(0, 0, offCanvas.width, offCanvas.height);
      ctx.drawImage(origImage, cx, cy, cw, ch, 0, 0, cw, ch);
      ctx.filter = 'none';
    }

    for (const wm of watermarks) {
      const px = (wm.x / 100) * cw;
      const py = (wm.y / 100) * ch;
      if (wm.type === 'text') {
        const fs = Math.round(wm.size * scaleX);
        ctx.font = '700 ' + fs + 'px ' + (wm.font || 'Segoe UI') + ', "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.fillStyle = wm.color;
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = fs * 0.15;
        ctx.shadowOffsetX = fs * 0.05;
        ctx.shadowOffsetY = fs * 0.05;
        ctx.fillText(wm.text, px, py + fs);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      } else if (wm.type === 'emoji') {
        const fs = Math.round(wm.size * scaleX);
        ctx.font = fs + 'px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.fillText(wm.text, px, py + fs);
      } else if (wm.type === 'gameicon' && wm._loadedImg) {
        const sz = Math.round(wm.size * scaleX);
        ctx.drawImage(wm._loadedImg, px, py, sz, sz);
        if (wm.gameName) {
          const labelFs = Math.max(10, Math.round(wm.size * 0.3)) * scaleX;
          ctx.font = '700 ' + Math.round(labelFs) + 'px ' + (wm.font || 'Segoe UI') + ', sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = labelFs * 0.15;
          ctx.fillText(wm.gameName, px + sz + Math.round(6 * scaleX), py + sz / 2 + labelFs / 3);
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }
    }

    const dataUrl = offCanvas.toDataURL('image/png');
    const base64Data = dataUrl.split(',')[1];
    const result = await window.kairozun.saveEditedScreenshot({ base64Data, originalName: fileName });
    saveBtn.textContent = result ? '✓' : '✗';
    setTimeout(() => { saveBtn.innerHTML = saveBtnOrigHTML; saveBtn.disabled = false; }, 1200);
  } catch {
    saveBtn.textContent = '✗';
    setTimeout(() => { saveBtn.innerHTML = saveBtnOrigHTML; saveBtn.disabled = false; }, 1200);
  }
});

// ── Reset ─────────────────────────────────────────────────────────
document.getElementById('editor-reset').addEventListener('click', () => {
  currentFilter = 'none';
  watermarks = [];
  nextId = 0;
  activeTextWm = null;
  selectedWm = null;
  cropRect = null;
  cropMode = false;
  blurMode = false;
  blurRegions = [];
  document.getElementById('crop-overlay').classList.add('hidden');
  document.getElementById('crop-overlay').innerHTML = '';
  document.getElementById('crop-toggle').classList.remove('active');
  document.getElementById('blur-overlay').classList.add('hidden');
  document.getElementById('blur-overlay').innerHTML = '';
  document.getElementById('blur-toggle').classList.remove('active');
  dragLayer.innerHTML = '';
  wmInput.value = '';
  currentColor = '#ffffff';
  colorPreview.style.background = '#ffffff';
  colorHex.value = 'ffffff';
  currentSize = 24;
  sizeValue.textContent = '24';
  currentFont = 'Segoe UI';
  fontActiveName.textContent = 'Segoe UI';
  fontList.querySelectorAll('.font-option').forEach(b => b.classList.toggle('active', b.dataset.font === 'Segoe UI'));
  colorGrid.querySelectorAll('.color-swatch-opt').forEach(el => el.classList.toggle('active', el.dataset.color === '#ffffff'));
  filterPanelList.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'none'));
  filterActiveName.textContent = (i18n[currentLang] || i18n.en).filterNone || 'None';
  filterPanel.classList.add('hidden');
  filterToggle.classList.remove('active');
  closeRightPanel();
  drawCanvas();
});

// ── Crop Tool ─────────────────────────────────────────────────────
const cropOverlay = document.getElementById('crop-overlay');
const cropToggleBtn = document.getElementById('crop-toggle');

cropToggleBtn.addEventListener('click', () => {
  cropMode = !cropMode;
  cropToggleBtn.classList.toggle('active', cropMode);
  if (cropMode) {
    cropOverlay.classList.remove('hidden');
    cropOverlay.innerHTML = '';
    dragLayer.style.pointerEvents = 'none';
    // Position overlay exactly on top of canvas
    syncCropOverlay();
  } else {
    cropOverlay.classList.add('hidden');
    cropOverlay.innerHTML = '';
    dragLayer.style.pointerEvents = '';
  }
});

function syncCropOverlay() {
  const canvas = editorCanvas;
  const wrapRect = document.getElementById('editor-canvas-wrap').getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  cropOverlay.style.left = (canvasRect.left - wrapRect.left) + 'px';
  cropOverlay.style.top = (canvasRect.top - wrapRect.top) + 'px';
  cropOverlay.style.width = canvasRect.width + 'px';
  cropOverlay.style.height = canvasRect.height + 'px';
  cropOverlay.style.right = 'auto';
  cropOverlay.style.bottom = 'auto';
}

let cropDragging = false;
let cropStartX = 0, cropStartY = 0;
let cropSelEl = null;

cropOverlay.addEventListener('mousedown', (e) => {
  if (!cropMode) return;
  // Don't start new selection if clicking confirm buttons
  if (e.target.closest('.crop-confirm-bar')) return;
  e.preventDefault();
  const rect = cropOverlay.getBoundingClientRect();
  cropStartX = e.clientX - rect.left;
  cropStartY = e.clientY - rect.top;
  cropDragging = true;

  // Remove old selection
  cropOverlay.innerHTML = '';

  // Create selection element
  cropSelEl = document.createElement('div');
  cropSelEl.className = 'crop-selection';
  cropSelEl.style.left = cropStartX + 'px';
  cropSelEl.style.top = cropStartY + 'px';
  cropSelEl.style.width = '0px';
  cropSelEl.style.height = '0px';
  cropOverlay.appendChild(cropSelEl);
});

document.addEventListener('mousemove', (e) => {
  if (!cropDragging || !cropSelEl) return;
  const rect = cropOverlay.getBoundingClientRect();
  let curX = e.clientX - rect.left;
  let curY = e.clientY - rect.top;
  curX = Math.max(0, Math.min(curX, rect.width));
  curY = Math.max(0, Math.min(curY, rect.height));

  const x = Math.min(cropStartX, curX);
  const y = Math.min(cropStartY, curY);
  const w = Math.abs(curX - cropStartX);
  const h = Math.abs(curY - cropStartY);

  cropSelEl.style.left = x + 'px';
  cropSelEl.style.top = y + 'px';
  cropSelEl.style.width = w + 'px';
  cropSelEl.style.height = h + 'px';
});

document.addEventListener('mouseup', () => {
  if (!cropDragging || !cropSelEl) return;
  cropDragging = false;

  const selW = parseFloat(cropSelEl.style.width);
  const selH = parseFloat(cropSelEl.style.height);

  if (selW < 10 || selH < 10) {
    cropOverlay.innerHTML = '';
    return;
  }

  // Add confirm buttons
  const bar = document.createElement('div');
  bar.className = 'crop-confirm-bar';
  const applyBtn = document.createElement('button');
  applyBtn.className = 'crop-confirm-btn apply';
  applyBtn.textContent = '✓';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'crop-confirm-btn cancel';
  cancelBtn.textContent = '✕';
  bar.appendChild(applyBtn);
  bar.appendChild(cancelBtn);
  cropSelEl.appendChild(bar);

  cancelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    cropOverlay.innerHTML = '';
  });

  applyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Convert selection pixels to original image coordinates
    const overlayW = cropOverlay.clientWidth;
    const overlayH = cropOverlay.clientHeight;
    const selX = parseFloat(cropSelEl.style.left);
    const selY = parseFloat(cropSelEl.style.top);
    const sw = parseFloat(cropSelEl.style.width);
    const sh = parseFloat(cropSelEl.style.height);

    // Current source dimensions (already cropped or original)
    const srcW = cropRect ? cropRect.w : origImage.naturalWidth;
    const srcH = cropRect ? cropRect.h : origImage.naturalHeight;
    const srcX = cropRect ? cropRect.x : 0;
    const srcY = cropRect ? cropRect.y : 0;

    // Map overlay selection to source image coords
    const nx = srcX + (selX / overlayW) * srcW;
    const ny = srcY + (selY / overlayH) * srcH;
    const nw = (sw / overlayW) * srcW;
    const nh = (sh / overlayH) * srcH;

    cropRect = { x: Math.round(nx), y: Math.round(ny), w: Math.round(nw), h: Math.round(nh) };

    // Exit crop mode and redraw
    cropMode = false;
    cropToggleBtn.classList.remove('active');
    cropOverlay.classList.add('hidden');
    cropOverlay.innerHTML = '';
    dragLayer.style.pointerEvents = '';
    drawCanvas();
  });
});

// Re-sync crop overlay on resize/panel transitions
window.addEventListener('resize', () => { if (cropMode) setTimeout(syncCropOverlay, 100); });
filterPanel.addEventListener('transitionend', () => { if (cropMode) syncCropOverlay(); });
rightPanel.addEventListener('transitionend', () => { if (cropMode) syncCropOverlay(); });

// ── Blur/Pixelate Tool ────────────────────────────────────────────
const blurOverlay = document.getElementById('blur-overlay');
const blurToggleBtn = document.getElementById('blur-toggle');

blurToggleBtn.addEventListener('click', () => {
  blurMode = !blurMode;
  blurToggleBtn.classList.toggle('active', blurMode);
  if (blurMode) {
    // Exit crop mode if active
    if (cropMode) {
      cropMode = false;
      cropToggleBtn.classList.remove('active');
      cropOverlay.classList.add('hidden');
      cropOverlay.innerHTML = '';
      dragLayer.style.pointerEvents = '';
    }
    blurOverlay.classList.remove('hidden');
    dragLayer.style.pointerEvents = 'none';
    syncBlurOverlay();
    renderBlurRegionEls();
  } else {
    blurOverlay.classList.add('hidden');
    blurOverlay.innerHTML = '';
    dragLayer.style.pointerEvents = '';
  }
});

function syncBlurOverlay() {
  const canvas = editorCanvas;
  const wrapRect = document.getElementById('editor-canvas-wrap').getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  blurOverlay.style.left = (canvasRect.left - wrapRect.left) + 'px';
  blurOverlay.style.top = (canvasRect.top - wrapRect.top) + 'px';
  blurOverlay.style.width = canvasRect.width + 'px';
  blurOverlay.style.height = canvasRect.height + 'px';
  blurOverlay.style.right = 'auto';
  blurOverlay.style.bottom = 'auto';
}

function renderBlurRegionEls() {
  blurOverlay.innerHTML = '';
  for (let i = 0; i < blurRegions.length; i++) {
    const br = blurRegions[i];
    const el = document.createElement('div');
    el.className = 'blur-region';
    el.style.left = br.x + '%';
    el.style.top = br.y + '%';
    el.style.width = br.w + '%';
    el.style.height = br.h + '%';
    const del = document.createElement('button');
    del.className = 'blur-region-del';
    del.textContent = '✕';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      blurRegions.splice(i, 1);
      renderBlurRegionEls();
      drawCanvas();
    });
    el.appendChild(del);
    blurOverlay.appendChild(el);
  }
}

let blurDragging = false;
let blurStartX = 0, blurStartY = 0;
let blurSelEl = null;

blurOverlay.addEventListener('mousedown', (e) => {
  if (!blurMode) return;
  if (e.target.closest('.blur-region-del')) return;
  if (e.target.closest('.blur-region')) return;
  e.preventDefault();
  const rect = blurOverlay.getBoundingClientRect();
  blurStartX = e.clientX - rect.left;
  blurStartY = e.clientY - rect.top;
  blurDragging = true;

  blurSelEl = document.createElement('div');
  blurSelEl.className = 'blur-selection';
  blurSelEl.style.left = blurStartX + 'px';
  blurSelEl.style.top = blurStartY + 'px';
  blurSelEl.style.width = '0px';
  blurSelEl.style.height = '0px';
  blurOverlay.appendChild(blurSelEl);
});

document.addEventListener('mousemove', (e) => {
  if (!blurDragging || !blurSelEl) return;
  const rect = blurOverlay.getBoundingClientRect();
  let curX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  let curY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
  const x = Math.min(blurStartX, curX);
  const y = Math.min(blurStartY, curY);
  blurSelEl.style.left = x + 'px';
  blurSelEl.style.top = y + 'px';
  blurSelEl.style.width = Math.abs(curX - blurStartX) + 'px';
  blurSelEl.style.height = Math.abs(curY - blurStartY) + 'px';
});

document.addEventListener('mouseup', () => {
  if (!blurDragging || !blurSelEl) return;
  blurDragging = false;
  const left = parseFloat(blurSelEl.style.left);
  const top = parseFloat(blurSelEl.style.top);
  const selW = parseFloat(blurSelEl.style.width);
  const selH = parseFloat(blurSelEl.style.height);
  blurSelEl.remove();
  blurSelEl = null;

  if (selW < 5 || selH < 5) return;

  const ow = blurOverlay.clientWidth;
  const oh = blurOverlay.clientHeight;

  blurRegions.push({
    x: (left / ow) * 100,
    y: (top / oh) * 100,
    w: (selW / ow) * 100,
    h: (selH / oh) * 100,
  });
  renderBlurRegionEls();
  drawCanvas();
});

window.addEventListener('resize', () => { if (blurMode) setTimeout(syncBlurOverlay, 100); });
filterPanel.addEventListener('transitionend', () => { if (blurMode) syncBlurOverlay(); });
rightPanel.addEventListener('transitionend', () => { if (blurMode) syncBlurOverlay(); });

// ── Import Photo ──────────────────────────────────────────────────
const importToggle = document.getElementById('import-photo-toggle');
let importMenu = null;

importToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  if (importMenu) { importMenu.remove(); importMenu = null; return; }
  const tt = i18n[currentLang] || i18n.en;
  importMenu = document.createElement('div');
  importMenu.className = 'import-dropdown';

  const fromFile = document.createElement('button');
  fromFile.className = 'import-dropdown-item';
  fromFile.textContent = tt.importFromFile || 'From Computer';
  fromFile.addEventListener('click', async () => {
    importMenu.remove(); importMenu = null;
    const base64 = await window.kairozun.pickImportPhoto();
    if (base64) loadImportedImage(base64);
  });

  const fromGallery = document.createElement('button');
  fromGallery.className = 'import-dropdown-item';
  fromGallery.textContent = tt.importFromGallery || 'From Gallery';
  fromGallery.addEventListener('click', async () => {
    importMenu.remove(); importMenu = null;
    showImportGallery();
  });

  importMenu.appendChild(fromFile);
  importMenu.appendChild(fromGallery);

  const rect = importToggle.getBoundingClientRect();
  const toolbarRect = document.getElementById('editor-toolbar').getBoundingClientRect();
  let menuLeft = rect.left - toolbarRect.left;
  const menuTop = rect.top - toolbarRect.top;
  document.getElementById('editor-toolbar').appendChild(importMenu);
  const menuW = importMenu.offsetWidth;
  if (menuLeft + menuW > toolbarRect.width) menuLeft = Math.max(0, rect.right - toolbarRect.left - menuW);
  importMenu.style.left = menuLeft + 'px';
  importMenu.style.bottom = (toolbarRect.bottom - rect.top + 4) + 'px';
  importMenu.style.top = 'auto';
});

document.addEventListener('click', () => {
  if (importMenu) { importMenu.remove(); importMenu = null; }
});

function loadImportedImage(base64) {
  const img = new Image();
  img.onload = () => {
    origImage = img;
    currentFilter = 'none';
    watermarks = [];
    nextId = 0;
    activeTextWm = null;
    selectedWm = null;
    cropRect = null;
    cropMode = false;
    blurMode = false;
    blurRegions = [];
    document.getElementById('crop-overlay').classList.add('hidden');
    document.getElementById('crop-overlay').innerHTML = '';
    document.getElementById('crop-toggle').classList.remove('active');
    document.getElementById('blur-overlay').classList.add('hidden');
    document.getElementById('blur-overlay').innerHTML = '';
    document.getElementById('blur-toggle').classList.remove('active');
    dragLayer.innerHTML = '';
    drawCanvas();
  };
  img.src = 'data:image/png;base64,' + base64;
}

// Import from gallery — modal with screenshot list
let importGalleryOverlay = null;

async function showImportGallery() {
  const screenshots = await window.kairozun.getScreenshots();
  if (!screenshots || screenshots.length === 0) return;

  const tt = i18n[currentLang] || i18n.en;
  importGalleryOverlay = document.createElement('div');
  importGalleryOverlay.className = 'import-gallery-overlay';

  const modal = document.createElement('div');
  modal.className = 'import-gallery-modal';

  const header = document.createElement('div');
  header.className = 'import-gallery-header';
  const title = document.createElement('span');
  title.textContent = tt.importFromGallery || 'From Gallery';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'import-gallery-close';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => { importGalleryOverlay.remove(); importGalleryOverlay = null; });
  header.appendChild(title);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'import-gallery-grid';
  for (const ss of screenshots) {
    const thumb = document.createElement('div');
    thumb.className = 'import-gallery-thumb';
    const img = document.createElement('img');
    img.alt = ss.name;
    img.src = '';
    window.kairozun.readScreenshot(ss.path).then(b64 => {
      if (b64) img.src = 'data:image/png;base64,' + b64;
    }).catch(() => {});
    thumb.appendChild(img);
    thumb.addEventListener('click', async () => {
      const b64 = await window.kairozun.readScreenshot(ss.path);
      if (b64) loadImportedImage(b64);
      importGalleryOverlay.remove();
      importGalleryOverlay = null;
    });
    grid.appendChild(thumb);
  }
  modal.appendChild(grid);
  importGalleryOverlay.appendChild(modal);

  importGalleryOverlay.addEventListener('click', (e) => {
    if (e.target === importGalleryOverlay) { importGalleryOverlay.remove(); importGalleryOverlay = null; }
  });

  document.body.appendChild(importGalleryOverlay);
}

// ── Delete ────────────────────────────────────────────────────────
document.getElementById('editor-delete').addEventListener('click', async () => {
  const ok = await window.kairozun.deleteScreenshot(filePath);
  if (ok) window.kairozun.closeEditor();
});

// ── Close ─────────────────────────────────────────────────────────
document.getElementById('editor-close').addEventListener('click', () => {
  window.kairozun.closeEditor();
});

// ── Help Popup ────────────────────────────────────────────────────
const helpOverlay = document.getElementById('help-overlay');

document.getElementById('editor-help-btn').addEventListener('click', () => {
  helpOverlay.classList.toggle('hidden');
});

document.getElementById('help-close').addEventListener('click', () => {
  helpOverlay.classList.add('hidden');
});

helpOverlay.addEventListener('click', (e) => {
  if (e.target === helpOverlay) helpOverlay.classList.add('hidden');
});
