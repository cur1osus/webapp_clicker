const tg = window.Telegram.WebApp;
tg.expand?.();
tg.ready?.();

// tg.showAlert(tg.viewportHeight)

const tabButtons = Array.from(document.querySelectorAll("[data-tab-button]"));
const tabPanels = Array.from(document.querySelectorAll("[data-panel]"));

const CURRENCY_NAME = "Астральные кристаллы";
const CURRENCY_SYMBOL = "✦";
const LOCAL_PLAYER_ID_KEY = "galactic_clicker_player_id";
const LOCAL_PROGRESS_KEY = "galactic_clicker_progress";
const SAVE_DELAY_MS = 200;
const BASE_LEVEL_GOAL = 120;

const LEVEL_GROWTH_FACTOR = 1.65;
const LEVEL_TITLE_PRESETS = [
  "Новичок",
  "Ас",
  "Командор",
  "Стратег",
  "Легенда",
  "Грандмастер",
  "Космолорд",
  "Архонт",
  "Император",
  "Властелин",
];
const DYNAMIC_LEVEL_PREFIX = "Покоритель #";

const BASE_COMBO_WINDOW = 1200;
const BASE_MAX_COMBO = 8;
const BASE_SCORE_MULTIPLIER = 1;
const BASE_CURRENCY_PER_CLICK = 1;
const BASE_LEVEL_REWARD = 50;
const BASE_PASSIVE_PER_TICK = 0;
const PASSIVE_TICK_MS = 5000;

const DEFAULT_SKIN_ID = "stardust_emblem";

const dom = {
  card: document.querySelector(".card"),
  heroSection: document.querySelector(".card .header"),
  clickerButton: document.getElementById("clickerButton"),
  clickerButtonImage: document.getElementById("clickerButtonImage"),
  clickDelta: document.getElementById("clickDelta"),
  counterValue: document.getElementById("counterValue"),
  progressBar: document.getElementById("progressBar"),
  energyLabel: document.getElementById("energyLabel"),
  streakLabel: document.getElementById("streakLabel"),
  resetButton: document.getElementById("resetButton"),
  levelName: document.getElementById("levelName"),
  levelGoal: document.getElementById("levelGoal"),
  currencyInline: document.getElementById("currencyInline"),
  currencyValue: document.getElementById("currencyValue"),
  passiveRate: document.getElementById("passiveRate"),
  upgradeList: document.getElementById("upgradeList"),
  leaderboardList: document.getElementById("leaderboardList"),
  leaderboardStatus: document.getElementById("leaderboardStatus"),
  leaderboardRefresh: document.getElementById("leaderboardRefresh"),
  currentSkinPreview: document.getElementById("currentSkinPreview"),
  currentSkinMeta: document.getElementById("currentSkinMeta"),
  ownedSkinsList: document.getElementById("ownedSkinsList"),
  chestList: document.getElementById("chestList"),
  chestOverlay: document.getElementById("chestOverlay"),
  chestOverlayVisual: document.getElementById("chestOverlayVisual"),
  chestOverlayTitle: document.getElementById("chestOverlayTitle"),
  chestOverlayMessage: document.getElementById("chestOverlayMessage"),
  chestOverlayLabel: document.getElementById("chestOverlayLabel"),
  chestOverlayAction: document.getElementById("chestOverlayAction"),
  chestOverlayClose: document.getElementById("chestOverlayClose"),
  chestOverlayChestName: document.getElementById("chestOverlayChestName"),
  chestOverlayItems: document.getElementById("chestOverlayItems"),
};

