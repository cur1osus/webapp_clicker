const serializeUpgrades = () => {
  const upgrades = new Array();
  Object.keys(upgradeLevels).forEach((key) => {
    upgrades.push({ name: key, level: upgradeLevels[key] });
  });
  return upgrades;
};

const buildCurrentProgress = () => ({
  score,
  level,
  currency,
  upgrades: serializeUpgrades(),
  active_skin: currentSkinId,
  owned_skins: Array.from(ownedSkins).sort(),
  has_free_chest: hasFreeChest
});

const signatureFromProgress = (progress) => JSON.stringify(progress)

const saveInLocalStorage = (progress) => {
  try {
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn("Не удалось сохранить прогресс локально:", error);
  }
};

const sendProgress = (progress) => {
  const prepared = {
    ...progress,
    user_id: userContext.id,
  };
  const body = JSON.stringify(prepared);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(API_ENDPOINT, blob)) {
      return;
    }
  }

  fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => { });
};

const flushSave = () => {
  saveTimeoutId = null;
  const currentProgress = buildCurrentProgress();
  const signature = signatureFromProgress(currentProgress);
  const signatureLocalStorage = localStorage.getItem(LOCAL_PROGRESS_KEY);

  if (!signatureLocalStorage || signature !== signatureLocalStorage) {
    saveInLocalStorage(currentProgress);
  }

  if (signature === lastSavedSignature) {
    return;
  }

  lastSavedSignature = signature;
  sendProgress(currentProgress);
};

const scheduleSave = (immediate = false) => {
  // const currentProgress = buildCurrentProgress();
  // saveInLocalStorage(currentProgress);

  if (immediate) {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      saveTimeoutId = null;
    }
    flushSave();
    return;
  }

  if (saveTimeoutId !== null) {
    return;
  }

  saveTimeoutId = window.setTimeout(flushSave, SAVE_DELAY_MS);
};
