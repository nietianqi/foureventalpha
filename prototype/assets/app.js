(function () {
  const data = window.prototypeData;
  const app = document.getElementById("app");

  if (!data || !app) {
    return;
  }

  const summaryById = Object.fromEntries(data.stockSummaries.map((item) => [item.id, item]));
  const detailById = data.stockDetails;
  const strategyById = Object.fromEntries(data.strategyCards.map((item) => [item.id, item]));
  const sceneById = Object.fromEntries(data.avoidSceneCards.map((item) => [item.id, item]));
  const valuationPresetById = Object.fromEntries(data.valuationPresets.map((item) => [item.id, item]));
  const trendByMarket = Object.fromEntries(data.trendSignals.map((item) => [item.market, item]));
  const liquidityRank = { 高: 0, 中高: 1, 中: 2, 中低: 3, 低: 4 };
  const liquidityValues = Array.from(new Set(data.stockSummaries.map((item) => item.liquidity)))
    .sort((left, right) => (liquidityRank[left] ?? 99) - (liquidityRank[right] ?? 99));
  const screenerStateValues = ["关注", "观察", "回避"];
  const screenerPresets = [
    { id: "all", label: "全部样本", summary: "查看当前市场全部可比样本，按结论与风险优先级排序。" },
    { id: "focus", label: "关注样本", summary: "优先筛出当前已经进入“关注”结论的标的。" },
    { id: "repair", label: "修复候选", summary: "聚焦政策修复、估值修复、治理修复与回购改善链条。" },
    { id: "income", label: "股息/现金流", summary: "优先筛高股息或自由现金流更扎实的样本。" },
    { id: "avoid", label: "回避排查", summary: "先把高风险或当前结论已转回避的样本排出来检查。" }
  ];
  const screenerPresetById = Object.fromEntries(screenerPresets.map((item) => [item.id, item]));
  const marketPathById = {
    cn: "market-cn.html",
    us: "market-us.html",
    jp: "market-jp.html",
    hk: "market-hk.html"
  };
  const riskTone = { 低: "success", 中: "warning", 高: "danger" };
  const stateTone = { 关注: "success", 观察: "warning", 回避: "danger" };
  const valuationTone = {
    "低估可跟踪": "success",
    "合理可跟踪": "primary",
    "合理可持有": "primary",
    "分红型可守": "success",
    "等待更好价格": "warning",
    "修复中观察": "warning",
    "趋势过热不追": "danger",
    "估值陷阱回避": "danger"
  };
  const riskValues = ["低", "中", "高"];
  const valuationThresholds = {
    q80: 80,
    q70: 70,
    q60: 60,
    m25: 25,
    m15: 15,
    m5: 5
  };

  function currentParams() {
    return new URLSearchParams(window.location.search);
  }

  function safeMarket(value) {
    return data.marketOrder.includes(value) ? value : "cn";
  }

  function safeStock(value) {
    return summaryById[value] ? value : data.stockSummaries[0].id;
  }

  function safeRisk(value) {
    return riskValues.includes(value) ? value : "all";
  }

  function safeFilterValue(group, value, fallback) {
    const options = data.valuationFilterOptions[group];
    return options.some((item) => item.value === value) ? value : fallback;
  }

  function safeValPreset(marketId, value) {
    const defaults = data.markets[marketId].valuationDefaults;
    return valuationPresetById[value] ? value : defaults.preset;
  }

  function marketUrl(marketId) {
    return marketPathById[safeMarket(marketId)];
  }

  function valuationPageUrl(marketId, filters) {
    const next = new URLSearchParams();
    const config = filters || {};

    next.set("market", safeMarket(marketId));

    [
      ["valPreset", config.preset],
      ["valBand", config.band],
      ["valQuality", config.quality],
      ["valMargin", config.margin],
      ["valSize", config.size]
    ].forEach(([key, value]) => {
      if (value && value !== "all") {
        next.set(key, value);
      }
    });

    return `valuation.html?${next.toString()}`;
  }

  function trendPageUrl(marketId) {
    return `trend.html?market=${safeMarket(marketId)}`;
  }

  function screenerPageUrl(marketId, filters) {
    const next = new URLSearchParams();
    const config = filters || {};
    const safeMarketId = safeMarket(marketId);

    next.set("market", safeMarketId);

    [
      ["scrPreset", safeScreenerPreset(config.preset)],
      ["scrStrategy", safeScreenerStrategy(safeMarketId, config.strategy)],
      ["scrRisk", safeRisk(config.risk)],
      ["scrLiquidity", safeScreenerLiquidity(config.liquidity)],
      ["scrState", safeScreenerState(config.state)],
      ["scrQuery", config.query && config.query.trim()]
    ].forEach(([key, value]) => {
      if (value && value !== "all") {
        next.set(key, value);
      }
    });

    return `screener.html?${next.toString()}`;
  }

  function marketContextUrl(pageId, marketId) {
    if (pageId === "valuation") {
      return valuationPageUrl(marketId);
    }

    if (pageId === "trend") {
      return trendPageUrl(marketId);
    }

    if (pageId === "screener") {
      return screenerPageUrl(marketId, getScreenerState(safeMarket(currentParams().get("market"))));
    }

    return marketUrl(marketId);
  }

  function stockUrl(stockId) {
    return `stock.html?stock=${stockId}`;
  }

  function boardUrl(marketId, boardType, filters) {
    const next = new URLSearchParams();
    const prefix = boardType === "avoid" ? "av" : "op";
    const entries = [
      [`${prefix}Strategy`, filters && filters.strategy],
      [`${prefix}Risk`, filters && filters.risk],
      [`${prefix}Scene`, filters && filters.scene]
    ];

    entries.forEach(([key, value]) => {
      if (value && value !== "all") {
        next.set(key, value);
      }
    });

    const query = next.toString();
    const hash = boardType === "avoid" ? "#avoid-board" : "#opportunity-board";
    return `${marketUrl(marketId)}${query ? `?${query}` : ""}${hash}`;
  }

  function getValuationParams(params) {
    const current = params || currentParams();

    return {
      preset: current.get("valPreset"),
      band: current.get("valBand"),
      quality: current.get("valQuality"),
      margin: current.get("valMargin"),
      size: current.get("valSize")
    };
  }

  function safeScreenerPreset(value) {
    return screenerPresets.some((item) => item.id === value) ? value : "all";
  }

  function safeScreenerState(value) {
    return screenerStateValues.includes(value) ? value : "all";
  }

  function safeScreenerLiquidity(value) {
    return liquidityValues.includes(value) ? value : "all";
  }

  function safeScreenerStrategy(marketId, value) {
    const market = data.markets[safeMarket(marketId)];
    return market.strategyIds.includes(value) ? value : "all";
  }

  function getScreenerStrategyOptions(marketId) {
    const market = data.markets[safeMarket(marketId)];
    return [{ value: "all", label: "全部策略" }].concat(
      market.strategyIds.map((strategyId) => ({
        value: strategyId,
        label: strategyById[strategyId].name
      }))
    );
  }

  function getScreenerState(marketId, params) {
    const current = params || currentParams();
    const safeMarketId = safeMarket(marketId || current.get("market"));

    return {
      preset: safeScreenerPreset(current.get("scrPreset")),
      strategy: safeScreenerStrategy(safeMarketId, current.get("scrStrategy")),
      risk: safeRisk(current.get("scrRisk")),
      liquidity: safeScreenerLiquidity(current.get("scrLiquidity")),
      state: safeScreenerState(current.get("scrState")),
      query: (current.get("scrQuery") || "").trim()
    };
  }

  function setTitle(title) {
    document.title = `${title} | ${data.site.name}`;
  }

  function pill(text, tone) {
    return `<span class="pill ${tone || "neutral"}">${text}</span>`;
  }

  function optionList(items, selectedValue) {
    return items
      .map((item) => `<option value="${item.value}"${item.value === selectedValue ? " selected" : ""}>${item.label}</option>`)
      .join("");
  }

  function optionLabel(group, value) {
    const item = data.valuationFilterOptions[group].find((entry) => entry.value === value);
    return item ? item.label : "未设置";
  }

  function updateQueryGroup(values) {
    const next = currentParams();

    Object.keys(values).forEach((key) => next.delete(key));

    Object.entries(values).forEach(([key, value]) => {
      if (value && value !== "all") {
        next.set(key, value);
      }
    });

    const nextUrl = `${window.location.pathname}${next.toString() ? `?${next.toString()}` : ""}${window.location.hash || ""}`;
    window.history.replaceState({}, "", nextUrl);
  }

  function renderHeader(activePage, activeMarket, activeStockId) {
    const navLinks = [
      { id: "home", label: "首页", href: "index.html" },
      { id: "market", label: "市场页", href: marketUrl(activeMarket || "cn") },
      { id: "valuation", label: "合理股价估值", href: valuationPageUrl(activeMarket || "cn") },
      { id: "trend", label: "趋势", href: trendPageUrl(activeMarket || "cn") },
      { id: "screener", label: "筛选器", href: screenerPageUrl(activeMarket || "cn") },
      { id: "stock", label: "股票详情", href: stockUrl(activeStockId || "cn-galaxy-energy") }
    ];

    const links = navLinks
      .map((item) => `<a class="nav-link${item.id === activePage ? " is-active" : ""}" href="${item.href}">${item.label}</a>`)
      .join("");

    const marketLinks = data.marketOrder
      .map((marketId) => {
        const market = data.markets[marketId];
        return `<a class="chip${marketId === activeMarket ? " is-active" : ""}" href="${marketContextUrl(activePage, marketId)}">${market.shortName}</a>`;
      })
      .join("");

    return `
      <header class="site-header">
        <div class="container header-inner">
          <a class="brand" href="index.html">
            <span class="brand-mark">4M</span>
            <span class="brand-copy">
              <strong>${data.site.name}</strong>
              <span>${data.site.tagLine}</span>
            </span>
          </a>
          <nav class="nav-links">${links}</nav>
          <div class="header-actions">
            <div class="search-hint">搜索示意：输入名称 / 代码 / 场景 / 筛选器</div>
            <button class="button ghost subtle" data-message="登录/订阅流程在本轮原型中仅保留入口。">登录</button>
            <button class="button primary subtle" data-message="订阅页尚未展开，本轮先演示入口与状态。">订阅</button>
          </div>
        </div>
        <div class="container subnav">
          <div class="subnav-label">市场快速切换</div>
          <div class="chip-row">${marketLinks}</div>
        </div>
      </header>
    `;
  }

  function renderFooter() {
    return `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-card">
            <strong>原型说明</strong>
            <p>${data.site.note} 当前更新时间：${data.site.updatedAt}。本轮正式入口为首页、四个独立市场页、合理股价估值页、趋势页、筛选器页和股票详情页。</p>
          </div>
        </div>
      </footer>
      <div class="toast" id="page-toast"></div>
    `;
  }

  function renderShell(activePage, activeMarket, content, options) {
    const config = options || {};

    app.innerHTML = `
      <div class="page-shell">
        ${renderHeader(activePage, activeMarket, config.stockId)}
        <div class="page-main">
          <div class="container fade-up">${content}</div>
        </div>
        ${renderFooter()}
      </div>
    `;

    bindActionButtons(app);
  }

  function showToast(message) {
    const toast = document.getElementById("page-toast");
    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function bindActionButtons(scope) {
    const root = scope || app;

    root.querySelectorAll("[data-toggle]").forEach((button) => {
      if (button.dataset.boundToggle === "true") {
        return;
      }

      button.dataset.boundToggle = "true";
      button.addEventListener("click", () => {
        const isPressed = button.classList.toggle("is-pressed");
        button.textContent = isPressed ? button.dataset.onLabel : button.dataset.offLabel;
        showToast(isPressed ? button.dataset.offMessage : button.dataset.onMessage);
      });
    });

    root.querySelectorAll("[data-message]").forEach((button) => {
      if (button.dataset.boundMessage === "true") {
        return;
      }

      button.dataset.boundMessage = "true";
      button.addEventListener("click", () => showToast(button.dataset.message));
    });
  }

  function scrollToHashTarget() {
    if (!window.location.hash) {
      return;
    }

    const target = document.querySelector(window.location.hash);
    if (!target) {
      return;
    }

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function renderEmpty(message) {
    return `<div class="empty-state">${message}</div>`;
  }

  function matchesScreenerPreset(item, presetId) {
    const detail = detailById[item.id];

    if (!detail) {
      return false;
    }

    switch (presetId) {
      case "focus":
        return detail.conclusion.state === "关注";
      case "repair":
        return /repair|recovery|rebound|reform|buyback/.test(item.strategyId);
      case "income":
        return /high-dividend|cashflow/.test(item.strategyId);
      case "avoid":
        return detail.conclusion.state === "回避" || item.riskLevel === "高";
      default:
        return true;
    }
  }

  function getFilteredScreenerItems(marketId, state) {
    const stateWeight = { 关注: 0, 观察: 1, 回避: 2 };
    const riskWeight = { 低: 0, 中: 1, 高: 2 };
    const query = (state.query || "").trim().toLowerCase();

    return data.stockSummaries
      .filter((item) => item.market === marketId)
      .filter((item) => matchesScreenerPreset(item, state.preset))
      .filter((item) => (state.strategy === "all" ? true : item.strategyId === state.strategy))
      .filter((item) => (state.risk === "all" ? true : item.riskLevel === state.risk))
      .filter((item) => (state.liquidity === "all" ? true : item.liquidity === state.liquidity))
      .filter((item) => (state.state === "all" ? true : detailById[item.id].conclusion.state === state.state))
      .filter((item) => {
        if (!query) {
          return true;
        }

        return [
          item.name,
          item.symbol,
          item.industry,
          strategyById[item.strategyId].name,
          sceneById[item.primarySceneId].name
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => {
        const leftState = detailById[left.id].conclusion.state;
        const rightState = detailById[right.id].conclusion.state;

        if (stateWeight[leftState] !== stateWeight[rightState]) {
          return stateWeight[leftState] - stateWeight[rightState];
        }

        if (riskWeight[left.riskLevel] !== riskWeight[right.riskLevel]) {
          return riskWeight[left.riskLevel] - riskWeight[right.riskLevel];
        }

        return left.name.localeCompare(right.name, "zh-CN");
      });
  }

  function renderScreenerRow(item) {
    const market = data.markets[item.market];
    const strategy = strategyById[item.strategyId];
    const scene = sceneById[item.primarySceneId];
    const detail = detailById[item.id];
    const firstMetric = detail.metrics[0];
    const secondMetric = detail.metrics[1];

    return `
      <tr>
        <td class="valuation-stock">
          <strong><a href="${stockUrl(item.id)}">${item.name}</a></strong>
          <span>${item.symbol} · ${item.industry}</span>
        </td>
        <td>${market.shortName}</td>
        <td>${pill(detail.conclusion.state, stateTone[detail.conclusion.state])}</td>
        <td>
          <div class="table-cell-stack">
            <strong>${strategy.name}</strong>
            <span>${detail.conclusion.summary}</span>
          </div>
        </td>
        <td>
          <div class="table-cell-stack">
            <strong>${scene.name}</strong>
            <span>${pill(`风险 ${item.riskLevel}`, riskTone[item.riskLevel])}</span>
          </div>
        </td>
        <td>
          <div class="table-cell-stack">
            <strong>${firstMetric.value}</strong>
            <span>${firstMetric.label}</span>
            <span>${secondMetric.label}：${secondMetric.value}</span>
          </div>
        </td>
        <td class="numeric-cell">${item.price}</td>
        <td class="numeric-cell">
          <div class="table-cell-stack">
            <strong>${item.marketCap}</strong>
            <span>流动性 ${item.liquidity}</span>
          </div>
        </td>
      </tr>
    `;
  }

  function renderCompactStock(item) {
    const summary = summaryById[item.stockId];
    const market = data.markets[summary.market];
    const strategy = strategyById[item.strategyId];
    const scene = sceneById[item.sceneId];

    return `
      <article class="stock-row ${item.type === "avoid" ? "risk-row" : ""}">
        <div class="stock-row-head">
          <div>
            <div class="pill-row">
              ${pill(market.shortName, "primary")}
              ${pill(strategy.name, "neutral")}
              ${pill(`风险 ${item.riskLevel}`, riskTone[item.riskLevel])}
            </div>
            <h3><a href="${stockUrl(summary.id)}">${summary.name}</a></h3>
            <p>${item.reason}</p>
          </div>
          <div class="stock-price">
            <strong>${summary.price}</strong>
            <span>${summary.symbol}</span>
          </div>
        </div>
        <div class="stock-meta">
          <div class="pill-row">
            ${pill(summary.industry, "neutral")}
            ${pill(scene.name, item.type === "avoid" ? "danger" : "warning")}
          </div>
          <a class="button ghost subtle" href="${stockUrl(summary.id)}">查看详情</a>
        </div>
        <div class="stock-row-footer">
          <span>${item.comment}</span>
          <div class="button-row">
            <button class="button ghost subtle" data-toggle="favorite" data-off-label="加入自选" data-on-label="已加入自选" data-off-message="${summary.name} 已加入自选示意。" data-on-message="${summary.name} 已从自选中移除示意。">加入自选</button>
            <button class="button ghost subtle" data-toggle="alert" data-off-label="设置提醒" data-on-label="提醒已开启" data-off-message="${summary.name} 已开启提醒示意。" data-on-message="${summary.name} 已关闭提醒示意。">设置提醒</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderSampleStockLinks(stockIds) {
    const validIds = (stockIds || []).filter((stockId) => summaryById[stockId]);

    if (!validIds.length) {
      return "";
    }

    return `
      <div class="button-row">
        ${validIds
          .slice(0, 2)
          .map((stockId) => `<a class="button ghost subtle" href="${stockUrl(stockId)}">${summaryById[stockId].name}</a>`)
          .join("")}
      </div>
    `;
  }

  function renderHomeQuoteGroup(group) {
    return `
      <article class="quote-group">
        <div class="quote-group-head">
          <strong>${group.label}</strong>
          <span>${group.items.length} 项</span>
        </div>
        <div class="quote-list">
          ${group.items
            .map(
              (item) => `
                <a class="quote-row" href="${item.href || "#"}">
                  <div class="quote-meta">
                    <strong>${item.name}</strong>
                    <span>${item.symbol}</span>
                  </div>
                  <div class="quote-value">
                    <strong>${item.value}</strong>
                    <span class="${item.tone === "positive" ? "positive" : item.tone === "negative" ? "negative" : ""}">${item.change} ${item.changePct}</span>
                  </div>
                </a>
              `
            )
            .join("")}
        </div>
      </article>
    `;
  }

  function renderHomeNewsItem(item) {
    return `
      <a class="news-item" href="${item.href || "#"}">
        <div class="news-item-head">
          <span class="news-meta">${item.time}</span>
          ${pill(item.tag, "neutral")}
        </div>
        <strong>${item.title}</strong>
        <span>${item.target}</span>
      </a>
    `;
  }

  function renderHomeReadItem(item) {
    return `
      <a class="read-item" href="${item.href || "#"}">
        <strong>${item.title}</strong>
        <span>${item.summary}</span>
      </a>
    `;
  }

  function renderCalendarRows(items) {
    return items
      .map(
        (item) => `
          <tr>
            <td>${item.time}</td>
            <td>${item.region}</td>
            <td>${pill(item.importance === "高" ? "高" : item.importance === "中" ? "中" : item.importance, item.importance === "高" ? "danger" : item.importance === "中" ? "warning" : "neutral")}</td>
            <td>
              <div class="table-cell-stack">
                <strong>${item.href ? `<a href="${item.href}">${item.title}</a>` : item.title}</strong>
                <span>前值 ${item.previous || "-"}</span>
              </div>
            </td>
            <td>${item.actual || "-"}</td>
            <td>${item.forecast || "-"}</td>
          </tr>
        `
      )
      .join("");
  }

  function renderHomeLeaderboardCard(title, stockIds, hint) {
    return `
      <article class="leaderboard-card">
        <div class="quote-group-head">
          <strong>${title}</strong>
          <span>${hint}</span>
        </div>
        <div class="leaderboard-table-wrap">
          <table class="leaderboard-table">
            <tbody>
              ${stockIds
                .map((stockId, index) => {
                  const summary = summaryById[stockId];
                  const detail = detailById[stockId];
                  if (!summary || !detail) {
                    return "";
                  }

                  return `
                    <tr>
                      <td class="leaderboard-rank">${index + 1}</td>
                      <td>
                        <div class="table-cell-stack">
                          <strong><a href="${stockUrl(stockId)}">${summary.name}</a></strong>
                          <span>${strategyById[summary.strategyId].name}</span>
                        </div>
                      </td>
                      <td>${pill(detail.conclusion.state, stateTone[detail.conclusion.state])}</td>
                      <td class="numeric-cell">${summary.price}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </article>
    `;
  }

  function renderMarketWatchRow(stockId) {
    const summary = summaryById[stockId];
    const detail = detailById[stockId];

    if (!summary || !detail) {
      return "";
    }

    return `
      <a class="watch-row" href="${stockUrl(stockId)}">
        <div class="quote-meta">
          <strong>${summary.name}</strong>
          <span>${summary.symbol} · ${summary.industry}</span>
        </div>
        <div class="watch-row-side">
          ${pill(detail.conclusion.state, stateTone[detail.conclusion.state])}
          <strong>${summary.price}</strong>
        </div>
      </a>
    `;
  }

  function renderSceneSignalRow(sceneId, marketId) {
    const scene = sceneById[sceneId];

    if (!scene) {
      return "";
    }

    return `
      <a class="read-item" href="${boardUrl(marketId, "avoid", { scene: scene.id })}">
        <strong>${scene.name}</strong>
        <span>${scene.signal}</span>
      </a>
    `;
  }

  function renderHomePage() {
    setTitle("首页");
    const homeData = data.homeWorkbench;
    const marketMatrixRows = data.marketOrder
      .map((marketId) => {
        const market = data.markets[marketId];
        const strategy = strategyById[market.strategyIds[0]];
        const scene = sceneById[market.avoidSceneIds[0]];

        return `
          <tr>
            <td>${market.shortName}</td>
            <td>${market.headline}</td>
            <td>${strategy.name}</td>
            <td>${scene.name}</td>
            <td><a class="button ghost subtle" href="${marketUrl(marketId)}">进入</a></td>
          </tr>
        `;
      })
      .join("");

    const marketCards = data.marketOrder
      .map((marketId) => {
        const market = data.markets[marketId];
        const strategy = strategyById[market.strategyIds[0]];
        const scene = sceneById[market.avoidSceneIds[0]];
        return `
          <article class="card home-market-card">
            <div class="pill-row">
              ${pill(market.shortName, "primary")}
              ${pill(strategy.name, "success")}
            </div>
            <h3>${market.name}</h3>
            <p>${market.intro}</p>
            <ul class="list-bullets compact-list">
              <li><strong>判断顺序：</strong>${market.methodSummary}</li>
              <li><strong>先排除：</strong>${scene.name}</li>
            </ul>
            <div class="stock-row-footer">
              <span class="card-subtle">适合风格：${market.fitStyle}</span>
              <a class="button ghost subtle" href="${marketUrl(marketId)}">看市场页</a>
            </div>
          </article>
        `;
      })
      .join("");

    renderShell(
      "home",
      "cn",
      `
        <section class="section home-terminal">
          <div class="home-terminal-grid">
            <article class="home-overview-panel">
              <div class="eyebrow">Finance Workbench</div>
              <h1 class="home-title">四大市场决策工作台</h1>
              <p class="home-lead">用户进来先看市场状态，再看新闻、日历、榜单和工具入口。首页不做营销页，而是直接告诉用户今天从哪里开始看。</p>
              <div class="button-row">
                <a class="button primary" href="${marketUrl("cn")}">打开市场页</a>
                <a class="button secondary" href="${screenerPageUrl("cn")}">打开筛选器</a>
                <a class="button ghost" href="${valuationPageUrl("us", data.markets.us.valuationDefaults)}">看合理估值</a>
                <a class="button ghost" href="${trendPageUrl("us")}">看趋势页</a>
              </div>
              <div class="terminal-kpis">
                <div class="stat-card"><strong>4</strong><span>核心市场</span></div>
                <div class="stat-card"><strong>4</strong><span>报价分组</span></div>
                <div class="stat-card"><strong>2</strong><span>并行榜单</span></div>
                <div class="stat-card"><strong>3</strong><span>独立工具页</span></div>
              </div>
            </article>
            <article class="market-matrix-panel">
              <div class="workspace-head">
                <div>
                  <div class="section-marker">Market Matrix</div>
                  <h2>先决定看哪个市场</h2>
                  <p>四个市场不用同一套方法。先看主逻辑和最该排除的坑，再进入对应工作区。</p>
                </div>
              </div>
              <div class="matrix-table-wrap">
                <table class="matrix-table">
                  <thead>
                    <tr>
                      <th>市场</th>
                      <th>当前主线</th>
                      <th>先看什么</th>
                      <th>先排除什么</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>${marketMatrixRows}</tbody>
                </table>
              </div>
            </article>
          </div>
          <div class="quote-board">
            ${homeData.quoteGroups.map(renderHomeQuoteGroup).join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Headlines</div>
              <h2>今日热点与重要日历</h2>
              <p>把“发生了什么”和“什么时候发生”并排放，避免用户来回切页找上下文。</p>
            </div>
            <a class="button ghost subtle" href="${trendPageUrl("us")}">看趋势页</a>
          </div>
          <div class="news-calendar-grid">
            <article class="section-panel news-panel">
              <div class="panel-head">
                <div>
                  <strong class="panel-title">热点新闻</strong>
                  <p>保持短句、标签和相关市场，先让人快速扫完。</p>
                </div>
              </div>
              <div class="news-list">
                ${homeData.headlines.map(renderHomeNewsItem).join("")}
              </div>
              <div class="read-list">
                ${homeData.popularReads.map(renderHomeReadItem).join("")}
              </div>
            </article>
            <article class="section-panel calendar-panel">
              <div class="panel-head">
                <div>
                  <strong class="panel-title">重要日历</strong>
                  <p>经济事件和财报事件拆开看，直接服务今天的市场判断。</p>
                </div>
              </div>
              <div class="calendar-columns">
                <div class="calendar-card">
                  <strong class="panel-title">经济事件</strong>
                  <div class="calendar-table-wrap">
                    <table class="calendar-table">
                      <thead>
                        <tr><th>时间</th><th>地区</th><th>级别</th><th>事件</th><th>实际</th><th>预期</th></tr>
                      </thead>
                      <tbody>${renderCalendarRows(homeData.calendar.economic)}</tbody>
                    </table>
                  </div>
                </div>
                <div class="calendar-card">
                  <strong class="panel-title">财报事件</strong>
                  <div class="calendar-table-wrap">
                    <table class="calendar-table">
                      <thead>
                        <tr><th>时间</th><th>地区</th><th>级别</th><th>公司</th><th>实际</th><th>预期</th></tr>
                      </thead>
                      <tbody>${renderCalendarRows(homeData.calendar.earnings)}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Boards</div>
              <h2>热门榜单</h2>
              <p>榜单继续保留高密度比较，先看状态和价格，再决定要不要点进详情。</p>
            </div>
          </div>
          <div class="leaderboard-grid">
            ${renderHomeLeaderboardCard("Top Gainers", homeData.rankings.gainers, "修复 / 兑现")}
            ${renderHomeLeaderboardCard("Top Losers", homeData.rankings.losers, "高风险 / 回避")}
            ${renderHomeLeaderboardCard("Most Active", homeData.rankings.active, "高关注度")}
            ${renderHomeLeaderboardCard("Trending Stocks", homeData.rankings.trending, "跟踪名单")}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Tools</div>
              <h2>专题 / 工具入口</h2>
              <p>工具单独作为一层，不和数据流混在一起，方便用户直接进工作区。</p>
            </div>
          </div>
          <div class="tool-grid">
            ${homeData.tools
              .map(
                (item) => `
                  <a class="tool-card" href="${item.href || "#"}">
                    <strong>${item.title}</strong>
                    <span>${item.description}</span>
                  </a>
                `
              )
              .join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Markets</div>
              <h2>四市场快照</h2>
              <p>继续保留四市场差异，但放到更靠下的位置，避免一上来就被长文案打断。</p>
            </div>
          </div>
          <div class="market-grid">${marketCards}</div>
        </section>
      `
    );
  }

  function getBoardState(prefix, marketId) {
    const params = currentParams();
    const market = data.markets[marketId];
    const strategyValue = params.get(`${prefix}Strategy`) || "all";
    const riskValue = safeRisk(params.get(`${prefix}Risk`));
    const sceneValue = params.get(`${prefix}Scene`) || "all";

    return {
      strategy: market.strategyIds.includes(strategyValue) ? strategyValue : "all",
      risk: riskValue,
      scene: market.avoidSceneIds.includes(sceneValue) ? sceneValue : "all"
    };
  }

  function renderBoardPanel(boardType, marketId, state) {
    const market = data.markets[marketId];
    const title = boardType === "avoid" ? "今日不能买榜" : "今日机会榜";
    const intro =
      boardType === "avoid"
        ? "右栏展示不该买的坑位，优先筛掉高风险、便宜陷阱和情绪末端。"
        : "左栏展示可继续跟踪的机会，把思路、催化和风险放在同一张表里。";
    const prefix = boardType === "avoid" ? "av" : "op";
    const panelClass = boardType === "avoid" ? "panel risk board-panel" : "panel opportunity board-panel";
    const anchorId = boardType === "avoid" ? "avoid-board" : "opportunity-board";

    return `
      <article class="${panelClass}" id="${anchorId}">
        <div class="panel-head">
          <div>
            <strong class="panel-title">${title}</strong>
            <p>${intro}</p>
          </div>
        </div>
        <div class="board-filters">
          <div class="field">
            <label for="${prefix}-strategy">思路</label>
            <select id="${prefix}-strategy" data-board-filter="${prefix}" data-filter-key="strategy">
              ${optionList([{ value: "all", label: "全部思路" }].concat(market.strategyIds.map((id) => ({ value: id, label: strategyById[id].name }))), state.strategy)}
            </select>
          </div>
          <div class="field">
            <label for="${prefix}-risk">风险等级</label>
            <select id="${prefix}-risk" data-board-filter="${prefix}" data-filter-key="risk">
              ${optionList([{ value: "all", label: "全部风险" }, { value: "低", label: "低风险" }, { value: "中", label: "中风险" }, { value: "高", label: "高风险" }], state.risk)}
            </select>
          </div>
          <div class="field">
            <label for="${prefix}-scene">命中场景</label>
            <select id="${prefix}-scene" data-board-filter="${prefix}" data-filter-key="scene">
              ${optionList([{ value: "all", label: "全部场景" }].concat(market.avoidSceneIds.map((id) => ({ value: id, label: sceneById[id].name }))), state.scene)}
            </select>
          </div>
        </div>
        <div class="board-meta">
          <span id="${prefix}-count">当前结果：0</span>
          <span>${boardType === "avoid" ? "先把不该碰的坑讲清楚，再决定什么时候回看。" : "机会样本必须能同时解释逻辑、催化和风险。"}</span>
        </div>
        <div class="stock-list" id="${prefix}-list"></div>
      </article>
    `;
  }

  function getValuationState(marketId) {
    const params = currentParams();
    const defaults = data.markets[marketId].valuationDefaults;
    const preset = safeValPreset(marketId, params.get("valPreset"));

    return {
      preset,
      band: safeFilterValue("band", params.get("valBand"), defaults.band),
      quality: safeFilterValue("quality", params.get("valQuality"), defaults.quality),
      margin: safeFilterValue("margin", params.get("valMargin"), defaults.margin),
      size: safeFilterValue("size", params.get("valSize"), defaults.size)
    };
  }

  function getFilteredValuationItems(marketId, state) {
    return data.valuationItems
      .filter((item) => item.market === marketId)
      .filter((item) => item.presetIds.includes(state.preset))
      .filter((item) => (state.band === "all" ? true : item.valuationBand === state.band))
      .filter((item) => (state.size === "all" ? true : item.sizeBucket === state.size))
      .filter((item) => (state.quality === "all" ? true : item.qualityValue >= valuationThresholds[state.quality]))
      .filter((item) => (state.margin === "all" ? true : item.marginValue >= valuationThresholds[state.margin]))
      .sort((left, right) => {
        const sortKey = valuationPresetById[state.preset].sortKey;

        if (sortKey === "crowding") {
          return left.crowdingScore - right.crowdingScore || right.qualityValue - left.qualityValue;
        }

        if (sortKey === "quality") {
          return right.qualityValue - left.qualityValue || right.marginValue - left.marginValue;
        }

        return right.marginValue - left.marginValue || right.qualityValue - left.qualityValue;
      });
  }

  function handleLegacyMarketHash(marketId) {
    if (window.location.hash === "#valuation-board") {
      window.location.replace(`${valuationPageUrl(marketId, getValuationParams())}#valuation-board`);
      return true;
    }

    if (window.location.hash === "#trend-board") {
      window.location.replace(`${trendPageUrl(marketId)}#trend-board`);
      return true;
    }

    return false;
  }

  function renderTrendWatchlist(marketId) {
    const trend = trendByMarket[marketId];
    const watchlist =
      trend.watchlistItems && trend.watchlistItems.length
        ? trend.watchlistItems
        : (trend.watchlistStockIds || []).map((stockId) => ({ stockId, role: "跟踪样本" }));

    return watchlist
      .filter((entry) => summaryById[entry.stockId])
      .map((entry) => {
        const summary = summaryById[entry.stockId];
        const detail = data.stockDetails[summary.id];
        const strategy = strategyById[summary.strategyId];
        const role = entry.role || strategy.name;
        const whyWatch = entry.whyWatch || detail.conclusion.summary;

        return `
          <article class="card">
            <div class="pill-row">
              ${pill(summary.symbol, "dark")}
              ${pill(role, "primary")}
              ${pill(`风险 ${summary.riskLevel}`, riskTone[summary.riskLevel])}
            </div>
            <h3>${summary.name}</h3>
            <p>${whyWatch}</p>
            <div class="pill-row">
              ${pill(summary.industry, "neutral")}
              ${pill(`流动性 ${summary.liquidity}`, "neutral")}
            </div>
            <div class="stock-row-footer">
              <span class="card-subtle">${detail.thesis[0]}</span>
              <a class="button ghost subtle" href="${stockUrl(summary.id)}">查看详情</a>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderValuationPanel(marketId, state) {
    const presetTabs = data.valuationPresets
      .map((preset) => `<button class="preset-chip${preset.id === state.preset ? " is-active" : ""}" data-valuation-preset="${preset.id}" type="button">${preset.label}</button>`)
      .join("");

    return `
      <article class="filter-panel valuation-panel" id="valuation-board">
        <div class="panel-head">
          <div>
            <div class="section-marker">Valuation Desk</div>
            <strong class="panel-title">合理股票估值工作台</strong>
            <p id="valuation-preset-summary">${valuationPresetById[state.preset].summary}</p>
          </div>
          <div class="button-row">
            <button class="button ghost subtle" data-message="保存筛选功能本轮先保留状态示意。">保存筛选</button>
            <button class="button secondary subtle" data-valuation-reset type="button">恢复默认</button>
          </div>
        </div>
        <div class="preset-row">${presetTabs}</div>
        <div class="valuation-filter-grid">
          <div class="field">
            <label for="val-band">估值带</label>
            <select id="val-band" data-valuation-filter="band">${optionList(data.valuationFilterOptions.band, state.band)}</select>
          </div>
          <div class="field">
            <label for="val-quality">质量门槛</label>
            <select id="val-quality" data-valuation-filter="quality">${optionList(data.valuationFilterOptions.quality, state.quality)}</select>
          </div>
          <div class="field">
            <label for="val-margin">安全边际</label>
            <select id="val-margin" data-valuation-filter="margin">${optionList(data.valuationFilterOptions.margin, state.margin)}</select>
          </div>
          <div class="field">
            <label for="val-size">市值段</label>
            <select id="val-size" data-valuation-filter="size">${optionList(data.valuationFilterOptions.size, state.size)}</select>
          </div>
        </div>
        <div class="valuation-meta">
          <span id="valuation-count">当前结果：0 只</span>
          <span>${data.markets[marketId].valuationFocus} 这里参考 Investing 选股器的工作台骨架，但只保留适合本原型的核心判断维度。</span>
        </div>
        <div class="valuation-table-wrap">
          <table class="valuation-table">
            <thead>
              <tr>
                <th>股票 / 代码</th>
                <th>策略标签</th>
                <th>当前价</th>
                <th>合理价值区间</th>
                <th>安全边际</th>
                <th>质量分</th>
                <th>估值结论</th>
              </tr>
            </thead>
            <tbody id="valuation-body"></tbody>
          </table>
        </div>
      </article>
    `;
  }

  function renderSparkline(points) {
    const width = 220;
    const height = 74;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = Math.max(max - min, 1);
    const path = points
      .map((value, index) => {
        const x = (index / (points.length - 1)) * width;
        const y = height - ((value - min) / span) * (height - 8) - 4;
        return `${x},${y}`;
      })
      .join(" ");

    return `
      <svg viewBox="0 0 ${width} ${height}" class="sparkline-svg" aria-hidden="true">
        <polyline points="${path}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
      </svg>
    `;
  }

  function renderTrendPanel(marketId) {
    const market = data.markets[marketId];
    const trend = trendByMarket[marketId];

    return `
      <article class="section-panel trend-panel" id="trend-board">
        <div class="section-head">
          <div>
            <div class="section-marker">Trend Radar</div>
            <h2>趋势雷达</h2>
            <p>${market.trendFocus}</p>
          </div>
        </div>
        <div class="trend-temperature">
          <span class="trend-label">趋势温度</span>
          <strong>${trend.regime.temperature}°</strong>
          <p>${trend.regime.label}：${trend.regime.summary}</p>
        </div>
        <div class="trend-sparkline">
          <div>
            <strong>7 日趋势火花线</strong>
            <p>用一条紧凑曲线模拟热度变化，帮助判断是继续跟还是先等回撤。</p>
          </div>
          ${renderSparkline(trend.sparkline)}
          <div class="trend-list-grid">
            <div>
              <strong>顺风线索</strong>
              <ul class="trend-list">${trend.leaders.map((item) => `<li>${item}</li>`).join("")}</ul>
            </div>
            <div>
              <strong>警惕事项</strong>
              <ul class="trend-list">${trend.warnings.map((item) => `<li>${item}</li>`).join("")}</ul>
            </div>
          </div>
        </div>
        <div class="trend-factor-stack">
          ${trend.factorScores
            .map(
              (item) => `
                <div class="trend-factor">
                  <div class="trend-factor-head"><strong>${item.label}</strong><span>${item.value}</span></div>
                  <div class="factor-bar"><span style="width:${item.value}%"></span></div>
                  <p>${item.summary}</p>
                </div>
              `
            )
            .join("")}
        </div>
        <div class="trend-actions">
          ${trend.ctaLinks
            .map(
              (item) => `
                <a class="trend-action ${item.tone}" href="${item.url}">
                  <strong>${item.title}</strong>
                  <span>${item.description}</span>
                </a>
              `
            )
            .join("")}
        </div>
      </article>
    `;
  }

  function renderValuationRow(item) {
    const summary = summaryById[item.stockId];
    const strategy = strategyById[summary.strategyId];
    const tone = valuationTone[item.verdict] || "neutral";

    return `
      <tr>
        <td>
          <a class="valuation-stock" href="${stockUrl(summary.id)}">
            <strong>${summary.name}</strong>
            <span>${summary.symbol}</span>
          </a>
        </td>
        <td>
          ${pill(strategy.name, "neutral")}
          <span class="valuation-note">${summary.industry}</span>
        </td>
        <td>${summary.price}</td>
        <td>${item.fairValueLow} - ${item.fairValueHigh}</td>
        <td class="${item.marginValue >= 15 ? "positive" : item.marginValue > 0 ? "caution" : "negative"}">${item.marginOfSafety}</td>
        <td>${item.qualityScore}</td>
        <td>
          ${pill(item.verdict, tone)}
          <span class="valuation-note">${item.note}</span>
        </td>
      </tr>
    `;
  }

  function renderMarketPage() {
    const marketId = safeMarket(document.body.dataset.market);
    if (handleLegacyMarketHash(marketId)) {
      return null;
    }

    const market = data.markets[marketId];
    const opportunityState = getBoardState("op", marketId);
    const avoidState = getBoardState("av", marketId);
    const opportunityCount = data.rankingItems.filter((item) => item.market === marketId && item.type === "opportunity").length;
    const avoidCount = data.rankingItems.filter((item) => item.market === marketId && item.type === "avoid").length;
    const featuredWatchRows = market.opportunityStockIds.slice(0, 4).map(renderMarketWatchRow).join("");
    const featuredSceneRows = market.avoidSceneIds.slice(0, 4).map((sceneId) => renderSceneSignalRow(sceneId, marketId)).join("");

    const strategyCards = market.strategyIds
      .map((strategyId) => {
        const strategy = strategyById[strategyId];
        return `
          <article class="card">
            ${pill("怎么买", "primary")}
            <h3>${strategy.name}</h3>
            <p>${strategy.summary}</p>
            <ul class="list-bullets">
              <li><strong>适用场景：</strong>${strategy.fitFor}</li>
              <li><strong>必须验证：</strong>${strategy.mustConfirm}</li>
              <li><strong>最容易看错：</strong>${strategy.falsePositive}</li>
            </ul>
            <div class="stock-row-footer">
              <span class="card-subtle">核心问题：${strategy.coreQuestion}</span>
              <a class="button ghost subtle" href="${boardUrl(marketId, "opportunity", { strategy: strategy.id })}">查看机会样本</a>
            </div>
            ${renderSampleStockLinks(strategy.sampleStockIds)}
          </article>
        `;
      })
      .join("");

    const sceneCards = market.avoidSceneIds
      .map((sceneId) => {
        const scene = sceneById[sceneId];
        return `
          <article class="card">
            ${pill(`风险 ${scene.level}`, riskTone[scene.level])}
            <h3>${scene.name}</h3>
            <p>${scene.summary}</p>
            <ul class="list-bullets">
              <li><strong>为什么危险：</strong>${scene.whyDangerous}</li>
              <li><strong>何时能重看：</strong>${scene.reentrySignal}</li>
              <li><strong>替代打法：</strong>${scene.substitute}</li>
            </ul>
            <div class="stock-row-footer">
              <span class="card-subtle">危险信号：${scene.signal}</span>
              <a class="button warning subtle" href="${boardUrl(marketId, "avoid", { scene: scene.id })}">查看回避样本</a>
            </div>
            ${renderSampleStockLinks(scene.sampleStockIds)}
          </article>
        `;
      })
      .join("");

    setTitle(`${market.name}`);
    renderShell(
      "market",
      marketId,
      `
        <section class="section">
          <div class="banner-grid market-hero-grid">
            <div class="banner-card market-head-panel">
              <div class="eyebrow">${market.name}</div>
              <h1 class="page-title">${market.headline}</h1>
              <p class="page-subtitle">${market.currentState}</p>
              <div class="button-row">
                <a class="button secondary" href="#opportunity-board">看今日机会榜</a>
                <a class="button ghost" href="#avoid-board">看今日不能买榜</a>
                <a class="button ghost" href="${screenerPageUrl(marketId)}">打开筛选器</a>
                <a class="button primary" href="${valuationPageUrl(marketId, market.valuationDefaults)}">去合理估值页</a>
                <a class="button ghost" href="${trendPageUrl(marketId)}">去趋势页</a>
              </div>
            </div>
            <div class="banner-side market-glance-grid">
              <div class="banner-stat"><strong>${market.fitStyle}</strong><span>适合风格</span></div>
              <div class="banner-stat"><strong>${market.pitfall}</strong><span>最易踩坑类型</span></div>
              <div class="banner-stat"><strong>${opportunityCount} / ${avoidCount}</strong><span>公开机会 / 风险样本</span></div>
              <div class="banner-stat"><strong>${valuationPresetById[market.valuationDefaults.preset].label}</strong><span>默认估值视角</span></div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="market-summary-grid">
            <article class="card">
              ${pill("判断顺序", "primary")}
              <h3>先看什么</h3>
              <p>${market.methodSummary}</p>
            </article>
            <article class="card">
              ${pill("估值重点", "success")}
              <h3>估值页先确认什么</h3>
              <p>${market.valuationFocus}</p>
            </article>
            <article class="card">
              ${pill("趋势重点", "dark")}
              <h3>趋势页先盯什么</h3>
              <p>${market.trendFocus}</p>
            </article>
            <article class="card">
              ${pill("假信号", "warning")}
              <h3>最怕什么误判</h3>
              <p>${market.currentState}</p>
              <div class="pill-row">${pill(`易踩坑：${market.pitfall}`, "warning")}</div>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="market-desk-grid">
            <article class="section-panel">
              <div class="panel-head">
                <div>
                  <strong class="panel-title">代表跟踪样本</strong>
                  <p>先看当前市场里最值得继续跟踪的公开样本，再决定要不要进入筛选器或详情页。</p>
                </div>
                <a class="button ghost subtle" href="${screenerPageUrl(marketId)}">去筛选器</a>
              </div>
              <div class="watch-list">
                ${featuredWatchRows}
              </div>
            </article>
            <article class="section-panel">
              <div class="panel-head">
                <div>
                  <strong class="panel-title">先排除的风险场景</strong>
                  <p>先把最常见的错误买点排除掉，再回到机会样本做对比。</p>
                </div>
              </div>
              <div class="read-list">
                ${featuredSceneRows}
              </div>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Workspace</div>
              <h2>市场工作区</h2>
              <p>${market.name}先把机会榜和不能买榜并排摆出来；如果要继续看估值、趋势或更深的条件组合，再去顶部独立工具页。</p>
            </div>
          </div>
          <div class="filter-panel board-hub">
            <div class="workspace-head">
              <strong>双榜单主工作区</strong>
              <span>左边找方向，右边先避坑；筛选器、合理估值和趋势都保持单独页面，减少视图干扰。</span>
            </div>
            <div class="board-grid">
              ${renderBoardPanel("opportunity", marketId, opportunityState)}
              ${renderBoardPanel("avoid", marketId, avoidState)}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Strategy</div>
              <h2>要怎么买</h2>
              <p>方法卡放在工作区后面，让用户先看到结果，再回头看方法论和验证标准。</p>
            </div>
          </div>
          <div class="market-grid">${strategyCards}</div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Avoid</div>
              <h2>不能买什么</h2>
              <p>风险场景继续完整保留，但视觉上更像工作台的知识面板，而不是首页式营销卡片。</p>
            </div>
          </div>
          <div class="market-grid">${sceneCards}</div>
        </section>

        <section class="section">
          <div class="section-panel">
            <div class="section-head">
              <div>
                <div class="section-marker">Education</div>
                <h2>为什么这个市场要这么看</h2>
                <p>${market.methodSummary}</p>
              </div>
            </div>
            <div class="education-grid">
              ${market.education.map((item, index) => `<article class="card">${pill(`步骤 ${index + 1}`, "dark")}<h3>${market.shortName}市场判断顺序</h3><p>${item}</p></article>`).join("")}
            </div>
          </div>
        </section>
      `
    );

    return marketId;
  }

  function bindMarketBoards(marketId) {
    const boardState = {
      op: getBoardState("op", marketId),
      av: getBoardState("av", marketId)
    };

    function getItems(boardKey) {
      const type = boardKey === "av" ? "avoid" : "opportunity";
      const filters = boardState[boardKey];
      return data.rankingItems
        .filter((item) => item.market === marketId && item.type === type)
        .filter((item) => (filters.strategy === "all" ? true : item.strategyId === filters.strategy))
        .filter((item) => (filters.risk === "all" ? true : item.riskLevel === filters.risk))
        .filter((item) => (filters.scene === "all" ? true : item.sceneId === filters.scene))
        .sort((left, right) => right.score - left.score);
    }

    function renderBoard(boardKey) {
      const items = getItems(boardKey);
      const list = app.querySelector(`#${boardKey}-list`);
      const count = app.querySelector(`#${boardKey}-count`);
      const boardLabel = boardKey === "av" ? "风险" : "机会";

      list.innerHTML = items.length
        ? items.map(renderCompactStock).join("")
        : renderEmpty(`当前筛选条件下，没有符合要求的${boardLabel}样本。`);
      count.textContent = `当前结果：${items.length}`;
      bindActionButtons(list);
    }

    function syncQuery() {
      updateQueryGroup({
        opStrategy: boardState.op.strategy,
        opRisk: boardState.op.risk,
        opScene: boardState.op.scene,
        avStrategy: boardState.av.strategy,
        avRisk: boardState.av.risk,
        avScene: boardState.av.scene
      });
    }

    app.querySelectorAll("[data-board-filter]").forEach((element) => {
      element.addEventListener("change", () => {
        const boardKey = element.dataset.boardFilter;
        const filterKey = element.dataset.filterKey;
        boardState[boardKey][filterKey] = element.value || "all";
        renderBoard(boardKey);
        syncQuery();
      });
    });

    renderBoard("op");
    renderBoard("av");
  }

  function bindValuationPanel(marketId) {
    const state = getValuationState(marketId);
    const marketDefaults = data.markets[marketId].valuationDefaults;
    const body = app.querySelector("#valuation-body");
    const count = app.querySelector("#valuation-count");

    if (!body || !count) {
      return;
    }

    function getFilteredItems() {
      return getFilteredValuationItems(marketId, state);
    }

    function syncControls() {
      app.querySelectorAll("[data-valuation-preset]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.valuationPreset === state.preset);
      });
      app.querySelector('#val-band').value = state.band;
      app.querySelector('#val-quality').value = state.quality;
      app.querySelector('#val-margin').value = state.margin;
      app.querySelector('#val-size').value = state.size;
      app.querySelector('#valuation-preset-summary').textContent = valuationPresetById[state.preset].summary;
    }

    function syncQuery() {
      updateQueryGroup({
        valPreset: state.preset,
        valBand: state.band,
        valQuality: state.quality,
        valMargin: state.margin,
        valSize: state.size
      });
    }

    function renderTable() {
      const items = getFilteredItems();

      body.innerHTML = items.length
        ? items.map(renderValuationRow).join('')
        : `<tr><td colspan="7">${renderEmpty("当前估值条件下，没有符合要求的样本。")}</td></tr>`;
      count.textContent = `当前结果：${items.length} 只`;
    }

    app.querySelectorAll("[data-valuation-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextPreset = button.dataset.valuationPreset;
        const defaults = valuationPresetById[nextPreset].defaultFilters;
        state.preset = nextPreset;
        state.band = defaults.band;
        state.quality = defaults.quality;
        state.margin = defaults.margin;
        state.size = defaults.size;
        syncControls();
        renderTable();
        syncQuery();
      });
    });

    app.querySelectorAll("[data-valuation-filter]").forEach((field) => {
      field.addEventListener("change", () => {
        state[field.dataset.valuationFilter] = field.value || "all";
        renderTable();
        syncQuery();
      });
    });

    const resetButton = app.querySelector("[data-valuation-reset]");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        state.preset = marketDefaults.preset;
        state.band = marketDefaults.band;
        state.quality = marketDefaults.quality;
        state.margin = marketDefaults.margin;
        state.size = marketDefaults.size;
        syncControls();
        renderTable();
        syncQuery();
        showToast("已恢复该市场默认估值视图。");
      });
    }

    syncControls();
    renderTable();
  }

  function renderValuationPage() {
    const marketId = safeMarket(currentParams().get("market"));
    const market = data.markets[marketId];
    const valuationState = getValuationState(marketId);
    const preset = valuationPresetById[valuationState.preset];
    const filteredItems = getFilteredValuationItems(marketId, valuationState);
    const featuredStockId = market.opportunityStockIds[0] || market.avoidStockIds[0];

    setTitle(`${market.name}合理估值`);
    renderShell(
      "valuation",
      marketId,
      `
        <section class="section">
          <div class="banner-grid">
            <div class="banner-card">
              <div class="eyebrow">${market.name} / Valuation</div>
              <h1 class="page-title">合理股价估值</h1>
              <p class="page-subtitle">${market.currentState}</p>
              <div class="button-row">
                <a class="button secondary" href="${marketUrl(marketId)}">回到市场页</a>
                <a class="button ghost" href="${trendPageUrl(marketId)}">查看趋势页</a>
                <a class="button primary" href="${stockUrl(featuredStockId)}">打开代表样本</a>
              </div>
            </div>
            <div class="banner-side">
              <div class="banner-stat"><strong>${preset.label}</strong><span>当前预设</span></div>
              <div class="banner-stat"><strong>${filteredItems.length} 只</strong><span>当前结果数</span></div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Valuation Notes</div>
              <h2>${market.shortName}市场估值说明</h2>
              <p>${market.valuationFocus}</p>
            </div>
          </div>
          <div class="market-grid">
            <article class="card">
              ${pill("市场锚点", "primary")}
              <h3>判断顺序</h3>
              <p>${market.methodSummary}</p>
              <div class="pill-row">${pill(market.fitStyle, "neutral")}</div>
            </article>
            <article class="card">
              ${pill("估值焦点", "success")}
              <h3>看估值前先确认什么</h3>
              <p>${market.valuationFocus}</p>
              <div class="pill-row">${pill(`市场默认：${valuationPresetById[market.valuationDefaults.preset].label}`, "success")}</div>
            </article>
            <article class="card">
              ${pill("默认筛选", "dark")}
              <h3>当前过滤组合</h3>
              <p>估值带：${optionLabel("band", valuationState.band)}；质量门槛：${optionLabel("quality", valuationState.quality)}；安全边际：${optionLabel("margin", valuationState.margin)}；市值段：${optionLabel("size", valuationState.size)}。</p>
              <div class="pill-row">${pill("切市场后重置为目标市场默认组合", "neutral")}</div>
            </article>
            <article class="card">
              ${pill("先排除", "warning")}
              <h3>${preset.label}</h3>
              <p>${preset.summary}</p>
              <div class="pill-row">${pill(`易踩坑：${market.pitfall}`, "warning")}</div>
            </article>
          </div>
        </section>

        <section class="section">
          ${renderValuationPanel(marketId, valuationState)}
        </section>
      `,
      { stockId: featuredStockId }
    );

    return marketId;
  }

  function renderTrendPage() {
    const marketId = safeMarket(currentParams().get("market"));
    const market = data.markets[marketId];
    const trend = trendByMarket[marketId];
    const strongestFactor = trend.factorScores.reduce((best, item) => (item.value > best.value ? item : best), trend.factorScores[0]);
    const featuredStockId = (trend.watchlistItems && trend.watchlistItems[0] && trend.watchlistItems[0].stockId) || trend.watchlistStockIds[0] || market.opportunityStockIds[0];

    setTitle(`${market.name}趋势`);
    renderShell(
      "trend",
      marketId,
      `
        <section class="section">
          <div class="banner-grid">
            <div class="banner-card">
              <div class="eyebrow">${market.name} / Trend</div>
              <h1 class="page-title">趋势页</h1>
              <p class="page-subtitle">${market.trendOverview}</p>
              <div class="button-row">
                <a class="button secondary" href="${marketUrl(marketId)}">回到市场页</a>
                <a class="button ghost" href="${valuationPageUrl(marketId, market.valuationDefaults)}">查看合理估值</a>
                <a class="button primary" href="${stockUrl(featuredStockId)}">打开跟踪样本</a>
              </div>
            </div>
            <div class="banner-side">
              <div class="banner-stat"><strong>${trend.regime.temperature}°</strong><span>当前趋势温度</span></div>
              <div class="banner-stat"><strong>${strongestFactor.label} ${strongestFactor.value}</strong><span>当前最强因子</span></div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Trend Focus</div>
              <h2>${market.shortName}市场趋势判断</h2>
              <p>${market.trendFocus}</p>
            </div>
          </div>
          <div class="market-grid">
            <article class="card">
              ${pill("当前阶段", "primary")}
              <h3>${trend.regime.label}</h3>
              <p>${trend.regime.summary}</p>
              <div class="pill-row">${pill(`温度 ${trend.regime.temperature}°`, "success")}</div>
            </article>
            <article class="card">
              ${pill("趋势重点", "success")}
              <h3>先盯什么</h3>
              <p>${market.trendFocus}</p>
              <div class="pill-row">${pill(`${strongestFactor.label} ${strongestFactor.value}`, "success")}</div>
            </article>
            <article class="card">
              ${pill("顺风方向", "dark")}
              <h3>优先跟踪</h3>
              <p>${trend.leaders[0]}</p>
              <div class="pill-row">${pill("行动卡会带回市场页机会榜", "neutral")}</div>
            </article>
            <article class="card">
              ${pill("警惕事项", "warning")}
              <h3>先看风险</h3>
              <p>${trend.warnings[0]}</p>
              <div class="pill-row">${pill("先在不能买榜确认风险场景", "warning")}</div>
            </article>
          </div>
        </section>

        <section class="section">
          ${renderTrendPanel(marketId)}
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Watchlist</div>
              <h2>当前市场跟踪样本区</h2>
              <p>每个样本都带“角色”和“为什么现在要看”，再继续跳到股票详情页追具体结论、风险标签和替代方向。</p>
            </div>
          </div>
          <div class="market-grid">${renderTrendWatchlist(marketId)}</div>
        </section>
      `,
      { stockId: featuredStockId }
    );
  }

  function bindScreenerPanel(marketId) {
    const state = getScreenerState(marketId);
    const body = app.querySelector("#screener-body");
    const count = app.querySelector("#screener-count");
    const summary = app.querySelector("#screener-summary");
    const resultTotal = app.querySelector("#screener-result-total");
    const activePreset = app.querySelector("#screener-active-preset");

    if (!body || !count || !summary || !resultTotal || !activePreset) {
      return;
    }

    function syncControls() {
      app.querySelectorAll("[data-screener-preset]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.screenerPreset === state.preset);
      });

      app.querySelector("#scr-query").value = state.query;
      app.querySelector("#scr-strategy").value = state.strategy;
      app.querySelector("#scr-risk").value = state.risk;
      app.querySelector("#scr-liquidity").value = state.liquidity;
      app.querySelector("#scr-state").value = state.state;
    }

    function syncQuery() {
      updateQueryGroup({
        scrPreset: state.preset,
        scrStrategy: state.strategy,
        scrRisk: state.risk,
        scrLiquidity: state.liquidity,
        scrState: state.state,
        scrQuery: state.query
      });
    }

    function renderTable() {
      const items = getFilteredScreenerItems(marketId, state);
      const preset = screenerPresetById[state.preset];

      body.innerHTML = items.length
        ? items.map(renderScreenerRow).join("")
        : `<tr><td colspan="8">${renderEmpty("当前筛选条件下，没有符合要求的样本。")}</td></tr>`;

      count.textContent = `当前结果：${items.length} 只`;
      summary.textContent = preset.summary;
      resultTotal.textContent = `${items.length} 只`;
      activePreset.textContent = preset.label;
    }

    app.querySelectorAll("[data-screener-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        state.preset = button.dataset.screenerPreset;
        renderTable();
        syncControls();
        syncQuery();
      });
    });

    app.querySelectorAll("[data-screener-filter]").forEach((field) => {
      const eventName = field.tagName === "INPUT" ? "input" : "change";

      field.addEventListener(eventName, () => {
        const filterKey = field.dataset.screenerFilter;
        state[filterKey] = filterKey === "query" ? field.value : (field.value || "all");
        renderTable();
        syncQuery();
      });
    });

    const resetButton = app.querySelector("[data-screener-reset]");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        state.preset = "all";
        state.strategy = "all";
        state.risk = "all";
        state.liquidity = "all";
        state.state = "all";
        state.query = "";
        renderTable();
        syncControls();
        syncQuery();
        showToast("已恢复当前市场默认筛选条件。");
      });
    }

    const saveButton = app.querySelector("[data-screener-save]");
    if (saveButton) {
      saveButton.addEventListener("click", () => {
        showToast(`已保存 ${data.markets[marketId].shortName} 市场筛选器示意。`);
      });
    }

    syncControls();
    renderTable();
  }

  function renderScreenerPage() {
    const marketId = safeMarket(currentParams().get("market"));
    const market = data.markets[marketId];
    const state = getScreenerState(marketId);
    const totalItems = data.stockSummaries.filter((item) => item.market === marketId).length;
    const filteredItems = getFilteredScreenerItems(marketId, state);
    const preset = screenerPresetById[state.preset];
    const strategyOptions = getScreenerStrategyOptions(marketId);
    const featuredStockId = filteredItems[0] ? filteredItems[0].id : (market.opportunityStockIds[0] || market.avoidStockIds[0]);

    setTitle(`${market.name}筛选器`);
    renderShell(
      "screener",
      marketId,
      `
        <section class="section">
          <div class="banner-grid">
            <div class="banner-card">
              <div class="eyebrow">${market.name} / Screener</div>
              <h1 class="page-title">筛选器</h1>
              <p class="page-subtitle">参考 Investing 的工作台结构，把策略、风险、流动性与当前结论放进同一张比较表里，先筛出值得跟踪或优先排除的样本。</p>
              <div class="button-row">
                <a class="button secondary" href="${marketUrl(marketId)}">回到市场页</a>
                <a class="button ghost" href="${valuationPageUrl(marketId, market.valuationDefaults)}">查看合理估值</a>
                <a class="button primary" href="${stockUrl(featuredStockId)}">打开代表样本</a>
              </div>
            </div>
            <div class="banner-side">
              <div class="banner-stat"><strong id="screener-result-total">${filteredItems.length} 只</strong><span>当前筛中结果</span></div>
              <div class="banner-stat"><strong>${totalItems} 只</strong><span>${market.shortName}市场总样本</span></div>
              <div class="banner-stat"><strong id="screener-active-preset">${preset.label}</strong><span>当前筛选视角</span></div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="filter-panel">
            <div class="workspace-head">
              <div>
                <div class="section-marker">Screener Workspace</div>
                <h2>${market.shortName}市场股票筛选器</h2>
                <p id="screener-summary">${preset.summary}</p>
              </div>
              <div class="button-row">
                <button class="button ghost subtle" data-screener-save>保存筛选器</button>
                <button class="button secondary subtle" data-screener-reset>恢复默认</button>
              </div>
            </div>
            <div class="preset-row">
              ${screenerPresets.map((item) => `<button class="preset-chip${item.id === state.preset ? " is-active" : ""}" data-screener-preset="${item.id}">${item.label}</button>`).join("")}
            </div>
            <div class="screener-toolbar">
              <div class="field screener-search">
                <label for="scr-query">快速搜索</label>
                <input id="scr-query" class="text-input" type="text" value="${state.query}" placeholder="名称 / 代码 / 行业 / 风险场景" data-screener-filter="query">
              </div>
              <div class="field">
                <label for="scr-strategy">策略</label>
                <select id="scr-strategy" data-screener-filter="strategy">${optionList(strategyOptions, state.strategy)}</select>
              </div>
              <div class="field">
                <label for="scr-risk">风险</label>
                <select id="scr-risk" data-screener-filter="risk">${optionList([{ value: "all", label: "全部风险" }].concat(riskValues.map((value) => ({ value, label: `风险 ${value}` }))), state.risk)}</select>
              </div>
              <div class="field">
                <label for="scr-liquidity">流动性</label>
                <select id="scr-liquidity" data-screener-filter="liquidity">${optionList([{ value: "all", label: "全部流动性" }].concat(liquidityValues.map((value) => ({ value, label: value }))), state.liquidity)}</select>
              </div>
              <div class="field">
                <label for="scr-state">当前结论</label>
                <select id="scr-state" data-screener-filter="state">${optionList([{ value: "all", label: "全部结论" }].concat(screenerStateValues.map((value) => ({ value, label: value }))), state.state)}</select>
              </div>
            </div>
            <div class="board-meta">
              <span id="screener-count">当前结果：${filteredItems.length} 只</span>
              <span>默认按结论优先级、风险等级和名称排序，方便像 Investing 一样先做横向比较再点进详情。</span>
            </div>
            <div class="valuation-table-wrap">
              <table class="valuation-table">
                <thead>
                  <tr>
                    <th>公司</th>
                    <th>市场</th>
                    <th>当前结论</th>
                    <th>主策略</th>
                    <th>风险场景</th>
                    <th>关键指标</th>
                    <th>价格</th>
                    <th>市值 / 流动性</th>
                  </tr>
                </thead>
                <tbody id="screener-body">
                  ${filteredItems.map(renderScreenerRow).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      `,
      { stockId: featuredStockId }
    );

    return marketId;
  }

  function renderStockPage() {
    const stockId = safeStock(currentParams().get("stock"));
    const summary = summaryById[stockId];
    const detail = data.stockDetails[stockId];
    const market = data.markets[summary.market];
    const strategy = strategyById[summary.strategyId];
    const scenes = detail.avoid.sceneIds.map((sceneId) => sceneById[sceneId]);
    const relatedStocks = data.stockSummaries
      .filter((item) => item.market === summary.market && item.id !== summary.id)
      .slice(0, 3)
      .map((item) => `<a class="related-link" href="${stockUrl(item.id)}"><strong>${item.name}</strong><span>${data.stockDetails[item.id].conclusion.summary}</span></a>`)
      .join("");

    setTitle(`${summary.name}详情`);
    renderShell(
      "stock",
      summary.market,
      `
        <section class="section">
          <div class="banner-grid">
            <div class="banner-card">
              <div class="eyebrow">${market.name} / ${summary.symbol}</div>
              <h1 class="page-title">${summary.name}</h1>
              <p class="page-subtitle">${summary.industry} | 价格 ${summary.price} | 市值 ${summary.marketCap} | 流动性 ${summary.liquidity}</p>
              <div class="pill-row">
                ${pill(strategy.name, "primary")}
                ${pill(`风险 ${summary.riskLevel}`, riskTone[summary.riskLevel])}
                ${pill(`适合周期 ${detail.conclusion.cycle}`, "neutral")}
              </div>
            </div>
            <div class="banner-side">
              <div class="state-card ${detail.conclusion.state === "回避" ? "risk" : ""}">
                <div class="section-marker">Conclusion</div>
                <div class="pill-row">${pill(detail.conclusion.state, stateTone[detail.conclusion.state])}</div>
                <div class="state-value"><strong>${detail.conclusion.state}</strong></div>
                <p class="state-note">${detail.conclusion.summary}</p>
              </div>
              <div class="aside-panel">
                <strong>操作区</strong>
                <p>保留自选、提醒、分享与订阅解锁入口，演示详情页的关键操作层。</p>
                <div class="button-row">
                  <button class="button ghost" data-toggle="favorite" data-off-label="加入自选" data-on-label="已加入自选" data-off-message="${summary.name} 已加入自选示意。" data-on-message="${summary.name} 已从自选中移除示意。">加入自选</button>
                  <button class="button ghost" data-toggle="alert" data-off-label="设置提醒" data-on-label="提醒已开启" data-off-message="${summary.name} 已开启提醒示意。" data-on-message="${summary.name} 已关闭提醒示意。">设置提醒</button>
                  <button class="button ghost" data-message="分享功能在本轮原型中仅保留入口。">分享</button>
                  <button class="button primary" data-message="订阅拦截层将在下一轮补完整态。">订阅解锁</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="detail-grid">
            <div class="content-stack">
              <div class="section-panel">
                <div class="section-head">
                  <div>
                    <div class="section-marker">Why Buy</div>
                    <h2>入选理由</h2>
                    <p>把它放回 ${market.shortName} 市场的方法框架里，先回答“${strategy.coreQuestion}”，再决定是否值得继续跟踪。</p>
                  </div>
                </div>
                <ul class="list-bullets">${detail.thesis.map((item) => `<li>${item}</li>`).join("")}</ul>
              </div>

              <div class="warning-box">
                <div class="section-marker">Why Not Buy</div>
                <h2>不能买判断</h2>
                <p>${detail.avoid.reason}</p>
                <div class="pill-row">
                  ${detail.avoid.tags.map((tag) => pill(tag, "danger")).join("")}
                  ${scenes.map((scene) => `<a href="${boardUrl(summary.market, "avoid", { scene: scene.id })}">${pill(scene.name, "warning")}</a>`).join("")}
                </div>
              </div>

              <div class="section-panel">
                <div class="section-head">
                  <div>
                    <div class="section-marker">Metrics</div>
                    <h2>市场专属指标面板</h2>
                    <p>${market.methodSummary}</p>
                  </div>
                </div>
                <div class="insight-grid">
                  ${detail.metrics.map((item) => `<article class="metric-card"><strong>${item.value}</strong><span>${item.label}</span><span>${item.comment}</span></article>`).join("")}
                </div>
              </div>

              <div class="section-panel">
                <div class="section-head">
                  <div>
                    <div class="section-marker">Related</div>
                    <h2>相关榜单与替代方向</h2>
                    <p>从详情页继续回到市场页双榜单、独立估值页、趋势页和替代方向，是后续增长路径的关键承接。</p>
                  </div>
                </div>
                <div class="related-list">
                  ${detail.related.rankings.map((item) => `<a class="related-link" href="${item.url}"><strong>${item.label}</strong><span>回到市场页继续查看对应筛选和样本。</span></a>`).join("")}
                  ${detail.related.analysis.map((item) => `<a class="related-link" href="${item.url}"><strong>${item.label}</strong><span>${item.summary}</span></a>`).join("")}
                  ${detail.related.alternatives.map((item) => `<a class="related-link" href="${item.url}"><strong>${item.label}</strong><span>${item.reason}</span></a>`).join("")}
                </div>
              </div>
            </div>

            <div class="aside-stack">
              <div class="aside-panel">
                <strong>结论卡</strong>
                <p>状态支持“关注 / 观察 / 回避”三态切换，是全站复用的核心业务组件。</p>
                <div class="pill-row">${pill(`风险等级 ${detail.conclusion.risk}`, riskTone[detail.conclusion.risk])}${pill(`适合周期 ${detail.conclusion.cycle}`, "neutral")}</div>
              </div>
              <div class="aside-panel">
                <strong>市场方法镜头</strong>
                <p>${market.methodSummary}</p>
                <div class="pill-row">${pill(market.shortName, "primary")}${pill(strategy.name, "neutral")}</div>
              </div>
              <div class="aside-panel">
                <strong>这条思路先确认什么</strong>
                <p>${strategy.mustConfirm}</p>
                <p>最容易看错：${strategy.falsePositive}</p>
              </div>
              <div class="aside-panel">
                <strong>同市场延伸阅读</strong>
                <p>保留同市场股票继续跳转的能力，模拟用户在详情页深挖的实际行为。</p>
                <div class="related-list">${relatedStocks || renderEmpty("暂无更多同市场样本。")}</div>
              </div>
              <div class="aside-panel">
                <strong>风险标签跳转</strong>
                <p>风险标签直接跳到对应市场页的今日不能买榜，并带上场景预设筛选。</p>
                <div class="related-list">${scenes.map((scene) => `<a class="related-link" href="${boardUrl(summary.market, "avoid", { scene: scene.id })}"><strong>${scene.name}</strong><span>${scene.summary}</span></a>`).join("")}</div>
              </div>
            </div>
          </div>
        </section>

        <div class="note-bar">${data.site.note}</div>
      `
      ,
      { stockId }
    );
  }

  const page = document.body.dataset.page;

  if (page === "home") {
    renderHomePage();
  } else if (page === "market") {
    const marketId = renderMarketPage();
    if (marketId) {
      bindMarketBoards(marketId);
    }
  } else if (page === "valuation") {
    const marketId = renderValuationPage();
    bindValuationPanel(marketId);
  } else if (page === "trend") {
    renderTrendPage();
  } else if (page === "screener") {
    const marketId = renderScreenerPage();
    bindScreenerPanel(marketId);
  } else if (page === "stock") {
    renderStockPage();
  }

  scrollToHashTarget();
})();