const TAP_SKINS = [
  {
    id: "stardust_emblem",
    name: "Звёздная эмблема",
    rarity: "common",
    description: "Классическая эмблема станции. Баланс фиолетовых оттенков и знакомая звезда.",
    image: createSkinSvg(
      "#342063",
      "#7f5cff",
      "rgba(255,106,193,0.35)",
      "✦",
    ),
  },
  {
    id: "nebula_flare",
    name: "Вспышка туманности",
    rarity: "rare",
    description: "Бирюзовое сияние туманности наполняет каждый клик космической энергией.",
    image: createSkinSvg(
      "#0f2c37",
      "#33c9ff",
      "rgba(51,201,255,0.33)",
      "☄",
    ),
  },
  {
    id: "aurora_blade",
    name: "Клинок Авроры",
    rarity: "epic",
    description: "Редкий луч изумрудного света, оставляющий за собой след северного сияния.",
    image: createSkinSvg(
      "#06251f",
      "#33faae",
      "rgba(51,250,174,0.35)",
      "✧",
    ),
  },
  {
    id: "void_crown",
    name: "Корона Пустоты",
    rarity: "legendary",
    description: "Легендарная корона Тёмной матрицы. Притягивает взгляды и кристаллы.",
    image: createSkinSvg(
      "#120c23",
      "#8f5dff",
      "rgba(255,215,0,0.28)",
      "✨",
    ),
  },
];

const SKIN_RARITY_ORDER = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};

const SKIN_RARITY_LABEL = {
  common: "Обычный",
  rare: "Редкий",
  epic: "Эпический",
  legendary: "Легендарный",
};

const CHEST_DEFINITIONS = [
  {
    id: "daily_free",
    name: "Ежедневный контейнер",
    description: "Открывай раз в день бесплатно и получай шанс на редкие скины или усиления.",
    costType: "free",
    costAmount: 0,
    rewards: [
      { type: "skin", weight: 55, amount: 500 },
      { type: "upgrade", weight: 30 },
      { type: "currency", weight: 15, amount: 120 },
    ],
    rewardRolls: [1, 2],
  },
  {
    id: "crystal_cache",
    name: "Кристальный контейнер",
    description: "Стабильный источник апгрейдов и шанс на новые облики за астральные кристаллы.",
    costType: "currency",
    costAmount: 220,
    rewards: [
      { type: "skin", weight: 45, amount: 500 },
      { type: "upgrade", weight: 35 },
      { type: "currency", weight: 20, amount: 260 },
    ],
    rewardRolls: [2, 3],
  },
  {
    id: "stellar_vault",
    name: "Звёздный сейф",
    description: "Премиальный сундук за Telegram Stars. Повышенные шансы на легендарные скины.",
    costType: "stars",
    costAmount: 3,
    rewards: [
      { type: "skin", weight: 60, amount: 500 },
      { type: "upgrade", weight: 25 },
      { type: "currency", weight: 15, amount: 420 },
    ],
    rewardRolls: [2, 3],
  },
];

const CHEST_DEFINITION_MAP = new Map(CHEST_DEFINITIONS.map((definition) => [definition.id, definition]));
const CHEST_REFRESH_INTERVAL_MS = 60_000;

const SETTINGS = {
  comboWindowMs: BASE_COMBO_WINDOW,
  maxCombo: BASE_MAX_COMBO,
  minCombo: 1,
};

const modifiers = {
  scoreMultiplier: BASE_SCORE_MULTIPLIER,
  currencyPerClick: BASE_CURRENCY_PER_CLICK,
  levelReward: BASE_LEVEL_REWARD,
  passivePerTick: BASE_PASSIVE_PER_TICK,
};

