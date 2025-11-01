const ensurePassiveTimer = () => {
  if (passiveIncomeIntervalId) {
    window.clearInterval(passiveIncomeIntervalId);
    passiveIncomeIntervalId = null;
  }

  if (modifiers.passivePerTick > 0) {
    passiveIncomeIntervalId = window.setInterval(() => {
      addCurrency(modifiers.passivePerTick);
    }, PASSIVE_TICK_MS);
  }
};


const renderCurrency = () => {
  if (dom.currencyInline) {
    dom.currencyInline.textContent = `${formatNumber(currency)} ${CURRENCY_SYMBOL}`;
  }
  if (dom.currencyValue) {
    dom.currencyValue.textContent = formatNumber(currency);
  }
  if (dom.passiveRate) {
    const passive = modifiers.passivePerTick;
    dom.passiveRate.textContent = passive > 0
      ? `Пассивный доход (${CURRENCY_NAME}): +${formatNumber(passive)} ${CURRENCY_SYMBOL} / ${(PASSIVE_TICK_MS / 1000)}с`
      : `Пассивный доход (${CURRENCY_NAME}): отсутствует`;
  }
};

const attemptPurchase = (definition) => {
  const currentLevel = getUpgradeLevel(definition.id);

  const cost = getUpgradeCost(definition);
  if (!spendCurrency(cost)) {
    tg.HapticFeedback?.impactOccurred?.("light");
    return;
  }

  upgradeLevels[definition.id] = currentLevel + 1;

  applyUpgradeEffects();
  renderUpgrades();
  tg.HapticFeedback?.notificationOccurred?.("success");
};

const renderUpgrades = () => {
  if (!dom.upgradeList) {
    return;
  }

  const fragment = document.createDocumentFragment();

  UPGRADE_DEFINITIONS.forEach((definition) => {
    const level = getUpgradeLevel(definition.id);
    const cost = getUpgradeCost(definition);

    const card = document.createElement("div");
    card.className = "upgrade-card";
    card.dataset.upgradeId = definition.id;

    const header = document.createElement("header");

    const title = document.createElement("h3");
    title.className = "upgrade-card-title";
    title.textContent = definition.name;
    // title.textContent = definition.id;


    const levelBadge = document.createElement("span");
    levelBadge.className = "upgrade-card-level";
    levelBadge.textContent = level > 0 ? `Уровень ${level}` : "Нет улучшений";

    header.appendChild(title);
    header.appendChild(levelBadge);

    const description = document.createElement("p");
    description.className = "upgrade-card-description";
    description.textContent = definition.description;

    const footer = document.createElement("div");
    footer.className = "upgrade-card-footer";

    const costLabel = document.createElement("span");
    costLabel.className = "upgrade-card-cost";
    const costText = document.createElement("span");
    costText.textContent = `Стоимость: ${formatNumber(cost)}`;
    const symbol = document.createElement("span");
    symbol.className = "currency-symbol";
    symbol.textContent = CURRENCY_SYMBOL;
    costLabel.appendChild(costText);
    costLabel.appendChild(symbol);

    const button = document.createElement("button");
    button.className = "buy-button";
    button.type = "button";
    button.dataset.upgradeId = definition.id;

    button.textContent = "Улучшить";
    button.dataset.cost = String(cost);
    button.disabled = currency < cost;
    button.addEventListener("click", () => attemptPurchase(definition));


    footer.appendChild(costLabel);
    footer.appendChild(button);
    card.appendChild(header);
    card.appendChild(description);
    card.appendChild(footer);
    fragment.appendChild(card);
  });

  replaceChildrenSafe(dom.upgradeList, fragment);
  syncUpgradeAffordability();
};


const applyUpgradeEffects = () => {
  SETTINGS.comboWindowMs = BASE_COMBO_WINDOW;
  SETTINGS.maxCombo = BASE_MAX_COMBO;
  modifiers.scoreMultiplier = BASE_SCORE_MULTIPLIER;
  modifiers.currencyPerClick = BASE_CURRENCY_PER_CLICK;
  modifiers.levelReward = BASE_LEVEL_REWARD;
  modifiers.passivePerTick = BASE_PASSIVE_PER_TICK;

  const chronoLevel = getUpgradeLevel("chrono_core");
  if (chronoLevel > 0) {
    SETTINGS.comboWindowMs = BASE_COMBO_WINDOW + chronoLevel * 180;
  }

  const comboCrownLevel = getUpgradeLevel("crown_of_combos");
  if (comboCrownLevel > 0) {
    SETTINGS.maxCombo = BASE_MAX_COMBO + comboCrownLevel;
  }

  const quantumLevel = getUpgradeLevel("quantum_loop");
  if (quantumLevel > 0) {
    modifiers.scoreMultiplier = Number(
      (BASE_SCORE_MULTIPLIER * (1 + 0.15 * quantumLevel)).toFixed(2),
    );
  }

  const magnetLevel = getUpgradeLevel("stellar_magnet");
  if (magnetLevel > 0) {
    modifiers.currencyPerClick = BASE_CURRENCY_PER_CLICK + magnetLevel;
  }

  const dividendLevel = getUpgradeLevel("dividend_protocol");
  if (dividendLevel > 0) {
    modifiers.levelReward = BASE_LEVEL_REWARD + dividendLevel * 75;
  }

  const droneLevel = getUpgradeLevel("drone_fleet");
  if (droneLevel > 0) {
    modifiers.passivePerTick = BASE_PASSIVE_PER_TICK + droneLevel * 4;
  }

  const entropyLevel = getUpgradeLevel("entropy_shield");
  SETTINGS.minCombo = entropyLevel ? entropyLevel : 1;

  const exchangeLevel = getUpgradeLevel("galactic_exchange");
  if (exchangeLevel > 0) {
    modifiers.levelReward = Math.round(
      modifiers.levelReward * (1 + 0.1 * exchangeLevel) + exchangeLevel * 15,
    );
  }


  ensurePassiveTimer();
  syncUpgradeAffordability();
  renderCurrency();
};

const syncUpgradeAffordability = () => {
  if (!dom.upgradeList) {
    return;
  }
  dom.upgradeList.querySelectorAll(".buy-button").forEach((button) => {
    const cost = Number.parseInt(button.dataset.cost ?? "0", 10);
    button.disabled = currency < cost;
  });
};
