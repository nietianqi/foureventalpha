(function () {
  const data = window.prototypeData;
  const app = document.getElementById("app");

  if (!data || !app) {
    return;
  }

  const summaryById = Object.fromEntries(data.stockSummaries.map((item) => [item.id, item]));
  const strategyById = Object.fromEntries(data.strategyCards.map((item) => [item.id, item]));
  const sceneById = Object.fromEntries(data.avoidSceneCards.map((item) => [item.id, item]));
  const valuationPresetById = Object.fromEntries(data.valuationPresets.map((item) => [item.id, item]));
  const trendByMarket = Object.fromEntries(data.trendSignals.map((item) => [item.market, item]));
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

  function valuationUrl(marketId, filters) {
    const next = new URLSearchParams();
    const config = filters || {};

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

    const query = next.toString();
    return `${marketUrl(marketId)}${query ? `?${query}` : ""}#valuation-board`;
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

  function renderHeader(activePage, activeMarket) {
    const navLinks = [
      { id: "home", label: "首页", href: "index.html" },
      { id: "market", label: "市场页", href: marketUrl(activeMarket || "cn") },
      { id: "stock", label: "股票详情", href: stockUrl("cn-galaxy-energy") }
    ];

    const links = navLinks
      .map((item) => `<a class="nav-link${item.id === activePage ? " is-active" : ""}" href="${item.href}">${item.label}</a>`)
      .join("");

    const marketLinks = data.marketOrder
      .map((marketId) => {
        const market = data.markets[marketId];
        return `<a class="chip${marketId === activeMarket ? " is-active" : ""}" href="${marketUrl(marketId)}">${market.shortName}</a>`;
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
            <div class="search-hint">搜索示意：输入名称 / 代码 / 场景</div>
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
            <p>${data.site.note} 当前更新时间：${data.site.updatedAt}。本轮正式入口为首页、四个独立市场页和股票详情页；市场页已经升级为左侧双榜单 + 右侧估值工作台 / 趋势雷达。</p>
          </div>
        </div>
      </footer>
      <div class="toast" id="page-toast"></div>
    `;
  }

  function renderShell(activePage, activeMarket, content) {
    app.innerHTML = `
      <div class="page-shell">
        ${renderHeader(activePage, activeMarket)}
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

  function renderHomePage() {
    setTitle("首页原型");
    const opportunityItems = data.rankingItems.filter((item) => item.type === "opportunity").slice(0, 4);
    const avoidItems = data.rankingItems.filter((item) => item.type === "avoid").slice(0, 4);

    const marketCards = data.marketOrder
      .map((marketId) => {
        const market = data.markets[marketId];
        const strategy = strategyById[market.strategyIds[0]];
        const scene = sceneById[market.avoidSceneIds[0]];
        return `
          <article class="card">
            ${pill(market.shortName, "primary")}
            <h3>${market.name}</h3>
            <p>${market.headline}</p>
            <div class="pill-row">
              ${pill(`当前主思路：${strategy.name}`, "success")}
              ${pill(`先别碰：${scene.name}`, "danger")}
            </div>
            <div class="stock-row-footer">
              <span class="card-subtle">适合风格：${market.fitStyle}</span>
              <a class="button ghost subtle" href="${marketUrl(marketId)}">进入市场页</a>
            </div>
          </article>
        `;
      })
      .join("");

    const teachingCards = data.marketOrder
      .map((marketId) => {
        const market = data.markets[marketId];
        return `
          <article class="card">
            ${pill(market.shortName, "dark")}
            <h3>${market.name}要怎么读</h3>
            <p>${market.intro}</p>
            <div class="pill-row">${pill(market.fitStyle, "neutral")}</div>
            <ul class="list-bullets">${market.education.map((item) => `<li>${item}</li>`).join("")}</ul>
          </article>
        `;
      })
      .join("");

    renderShell(
      "home",
      "cn",
      `
        <section class="hero">
          <div class="hero-grid">
            <div>
              <div class="eyebrow">P0 首页原型</div>
              <h1>四个市场，不能只用一套买法。</h1>
              <p>首页不是资讯堆砌页，而是决策入口。用户进来后要在 5 秒内理解：四个市场用不同逻辑判断，机会和风险也必须并排看。</p>
              <div class="button-row">
                <a class="button primary" href="${marketUrl("cn")}">从中国市场开始</a>
                <a class="button secondary" href="${valuationUrl("us", data.markets.us.valuationDefaults)}">先看估值工作台</a>
              </div>
              <div class="stats-grid">
                <div class="stat-card"><strong>4</strong><span>独立市场入口页</span></div>
                <div class="stat-card"><strong>2</strong><span>左侧机会/风险榜单</span></div>
                <div class="stat-card"><strong>1</strong><span>右侧合理估值工作台</span></div>
                <div class="stat-card"><strong>1</strong><span>趋势雷达侧栏</span></div>
              </div>
            </div>
            <div class="hero-side">
              <div class="floating-card"><strong>首页必须回答的 3 个问题</strong><span>现在应该去哪个市场看？用什么逻辑看？今天最该先避开什么？</span></div>
              <div class="floating-card"><strong>本轮原型交互范围</strong><span>支持四市场独立切换、左侧双榜单筛选、右侧估值工作台筛选、趋势跳转和详情页状态演示。</span></div>
              <div class="floating-card"><strong>原型输出定位</strong><span>HTML 中保真结构稿，可直接作为后续 Figma 还原和前端实现基线。</span></div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Markets</div>
              <h2>四市场总览卡片</h2>
              <p>每张卡片同时告诉用户：这个市场该怎么看、当前主思路是什么、今天最该避开什么。</p>
            </div>
            <a class="button ghost subtle" href="${marketUrl("us")}">看市场模板</a>
          </div>
          <div class="market-grid">${marketCards}</div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Boards</div>
              <h2>机会与风险并列展示</h2>
              <p>首页继续保留摘要能力，但完整筛选、估值工作台和趋势雷达都沉到了各市场页。</p>
            </div>
          </div>
          <div class="ranking-panels">
            <div class="panel opportunity">
              <div class="panel-head">
                <div><strong class="panel-title">今日机会榜摘要</strong><p>优先展示逻辑、催化与风险都能讲清楚的样本。</p></div>
                <a class="button ghost subtle" href="${boardUrl("cn", "opportunity", {})}">去市场页查看</a>
              </div>
              <div class="stock-list">${opportunityItems.map(renderCompactStock).join("")}</div>
            </div>
            <div class="panel risk">
              <div class="panel-head">
                <div><strong class="panel-title">今日不能买榜摘要</strong><p>情绪末端、便宜陷阱和流动性风险优先亮出来。</p></div>
                <a class="button warning subtle" href="${boardUrl("cn", "avoid", {})}">去市场页查看</a>
              </div>
              <div class="stock-list">${avoidItems.map(renderCompactStock).join("")}</div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Teaching</div>
              <h2>思路教学区</h2>
              <p>用更明确的信息架构，告诉用户四个市场适合什么风格、应该避开哪些常见误判。</p>
            </div>
          </div>
          <div class="teaching-grid">${teachingCards}</div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Subscription</div>
              <h2>订阅转化区</h2>
              <p>未接入真实支付，但保留免费与付费权益对比，让后续商业化设计有承接位置。</p>
            </div>
          </div>
          <div class="subscription-grid">
            <article class="subscription-card">
              <strong class="card-title">免费用户</strong>
              <p>可查看首页摘要、市场主线、双榜单公开样本和部分详情页内容。</p>
              <ul class="list-bullets">
                <li>四市场总览与基础教学</li>
                <li>市场页双榜单公开筛选</li>
                <li>右侧估值工作台公开摘要</li>
              </ul>
              <div class="button-row"><button class="button ghost" data-message="免费路径已默认开放。">继续浏览</button></div>
            </article>
            <article class="subscription-card highlight">
              <strong class="card-title">订阅会员</strong>
              <p>解锁完整的不能买判断、更多估值筛选组合、提醒能力和更细的市场场景解释。</p>
              <ul class="list-bullets">
                <li>完整场景判断与替代建议</li>
                <li>自选、提醒、权限拦截演示挂点</li>
                <li>更多估值维度与趋势联动</li>
              </ul>
              <div class="button-row"><button class="button secondary" data-message="订阅页将在下一轮补全完整态。">查看权益</button></div>
            </article>
          </div>
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
          <span>参考 Investing 选股器骨架做筛选工作台，但这里只保留适合本原型的核心判断维度。</span>
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
            <p>${market.trendOverview}</p>
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
    const market = data.markets[marketId];
    const opportunityState = getBoardState("op", marketId);
    const avoidState = getBoardState("av", marketId);
    const valuationState = getValuationState(marketId);

    const strategyCards = market.strategyIds
      .map((strategyId) => {
        const strategy = strategyById[strategyId];
        return `
          <article class="card">
            ${pill("怎么买", "primary")}
            <h3>${strategy.name}</h3>
            <p>${strategy.summary}</p>
            <div class="pill-row">
              ${pill(`适合：${strategy.fitFor}`, "neutral")}
              ${pill(`周期：${strategy.cycle}`, "success")}
            </div>
            <div class="stock-row-footer">
              <span class="card-subtle">催化：${strategy.catalyst}</span>
              <a class="button ghost subtle" href="${boardUrl(marketId, "opportunity", { strategy: strategy.id })}">查看机会样本</a>
            </div>
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
            <div class="pill-row">${pill(scene.signal, "neutral")}</div>
            <div class="stock-row-footer">
              <span class="card-subtle">替代方向：${scene.substitute}</span>
              <a class="button warning subtle" href="${boardUrl(marketId, "avoid", { scene: scene.id })}">查看回避样本</a>
            </div>
          </article>
        `;
      })
      .join("");

    setTitle(`${market.name}原型`);
    renderShell(
      "market",
      marketId,
      `
        <section class="section">
          <div class="banner-grid">
            <div class="banner-card">
              <div class="eyebrow">${market.name}</div>
              <h1 class="page-title">${market.headline}</h1>
              <p class="page-subtitle">${market.currentState}</p>
              <div class="button-row">
                <a class="button secondary" href="#opportunity-board">看今日机会榜</a>
                <a class="button ghost" href="#avoid-board">看今日不能买榜</a>
                <a class="button primary" href="#valuation-board">看合理估值台</a>
              </div>
            </div>
            <div class="banner-side">
              <div class="banner-stat"><strong>${market.fitStyle}</strong><span>适合风格</span></div>
              <div class="banner-stat"><strong>${market.pitfall}</strong><span>最易踩坑类型</span></div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Strategy</div>
              <h2>要怎么买</h2>
              <p>统一的 4 张思路卡模板，不同市场只替换内容，不改结构。</p>
            </div>
          </div>
          <div class="market-grid">${strategyCards}</div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Avoid</div>
              <h2>不能买什么</h2>
              <p>把“不能买场景”做成稳定结构，首页、市场页和详情页继续复用同一套视觉语言。</p>
            </div>
          </div>
          <div class="market-grid">${sceneCards}</div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Workspace</div>
              <h2>市场筛选演示区</h2>
              <p>${market.name} 的左侧继续保留双榜单筛选，右侧新增合理估值工作台与趋势雷达，三块内容互相配合但状态独立。</p>
            </div>
          </div>
          <div class="market-workspace">
            <div class="filter-panel board-hub">
              <div class="workspace-head">
                <strong>左侧双榜单</strong>
                <span>机会榜和不能买榜互不影响，继续承担“先找方向、先避坑”的主职责。</span>
              </div>
              <div class="board-grid">
                ${renderBoardPanel("opportunity", marketId, opportunityState)}
                ${renderBoardPanel("avoid", marketId, avoidState)}
              </div>
            </div>
            <div class="analysis-grid">
              ${renderValuationPanel(marketId, valuationState)}
              ${renderTrendPanel(marketId)}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-panel">
            <div class="section-head">
              <div>
                <div class="section-marker">Education</div>
                <h2>为什么这个市场要这么看</h2>
                <p>${market.intro}</p>
              </div>
            </div>
            <div class="education-grid">
              ${market.education.map((item, index) => `<article class="card">${pill(`教学要点 ${index + 1}`, "dark")}<h3>${market.shortName}市场判断规则</h3><p>${item}</p></article>`).join("")}
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

    function getFilteredItems() {
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
      const body = app.querySelector('#valuation-body');
      const count = app.querySelector('#valuation-count');

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
                    <p>详情页必须先把这只股票为什么值得看讲清楚，再谈应该如何约束风险。</p>
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
                    <p>${market.name} 的判断逻辑会落到不同指标上，详情页用统一栅格展示可比较信息。</p>
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
                    <p>从详情页继续回到市场工作区查看双榜单、估值与替代方向，是后续增长路径的关键承接。</p>
                  </div>
                </div>
                <div class="related-list">
                  ${detail.related.rankings.map((item) => `<a class="related-link" href="${item.url}"><strong>${item.label}</strong><span>回到市场页继续查看对应筛选和样本。</span></a>`).join("")}
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
    );
  }

  const page = document.body.dataset.page;

  if (page === "home") {
    renderHomePage();
  } else if (page === "market") {
    const marketId = renderMarketPage();
    bindMarketBoards(marketId);
    bindValuationPanel(marketId);
  } else if (page === "stock") {
    renderStockPage();
  }

  scrollToHashTarget();
})();