const UPGRADE_DEFINITIONS = [
  {
    id: "chrono_core",
    name: "Импульсный стабилизатор",
    description: "Увеличивает длительность окна комбо на 180 мс за уровень.",
    baseCost: 160,
    costGrowth: 1.75,
  },
  {
    id: "quantum_loop",
    name: "Квантовый контур",
    description: "Увеличивает энергию одного клика на 15% за уровень.",
    baseCost: 260,
    costGrowth: 1.85,
  },
  {
    id: "stellar_magnet",
    name: "Звёздный магнит",
    description: "Добавляет +1 ✦ за каждый клик за уровень.",
    baseCost: 220,
    costGrowth: 1.75,
  },
  {
    id: "dividend_protocol",
    name: "Дивидендный протокол",
    description: "Каждый новый уровень приносит +75 ✦ за уровень улучшения.",
    baseCost: 340,
    costGrowth: 1.8,
  },
  {
    id: "drone_fleet",
    name: "Флот дронов",
    description: "Приносит 4 ✦ каждые 5 секунд за уровень.",
    baseCost: 420,
    costGrowth: 1.9,
  },
  {
    id: "crown_of_combos",
    name: "Корона комбо",
    description: "Повышает максимальное комбо на 1 за уровень.",
    baseCost: 280,
    costGrowth: 1.8,
  },
  {
    id: "entropy_shield",
    name: "Энтропийный щит",
    description: "Снижает штраф за сброс комбо: минимальное комбо становится выше на 1 за уровень.",
    baseCost: 260,
    costGrowth: 1.7,
  },
  {
    id: "galactic_exchange",
    name: "Галактическая биржа",
    description: "Увеличивает награду кристаллов за уровни на 10% + 15 ✦ за уровень.",
    baseCost: 360,
    costGrowth: 1.85,
  },
];

const levelPalettes = [
  {
    background: ["#1f1b2e", "#0f0b1a"],
    accent: ["#7f5cff", "#ff6ac1"],
    glow: ["rgba(127,92,255,0.45)", "rgba(255,106,193,0.45)"],
    streak: ["rgba(127,92,255,0.18)", "#ff6ac1"],
  },
  {
    background: ["#101f2e", "#06111f"],
    accent: ["#5cc9ff", "#2d8fff"],
    glow: ["rgba(92,201,255,0.4)", "rgba(45,143,255,0.4)"],
    streak: ["rgba(92,201,255,0.18)", "#2d8fff"],
  },
  {
    background: ["#2e1f1f", "#140808"],
    accent: ["#ff6f5c", "#ffbb6a"],
    glow: ["rgba(255,111,92,0.45)", "rgba(255,187,106,0.45)"],
    streak: ["rgba(255,111,92,0.18)", "#ff8f5c"],
  },
  {
    background: ["#1f2e24", "#0b130d"],
    accent: ["#57d57a", "#8df7c5"],
    glow: ["rgba(87,213,122,0.45)", "rgba(141,247,197,0.45)"],
    streak: ["rgba(87,213,122,0.18)", "#57d57a"],
  },
  {
    background: ["#2b1f2e", "#140912"],
    accent: ["#d957ff", "#ff9eff"],
    glow: ["rgba(217,87,255,0.45)", "rgba(255,158,255,0.45)"],
    streak: ["rgba(217,87,255,0.18)", "#ff9eff"],
  },
];

let lastLevelPalette = levelPalettes[0];
applyPalette(lastLevelPalette);


const UPGRADE_IDS = new Array(UPGRADE_DEFINITIONS.map((definition) => definition.id));

let score = 0;
let combo = 1;
let level = 0;
let currency = 0;
let upgradeLevels = new Map();
let hasFreeChest = false;
let currentSkinId = DEFAULT_SKIN_ID;
const ownedSkins = new Set([DEFAULT_SKIN_ID]);
let lastClickTs = 0;
let chestRefreshIntervalId = null;
let passiveIncomeIntervalId = null;
let saveTimeoutId = null;
let levelUpFlashTimeoutId = 0;
let lastSavedSignature = null;
let comboDelayTimeoutId = null;
let heroDismissed = false;

const API_ENDPOINT = "/api/clicker";

const LEADERBOARD_ENDPOINT = "/api/leaderboard";
const LEADERBOARD_REFRESH_MS = 60_000;
const LEADERBOARD_LIMIT = 20;

let userContext = extractUserContext();
// const initData = typeof tg.initData === "string" ? tg.initData : "";

