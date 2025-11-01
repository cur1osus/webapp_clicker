const spawnClickDelta = (scoreGain, currencyGain) => {
  const container = document.getElementById("clickDelta");
  if (!container) {
    return;
  }

  const lines = [`+${formatNumber(scoreGain)} очков`];
  if (currencyGain > 0) {
    lines.push(`+${formatNumber(currencyGain)} ${CURRENCY_SYMBOL}`);
  }

  const bubble = document.createElement("span");
  bubble.className = "click-delta-burst";

  lines.forEach((line, index) => {
    const lineNode = document.createElement("span");
    lineNode.className = "click-delta-line";
    if (index === 0) {
      lineNode.classList.add("is-primary");
    }
    lineNode.textContent = line;
    bubble.appendChild(lineNode);
  });

  const offsetX = (Math.random() - 0.5) * 80;
  const offsetY = -80 - Math.random() * 40;
  const peakOffset = -28 - Math.random() * 16;

  bubble.style.setProperty("--offset-x", `${offsetX}px`);
  bubble.style.setProperty("--offset-y", `${offsetY}px`);
  bubble.style.setProperty("--offset-peak", `${peakOffset}px`);

  container.appendChild(bubble);

  const cleanup = () => {
    bubble.remove();
  };

  bubble.addEventListener("animationend", cleanup, { once: true });
  window.setTimeout(cleanup, 900);

  while (container.childElementCount > 5) {
    const firstChild = container.firstElementChild;
    if (firstChild && firstChild !== bubble) {
      firstChild.remove();
    } else {
      break;
    }
  }
};

const pickPaletteForLevel = (index) =>
  levelPalettes[index % levelPalettes.length];

const animateBackground = (palette) => {
  if (palette) {
    lastLevelPalette = palette;
  }
  applyPalette(lastLevelPalette);
};

const triggerLevelUpFlash = () => {
  if (!dom.card || !dom.clickerButton) {
    return;
  }
  dom.card.classList.add("level-up");
  dom.clickerButton.classList.add("level-up");
  window.clearTimeout(levelUpFlashTimeoutId);
  levelUpFlashTimeoutId = window.setTimeout(() => {
    dom.card?.classList.remove("level-up");
    dom.clickerButton?.classList.remove("level-up");
  }, 600);
};

const animateLevelUp = () => {
  const palette = pickPaletteForLevel(level);
  animateBackground(palette);
};

const updateLevelIndicator = () => {
  const currentGoal = getLevelGoal(level);
  const remaining = Math.max(currentGoal - score, 0);

  dom.levelName.textContent = `Уровень: ${getLevelName(level)}`;
  dom.levelGoal.textContent = remaining > 0
    ? `До перехода: ${remaining}`
    : "Порог пройден!";
};

const updateProgress = () => {
  const span = getLevelSpan();
  const progress = clamp(getProgressInLevel(), 0, span);
  const ratio = span === 0 ? 1 : progress / span;
  const percentage = Math.round(ratio * 100);

  dom.progressBar.style.width = `${percentage}%`;
  dom.energyLabel.textContent = `Прогресс: ${percentage}%`;
};

const updateCombo = () => {
  dom.streakLabel.textContent = `Комбо x${combo}`;
  dom.streakLabel.style.background = combo > 1
    ? "rgba(255, 106, 193, 0.22)"
    : "rgba(127, 92, 255, 0.16)";
};

const updateCounter = () => {
  dom.counterValue.textContent = score.toString();
  updateProgress();
};


const levelUp = () => {
  level++;
  updateLevelIndicator();
  updateProgress();

  const reward = Math.max(0, Math.round(modifiers.levelReward));
  if (reward > 0) {
    addCurrency(reward);
  }

  animateLevelUp();

  tg.HapticFeedback?.notificationOccurred?.("success");
};

const evaluateLevelProgression = () => {
  const targetScore = getLevelGoal(level);
  if (score > targetScore) {
    levelUp();
  }
};

if (dom.clickerButton) {

  dom.clickerButton.addEventListener("click", () => {
    registerClick();
    tg.HapticFeedback?.impactOccurred?.("medium");
  });

  // Надёжный pressed-класс для мобилок в Telegram WebView
  const btn = document.querySelector('.clicker-button');

  btn.addEventListener('pointerdown', () => btn.classList.add('pressed'));
  const clear = () => btn.classList.remove('pressed');
  btn.addEventListener('pointerup', clear);
  btn.addEventListener('pointercancel', clear);
  btn.addEventListener('pointerleave', clear);

  // Когда нужно «пульснуть» (level up) — вешаем класс на WRAPPER
  const wrapper = document.querySelector('.clicker-button-wrapper');
  function pulse() {
    wrapper.classList.remove('level-up');
    // перезапуск анимации
    void wrapper.offsetWidth;
    wrapper.classList.add('level-up');
  }
}

function registerClick() {
  if (dom.heroSection) {
    setWelcomeCardVisibility(false);
  }


  const now = Date.now();
  if (now - lastClickTs <= SETTINGS.comboWindowMs) {
    combo = combo >= SETTINGS.maxCombo ? SETTINGS.maxCombo : combo + 1;
  } else {
    combo = SETTINGS.minCombo;
  }

  const clickGain = Math.max(1, Math.round(combo * modifiers.scoreMultiplier));
  score += clickGain;
  lastClickTs = now;

  const currencyGain = Math.max(0, Math.round(combo * modifiers.currencyPerClick));
  if (currencyGain > 0) {
    addCurrency(currencyGain);
  }

  dom.counterValue.animate([{ transform: "scale(1.1)" }, { transform: "scale(1)" }], {
    duration: 160,
    easing: "ease-out",
  });

  // spawnClickDelta(clickGain, currencyGain);

  evaluateLevelProgression();
  updateCounter();
  updateLevelIndicator();
  updateCombo();
  scheduleComboDelay();
  scheduleSave()
};
