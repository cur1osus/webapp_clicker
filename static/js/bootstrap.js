/**
 * Загрузка прогресса при входе в игру
 * @returns {Promise<void>}
 */
const loadInitialProgress = async () => {
  // if (loadProgressFromLocalStorage()) {
  //   console.log("Progress loaded from local storage");
  //   return;
  // }

  if (!userContext.id) {
    return;
  }

  progressLocalStorage = localStorage.getItem(LOCAL_PROGRESS_KEY);
  db_version_from_local_storage = localStorage.getItem("db_version");
  if (!progressLocalStorage || !db_version_from_local_storage) {
    progress = {};
  } else {
    progress = JSON.parse(progressLocalStorage);
    applyLoadedProgress(progress);
  }

  const params_to_version_db = new URLSearchParams({ db_version: db_version_from_local_storage ? db_version_from_local_storage : 0 });
  try {
    const response_version_db = await fetch(`${DB_ENDPOINT}?${params_to_version_db.toString()}`, {
      method: "GET"
    });
    if (response_version_db.ok) {
      return;
    }

    const params = new URLSearchParams({ user_id: String(userContext.id), username: userContext.username ?? "" });
    const response = await fetch(`${API_ENDPOINT}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok || response.status === 204) {
      const hasProgress =
        score > 0 ||
        currency > 0 ||
        level > 0 ||
        Object.keys(upgradeLevels).length > 0;
      setWelcomeCardVisibility(!hasProgress);
      return;
    }

    const loaded_progress = await response.json();
    applyLoadedProgress(loaded_progress);
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(loaded_progress));
    localStorage.setItem("db_version", Number.parseInt(loaded_progress.db_version));
  } catch (error) {
    console.warn("Не удалось загрузить прогресс:", error);
    const hasProgress =
      score > 0 ||
      currency > 0 ||
      level > 0 ||
      Object.keys(upgradeLevels).length > 0;
    setWelcomeCardVisibility(!hasProgress);
  }
};


tabButtons.forEach((button) => {
  const target = button.dataset.tabButton ?? "clicker";
  button.addEventListener("click", () => {
    activateTab(target);
    tg.HapticFeedback?.impactOccurred?.("light");
    if (target === "leaderboard") {
      void loadLeaderboard();
    }
  });
});




function loadProgressFromLocalStorage() {
  const progress = localStorage.getItem(LOCAL_PROGRESS_KEY);
  if (progress) {
    applyLoadedProgress(JSON.parse(progress));
    return true;
  }

  return false;
}

const applyLoadedProgress = (data) => {
  const parsedScore = Number.parseInt(data.score, 10);
  score = Number.isFinite(parsedScore) ? Math.max(0, parsedScore) : 0;

  const storedIndex = Number.parseInt(data.level, 10);
  level = storedIndex

  const storedCurrency = Number.parseInt(data.currency, 10);
  currency = Number.isFinite(storedCurrency) ? Math.max(0, storedCurrency) : 0;

  // Object.keys(upgradeLevels).forEach((key) => {
  //   delete upgradeLevels[key];
  // // });

  data.upgrades.forEach((dict) => {
    Object.keys(dict).forEach((key) => {
      const numericLevel = Number.parseInt(dict[key], 10);
      upgradeLevels[String(key)] = numericLevel;
    });
  });


  // ownedSkins.clear();
  data.owned_skins.forEach((skinId) => {
    if (getSkinById(skinId)) {
      ownedSkins.add(skinId);
    }
  });

  currentSkinId =
    typeof data.active_skin === "string" && ownedSkins.has(data.active_skin)
      ? data.active_skin
      : DEFAULT_SKIN_ID;

  hasFreeChest = data.has_free_chest;

  // applyUpgradeEffects();
  renderUpgrades();
  renderActiveSkin();
  renderOwnedSkins();
  renderChests();

  combo = upgradeLevels?.entropy_shield ?? 1;
  updateLevelIndicator();
  updateCounter();
  updateCombo();
  animateBackground(pickPaletteForLevel(level));

  const hasProgress =
    score > 0 ||
    currency > 0 ||
    level > 0 ||
    Object.keys(upgradeLevels).length > 0;
  setWelcomeCardVisibility(!hasProgress);

  // const snapshot = buildPayload();
  // lastSavedSignature = signatureFromPayload(snapshot);
  // persistLocalProgress(snapshot);
};


const bootstrap = async () => {
  await loadInitialProgress();

  applyUpgradeEffects();
  renderUpgrades();
  applyPalette(lastLevelPalette);
  renderActiveSkin();
  renderOwnedSkins();
  renderChests();
  setChestRefreshTimer();
  activateTab("clicker");

  updateLevelIndicator();
  updateCounter();
  updateCombo();
  scheduleComboDelay();
  renderCurrency();
  scheduleSave();
};

bootstrap();

window.addEventListener("beforeunload", () => scheduleSave(true));
window.addEventListener("pagehide", () => scheduleSave(true));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    scheduleSave(true);
  }
});