function applyPalette(palette) {
  if (!palette) {
    return;
  }
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--bg-start", palette.background[0]);
  rootStyle.setProperty("--bg-end", palette.background[1]);
  rootStyle.setProperty("--accent", palette.accent[0]);
  rootStyle.setProperty("--accent-strong", palette.accent[1]);
  rootStyle.setProperty("--glow-primary", palette.glow[0]);
  rootStyle.setProperty("--glow-secondary", palette.glow[1]);
  rootStyle.setProperty("--streak-bg", palette.streak[0]);
  rootStyle.setProperty("--streak-color", palette.streak[1]);
};

const activateTab = (target) => {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tabButton === target;
    button.classList.toggle("is-active", isActive);
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.dataset.panel === target;
    panel.classList.toggle("is-hidden", !isActive);
  });
};


const setWelcomeCardVisibility = (show) => {
  if (!dom.heroSection || !dom.card) {
    return;
  }

  dom.heroSection.classList.toggle("is-hidden", !show);
  dom.card.classList.toggle("card-compact", !show);
};



/**
 * Возвращает случайный элемент из массива.
 */
function randomChoice(arr) {
  if (arr.length === 0) {
    throw new Error('Массив пуст');
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}


/**
 * Функция для выбора элемента из массива с весами.
 * @param {Array} items
 * @param {Array} weights
 * @returns
 */
function randomChoiceWeighted(items, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    if (random < weights[i]) {
      return items[i];
    }
    random -= weights[i];
  }
}


/**
 * Возвращает случайный ключ из объекта.
 * @param {Map} obj
 */
