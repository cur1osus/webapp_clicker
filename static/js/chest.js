const CHEST_OVERLAY_ANIMATION_MS = 1000;
const REWARD_ICON_MAP = {
  skin: "🎨",
  upgrade: "⚙️",
  currency: "✦",
};

let chestOverlayAnimationTimeoutId = null;
const chestState = {
  rewards: [],
  index: 0,
  done: true,
  defaultLabel: "",
};


const getChestById = (id) => CHEST_DEFINITION_MAP.get(id) ?? null;


const spendCurrency = (amount) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return false;
  }
  if (currency < amount) {
    return false;
  }
  currency -= amount;
  renderCurrency();
  syncUpgradeAffordability();
  return true;
};

const addCurrency = (amount) => {
  if (!Number.isFinite(amount) || amount === 0) {
    return;
  }
  currency = Math.max(0, currency + amount);
  renderCurrency();
  syncUpgradeAffordability();
  renderChests();
};

const formatDuration = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}ч ${minutes.toString().padStart(2, "0")}м`;
  }
  if (minutes > 0) {
    return `${minutes}м ${seconds.toString().padStart(2, "0")}с`;
  }
  return `${seconds}с`;
};


const getChestAvailability = (chest, referenceTs = Date.now()) => {
  if (!chest) {
    return { canOpen: false, statusText: "" };
  }

  if (chest.costType === "free") {
    if (hasFreeChest) {
      return { canOpen: true, statusText: "Готов к открытию" };
    }
    const date = new Date(referenceTs);
    date.setHours(8, 0, 0, 0);
    let isEarlierThanToday = referenceTs < date.getTime();
    if (!isEarlierThanToday) {
      date.setDate(date.getDate() + 1);
    }

    const targetTime = date.getTime();
    const now = new Date().getTime();
    const remaining = targetTime - now;

    return {
      canOpen: false,
      statusText: `Доступно через ${formatDuration(remaining)}`
    };
  }

  if (chest.costType === "currency") {
    const price = Number(chest.costAmount ?? 0);
    if (price <= 0) {
      return { canOpen: true, statusText: "Готов к открытию" };
    }
    if (currency >= price) {
      return { canOpen: true, statusText: "Готов к открытию" };
    }
    return { canOpen: false, statusText: `Нужно ${formatNumber(price)} ${CURRENCY_SYMBOL}` };
  }

  if (chest.costType === "stars") {
    const price = Number(chest.costAmount ?? 0);
    if (price > 0) {
      return { canOpen: true, statusText: `Оплата ${price}★ через Telegram` };
    }
    return { canOpen: true, statusText: "Оплата через Telegram Stars" };
  }

  return { canOpen: true, statusText: "Готов к открытию" };
};


function renderChests() {
  if (!dom.chestList) {
    return;
  }

  const now = Date.now();
  const fragment = document.createDocumentFragment();

  CHEST_DEFINITIONS.forEach((chest) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chest-card";
    button.dataset.chestId = chest.id;

    const header = document.createElement("div");
    header.className = "chest-card-header";

    const title = document.createElement("h3");
    title.className = "chest-card-title";
    title.textContent = chest.name;
    header.appendChild(title);

    const tag = document.createElement("span");
    tag.className = "chest-card-tag";
    if (chest.costType === "free") {
      tag.dataset.type = "free";
      tag.textContent = "Бесплатно";
    } else if (chest.costType === "stars") {
      tag.dataset.type = "premium";
      tag.textContent = "Telegram Stars";
    } else {
      tag.dataset.type = 'crystals'
      tag.textContent = "Кристаллы";
    }
    header.appendChild(tag);

    button.appendChild(header);

    const description = document.createElement("p");
    description.className = "chest-card-description";
    description.textContent = chest.description;
    button.appendChild(description);

    const footer = document.createElement("div");
    footer.className = "chest-card-footer";


    const status = document.createElement("span");
    status.className = "chest-card-status";

    const availability = getChestAvailability(chest, now);
    status.textContent = availability.statusText || "Готов к открытию";
    button.disabled = !availability.canOpen;

    if (availability.canOpen) {
      button.addEventListener("click", () => attemptOpenChest(chest, button));
    }

    footer.appendChild(status);
    button.appendChild(footer);

    fragment.appendChild(button);
  });

  replaceChildrenSafe(dom.chestList, fragment);
};


const createChestRewardCard = (reward, index) => {
  const card = document.createElement("div");
  card.className = "chest-reward-card";
  card.dataset.rewardIndex = String(index);
  card.dataset.type = reward.type;
  if (reward.rarity) {
    card.dataset.rarity = reward.rarity;
  }
  if (reward.theme) {
    card.dataset.theme = reward.theme;
  }
  if (reward?.isNew) {
    card.dataset.new = "true";
  }

  const thumbnail = document.createElement("div");
  thumbnail.className = "chest-reward-thumbnail";
  if (reward.image) {
    const img = document.createElement("img");
    img.src = reward.image;
    img.alt = reward.title ?? "Награда";
    thumbnail.appendChild(img);
  } else {
    const icon = document.createElement("span");
    icon.className = "chest-reward-icon";
    icon.textContent = reward.icon ?? REWARD_ICON_MAP[reward.type] ?? REWARD_ICON_MAP.generic;
    thumbnail.appendChild(icon);
  }
  card.appendChild(thumbnail);

  const title = document.createElement("strong");
  title.className = "chest-reward-title";
  title.textContent = reward.title ?? "Награда";
  card.appendChild(title);

  if (reward.subtitle) {
    const subtitle = document.createElement("span");
    subtitle.className = "chest-reward-subtitle";
    subtitle.textContent = reward.subtitle;
    card.appendChild(subtitle);
  }

  if (reward.badge) {
    const badge = document.createElement("span");
    badge.className = "chest-reward-badge";
    badge.textContent = reward.badge;
    card.appendChild(badge);
  }

  return card;
};

const renderRewardCard = (reward, index) => {
  if (!dom.chestOverlayItems) {
    return;
  }
  dom.chestOverlayItems.innerHTML = "";
  const card = createChestRewardCard(reward, index);
  dom.chestOverlayItems.appendChild(card);
  card.scrollIntoView({ behavior: "smooth", block: "center" });
};

const clearChestRewardCards = () => {
  if (dom.chestOverlayItems) {
    dom.chestOverlayItems.innerHTML = "";
  }
};

const updateChestOverlayActionState = () => {
  if (!dom.chestOverlayAction) {
    return;
  }
  dom.chestOverlayAction.textContent = chestState.done ? "Готово" : "Открыть";
};

const updateChestOverlayProgress = () => {
  if (!dom.chestOverlayLabel) {
    return;
  }
  dom.chestOverlayLabel.classList.remove("is-alert");
  const total = chestState.rewards.length;
  if (total <= 0) {
    dom.chestOverlayLabel.hidden = true;
    dom.chestOverlayLabel.textContent = "";
    return;
  }
  if (total === 1) {
    if (chestState.defaultLabel) {
      dom.chestOverlayLabel.hidden = false;
      dom.chestOverlayLabel.textContent = chestState.defaultLabel;
    } else {
      dom.chestOverlayLabel.hidden = true;
      dom.chestOverlayLabel.textContent = "";
    }
    return;
  }
  const opened = Math.min(chestState.index, total);

  dom.chestOverlayMessage.hidden = opened == total ? false : true;

  dom.chestOverlayLabel.textContent = `${total - opened}`;
  dom.chestOverlayLabel.style.display = opened == total ? 'none' : 'flex';

  dom.chestOverlayVisual.style.display = opened > 0 ? 'none' : 'flex';

  const nextReward = chestState.done ? null : chestState.rewards[chestState.index];

  const shouldAlert = nextReward && (nextReward.rarity === "legendary" || nextReward.theme === "legendary");
  if (shouldAlert) {
    dom.chestOverlayLabel.classList.add("is-alert");
  }
};

const renderNextRewardCard = () => {
  if (chestState.done) {
    return false;
  }

  // если нет наград, завершаем открытие сундука
  const total = chestState.rewards.length;
  if (total === 0) {
    chestState.done = true;
    updateChestOverlayActionState();
    updateChestOverlayProgress();
    return false;
  }

  // если мы все награды открыли, завершаем открытие сундука
  const currentIndex = Math.min(chestState.index, total - 1);
  const reward = chestState.rewards[currentIndex];
  if (!reward) {
    chestState.done = true;
    updateChestOverlayActionState();
    updateChestOverlayProgress();
    return false;
  }

  // если награды еще остались, отображаем следующую награду
  renderRewardCard(reward, currentIndex);
  chestState.index = currentIndex + 1;
  if (chestState.index >= total) {
    chestState.done = true;
  }
  updateChestOverlayActionState();
  updateChestOverlayProgress();
  return true;
};

const prepareChestState = (descriptor) => {
  clearChestRewardCards();
  chestState.rewards = descriptor.rewards;
  chestState.index = 0;
  chestState.done = descriptor.rewards.length === 0;
  chestState.defaultLabel = descriptor.rewards.length;

  updateChestOverlayActionState();
  updateChestOverlayProgress();
};

const resetChestRevealSequence = () => {
  clearChestRewardCards();
  chestState.rewards = [];
  chestState.index = 0;
  chestState.done = true;
  chestState.defaultLabel = "";
  updateChestOverlayActionState();
  updateChestOverlayProgress();
};


const handleTapOnChest = () => {
  const revealed = renderNextRewardCard();
  if (revealed) {
    tg.HapticFeedback?.selectionChanged?.();
  }
};


const formatRewardPlural = (count) => {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return "наград";
  }
  const mod10 = count % 10;
  if (mod10 === 1) {
    return "награда";
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return "награды";
  }
  return "наград";
};

const animateChestButton = (button) => {
  if (!button) {
    return;
  }
  button.classList.add("is-opening");
  window.setTimeout(() => {
    button.classList.remove("is-opening");
  }, 520);
};


const setChestOverlayTheme = (theme) => {
  if (!dom.chestOverlay) {
    return;
  }
  if (theme) {
    dom.chestOverlay.dataset.theme = theme;
  } else {
    delete dom.chestOverlay.dataset.theme;
  }
};

const applyChestOverlayDescriptor = (chestName, receivedRewards, rewards) => {
  if (dom.chestOverlayChestName) {
    dom.chestOverlayChestName.textContent = chestName;
  }
  if (dom.chestOverlayMessage) {
    dom.chestOverlayMessage.hidden = true;
    dom.chestOverlayMessage.textContent = receivedRewards;
  }
  if (dom.chestOverlayLabel) {
    const previewCount = Array.isArray(rewards) ? rewards.length : 0;
    dom.chestOverlayLabel.hidden = false;
    dom.chestOverlayLabel.textContent = `${previewCount}`;
  }
  if (dom.chestOverlayItems) {
    dom.chestOverlayItems.innerHTML = "";
  }
};

const hideChestOverlay = () => {
  if (!dom.chestOverlay || dom.chestOverlay.hidden) {
    return;
  }
  resetChestRevealSequence();
  dom.chestOverlay.dataset.visible = "false";
  dom.chestOverlay.setAttribute("aria-hidden", "true");
  window.clearTimeout(chestOverlayAnimationTimeoutId);
  chestOverlayAnimationTimeoutId = window.setTimeout(() => {
    if (!dom.chestOverlay) {
      return;
    }
    dom.chestOverlay.hidden = true;
    dom.chestOverlay.dataset.animating = "false";
  }, 240);

};

const openChestOverlay = (descriptor) => {
  if (!dom.chestOverlay) {
    return false;
  }
  applyChestOverlayDescriptor(descriptor.chestName, descriptor.receivedRewards, descriptor.rewards);
  setChestOverlayTheme(descriptor.theme);
  dom.chestOverlay.hidden = false;
  dom.chestOverlay.setAttribute("aria-hidden", "false");
  dom.chestOverlay.dataset.visible = "true";
  dom.chestOverlay.dataset.animating = "true";
  window.clearTimeout(chestOverlayAnimationTimeoutId);
  chestOverlayAnimationTimeoutId = window.setTimeout(() => {
    if (dom.chestOverlay) {
      dom.chestOverlay.dataset.animating = "false";
    }
  }, CHEST_OVERLAY_ANIMATION_MS);
  prepareChestState(descriptor);
  dom.chestOverlayAction?.focus({ preventScroll: true });
  return true;
};

const bindChestOverlayInteractions = () => {
  if (!dom.chestOverlay) {
    return;
  }

  const isActionElement = (target) =>
    Boolean(dom.chestOverlayAction && (target === dom.chestOverlayAction || target.closest?.(".chest-overlay-action")));
  const isCloseElement = (target) =>
    Boolean(dom.chestOverlayClose && (target === dom.chestOverlayClose || target.closest?.(".chest-overlay-close")));

  dom.chestOverlay.addEventListener("click", (event) => {
    const target = event.target;
    const isBackdrop = target?.dataset?.overlayClose === "true";
    const wantsClose = isBackdrop || isActionElement(target) || isCloseElement(target);

    if (!chestState.done) {
      handleTapOnChest();
      return;
    }

    if (wantsClose) {
      hideChestOverlay();
      dom.chestOverlayLabel.style.display = "inline-flex";
      dom.chestOverlayVisual.style.display = "flex";
      tg.HapticFeedback?.impactOccurred?.("light");
    }
  });
};

bindChestOverlayInteractions();

const setChestRefreshTimer = () => {
  if (chestRefreshIntervalId) {
    window.clearInterval(chestRefreshIntervalId);
  }
  if (!dom.chestList) {
    return;
  }
  chestRefreshIntervalId = window.setInterval(() => {
    renderChests();
  }, CHEST_REFRESH_INTERVAL_MS);
};

setChestRefreshTimer();

const buildOverlayReward = (reward) => {
  if (reward.type === "skin") {
    const rarity = reward.skin.rarity;
    return {
      type: "skin",
      title: reward.skin.name,
      subtitle: describeRarity(rarity),
      badge: reward.isNew ? "Новый скин" : "Скин",
      image: reward.skin.image,
      rarity,
      theme: rarity,
      isCompensation: Boolean(reward.isCompensation),
    };
  }
  if (reward.type === "upgrade") {
    return {
      type: "upgrade",
      title: reward.upgrade.name,
      subtitle: `Уровень ${reward.level}`,
      badge: "Улучшение",
      icon: REWARD_ICON_MAP.upgrade,
      theme: "upgrade",
      isCompensation: Boolean(reward.isCompensation),
    };
  }
  if (reward.type === "currency") {
    const amountText = formatNumber(reward.amount);
    return {
      type: "currency",
      title: `+${amountText} ${CURRENCY_SYMBOL}`,
      subtitle: "Астральные кристаллы",
      badge: reward.isCompensation ? "Компенсация" : "Кристаллы",
      icon: REWARD_ICON_MAP.currency,
      theme: "currency",
      isCompensation: Boolean(reward.isCompensation),
    };
  }
};

const describeChestRewardsOutcome = (chestName, rewards) => {
  const rawRewards = rewards
    .map((reward) => buildOverlayReward(reward))
    .filter((item) => Boolean(item));

  const total = rawRewards.length;
  const plural = formatRewardPlural(total);
  const names = rawRewards.map((item) => item.title).filter(Boolean);
  const preview = names.join(" → ");

  return {
    chestName,
    receivedRewards: `${preview}`,
    rewards: rawRewards,
    theme: "rare",
  };
};


const wrapperChestReward = (reward) => {
  if (!reward) {
    return;
  }
  if (reward.type === "skin") {
    const locked = getLockedSkins();
    if (locked.length === 0) {
      const amount = Number(reward.amount ?? 0);
      addCurrency(amount);
      return { type: "currency", amount: reward.amount, isCompensation: true };
    }
    const skin = randomChoice(locked);
    const unlocked = grantSkin(skin.id, { silent: true });
    return { type: "skin", skin, isNew: unlocked };
  }
  if (reward.type === "upgrade") {
    const upgrade = randomChoice(UPGRADE_DEFINITIONS);
    const newLevel = getUpgradeLevel(upgrade.id) + 1;
    upgradeLevels[upgrade.id] = newLevel;
    applyUpgradeEffects();
    renderUpgrades();
    return {
      type: "upgrade",
      upgrade,
      level: newLevel,
      isCompensation: false,
    };
  };
  if (reward.type === "currency") {
    const amount = Number(reward.amount ?? 0);
    addCurrency(amount);
    return { type: "currency", amount, isCompensation: false };
  }
};

const resolveChestRewards = (chest) => {
  const rewards = Array.isArray(chest?.rewards) && chest.rewards.length > 0
    ? chest.rewards
    : [{ type: "currency", weight: 1, amount: 150 }];

  const rolls = randomChoice(chest.rewardRolls);
  const weights_rewards = rewards.map((entry) => Number(entry.weight ?? 1));
  const chosen_rewards = [];
  for (let roll = 0; roll < rolls; roll += 1) {
    const reward = randomChoiceWeighted(rewards, weights_rewards);
    chosen_rewards.push(wrapperChestReward(reward));
  }
  return chosen_rewards;
};



const renderChestResult = (chest, rewards) => {
  const descriptor = describeChestRewardsOutcome(chest.name, rewards);
  const displayed = openChestOverlay(descriptor);
  if (displayed) {
    tg.HapticFeedback?.notificationOccurred?.("success");
    return;
  }
};

const attemptOpenChest = (chest, sourceButton = null) => {
  if (!chest) {
    return;
  }
  const now = Date.now();
  const availability = getChestAvailability(chest, now);
  if (!availability.canOpen) {
    tg.HapticFeedback?.impactOccurred?.("light");
    renderChests();
    return;
  }

  const triggerButtonAnimation = () => {
    if (sourceButton) {
      animateChestButton(sourceButton);
    }
  };

  if (chest.costType === "currency") {
    const price = Number(chest.costAmount ?? 0);
    if (price > 0 && !spendCurrency(price)) {
      tg.HapticFeedback?.impactOccurred?.("light");
      renderChests();
      return;
    }
  } else if (chest.costType === "stars") {
    const price = Number(chest.costAmount ?? 0);
    const confirmationMessage = `Открыть «${chest.name}» за ${price} Telegram Stars?`;
    if (typeof window.confirm === "function") {
      const approved = window.confirm(confirmationMessage);
      if (!approved) {
        return;
      }
    }
  } else if (chest.costType === "free") {
    hasFreeChest = false;
  }

  triggerButtonAnimation();

  const rewards = resolveChestRewards(chest);
  renderChestResult(chest, rewards);
  scheduleSave();


  // renderChests();
  // renderOwnedSkins();
  // renderActiveSkin();
};
