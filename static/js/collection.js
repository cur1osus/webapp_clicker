const getSkinById = (id) => TAP_SKINS.find((skin) => skin.id === id) ?? null;


/*
* Сортировка набора скинов для отображения
*/
const sortSkinsForDisplay = (skins) =>
  [...skins].sort((a, b) => {
    const orderA = SKIN_RARITY_ORDER[a.rarity] ?? 99;
    const orderB = SKIN_RARITY_ORDER[b.rarity] ?? 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name, "ru-RU");
  });


const renderActiveSkin = () => {
  const skin = getSkinById(currentSkinId)

  if (dom.clickerButtonImage) {
    dom.clickerButtonImage.src = skin.image;
    dom.clickerButtonImage.alt = skin.name;
  }

  if (dom.currentSkinPreview) {
    dom.currentSkinPreview.src = skin.image;
  }

  if (dom.currentSkinMeta) {
    const fragment = document.createDocumentFragment();

    const title = document.createElement("strong");
    title.textContent = skin.name;
    fragment.appendChild(title);

    const rarityLabel = document.createElement("span");
    rarityLabel.className = "skin-card-rarity";
    rarityLabel.dataset.rarity = skin.rarity;
    rarityLabel.textContent = SKIN_RARITY_LABEL[skin.rarity] ?? skin.rarity;
    fragment.appendChild(rarityLabel);

    const description = document.createElement("span");
    description.textContent = skin.description;
    fragment.appendChild(description);

    const progress = document.createElement("span");
    progress.textContent = `Собрано ${ownedSkins.size} из ${TAP_SKINS.length} скинов`;
    fragment.appendChild(progress);

    replaceChildrenSafe(dom.currentSkinMeta, fragment);
  }
};

const renderOwnedSkins = () => {
  if (!dom.ownedSkinsList) {
    return;
  }

  const fragment = document.createDocumentFragment();
  sortSkinsForDisplay(TAP_SKINS).forEach((skin) => {
    const owned = ownedSkins.has(skin.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "skin-card";
    button.dataset.skinId = skin.id;
    button.dataset.owned = owned ? "true" : "false";
    button.dataset.selected = skin.id === currentSkinId ? "true" : "false";

    const thumbnail = document.createElement("div");
    thumbnail.className = "skin-card-thumbnail";
    const img = document.createElement("img");
    img.src = skin.image;
    img.alt = skin.name;
    thumbnail.appendChild(img);
    button.appendChild(thumbnail);

    const name = document.createElement("span");
    name.className = "skin-card-name";
    name.textContent = skin.name;
    button.appendChild(name);

    const rarity = document.createElement("span");
    rarity.className = "skin-card-rarity";
    rarity.dataset.rarity = skin.rarity;
    rarity.textContent = SKIN_RARITY_LABEL[skin.rarity] ?? skin.rarity;
    button.appendChild(rarity);

    const status = document.createElement("span");
    status.className = "skin-card-status";
    if (owned) {
      status.textContent = skin.id === currentSkinId ? "Активно" : "В коллекции";
      button.addEventListener("click", () => selectSkin(skin.id));
    } else {
      status.textContent = "Доступно в сундуках";
      button.disabled = true;
    }
    button.appendChild(status);

    fragment.appendChild(button);
  });

  replaceChildrenSafe(dom.ownedSkinsList, fragment);
};

const selectSkin = (skinId) => {
  if (!ownedSkins.has(skinId) || currentSkinId === skinId) {
    return;
  }
  currentSkinId = skinId;
  renderActiveSkin();
  renderOwnedSkins();
  tg.HapticFeedback?.impactOccurred?.("light");
};

const grantSkin = (skinId, options = {}) => {
  const skin = getSkinById(skinId);
  if (!skin) {
    return false;
  }
  const { silent = false } = options ?? {};
  const alreadyOwned = ownedSkins.has(skinId);
  ownedSkins.add(skinId);
  if (!alreadyOwned) {
    renderActiveSkin();
    renderOwnedSkins();
  }
  return !alreadyOwned;
};


const getLockedSkins = () => TAP_SKINS.filter((skin) => !ownedSkins.has(skin.id));

const describeRarity = (rarity) => SKIN_RARITY_LABEL[rarity] ?? rarity;

// const clampRewardRolls = (value) => Math.max(1, Math.min(5, Math.floor(value)));

// const determineChestRewardRollCount = (chest) => {
//   const spec = chest?.rewardRolls;
//   if (Array.isArray(spec) && spec.length > 0) {
//     const minRaw = Number(spec[0]);
//     const maxRaw = Number(spec[1] ?? spec[0]);
//     if (Number.isFinite(minRaw)) {
//       const min = minRaw;
//       const max = Number.isFinite(maxRaw) ? maxRaw : min;
//       if (max <= min) {
//         return min;
//       }
//       const span = max - min + 1;
//       return min + Math.floor(Math.random() * span);
//     }
//   }
//   const numeric = Number(spec);
//   if (Number.isFinite(numeric) && numeric > 0) {
//     return clampRewardRolls(numeric);
//   }
//   return 1;
// };

// const determineOverlayThemeFromItems = (items = []) => {
//   const priorities = ["legendary", "epic", "rare", "common", "upgrade", "currency"];
//   for (const theme of priorities) {
//     if (items.some((item) => item?.theme === theme || item?.rarity === theme)) {
//       return theme;
//     }
//   }
//   return "rare";
// };