function randomKey(obj) {
  const keys = Object.keys(obj);
  if (keys.length === 0) throw new Error('Объект пуст');
  return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * Возвращает случайный ключ из объекта с весами.
 * @param {Map} obj
 * @param {Map} weights
 * @returns
 */
function randomKeyWeighted(obj, weights) {
  const keys = Object.keys(obj);

  if (keys.length === 0) {
    throw new Error('Объект пуст');
  }

  // Проверяем, что для каждого ключа из obj есть вес
  let totalWeight = 0;
  for (const key of keys) {
    if (!(key in weights)) {
      throw new Error(`Отсутствует вес для ключа: ${key}`);
    }
    const w = weights[key];
    if (typeof w !== 'number' || w < 0) {
      throw new Error(`Некорректный вес для ключа "${key}": ${w}`);
    }
    totalWeight += w;
  }

  if (totalWeight === 0) {
    throw new Error('Сумма весов равна нулю');
  }

  let random = Math.random() * totalWeight;

  for (const key of keys) {
    random -= weights[key];
    if (random < 0) {
      return key;
    }
  }

  // На случай погрешностей с плавающей точкой
  return keys[keys.length - 1];
}


/**
 * Создает SVG-изображение для облика кликера.
 */
function createSkinSvg(background, highlight, accent, glyph) {
  const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${background}" />
                    <stop offset="100%" stop-color="${highlight}" />
                </linearGradient>
            </defs>
            <rect width="512" height="512" rx="84" ry="84" fill="url(#grad)" />
            <circle cx="256" cy="256" r="168" fill="${accent}" opacity="0.32" />
            <circle cx="256" cy="256" r="120" fill="none" stroke="rgba(255,255,255,0.65)" stroke-width="14" stroke-dasharray="12 18" />
            <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="144" font-family="'Segoe UI', 'Inter', sans-serif" fill="rgba(255,255,255,0.92)">${glyph}</text>
        </svg>
    `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
};

/**
 * Достает контекст пользователя из Telegram
 */
function extractUserContext() {
  const user = tg.initDataUnsafe?.user;
  if (!user && !user?.id) {
    return {
      id: null,
      username: null,
      first_name: null,
      last_name: null,
      isFromTelegram: false,
    };
  }
  const idString = String(user.id).trim();
  try {
    localStorage.removeItem(LOCAL_PLAYER_ID_KEY);
  } catch (error) {
    console.warn("Не удалось сбросить fallback ID:", error);
  }
  return {
    id: idString,
    username: user.username ?? null,
    first_name: user.first_name ?? null,
    last_name: user.last_name ?? null,
    isFromTelegram: true,
  };
}

/**
* Получаем необходимое количество очков для текущего уровня
* @param {number} level Уровень
* @return {number} Необходимое количество очков для текущего уровня
*/
const getLevelGoal = (level) =>
  Math.max(
    BASE_LEVEL_GOAL,
    Math.round(BASE_LEVEL_GOAL * Math.pow(LEVEL_GROWTH_FACTOR, level)),
  );

/**
* Получаем название уровня
* @param {number} level Уровень
* @return {string} Название уровня
*/
const getLevelName = (level) =>
  LEVEL_TITLE_PRESETS[level] ?? `${DYNAMIC_LEVEL_PREFIX}${level + 1}`;

/**
 * Возвращает предыдущую цель
 * @return {number} Предыдущая цель
 */
const getPreviousGoal = () => (level === 0 ? 0 : getLevelGoal(level - 1));

/**
 * Возвращает сколько очков нужно для следующего уровня
 * @return {number} Необходимое количество очков для следующего уровня
 */
const getLevelSpan = () => Math.max(getLevelGoal(level) - getPreviousGoal(), 1);

/**
 * Возвращает количество очков, которые уже набрано, в текущем уровне
 * @return {number} Прогресс в текущем уровне
 */
const getProgressInLevel = () => score - getPreviousGoal();

/**
 * Ограничивает значение в заданном диапазоне
 * @param {number} value Значение для ограничения
 * @param {number} min Минимальное значение
 * @param {number} max Максимальное значение
 * @return {number} Ограниченное значение
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Форматирует число в строку с разделителями тысяч
 * @param {number} value Число для форматирования
 * @return {string} Форматированное число
 */
const formatNumber = (value) =>
  Number(value || 0).toLocaleString("ru-RU");

/**
 * Возвращает уровень улучшения по его имени
 * @param {string} upgrade_name Имя улучшения
 * @return {number} Уровень улучшения
 */
const getUpgradeLevel = (upgrade_name) => upgradeLevels[upgrade_name] ?? 0;

/**
 * Возвращает стоимость улучшения по его определению
 * @param {object} definition Определение улучшения
 * @return {number} Стоимость улучшения
 */
const getUpgradeCost = (definition) => {
  const currentLevel = getUpgradeLevel(definition.id);
  return Math.round(definition.baseCost * Math.pow(definition.costGrowth, currentLevel));
};

/**
 * Валидирует текущие уровни улучшений в словарь
 * @return {Map<string, number>} Словарь с уровнями улучшений
 */
const validateUpgrades = () => {
  const validated = {};
  Object.keys(upgradeLevels)
    .sort()
    .forEach((id) => {
      const level = upgradeLevels[id];
      if (level > 0 && UPGRADE_IDS.has(id)) {
        validated[id] = level;
      }
    });
  return validated;
};

/**
 * Заменяет дочерние элементы контейнера безопасным способом
 * @param {Element} container Контейнер, в котором нужно заменить дочерние элементы
 * @param {DocumentFragment} fragment Фрагмент, который нужно вставить в контейнер
 */
const replaceChildrenSafe = (container, fragment) => {
  if (!container || !fragment) {
    return;
  }
  if (typeof container.replaceChildren === "function") {
    container.replaceChildren(fragment);
    return;
  }
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  container.appendChild(fragment);
};


const scheduleComboDelay = () => {
  if (comboDelayTimeoutId) {
    clearTimeout(comboDelayTimeoutId);
  }
  comboDelayTimeoutId = window.setTimeout(() => {
    comboDelayTimeoutId = null;
    if (combo !== 1) {
      combo = SETTINGS.minCombo || 1;
      updateCombo();
    }
  }, SETTINGS.comboWindowMs + 250);
};
