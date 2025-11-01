const leaderboardState = {
  items: [],
  lastFetchedAt: 0,
  isLoading: false,
};

if (dom.leaderboardRefresh) {
  dom.leaderboardRefresh.addEventListener("click", () => {
    void loadLeaderboard(true);
    tg.HapticFeedback?.impactOccurred?.("light");
  });
}

async function loadLeaderboard(force = false) {
  if (!dom.leaderboardList || !dom.leaderboardStatus) {
    return;
  }

  const now = Date.now();
  if (
    !force &&
    leaderboardState.items.length > 0 &&
    now - leaderboardState.lastFetchedAt < LEADERBOARD_REFRESH_MS
  ) {
    return;
  }

  if (leaderboardState.isLoading) {
    return;
  }

  leaderboardState.isLoading = true;
  setLeaderboardStatus("Загрузка...", "info");
  if (dom.leaderboardRefresh) {
    dom.leaderboardRefresh.disabled = true;
  }

  try {
    const response = await fetch(`${LEADERBOARD_ENDPOINT}?limit=${LEADERBOARD_LIMIT}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const loaded_leaderboard = await response.json();
    const items = Array.isArray(loaded_leaderboard?.items)
      ? loaded_leaderboard.items
      : Array.isArray(loaded_leaderboard)
        ? loaded_leaderboard
        : [];

    leaderboardState.items = items;
    leaderboardState.lastFetchedAt = Date.now();

    renderLeaderboard(items);
    if (!items.length) {
      setLeaderboardStatus("Пока нет записей. Будь первым в галактике!", "info");
    } else {
      setLeaderboardStatus("", "info");
    }
  } catch (error) {
    console.warn("Не удалось загрузить таблицу лидеров:", error);
    setLeaderboardStatus("Не удалось загрузить таблицу лидеров. Попробуй позже.", "error");
  } finally {
    leaderboardState.isLoading = false;
    if (dom.leaderboardRefresh) {
      dom.leaderboardRefresh.disabled = false;
    }
  }
};

const setLeaderboardStatus = (message, state = "info") => {
  if (!dom.leaderboardStatus) {
    return;
  }
  if (!message) {
    dom.leaderboardStatus.textContent = "";
    dom.leaderboardStatus.hidden = true;
    delete dom.leaderboardStatus.dataset.state;
    return;
  }
  dom.leaderboardStatus.textContent = message;
  dom.leaderboardStatus.hidden = false;
  dom.leaderboardStatus.dataset.state = state;
};

const formatLeaderboardName = (entry) => {
  const username = typeof entry.username === "string" ? entry.username.trim() : "";
  if (username) {
    return username.startsWith("@") ? username : `@${username}`;
  }
  const idString = String(entry.user_id);
  const suffix = idString.slice(-4).padStart(4, "0");
  return `Игрок (${suffix})`;
};

const formatLeaderboardMeta = (entry) => {
  const metaParts = [];
  metaParts.push(`Уровень: ${getLevelName(entry.level)}`);
  // const currencyValue = Number(entry.currency);
  // metaParts.push(`${formatNumber(currencyValue)} ${CURRENCY_SYMBOL}`);
  return metaParts.join(" • ");
};

const renderLeaderboard = (items) => {
  if (!dom.leaderboardList) {
    return;
  }
  dom.leaderboardList.innerHTML = "";
  if (!Array.isArray(items) || items.length === 0) {
    dom.leaderboardList.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();
  const ownId = userContext?.id ? String(userContext.id) : null;

  items.forEach((entry, index) => {
    const rank = index + 1;
    const li = document.createElement("li");
    li.className = "leaderboard-item";

    const rankNode = document.createElement("span");
    rankNode.className = "leaderboard-rank";
    rankNode.textContent = String(rank);

    const userNode = document.createElement("div");
    userNode.className = "leaderboard-user";

    const nameNode = document.createElement("span");
    nameNode.className = "leaderboard-name";
    nameNode.textContent = formatLeaderboardName(entry);

    const metaNode = document.createElement("span");
    metaNode.className = "leaderboard-meta";
    metaNode.textContent = formatLeaderboardMeta(entry);

    userNode.appendChild(nameNode);
    userNode.appendChild(metaNode);

    const scoreNode = document.createElement("div");
    scoreNode.className = "leaderboard-score";

    const scoreValueNode = document.createElement("span");
    scoreValueNode.className = "leaderboard-score-value";
    scoreValueNode.textContent = formatNumber(entry.score ?? 0);

    const scoreLabelNode = document.createElement("span");
    scoreLabelNode.className = "leaderboard-score-label";
    scoreLabelNode.textContent = "очки";

    scoreNode.appendChild(scoreValueNode);
    scoreNode.appendChild(scoreLabelNode);

    li.appendChild(rankNode);
    li.appendChild(userNode);
    li.appendChild(scoreNode);

    if (ownId && String(entry.user_id) === ownId) {
      li.classList.add("is-self");
    }

    fragment.appendChild(li);
  });

  dom.leaderboardList.appendChild(fragment);
  dom.leaderboardList.hidden = false;
};
