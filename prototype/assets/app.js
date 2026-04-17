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

  const screenerReplicaConfig = {
    title: "选股器_股票筛选查询工具",
    subtitle: "把热门策略、分类筛选、列视图和高密度表格压在同一张工作台里，先筛再比，再决定要不要点进详情。",
    strategyPresets: [
      { id: "all", label: "全部股票", performance: "", filters: {} },
      { id: "dynamic-master", label: "动态大师", performance: "+61.3%", filters: { near52wHigh: "within5", above50d: "yes", volumeSignal: "hot" } },
      { id: "bull-run", label: "牛气哄哄", performance: "+50%", filters: { oneYearReturn: "above50", ytdReturn: "above20", above50d: "yes" } },
      { id: "near-high", label: "接近52周高点", performance: "+37.2%", filters: { near52wHigh: "within5", rsi: "between55and70" } },
      { id: "technical-bull", label: "技术面大牛股", performance: "+36.6%", filters: { near52wHigh: "within10", above50d: "yes", above200d: "yes", volumeSignal: "hot" } },
      { id: "below-book", label: "股价低于每股净资产70%的股票", performance: "+34.8%", filters: { pb: "below1", upside: "above30" } },
      { id: "value-master", label: "真乃基本大佬", performance: "+33%", filters: { pe: "below10", roe: "above15", upside: "above15" } },
      { id: "rocket-growth", label: "火箭成长股", performance: "+17.7%", filters: { revenueGrowth: "above20", epsGrowth: "above20" } },
      { id: "overvalued", label: "被高估的股票", performance: "+15.2%", filters: { pe: "above40", upside: "below0" } }
    ],
    categories: [
      { id: "popular", label: "热门", primary: ["marketCap", "price", "dividendYield", "peg"], secondary: ["exchange", "sector", "near52wHigh", "upside"] },
      { id: "price", label: "价格", primary: ["price", "dayChange", "weekChange", "near52wHigh"], secondary: ["monthChange", "ytdReturn", "oneYearReturn", "volumeSignal"] },
      { id: "valuation", label: "估值", primary: ["pe", "pb", "ps", "peg"], secondary: ["marketCap", "upside", "analystRating", "sector"] },
      { id: "insight", label: "洞察", primary: ["upside", "analystRating", "volumeSignal", "riskLevel"], secondary: ["exchange", "sector", "oneYearReturn", "near52wHigh"] },
      { id: "financial", label: "财务", primary: ["grossMargin", "netMargin", "roe", "debtEquity"], secondary: ["roa", "fcfMargin", "marketCap", "exchange"] },
      { id: "dividend", label: "股息", primary: ["dividendYield", "payoutRatio", "dividendStreak", "dividendGrowth5y"], secondary: ["marketCap", "exchange", "sector", "riskLevel"] },
      { id: "growth", label: "增长", primary: ["revenueGrowth", "epsGrowth", "oneYearReturn", "upside"], secondary: ["netMargin", "roe", "sector", "riskLevel"] },
      { id: "returns", label: "回报", primary: ["ytdReturn", "oneYearReturn", "roe", "upside"], secondary: ["dividendYield", "beta", "riskLevel", "exchange"] },
      { id: "risk", label: "风险", primary: ["riskLevel", "beta", "volatility30d", "debtEquity"], secondary: ["maxDrawdown", "oneYearReturn", "sector", "exchange"] },
      { id: "technical", label: "技术", primary: ["near52wHigh", "rsi", "above50d", "volumeSignal"], secondary: ["dayChange", "weekChange", "oneYearReturn", "riskLevel"] },
      { id: "efficiency", label: "效率", primary: ["grossMargin", "fcfMargin", "assetTurnover", "roe"], secondary: ["netMargin", "revenueGrowth", "debtEquity", "sector"] },
      { id: "profile", label: "简介", primary: ["exchange", "sector", "securityType", "riskLevel"], secondary: ["marketCap", "dividendYield", "upside", "oneYearReturn"] }
    ],
    filters: {
      marketCap: { label: "市值", options: [{ value: "all", label: "任何" }, { value: "mega", label: "超大盘 (>¥1万亿)" }, { value: "large", label: "大盘 (¥5,000亿-¥1万亿)" }, { value: "mid", label: "中盘 (¥2,000亿-¥5,000亿)" }, { value: "small", label: "小盘 (<¥2,000亿)" }] },
      price: { label: "最近成交价", options: [{ value: "all", label: "任何" }, { value: "below10", label: "低于 ¥10" }, { value: "between10and50", label: "¥10 - ¥50" }, { value: "between50and200", label: "¥50 - ¥200" }, { value: "above200", label: "高于 ¥200" }] },
      dividendYield: { label: "股息收益率(%)", options: [{ value: "all", label: "任何" }, { value: "above5", label: "高于 5%" }, { value: "between3and5", label: "3% - 5%" }, { value: "between1and3", label: "1% - 3%" }, { value: "below1", label: "低于 1%" }] },
      peg: { label: "市盈增长比率", options: [{ value: "all", label: "任何" }, { value: "below1", label: "低于 1" }, { value: "between1and2", label: "1 - 2" }, { value: "between2and5", label: "2 - 5" }, { value: "above5", label: "高于 5" }] },
      exchange: { label: "交易所", options: [{ value: "all", label: "任何" }, { value: "shanghai", label: "上海" }, { value: "shenzhen", label: "深圳" }] },
      sector: { label: "板块", options: [{ value: "all", label: "任何" }, { value: "金融", label: "金融" }, { value: "能源", label: "能源" }, { value: "工业", label: "工业" }, { value: "消费", label: "消费" }, { value: "科技", label: "科技" }, { value: "基础材料", label: "基础材料" }, { value: "公用事业", label: "公用事业" }] },
      near52wHigh: { label: "距离52周高点", options: [{ value: "all", label: "任何" }, { value: "within5", label: "5%以内" }, { value: "within10", label: "10%以内" }, { value: "within20", label: "20%以内" }, { value: "over20", label: "20%以上" }] },
      upside: { label: "上行边际", options: [{ value: "all", label: "任何" }, { value: "above30", label: "高于 30%" }, { value: "between15and30", label: "15% - 30%" }, { value: "between0and15", label: "0% - 15%" }, { value: "below0", label: "低于 0%" }] },
      dayChange: { label: "日涨跌幅", options: [{ value: "all", label: "任何" }, { value: "above3", label: "高于 3%" }, { value: "between0and3", label: "0% - 3%" }, { value: "betweenNeg3and0", label: "-3% - 0%" }, { value: "belowNeg3", label: "低于 -3%" }] },
      weekChange: { label: "一周涨跌", options: [{ value: "all", label: "任何" }, { value: "above5", label: "高于 5%" }, { value: "between0and5", label: "0% - 5%" }, { value: "betweenNeg5and0", label: "-5% - 0%" }, { value: "belowNeg5", label: "低于 -5%" }] },
      monthChange: { label: "一月涨跌", options: [{ value: "all", label: "任何" }, { value: "above15", label: "高于 15%" }, { value: "between5and15", label: "5% - 15%" }, { value: "between0and5", label: "0% - 5%" }, { value: "below0", label: "低于 0%" }] },
      ytdReturn: { label: "年初至今", options: [{ value: "all", label: "任何" }, { value: "above20", label: "高于 20%" }, { value: "between10and20", label: "10% - 20%" }, { value: "between0and10", label: "0% - 10%" }, { value: "below0", label: "低于 0%" }] },
      oneYearReturn: { label: "过去一年涨跌", options: [{ value: "all", label: "任何" }, { value: "above50", label: "高于 50%" }, { value: "between20and50", label: "20% - 50%" }, { value: "between0and20", label: "0% - 20%" }, { value: "below0", label: "低于 0%" }] },
      pe: { label: "市盈率", options: [{ value: "all", label: "任何" }, { value: "below10", label: "低于 10x" }, { value: "between10and20", label: "10x - 20x" }, { value: "between20and40", label: "20x - 40x" }, { value: "above40", label: "高于 40x" }] },
      pb: { label: "市净率", options: [{ value: "all", label: "任何" }, { value: "below1", label: "低于 1x" }, { value: "between1and2", label: "1x - 2x" }, { value: "between2and4", label: "2x - 4x" }, { value: "above4", label: "高于 4x" }] },
      ps: { label: "市销率", options: [{ value: "all", label: "任何" }, { value: "below1", label: "低于 1x" }, { value: "between1and3", label: "1x - 3x" }, { value: "between3and6", label: "3x - 6x" }, { value: "above6", label: "高于 6x" }] },
      analystRating: { label: "分析师评级", options: [{ value: "all", label: "任何" }, { value: "strongBuy", label: "强力买入" }, { value: "buy", label: "买入" }, { value: "hold", label: "中性" }] },
      grossMargin: { label: "毛利率", options: [{ value: "all", label: "任何" }, { value: "above40", label: "高于 40%" }, { value: "between20and40", label: "20% - 40%" }, { value: "between10and20", label: "10% - 20%" }, { value: "below10", label: "低于 10%" }] },
      netMargin: { label: "净利率", options: [{ value: "all", label: "任何" }, { value: "above20", label: "高于 20%" }, { value: "between10and20", label: "10% - 20%" }, { value: "between0and10", label: "0% - 10%" }, { value: "below0", label: "低于 0%" }] },
      roe: { label: "股本回报率", options: [{ value: "all", label: "任何" }, { value: "above20", label: "高于 20%" }, { value: "above15", label: "15% - 20%" }, { value: "between10and15", label: "10% - 15%" }, { value: "below10", label: "低于 10%" }] },
      roa: { label: "资产回报率", options: [{ value: "all", label: "任何" }, { value: "above10", label: "高于 10%" }, { value: "between5and10", label: "5% - 10%" }, { value: "between0and5", label: "0% - 5%" }, { value: "below0", label: "低于 0%" }] },
      debtEquity: { label: "债务股本比", options: [{ value: "all", label: "任何" }, { value: "below30", label: "低于 30%" }, { value: "between30and60", label: "30% - 60%" }, { value: "between60and100", label: "60% - 100%" }, { value: "above100", label: "高于 100%" }] },
      fcfMargin: { label: "自由现金流利润率", options: [{ value: "all", label: "任何" }, { value: "above20", label: "高于 20%" }, { value: "between10and20", label: "10% - 20%" }, { value: "between0and10", label: "0% - 10%" }, { value: "below0", label: "低于 0%" }] },
      payoutRatio: { label: "股息支付率", options: [{ value: "all", label: "任何" }, { value: "under30", label: "低于 30%" }, { value: "between30and50", label: "30% - 50%" }, { value: "between50and70", label: "50% - 70%" }, { value: "over70", label: "高于 70%" }] },
      dividendStreak: { label: "连续派息年数", options: [{ value: "all", label: "任何" }, { value: "over10", label: "10年以上" }, { value: "between5and10", label: "5 - 10年" }, { value: "between1and5", label: "1 - 5年" }, { value: "none", label: "未派息" }] },
      dividendGrowth5y: { label: "五年股息增长", options: [{ value: "all", label: "任何" }, { value: "above10", label: "高于 10%" }, { value: "between5and10", label: "5% - 10%" }, { value: "between0and5", label: "0% - 5%" }, { value: "below0", label: "低于 0%" }] },
      revenueGrowth: { label: "营收增长", options: [{ value: "all", label: "任何" }, { value: "above20", label: "高于 20%" }, { value: "between10and20", label: "10% - 20%" }, { value: "between0and10", label: "0% - 10%" }, { value: "below0", label: "低于 0%" }] },
      epsGrowth: { label: "每股收益增长", options: [{ value: "all", label: "任何" }, { value: "above20", label: "高于 20%" }, { value: "between10and20", label: "10% - 20%" }, { value: "between0and10", label: "0% - 10%" }, { value: "below0", label: "低于 0%" }] },
      riskLevel: { label: "风险等级", options: [{ value: "all", label: "任何" }, { value: "low", label: "低风险" }, { value: "medium", label: "中风险" }, { value: "high", label: "高风险" }] },
      beta: { label: "贝塔", options: [{ value: "all", label: "任何" }, { value: "below0_8", label: "低于 0.8" }, { value: "between0_8and1_2", label: "0.8 - 1.2" }, { value: "between1_2and1_6", label: "1.2 - 1.6" }, { value: "above1_6", label: "高于 1.6" }] },
      volatility30d: { label: "30日波动率", options: [{ value: "all", label: "任何" }, { value: "below20", label: "低于 20%" }, { value: "between20and30", label: "20% - 30%" }, { value: "between30and40", label: "30% - 40%" }, { value: "above40", label: "高于 40%" }] },
      maxDrawdown: { label: "最大回撤", options: [{ value: "all", label: "任何" }, { value: "below15", label: "低于 15%" }, { value: "between15and25", label: "15% - 25%" }, { value: "between25and35", label: "25% - 35%" }, { value: "above35", label: "高于 35%" }] },
      rsi: { label: "RSI", options: [{ value: "all", label: "任何" }, { value: "over70", label: "高于 70" }, { value: "between55and70", label: "55 - 70" }, { value: "between45and55", label: "45 - 55" }, { value: "below45", label: "低于 45" }] },
      above50d: { label: "高于50日均线", options: [{ value: "all", label: "任何" }, { value: "yes", label: "是" }, { value: "no", label: "否" }] },
      above200d: { label: "高于200日均线", options: [{ value: "all", label: "任何" }, { value: "yes", label: "是" }, { value: "no", label: "否" }] },
      volumeSignal: { label: "异常成交量", options: [{ value: "all", label: "任何" }, { value: "hot", label: "热度放量" }, { value: "warm", label: "温和放量" }, { value: "calm", label: "平稳成交" }] },
      assetTurnover: { label: "资产周转率", options: [{ value: "all", label: "任何" }, { value: "above1", label: "高于 1" }, { value: "between0_5and1", label: "0.5 - 1" }, { value: "between0_2and0_5", label: "0.2 - 0.5" }, { value: "below0_2", label: "低于 0.2" }] },
      securityType: { label: "上市板块", options: [{ value: "all", label: "任何" }, { value: "主板", label: "主板" }, { value: "创业板", label: "创业板" }, { value: "科创板", label: "科创板" }] }
    },
    views: [
      { id: "overview", label: "概览", columns: ["company", "name", "exchange", "board", "industry", "marketCap", "pe", "peg", "price", "dayChange", "fairValue", "fairValueUpside", "fairValueRating", "analystTarget", "upside"] },
      { id: "insight", label: "洞察", columns: ["company", "name", "exchange", "board", "sector", "marketCap", "pe", "analystRating", "fairValue", "fairValueUpside", "fairValueRating", "analystTarget", "upside"] },
      { id: "valuation", label: "估值", columns: ["company", "name", "exchange", "board", "marketCap", "price", "pe", "pb", "ps", "peg", "upside"] },
      { id: "returns", label: "回报", columns: ["company", "name", "exchange", "board", "dayChange", "weekChange", "monthChange", "ytdReturn", "oneYearReturn", "upside"] },
      { id: "technical", label: "技术", columns: ["company", "name", "exchange", "board", "price", "near52wHigh", "rsi", "above50d", "above200d", "volumeSignal", "dayChange"] },
      { id: "financial", label: "财务", columns: ["company", "name", "exchange", "board", "revenueGrowth", "grossMargin", "netMargin", "roe", "roa", "debtEquity", "fcfMargin"] },
      { id: "growth", label: "增长", columns: ["company", "name", "exchange", "board", "revenueGrowth", "epsGrowth", "ytdReturn", "oneYearReturn", "analystRating", "upside"] },
      { id: "risk", label: "风险", columns: ["company", "name", "exchange", "board", "riskLevel", "beta", "volatility30d", "maxDrawdown", "debtEquity", "oneYearReturn"] },
      { id: "custom", label: "自定义", columns: ["company", "name", "marketCap", "price", "pe", "upside"] }
    ],
    customColumnPool: [
      { id: "sector", label: "板块" },
      { id: "industry", label: "行业" },
      { id: "marketCap", label: "市值" },
      { id: "pe", label: "市盈率" },
      { id: "pb", label: "市净率" },
      { id: "ps", label: "市销率" },
      { id: "peg", label: "市盈增长比率" },
      { id: "price", label: "最近成交价" },
      { id: "dayChange", label: "日涨跌幅" },
      { id: "dividendYield", label: "股息收益率" },
      { id: "upside", label: "上行边际" },
      { id: "revenueGrowth", label: "营收增长" },
      { id: "epsGrowth", label: "EPS增长" },
      { id: "grossMargin", label: "毛利率" },
      { id: "roe", label: "ROE" },
      { id: "beta", label: "贝塔" },
      { id: "near52wHigh", label: "距52周高点" }
    ]
  };

  const screenerReplicaFilterIds = Object.keys(screenerReplicaConfig.filters);
  const screenerReplicaPresetById = Object.fromEntries(screenerReplicaConfig.strategyPresets.map((item) => [item.id, item]));
  const screenerReplicaCategoryById = Object.fromEntries(screenerReplicaConfig.categories.map((item) => [item.id, item]));
  const screenerReplicaViewById = Object.fromEntries(screenerReplicaConfig.views.map((item) => [item.id, item]));
  const screenerReplicaColumnById = Object.fromEntries(screenerReplicaConfig.customColumnPool.map((item) => [item.id, item]));
  const screenerReplicaColumnLabels = {
    company: "公司",
    name: "名称",
    exchange: "交易所",
    board: "板块",
    sector: "板块",
    industry: "行业",
    marketCap: "市值",
    pe: "市盈率",
    pb: "市净率",
    ps: "市销率",
    peg: "市盈增长比率",
    price: "最近成交价",
    dayChange: "日涨跌幅(%)",
    fairValue: "公允价值",
    fairValueUpside: "公允价值上行边际",
    fairValueRating: "公允价值评级",
    analystTarget: "分析师目标价",
    upside: "上涨边际(按分析师目标价计)",
    dividendYield: "股息收益率(%)",
    payoutRatio: "股息支付率(%)",
    dividendStreak: "连续派息(年)",
    dividendGrowth5y: "五年股息增长(%)",
    weekChange: "一周涨跌(%)",
    monthChange: "一月涨跌(%)",
    ytdReturn: "年初至今(%)",
    oneYearReturn: "过去一年(%)",
    near52wHigh: "距52周高点(%)",
    rsi: "RSI",
    above50d: "高于50日均线",
    above200d: "高于200日均线",
    volumeSignal: "异常成交量",
    revenueGrowth: "营收增长(%)",
    epsGrowth: "EPS增长(%)",
    grossMargin: "毛利率(%)",
    netMargin: "净利率(%)",
    roe: "ROE(%)",
    roa: "ROA(%)",
    debtEquity: "债务股本比(%)",
    fcfMargin: "自由现金流利润率(%)",
    riskLevel: "风险等级",
    beta: "贝塔",
    volatility30d: "30日波动率(%)",
    maxDrawdown: "最大回撤(%)",
    analystRating: "分析师评级",
    assetTurnover: "资产周转率",
    securityType: "上市板块"
  };

  const screenerReplicaStorageKeys = {
    saves: "four-markets-screener-saves",
    customColumns: "four-markets-screener-custom-columns"
  };

  function hashReplicaSeed(value) {
    return String(value || "")
      .split("")
      .reduce((total, char, index) => total + char.charCodeAt(0) * (index + 17), 0);
  }

  function between(value, min, max) {
    return value >= min && value < max;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toFixedNumber(value, digits) {
    return Number(value.toFixed(digits || 0));
  }

  function computeReplicaRiskLevel(row, beta, oneYearReturn, pe) {
    if (row.sector === "科技" && (beta >= 1.45 || oneYearReturn >= 80 || pe >= 80)) {
      return "high";
    }

    if (row.sector === "金融" || row.sector === "公用事业") {
      return "low";
    }

    if (beta >= 1.2 || oneYearReturn >= 35 || pe >= 24) {
      return "medium";
    }

    return "low";
  }

  function hydrateReplicaRow(rowArray) {
    const [code, name, avatar, avatarColor, exchange, sector, industry, securityType, marketCapValue, marketCapLabel, pe, peg, price, dayChange, upside] = rowArray;
    const seed = hashReplicaSeed(code);
    const premiumScore = clamp((pe / 22) + (upside > 0 ? 0.55 : 0.15), 0.1, 3.4);
    const dividendBase = sector === "金融" ? 5.4 : sector === "能源" ? 4.8 : sector === "公用事业" ? 4.2 : sector === "消费" ? 2.6 : sector === "科技" ? 0.2 : 1.8;
    const dividendYield = clamp(dividendBase + ((seed % 7) - 3) * 0.22, 0, 7.5);
    const pb = clamp(pe / (8.5 + (seed % 6)), 0.55, 18.2);
    const ps = clamp((premiumScore * (sector === "科技" ? 2.4 : sector === "消费" ? 1.3 : 0.75)) + ((seed % 5) * 0.32), 0.35, 25.1);
    const oneYearReturn = clamp(upside > 0 ? upside * (sector === "科技" ? 2.2 : 1.3) + 8 + (seed % 11) : upside * 4.5 - (seed % 8), -18, 146.9);
    const ytdReturn = clamp(oneYearReturn * 0.36 + (seed % 6), -12, 51.4);
    const monthChange = clamp(oneYearReturn * 0.13 + dayChange * 1.7, -10, 24.3);
    const weekChange = clamp(dayChange * 1.55 + (seed % 5) - 1.5, -6, 9.8);
    const near52wHigh = clamp(oneYearReturn > 80 ? 1 + (seed % 3) * 0.4 : oneYearReturn > 40 ? 2.4 + (seed % 7) * 0.7 : 4 + (seed % 10) * 0.9, 0.8, 22);
    const rsi = clamp(47 + Math.round(oneYearReturn / 8) + Math.round(dayChange * 2), 38, 79);
    const beta = clamp(sector === "科技" ? 1.25 + (seed % 9) * 0.09 : sector === "金融" ? 0.45 + (seed % 6) * 0.06 : sector === "能源" ? 0.82 + (seed % 6) * 0.07 : 0.75 + (seed % 8) * 0.08, 0.45, 1.91);
    const volatility30d = clamp(sector === "科技" ? 26 + (seed % 9) * 2.6 : sector === "金融" ? 8 + (seed % 8) * 0.8 : sector === "公用事业" ? 10 + (seed % 7) * 0.8 : 14 + (seed % 8) * 2.1, 8.1, 46.8);
    const maxDrawdown = clamp(volatility30d * 0.88 + (seed % 7), 9.4, 44.1);
    const revenueGrowth = clamp(sector === "科技" ? 16 + (seed % 8) * 4.3 : sector === "消费" ? 8 + (seed % 6) * 2.1 : sector === "金融" ? 3 + (seed % 5) * 1.1 : sector === "能源" ? 6 + (seed % 5) * 1.8 : 7 + (seed % 6) * 1.9, 3.8, 44.2);
    const epsGrowth = clamp(revenueGrowth * (sector === "科技" ? 1.3 : 0.95) + ((seed % 7) - 2), -8, 61.7);
    const grossMargin = clamp(sector === "消费" ? 48 + (seed % 9) * 4.8 : sector === "科技" ? 26 + (seed % 10) * 4.2 : sector === "金融" ? 45 + (seed % 9) * 1.8 : sector === "能源" ? 14 + (seed % 8) * 3.5 : sector === "公用事业" ? 40 + (seed % 7) * 3.1 : 18 + (seed % 8) * 2.4, 14.5, 91.4);
    const netMargin = clamp(sector === "金融" ? 25 + (seed % 10) * 1.6 : sector === "公用事业" ? 26 + (seed % 8) * 2.1 : sector === "消费" ? 8 + (seed % 9) * 5.2 : sector === "科技" ? 6 + (seed % 7) * 2.2 : 6 + (seed % 8) * 2.4, -22.6, 52.8);
    const roe = clamp(sector === "消费" ? 16 + (seed % 9) * 1.7 : sector === "科技" ? 8 + (seed % 11) * 1.5 : sector === "金融" ? 9 + (seed % 8) * 0.9 : sector === "公用事业" ? 11 + (seed % 8) * 0.9 : 10 + (seed % 8) * 1.1, -5.2, 30.7);
    const roa = clamp(sector === "金融" ? 1 + (seed % 5) * 0.45 : sector === "消费" ? 6 + (seed % 7) * 1.1 : sector === "科技" ? 5 + (seed % 8) * 0.9 : 4 + (seed % 7) * 1.2, -3.1, 23.4);
    const debtEquity = clamp(sector === "金融" ? 118 + (seed % 10) * 4.2 : sector === "科技" ? 4 + (seed % 9) * 2.7 : sector === "公用事业" ? 34 + (seed % 8) * 3.2 : sector === "消费" ? 22 + (seed % 7) * 3.4 : 18 + (seed % 8) * 3.9, 4, 152);
    const fcfMargin = clamp(sector === "金融" ? 22 + (seed % 7) * 1.3 : sector === "科技" ? -2 + (seed % 8) * 2.9 : sector === "消费" ? 8 + (seed % 8) * 3.1 : sector === "公用事业" ? 20 + (seed % 7) * 2.1 : 7 + (seed % 8) * 2.4, -18.6, 39.2);
    const assetTurnover = clamp(sector === "金融" ? 0.11 + (seed % 4) * 0.012 : sector === "科技" ? 0.27 + (seed % 8) * 0.09 : sector === "消费" ? 0.55 + (seed % 8) * 0.07 : sector === "公用事业" ? 0.22 + (seed % 6) * 0.03 : 0.35 + (seed % 8) * 0.08, 0.11, 1.18);
    const payoutRatio = clamp(sector === "科技" ? (seed % 3) * 4.8 : sector === "金融" ? 28 + (seed % 7) * 1.4 : sector === "能源" ? 40 + (seed % 6) * 1.8 : sector === "消费" ? 44 + (seed % 6) * 2.3 : sector === "公用事业" ? 52 + (seed % 6) * 1.7 : 18 + (seed % 7) * 1.9, 0, 60.5);
    const dividendStreak = sector === "科技" ? (seed % 2) : sector === "消费" ? 3 + (seed % 10) : sector === "能源" ? 4 + (seed % 10) : sector === "公用事业" ? 8 + (seed % 11) : 9 + (seed % 9);
    const dividendGrowth5y = sector === "科技" ? (seed % 3) * 1.2 : clamp(3 + (seed % 9) * 1.4, 3.2, 15.2);
    const analystRating = clamp(upside >= 30 ? 4.3 + (seed % 4) * 0.1 : upside >= 10 ? 3.9 + (seed % 4) * 0.1 : upside >= 0 ? 3.6 + (seed % 3) * 0.1 : 3.4 + (seed % 2) * 0.1, 3.4, 4.7);
    const riskLevel = computeReplicaRiskLevel({ sector }, beta, oneYearReturn, pe);
    const volumeSignal = oneYearReturn >= 45 || Math.abs(dayChange) >= 3 ? "hot" : oneYearReturn >= 18 || Math.abs(dayChange) >= 1 ? "warm" : "calm";

    return {
      id: `replica-${code}`,
      code,
      name,
      avatar,
      avatarColor,
      exchange,
      sector,
      industry,
      securityType,
      board: securityType,
      marketCapValue,
      marketCapLabel,
      pe,
      peg,
      price,
      dayChange,
      upside,
      dividendYield: toFixedNumber(dividendYield, 1),
      pb: toFixedNumber(pb, 2),
      ps: toFixedNumber(ps, 2),
      payoutRatio: toFixedNumber(payoutRatio, 1),
      dividendStreak,
      dividendGrowth5y: toFixedNumber(dividendGrowth5y, 1),
      weekChange: toFixedNumber(weekChange, 1),
      monthChange: toFixedNumber(monthChange, 1),
      ytdReturn: toFixedNumber(ytdReturn, 1),
      oneYearReturn: toFixedNumber(oneYearReturn, 1),
      near52wHigh: toFixedNumber(near52wHigh, 1),
      rsi,
      above50d: oneYearReturn >= 0 || dayChange >= 0,
      above200d: oneYearReturn >= 10 || ytdReturn >= 5,
      volumeSignal,
      revenueGrowth: toFixedNumber(revenueGrowth, 1),
      epsGrowth: toFixedNumber(epsGrowth, 1),
      grossMargin: toFixedNumber(grossMargin, 1),
      netMargin: toFixedNumber(netMargin, 1),
      roe: toFixedNumber(roe, 1),
      roa: toFixedNumber(roa, 1),
      debtEquity: toFixedNumber(debtEquity, 1),
      fcfMargin: toFixedNumber(fcfMargin, 1),
      beta: toFixedNumber(beta, 2),
      volatility30d: toFixedNumber(volatility30d, 1),
      maxDrawdown: toFixedNumber(maxDrawdown, 1),
      analystRating: toFixedNumber(analystRating, 1),
      riskLevel,
      assetTurnover: toFixedNumber(assetTurnover, 2),
      fairValueText: "升级至Pro+",
      fairValueUpsideText: "升级至Pro+",
      fairValueRatingText: "升级至Pro+",
      analystTargetText: "升级至Pro+"
    };
  }

  function parseLooseChineseAmount(value) {
    if (!value) {
      return 0;
    }

    const normalized = String(value).replace(/\s+/g, "");
    const numeric = Number(normalized.replace(/[^\d.]/g, ""));

    if (Number.isNaN(numeric)) {
      return 0;
    }

    if (normalized.includes("万亿")) {
      return numeric * 10000;
    }

    if (normalized.includes("亿")) {
      return numeric;
    }

    return numeric / 100000000;
  }

  function buildFallbackReplicaRows(marketId) {
    return data.stockSummaries
      .filter((item) => item.market === marketId)
      .map((item, index) => hydrateReplicaRow([
        item.symbol || String(index + 1).padStart(6, "0"),
        item.name,
        item.name.slice(0, 1),
        ["#4a78ff", "#ef6c5b", "#25a56a", "#f3b53f"][index % 4],
        item.market === "us" ? "美国" : item.market === "jp" ? "日本" : item.market === "hk" ? "香港" : "中国",
        item.industry.includes("银行") || item.industry.includes("保险") ? "金融" : item.industry.includes("油") ? "能源" : item.industry.includes("科技") || item.industry.includes("通信") ? "科技" : "工业",
        item.industry,
        "主板",
        parseLooseChineseAmount(item.marketCap),
        item.marketCap,
        Math.max(6, 10 + index * 3.5),
        Math.max(0.3, 0.9 + index * 0.25),
        Number(String(item.price).replace(/[^\d.]/g, "")) || 10 + index * 8,
        index % 2 === 0 ? 0.6 + index * 0.3 : -0.4 - index * 0.2,
        8 + index * 5
      ]));
  }

  function getReplicaScreenerRows(marketId) {
    const source = data.screenerReplicaRows && data.screenerReplicaRows[marketId];
    return source && source.length
      ? source.map(hydrateReplicaRow)
      : buildFallbackReplicaRows(marketId);
  }

  function defaultReplicaFilters() {
    return Object.fromEntries(screenerReplicaFilterIds.map((id) => [id, "all"]));
  }

  function safeReplicaFilterValue(filterId, value) {
    const filter = screenerReplicaConfig.filters[filterId];
    return filter && filter.options.some((item) => item.value === value) ? value : "all";
  }

  function safeReplicaCategory(value) {
    return screenerReplicaCategoryById[value] ? value : screenerReplicaConfig.categories[0].id;
  }

  function safeReplicaView(value) {
    return screenerReplicaViewById[value] ? value : screenerReplicaConfig.views[0].id;
  }

  function safeReplicaPreset(value) {
    return screenerReplicaPresetById[value] ? value : "all";
  }

  function safeReplicaColumns(value) {
    const allowed = new Set(screenerReplicaConfig.customColumnPool.map((item) => item.id));
    const parsed = String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => allowed.has(item));

    return parsed.length ? parsed : screenerReplicaViewById.custom.columns.slice(2);
  }

  function getReplicaScreenerState(marketId, params) {
    const current = params || currentParams();
    const filters = defaultReplicaFilters();

    screenerReplicaFilterIds.forEach((filterId) => {
      filters[filterId] = safeReplicaFilterValue(filterId, current.get(`scf_${filterId}`));
    });

    return {
      preset: safeReplicaPreset(current.get("scPreset")),
      category: safeReplicaCategory(current.get("scCategory")),
      view: safeReplicaView(current.get("scView")),
      query: (current.get("scQuery") || "").trim(),
      sortKey: current.get("scSort") || "marketCap",
      sortDir: current.get("scDir") === "asc" ? "asc" : "desc",
      moreFilters: current.get("scMore") === "1",
      customColumns: safeReplicaColumns(current.get("scCols")),
      filters,
      selectedIds: [],
      savedOpen: false
    };
  }

  function syncReplicaStateToUrl(state) {
    const values = {
      scPreset: state.preset,
      scCategory: state.category,
      scView: state.view,
      scQuery: state.query,
      scSort: state.sortKey,
      scDir: state.sortDir,
      scMore: state.moreFilters ? "1" : "",
      scCols: state.customColumns.join(","),
      scrPreset: "",
      scrStrategy: "",
      scrRisk: "",
      scrLiquidity: "",
      scrState: "",
      scrQuery: ""
    };

    screenerReplicaFilterIds.forEach((filterId) => {
      values[`scf_${filterId}`] = state.filters[filterId];
    });

    updateQueryGroup(values);
  }

  function replicaOptionLabel(filterId, value) {
    const filter = screenerReplicaConfig.filters[filterId];
    const option = filter && filter.options.find((item) => item.value === value);
    return option ? option.label : "任何";
  }

  function matchesReplicaFilter(filterId, value, row) {
    if (!value || value === "all") {
      return true;
    }

    switch (filterId) {
      case "marketCap":
        return value === "mega" ? row.marketCapValue >= 10000
          : value === "large" ? between(row.marketCapValue, 5000, 10000)
            : value === "mid" ? between(row.marketCapValue, 2000, 5000)
              : row.marketCapValue < 2000;
      case "price":
        return value === "below10" ? row.price < 10
          : value === "between10and50" ? between(row.price, 10, 50)
            : value === "between50and200" ? between(row.price, 50, 200)
              : row.price >= 200;
      case "dividendYield":
        return value === "above5" ? row.dividendYield >= 5
          : value === "between3and5" ? between(row.dividendYield, 3, 5)
            : value === "between1and3" ? between(row.dividendYield, 1, 3)
              : row.dividendYield < 1;
      case "peg":
        return value === "below1" ? row.peg < 1
          : value === "between1and2" ? between(row.peg, 1, 2)
            : value === "between2and5" ? between(row.peg, 2, 5)
              : row.peg >= 5;
      case "exchange":
        return value === "shanghai" ? row.exchange === "上海" : row.exchange === "深圳";
      case "sector":
      case "securityType":
      case "riskLevel":
      case "volumeSignal":
        return row[filterId] === value;
      case "near52wHigh":
        return value === "within5" ? row.near52wHigh <= 5
          : value === "within10" ? row.near52wHigh <= 10
            : value === "within20" ? row.near52wHigh <= 20
              : row.near52wHigh > 20;
      case "upside":
        return value === "above30" ? row.upside >= 30
          : value === "between15and30" ? between(row.upside, 15, 30)
            : value === "between0and15" ? between(row.upside, 0, 15)
              : row.upside < 0;
      case "dayChange":
        return value === "above3" ? row.dayChange >= 3
          : value === "between0and3" ? between(row.dayChange, 0, 3)
            : value === "betweenNeg3and0" ? between(row.dayChange, -3, 0)
              : row.dayChange < -3;
      case "weekChange":
        return value === "above5" ? row.weekChange >= 5
          : value === "between0and5" ? between(row.weekChange, 0, 5)
            : value === "betweenNeg5and0" ? between(row.weekChange, -5, 0)
              : row.weekChange < -5;
      case "monthChange":
        return value === "above15" ? row.monthChange >= 15
          : value === "between5and15" ? between(row.monthChange, 5, 15)
            : value === "between0and5" ? between(row.monthChange, 0, 5)
              : row.monthChange < 0;
      case "ytdReturn":
        return value === "above20" ? row.ytdReturn >= 20
          : value === "between10and20" ? between(row.ytdReturn, 10, 20)
            : value === "between0and10" ? between(row.ytdReturn, 0, 10)
              : row.ytdReturn < 0;
      case "oneYearReturn":
        return value === "above50" ? row.oneYearReturn >= 50
          : value === "between20and50" ? between(row.oneYearReturn, 20, 50)
            : value === "between0and20" ? between(row.oneYearReturn, 0, 20)
              : row.oneYearReturn < 0;
      case "pe":
        return value === "below10" ? row.pe < 10
          : value === "between10and20" ? between(row.pe, 10, 20)
            : value === "between20and40" ? between(row.pe, 20, 40)
              : row.pe >= 40;
      case "pb":
        return value === "below1" ? row.pb < 1
          : value === "between1and2" ? between(row.pb, 1, 2)
            : value === "between2and4" ? between(row.pb, 2, 4)
              : row.pb >= 4;
      case "ps":
        return value === "below1" ? row.ps < 1
          : value === "between1and3" ? between(row.ps, 1, 3)
            : value === "between3and6" ? between(row.ps, 3, 6)
              : row.ps >= 6;
      case "analystRating":
        return value === "strongBuy" ? row.analystRating >= 4.5
          : value === "buy" ? between(row.analystRating, 4, 4.5)
            : row.analystRating < 4;
      case "grossMargin":
        return value === "above40" ? row.grossMargin >= 40
          : value === "between20and40" ? between(row.grossMargin, 20, 40)
            : value === "between10and20" ? between(row.grossMargin, 10, 20)
              : row.grossMargin < 10;
      case "netMargin":
        return value === "above20" ? row.netMargin >= 20
          : value === "between10and20" ? between(row.netMargin, 10, 20)
            : value === "between0and10" ? between(row.netMargin, 0, 10)
              : row.netMargin < 0;
      case "roe":
        return value === "above20" ? row.roe >= 20
          : value === "above15" ? between(row.roe, 15, 20)
            : value === "between10and15" ? between(row.roe, 10, 15)
              : row.roe < 10;
      case "roa":
        return value === "above10" ? row.roa >= 10
          : value === "between5and10" ? between(row.roa, 5, 10)
            : value === "between0and5" ? between(row.roa, 0, 5)
              : row.roa < 0;
      case "debtEquity":
        return value === "below30" ? row.debtEquity < 30
          : value === "between30and60" ? between(row.debtEquity, 30, 60)
            : value === "between60and100" ? between(row.debtEquity, 60, 100)
              : row.debtEquity >= 100;
      case "fcfMargin":
        return value === "above20" ? row.fcfMargin >= 20
          : value === "between10and20" ? between(row.fcfMargin, 10, 20)
            : value === "between0and10" ? between(row.fcfMargin, 0, 10)
              : row.fcfMargin < 0;
      case "payoutRatio":
        return value === "under30" ? row.payoutRatio < 30
          : value === "between30and50" ? between(row.payoutRatio, 30, 50)
            : value === "between50and70" ? between(row.payoutRatio, 50, 70)
              : row.payoutRatio >= 70;
      case "dividendStreak":
        return value === "over10" ? row.dividendStreak >= 10
          : value === "between5and10" ? between(row.dividendStreak, 5, 10)
            : value === "between1and5" ? between(row.dividendStreak, 1, 5)
              : row.dividendStreak <= 0;
      case "dividendGrowth5y":
        return value === "above10" ? row.dividendGrowth5y >= 10
          : value === "between5and10" ? between(row.dividendGrowth5y, 5, 10)
            : value === "between0and5" ? between(row.dividendGrowth5y, 0, 5)
              : row.dividendGrowth5y < 0;
      case "revenueGrowth":
        return value === "above20" ? row.revenueGrowth >= 20
          : value === "between10and20" ? between(row.revenueGrowth, 10, 20)
            : value === "between0and10" ? between(row.revenueGrowth, 0, 10)
              : row.revenueGrowth < 0;
      case "epsGrowth":
        return value === "above20" ? row.epsGrowth >= 20
          : value === "between10and20" ? between(row.epsGrowth, 10, 20)
            : value === "between0and10" ? between(row.epsGrowth, 0, 10)
              : row.epsGrowth < 0;
      case "beta":
        return value === "below0_8" ? row.beta < 0.8
          : value === "between0_8and1_2" ? between(row.beta, 0.8, 1.2)
            : value === "between1_2and1_6" ? between(row.beta, 1.2, 1.6)
              : row.beta >= 1.6;
      case "volatility30d":
        return value === "below20" ? row.volatility30d < 20
          : value === "between20and30" ? between(row.volatility30d, 20, 30)
            : value === "between30and40" ? between(row.volatility30d, 30, 40)
              : row.volatility30d >= 40;
      case "maxDrawdown":
        return value === "below15" ? row.maxDrawdown < 15
          : value === "between15and25" ? between(row.maxDrawdown, 15, 25)
            : value === "between25and35" ? between(row.maxDrawdown, 25, 35)
              : row.maxDrawdown >= 35;
      case "rsi":
        return value === "over70" ? row.rsi >= 70
          : value === "between55and70" ? between(row.rsi, 55, 70)
            : value === "between45and55" ? between(row.rsi, 45, 55)
              : row.rsi < 45;
      case "above50d":
      case "above200d":
        return value === "yes" ? row[filterId] : !row[filterId];
      case "assetTurnover":
        return value === "above1" ? row.assetTurnover >= 1
          : value === "between0_5and1" ? between(row.assetTurnover, 0.5, 1)
            : value === "between0_2and0_5" ? between(row.assetTurnover, 0.2, 0.5)
              : row.assetTurnover < 0.2;
      default:
        return true;
    }
  }

  function getFilteredReplicaRows(marketId, state) {
    const rows = getReplicaScreenerRows(marketId);
    const query = state.query.trim().toLowerCase();

    return rows
      .filter((row) => !query || [row.name, row.code, row.industry, row.sector, row.exchange].join(" ").toLowerCase().includes(query))
      .filter((row) => screenerReplicaFilterIds.every((filterId) => matchesReplicaFilter(filterId, state.filters[filterId], row)));
  }

  function getVisibleReplicaColumns(state) {
    if (state.view === "custom") {
      return ["company", "name"].concat(state.customColumns);
    }

    return screenerReplicaViewById[state.view].columns;
  }

  function sortReplicaRows(rows, state) {
    const sortKey = state.sortKey;
    const dir = state.sortDir === "asc" ? 1 : -1;
    const getValue = (row) => {
      if (sortKey === "company") {
        return row.code;
      }

      if (sortKey === "name") {
        return row.name;
      }

      if (sortKey === "exchange" || sortKey === "board" || sortKey === "sector" || sortKey === "industry" || sortKey === "securityType" || sortKey === "riskLevel" || sortKey === "volumeSignal") {
        return row[sortKey];
      }

      return row[sortKey];
    };

    return rows.slice().sort((left, right) => {
      const leftValue = getValue(left);
      const rightValue = getValue(right);

      if (typeof leftValue === "string" || typeof rightValue === "string") {
        return String(leftValue).localeCompare(String(rightValue), "zh-CN") * dir;
      }

      return ((leftValue || 0) - (rightValue || 0)) * dir;
    });
  }

  function formatReplicaPercent(value, digits, signed) {
    const rounded = toFixedNumber(value, digits == null ? 1 : digits);
    return `${signed && rounded > 0 ? "+" : ""}${rounded}%`;
  }

  function formatReplicaBool(value) {
    return value ? "是" : "否";
  }

  function renderReplicaSignedStat(value, digits) {
    const tone = value > 0 ? " is-positive" : value < 0 ? " is-negative" : "";
    return `<span class="screener-stat-text${tone}">${formatReplicaPercent(value, digits, true)}</span>`;
  }

  function renderReplicaLockedCell(text) {
    return `<button class="screener-locked-link" data-message="当前原型保留了 Pro 锁定态表现，后续可再接真实接口。">${text || "升级至Pro+"}</button>`;
  }

  function renderReplicaUpside(value) {
    const tone = value < 0 ? "is-negative" : value >= 25 ? "is-strong" : "is-positive";
    const suffix = value < 0 ? "下行边际" : "上行边际";
    return `<span class="screener-upside ${tone}">${Math.abs(toFixedNumber(value, 1))}%的${suffix}</span>`;
  }

  function renderReplicaCompanyCell(row, index, selectedIds) {
    const checked = selectedIds.includes(row.id) ? " checked" : "";
    return `
      <div class="screener-company-cell">
        <input class="screener-row-checkbox" type="checkbox" data-screener-select="${row.id}"${checked}>
        <span class="screener-row-index">${index + 1}</span>
        <span class="screener-company-avatar" style="--avatar:${row.avatarColor}">${row.avatar}</span>
        <div class="screener-company-copy">
          <strong>${row.code}</strong>
        </div>
      </div>
    `;
  }

  function renderReplicaNameCell(row) {
    return `
      <div class="screener-name-cell">
        <strong>${row.name}</strong>
        <span>${row.sector}</span>
      </div>
    `;
  }

  function renderReplicaCell(columnId, row, index, state) {
    switch (columnId) {
      case "company":
        return renderReplicaCompanyCell(row, index, state.selectedIds);
      case "name":
        return renderReplicaNameCell(row);
      case "exchange":
      case "board":
      case "sector":
      case "industry":
      case "securityType":
        return row[columnId];
      case "marketCap":
        return row.marketCapLabel;
      case "pe":
      case "pb":
      case "ps":
      case "peg":
      case "beta":
      case "assetTurnover":
        return row[columnId];
      case "price":
        return `¥${row.price}`;
      case "dayChange":
      case "weekChange":
      case "monthChange":
      case "ytdReturn":
      case "oneYearReturn":
        return renderReplicaSignedStat(row[columnId], 1);
      case "dividendYield":
      case "payoutRatio":
      case "dividendGrowth5y":
      case "revenueGrowth":
      case "epsGrowth":
      case "grossMargin":
      case "netMargin":
      case "roe":
      case "roa":
      case "debtEquity":
      case "fcfMargin":
      case "volatility30d":
      case "maxDrawdown":
        return formatReplicaPercent(row[columnId], 1, false);
      case "near52wHigh":
        return `${row.near52wHigh}%`;
      case "rsi":
        return row.rsi;
      case "above50d":
      case "above200d":
        return formatReplicaBool(row[columnId]);
      case "volumeSignal":
        return row.volumeSignal === "hot" ? "热度放量" : row.volumeSignal === "warm" ? "温和放量" : "平稳成交";
      case "dividendStreak":
        return `${row.dividendStreak}年`;
      case "riskLevel":
        return row.riskLevel === "high" ? "高风险" : row.riskLevel === "medium" ? "中风险" : "低风险";
      case "analystRating":
        return row.analystRating;
      case "fairValue":
        return renderReplicaLockedCell(row.fairValueText);
      case "fairValueUpside":
        return renderReplicaLockedCell(row.fairValueUpsideText);
      case "fairValueRating":
        return renderReplicaLockedCell(row.fairValueRatingText);
      case "analystTarget":
        return renderReplicaLockedCell(row.analystTargetText);
      case "upside":
        return renderReplicaUpside(row.upside);
      default:
        return row[columnId] == null ? "-" : row[columnId];
    }
  }

  function renderReplicaFilterField(filterId, state) {
    const filter = screenerReplicaConfig.filters[filterId];
    return `
      <label class="screener-filter-field">
        <span>${filter.label}</span>
        <select data-screener-field="${filterId}">
          ${optionList(filter.options, state.filters[filterId])}
        </select>
      </label>
    `;
  }

  function renderReplicaActiveFilters(state) {
    const tags = screenerReplicaFilterIds
      .filter((filterId) => state.filters[filterId] !== "all")
      .map((filterId) => `
        <button class="screener-active-filter" data-screener-remove="${filterId}">
          <span>${screenerReplicaConfig.filters[filterId].label}：${replicaOptionLabel(filterId, state.filters[filterId])}</span>
          <strong>×</strong>
        </button>
      `);

    if (state.query) {
      tags.unshift(`
        <button class="screener-active-filter" data-screener-remove="query">
          <span>搜索：${state.query}</span>
          <strong>×</strong>
        </button>
      `);
    }

    return tags.join("");
  }

  function getReplicaAppliedFilterCount(state) {
    return screenerReplicaFilterIds.filter((filterId) => state.filters[filterId] !== "all").length + (state.query ? 1 : 0);
  }

  function getReplicaSavedScreeners() {
    try {
      return JSON.parse(window.localStorage.getItem(screenerReplicaStorageKeys.saves) || "[]");
    } catch (error) {
      return [];
    }
  }

  function setReplicaSavedScreeners(items) {
    window.localStorage.setItem(screenerReplicaStorageKeys.saves, JSON.stringify(items));
  }

  function getReplicaVisibleResultCount(rows, marketId) {
    const total = (data.screenerReplicaMarketTotals && data.screenerReplicaMarketTotals[marketId]) || rows.length;
    const pool = getReplicaScreenerRows(marketId).length || rows.length || 1;

    if (!rows.length) {
      return 0;
    }

    return Math.max(rows.length, Math.round(rows.length / pool * total));
  }

  function renderReplicaPresetRow(state) {
    return screenerReplicaConfig.strategyPresets
      .map((preset) => `
        <button class="screener-preset-pill${preset.id === state.preset ? " is-active" : ""}" data-screener-preset="${preset.id}">
          <span class="screener-preset-dot"></span>
          <span>${preset.label}</span>
          ${preset.performance ? `<strong>${preset.performance}</strong>` : ""}
        </button>
      `)
      .join("");
  }

  function renderReplicaCategoryTabs(state) {
    return screenerReplicaConfig.categories
      .map((category) => `<button class="screener-category-tab${category.id === state.category ? " is-active" : ""}" data-screener-category="${category.id}">${category.label}</button>`)
      .join("");
  }

  function renderReplicaViewTabs(state) {
    return screenerReplicaConfig.views
      .map((view) => `<button class="screener-view-tab${view.id === state.view ? " is-active" : ""}" data-screener-view="${view.id}">${view.label}</button>`)
      .join("");
  }

  function renderReplicaCustomColumns(state) {
    const checkedColumns = new Set(state.customColumns);
    return `
      <div class="screener-custom-panel${state.view === "custom" ? " is-visible" : ""}">
        ${screenerReplicaConfig.customColumnPool
        .map((column) => `
          <label class="screener-custom-option">
            <input type="checkbox" data-screener-column="${column.id}"${checkedColumns.has(column.id) ? " checked" : ""}>
            <span>${column.label}</span>
          </label>
        `)
        .join("")}
      </div>
    `;
  }

  function renderReplicaSavedPanel(state, marketId) {
    if (!state.savedOpen) {
      return "";
    }

    const items = getReplicaSavedScreeners().filter((item) => item.marketId === marketId);

    if (!items.length) {
      return `
        <div class="screener-saved-panel is-visible">
          <div class="screener-saved-empty">还没有保存的选股器，先配置好条件后点一次“保存”。</div>
        </div>
      `;
    }

    return `
      <div class="screener-saved-panel is-visible">
        ${items
        .map((item) => `
          <div class="screener-saved-item">
            <button class="screener-saved-load" data-screener-load="${item.id}">
              <strong>${item.name}</strong>
              <span>${item.summary}</span>
            </button>
            <button class="screener-saved-delete" data-screener-delete="${item.id}">删除</button>
          </div>
        `)
        .join("")}
      </div>
    `;
  }

  function exportReplicaRowsToCsv(columns, rows) {
    const headers = columns.map((columnId) => screenerReplicaColumnLabels[columnId] || columnId);
    const csvRows = rows.map((row, index) => columns.map((columnId) => {
      const raw = String(renderReplicaCell(columnId, row, index, { selectedIds: [] }))
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      return `"${raw.replace(/"/g, '""')}"`;
    }).join(","));
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "screener-export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  function renderJpMarketTwoIdeaCard(item, tone) {
    const isAvoid = tone === "danger";
    const listItems = isAvoid
      ? [
        ["危险信号", item.signal],
        ["为什么容易亏钱", item.why],
        ["如何识别", item.identify]
      ]
      : [
        ["为什么有效", item.why],
        ["关键指标", item.metrics.join(" / ")],
        ["常见误区", item.mistake]
      ];

    return `
      <article class="card jp2-idea-card">
        <div class="pill-row">
          ${pill(item.tag, tone)}
          ${pill(isAvoid ? "先排除" : "优先研究", "neutral")}
        </div>
        <h3>${item.title}</h3>
        <p>${item.definition || item.signal}</p>
        <ul class="list-bullets jp2-list">
          ${listItems.map(([label, value]) => `<li><strong>${label}：</strong>${value}</li>`).join("")}
        </ul>
        <div class="stock-row-footer">
          <span class="card-subtle">${isAvoid ? "回避动作" : "适合人群"}：${isAvoid ? item.action : item.fit}</span>
          <a class="button ghost subtle" href="${item.href}">${isAvoid ? "查看回避入口" : "查看相关入口"}</a>
        </div>
        ${renderSampleStockLinks(item.sampleStockIds)}
      </article>
    `;
  }

  function renderJpMarketTwoFrameworkPanel(node) {
    return `
      <div class="pill-row">
        ${pill(`步骤 ${node.step}`, "primary")}
        ${pill("框架节点", "neutral")}
      </div>
      <h3>${node.title}</h3>
      <p>${node.summary}</p>
      <div class="pill-row jp2-metric-row">
        ${node.metrics.map((metric) => pill(metric, "neutral")).join("")}
      </div>
      <div class="jp2-framework-columns">
        <article class="aside-panel jp2-framework-block">
          ${pill("可买逻辑", "success")}
          <ul class="list-bullets jp2-list">
            ${node.buyLogic.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </article>
        <article class="aside-panel jp2-framework-block">
          ${pill("减分 / 回避逻辑", "danger")}
          <ul class="list-bullets jp2-list">
            ${node.avoidLogic.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </article>
      </div>
      <div class="warning-box jp2-framework-warning">
        ${pill("常见误区", "warning")}
        <p>${node.pitfalls.join("；")}</p>
      </div>
      <div class="button-row">
        ${node.links.map((item) => `<a class="button ghost subtle" href="${item.href}">${item.label}</a>`).join("")}
      </div>
    `;
  }

  function renderJpMarketTwoResearchRow(item) {
    const summary = summaryById[item.stockId];

    if (!summary) {
      return "";
    }

    return `
      <tr>
        <td>
          <div class="table-cell-stack">
            <strong><a href="${stockUrl(summary.id)}">${summary.name}</a></strong>
            <span>${summary.symbol} / ${summary.industry}</span>
          </div>
        </td>
        <td>${item.thesis}</td>
        <td>${item.catalyst}</td>
        <td>${item.risk}</td>
        <td>
          <div class="table-cell-stack">
            <strong>${detailById[summary.id].conclusion.state}</strong>
            <span>${item.nextAction}</span>
          </div>
        </td>
      </tr>
    `;
  }

  function bindJpMarketTwoPage() {
    const pageData = data.jpMarketTwo;
    const buttons = Array.from(app.querySelectorAll("[data-framework-node]"));
    const panel = app.querySelector("#jp-framework-panel");

    if (!pageData || !buttons.length || !panel) {
      return;
    }

    const nodeById = Object.fromEntries(pageData.frameworkNodes.map((item) => [item.id, item]));

    function setActive(nodeId) {
      const activeNode = nodeById[nodeId] || pageData.frameworkNodes[0];

      buttons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.frameworkNode === activeNode.id);
      });

      panel.innerHTML = renderJpMarketTwoFrameworkPanel(activeNode);
      bindActionButtons(panel);
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => setActive(button.dataset.frameworkNode));
    });

    setActive(pageData.frameworkNodes[0].id);
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
          <div class="quote-board-head">
            <span class="section-marker">Live Quotes</span>
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

  function renderUsMarketPage(marketId) {
    const market = data.markets[marketId];
    const pageData = data.usMarketPage;
    const trend = trendByMarket[marketId];
    const opportunityState = getBoardState("op", marketId);
    const avoidState = getBoardState("av", marketId);
    const opportunityCount = data.rankingItems.filter((item) => item.market === marketId && item.type === "opportunity").length;
    const avoidCount = data.rankingItems.filter((item) => item.market === marketId && item.type === "avoid").length;
    const featuredWatchRows = market.opportunityStockIds.slice(0, 4).map(renderMarketWatchRow).join("");
    const featuredSceneRows = market.avoidSceneIds.slice(0, 4).map((sceneId) => renderSceneSignalRow(sceneId, marketId)).join("");
    const toolActionById = Object.fromEntries((pageData.toolActions || []).map((item) => [item.id, item]));

    const heroActions = (pageData.heroActionIds || [])
      .map((actionId) => toolActionById[actionId])
      .filter(Boolean)
      .map((action) => `<a class="button ${action.tone || "ghost"}" href="${action.href}">${action.label}</a>`)
      .join("");

    const quickCards = (pageData.quickCards || [])
      .map((card) => `
        <article class="section-panel us-market-quick-card${card.id === "avoid" ? " is-risk" : ""}">
          <div class="pill-row">
            ${pill(card.eyebrow, card.tone === "danger" ? "danger" : "primary")}
            ${pill(card.id === "avoid" ? "先排除" : "先看框架", "neutral")}
          </div>
          <h3>${card.title}</h3>
          <p>${card.summary}</p>
          <ul class="list-bullets us-market-quick-list">
            ${card.bullets.map((item) => `<li>${item}</li>`).join("")}
          </ul>
          <div class="stock-row-footer">
            <span class="card-subtle">${card.id === "avoid" ? `最怕：${market.pitfall}` : market.methodSummary}</span>
            <a class="button ghost subtle" href="${card.href}">${card.eyebrow}</a>
          </div>
        </article>
      `)
      .join("");

    const anchorNav = (pageData.anchorNav || [])
      .map((item, index) => `<a class="us-market-anchor-link${index === 0 ? " is-active" : ""}" data-us-anchor-link="${item.id}" href="${item.href}">${item.label}</a>`)
      .join("");

    const decisionSteps = (pageData.decisionSteps || [])
      .map((item) => `
        <div class="us-market-step">
          <span class="us-market-step-index">${item.step}</span>
          <div>
            <strong>${item.title}</strong>
            <p>${item.summary}</p>
          </div>
        </div>
      `)
      .join("");

    const strategyCards = market.strategyIds
      .map((strategyId) => {
        const strategy = strategyById[strategyId];
        if (!strategy) {
          return "";
        }

        const strategyAction = pageData.strategyActions && pageData.strategyActions[strategy.id];

        return `
          <article class="card us-market-strategy-card">
            <div class="pill-row">
              ${pill(strategy.name, "primary")}
              ${pill(strategy.cycle, "neutral")}
            </div>
            <h3>${strategy.summary}</h3>
            <ul class="list-bullets">
              <li><strong>适合谁看：</strong>${strategy.fitFor}</li>
              <li><strong>必须验证：</strong>${strategy.mustConfirm}</li>
              <li><strong>最容易误判：</strong>${strategy.falsePositive}</li>
            </ul>
            <div class="stock-row-footer">
              <span class="card-subtle">核心问题：${strategy.coreQuestion}</span>
              <div class="button-row">
                <a class="button ghost subtle" href="${boardUrl(marketId, "opportunity", { strategy: strategy.id })}">看机会样本</a>
                ${strategyAction ? `<a class="button ghost subtle" href="${strategyAction.href}">${strategyAction.label}</a>` : ""}
              </div>
            </div>
            ${renderSampleStockLinks(strategy.sampleStockIds)}
          </article>
        `;
      })
      .join("");

    const riskCards = market.avoidSceneIds
      .map((sceneId) => {
        const scene = sceneById[sceneId];
        if (!scene) {
          return "";
        }

        return `
          <article class="card us-market-risk-card">
            <div class="pill-row">
              ${pill(scene.name, "danger")}
              ${pill(`风险 ${scene.level}`, riskTone[scene.level])}
            </div>
            <h3>${scene.summary}</h3>
            <ul class="list-bullets">
              <li><strong>危险信号：</strong>${scene.signal}</li>
              <li><strong>为什么危险：</strong>${scene.whyDangerous}</li>
              <li><strong>何时重看：</strong>${scene.reentrySignal}</li>
              <li><strong>替代方向：</strong>${scene.substitute}</li>
            </ul>
            <div class="stock-row-footer">
              <span class="card-subtle">这是美股里最容易把“高估值 + 兑现落空”放大的场景之一。</span>
              <a class="button warning subtle" href="${boardUrl(marketId, "avoid", { scene: scene.id })}">看回避样本</a>
            </div>
            ${renderSampleStockLinks(scene.sampleStockIds)}
          </article>
        `;
      })
      .join("");

    const nextActions = (pageData.nextActionIds || [])
      .map((actionId) => toolActionById[actionId])
      .filter(Boolean)
      .map((action) => `
        <a class="tool-card us-market-tool-card${action.tone === "primary" ? " is-primary" : action.tone === "secondary" ? " is-secondary" : ""}" href="${action.href}">
          <strong>${action.label}</strong>
          <span>${action.description}</span>
        </a>
      `)
      .join("");

    setTitle(`${market.name}`);
    renderShell(
      "market",
      marketId,
      `
        <section class="section us-market-section" id="us-overview" data-us-anchor-target>
          <div class="banner-grid us-market-hero-grid">
            <div class="banner-card us-market-hero-card">
              <div class="eyebrow">${market.name}</div>
              <h1 class="page-title">${market.headline}</h1>
              <p class="page-subtitle">${pageData.heroNote}</p>
              <div class="pill-row us-market-tag-row">${pageData.heroTags.map((tag) => pill(tag, "neutral")).join("")}</div>
              <p class="us-market-hero-note">${market.currentState}</p>
              <div class="button-row">${heroActions}</div>
            </div>
            <article class="section-panel us-market-status-card">
              <div class="pill-row">
                ${pill(trend.regime.label, "primary")}
                ${pill(`温度 ${trend.regime.temperature}/100`, "dark")}
              </div>
              <h3>市场状态卡</h3>
              <p>${trend.regime.summary}</p>
              <div class="us-market-status-grid">
                ${pageData.statusMetrics.map((item) => `
                  <div class="us-market-metric">
                    <span>${item.label}</span>
                    <strong>${item.value}</strong>
                    <small>${item.note}</small>
                  </div>
                `).join("")}
              </div>
              <div class="us-market-status-notes">
                <div><strong>顺风：</strong>${trend.leaders[0]}</div>
                <div><strong>警惕：</strong>${trend.warnings[0]}</div>
              </div>
              <div class="us-market-status-footer">
                <span>公开机会 / 风险样本 ${opportunityCount} / ${avoidCount}</span>
                <span>${market.fitStyle}</span>
              </div>
            </article>
          </div>
          <div class="us-market-quick-grid">
            ${quickCards}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Preview</div>
              <h2>先把机会和风险并排摆出来</h2>
              <p>保留现有 repo 的机会 / 风险并列入口，让用户先建立方向感，再往下看判断框架与执行动作。</p>
            </div>
          </div>
          <div class="market-desk-grid us-market-preview-grid">
            <article class="section-panel us-market-preview-panel">
              <div class="panel-head">
                <div>
                  <strong class="panel-title">机会预览</strong>
                  <p>优先跟踪业绩兑现、现金流托底和低拥挤修复的公开样本。</p>
                </div>
                <a class="button ghost subtle" href="#opportunity-board">去机会榜</a>
              </div>
              <div class="watch-list">
                ${featuredWatchRows}
              </div>
            </article>
            <article class="section-panel us-market-preview-panel is-risk">
              <div class="panel-head">
                <div>
                  <strong class="panel-title">风险预览</strong>
                  <p>先排除最容易把高估值主线打回原形的踩坑场景。</p>
                </div>
                <a class="button warning subtle" href="#avoid-board">去不能买榜</a>
              </div>
              <div class="read-list">
                ${featuredSceneRows}
              </div>
            </article>
          </div>
        </section>

        <section class="section us-market-anchor-wrap">
          <nav class="us-market-anchor" aria-label="美国市场页导航">
            <div class="us-market-anchor-list">
              ${anchorNav}
            </div>
          </nav>
        </section>

        <section class="section us-market-section" id="us-buy" data-us-anchor-target>
          <div class="section-head">
            <div>
              <div class="section-marker">Framework</div>
              <h2>怎么买</h2>
              <p>先回答“什么值得看”，再决定应该用财报、估值还是趋势工具继续往下筛。</p>
            </div>
          </div>
          <div class="us-market-framework-grid">
            <article class="section-panel us-market-playbook">
              <div class="pill-row">
                ${pill("判断顺序", "dark")}
                ${pill("机会发现 + 判断框架 + 操作指导", "neutral")}
              </div>
              <h3>美股不是先看故事，而是先看兑现质量</h3>
              <p>${market.methodSummary}</p>
              <div class="us-market-step-list">
                ${decisionSteps}
              </div>
              <div class="us-market-focus-grid">
                <article class="aside-panel us-market-focus-card">
                  ${pill("合理估值页", "neutral")}
                  <strong>估值先确认什么</strong>
                  <p>${market.valuationFocus}</p>
                  <a class="button ghost subtle" href="${toolActionById.valuation.href}">去估值页</a>
                </article>
                <article class="aside-panel us-market-focus-card">
                  ${pill("趋势页", "neutral")}
                  <strong>趋势先确认什么</strong>
                  <p>${market.trendFocus}</p>
                  <a class="button ghost subtle" href="${toolActionById.trend.href}">去趋势页</a>
                </article>
              </div>
            </article>
            <div class="us-market-strategy-grid">
              ${strategyCards}
            </div>
          </div>
        </section>

        <section class="section us-market-section" id="us-avoid" data-us-anchor-target>
          <div class="section-head">
            <div>
              <div class="section-marker">Avoid</div>
              <h2>不能买什么</h2>
              <p>美股最容易亏钱的，不是方向完全看反，而是在高估值阶段替没有兑现的基本面找借口。</p>
            </div>
          </div>
          <div class="warning-box us-market-risk-summary">
            <div class="pill-row">
              ${pill("先排除再研究", "danger")}
              ${pill("不要替故事补逻辑", "warning")}
            </div>
            <p>下面这些场景一旦成立，应该先回到不能买榜或趋势 / 估值页复核，而不是继续给热门主线加仓。</p>
            <ul class="list-bullets">
              ${pageData.riskSummary.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </div>
          <div class="us-market-risk-grid">
            ${riskCards}
          </div>
        </section>

        <section class="section us-market-section" id="us-boards" data-us-anchor-target>
          <div class="section-head">
            <div>
              <div class="section-marker">Workspace</div>
              <h2>双榜执行区</h2>
              <p>看完框架后，回到双榜比较区做真正的执行判断。现有深链和 query 过滤继续保留。</p>
            </div>
          </div>
          <div class="filter-panel board-hub us-market-workspace-panel">
            <div class="workspace-head">
              <strong>机会榜 / 不能买榜主工作区</strong>
              <span>左边找方向，右边排风险；筛选器、合理估值页和趋势页继续保持独立入口。</span>
            </div>
            <div class="board-grid">
              ${renderBoardPanel("opportunity", marketId, opportunityState)}
              ${renderBoardPanel("avoid", marketId, avoidState)}
            </div>
          </div>
        </section>

        <section class="section us-market-section" id="us-watchlist" data-us-anchor-target>
          <div class="section-head">
            <div>
              <div class="section-marker">Watchlist</div>
              <h2>代表样本与下一步</h2>
              <p>${pageData.watchlistIntro}</p>
            </div>
          </div>
          <div class="market-grid us-market-watchlist-grid">${renderTrendWatchlist(marketId)}</div>
          <div class="tool-grid us-market-tool-grid">
            ${nextActions}
          </div>
        </section>
      `
    );

    return marketId;
  }

  function renderMarketPage() {
    const marketId = safeMarket(document.body.dataset.market);
    if (handleLegacyMarketHash(marketId)) {
      return null;
    }

    if (marketId === "us") {
      return renderUsMarketPage(marketId);
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
            <article class="card featured">
              ${pill("判断顺序", "dark")}
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

  function renderJpMarketTwoPage() {
    const pageData = data.jpMarketTwo;
    const defaultNode = pageData.frameworkNodes[0];

    setTitle("日本股票选股框架 2");
    renderShell(
      "market",
      "jp",
      `
        <section class="section">
          <div class="banner-grid jp2-hero-grid">
            <div class="banner-card jp2-hero-card">
              <div class="eyebrow">${pageData.pageLabel}</div>
              <h1 class="page-title">${pageData.title}</h1>
              <p class="page-subtitle">${pageData.subtitle}</p>
              <p class="jp2-hero-note">${pageData.summary}</p>
              <div class="button-row">
                <a class="button secondary" href="#buy-cases">看可以买的思路</a>
                <a class="button ghost" href="#avoid-cases">看不能买的思路</a>
                <a class="button primary" href="${screenerPageUrl("jp")}">进入选股器</a>
                <a class="button ghost" href="${marketUrl("jp")}">返回经典日股页</a>
              </div>
            </div>
            <div class="aside-stack jp2-hero-side">
              <article class="state-card jp2-state-card">
                ${pill("30 秒读懂这页", "primary")}
                <h3 class="card-title">先判断重估，再决定是否便宜</h3>
                <div class="jp2-step-list compact">
                  ${pageData.quickUse.map((item, index) => `
                    <div class="jp2-step compact">
                      <span class="jp2-step-index">0${index + 1}</span>
                      <p>${item}</p>
                    </div>
                  `).join("")}
                </div>
              </article>
              <div class="jp2-stat-grid">
                ${pageData.stats.map((item) => `
                  <div class="banner-stat jp2-stat-card">
                    <strong>${item.value}</strong>
                    <span>${item.label}</span>
                    <em>${item.note}</em>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Conclusion</div>
              <h2>一句话先给结论</h2>
              <p>这页先给用户结果，再带他往下理解为什么同样是便宜，日本股票里有的能买、有的不能碰。</p>
            </div>
          </div>
          <div class="jp2-conclusion-grid">
            ${pageData.conclusions.map((item) => `
              <article class="section-panel jp2-conclusion-card ${item.id === "buy" ? "is-positive" : "is-danger"}">
                <div class="pill-row">
                  ${pill(item.title, item.tone)}
                  ${pill(item.id === "buy" ? "先研究" : "先排除", "neutral")}
                </div>
                <h3>${item.title}</h3>
                <p>${item.summary}</p>
                <ul class="list-bullets jp2-list">
                  ${item.items.map((entry) => `<li>${entry}</li>`).join("")}
                </ul>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Main Thesis</div>
              <h2>日本市场主线为什么和别的市场不一样</h2>
              <p>这里不是讲新闻，而是把现在日本市场最值得看的定价逻辑压缩成三个信息块。</p>
            </div>
          </div>
          <div class="market-grid jp2-driver-grid">
            ${pageData.drivers.map((item) => `
              <article class="card jp2-driver-card">
                ${pill(item.tag, "primary")}
                <h3>${item.title}</h3>
                <p>${item.summary}</p>
                <ul class="list-bullets jp2-list">
                  ${item.bullets.map((entry) => `<li>${entry}</li>`).join("")}
                </ul>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="section" id="buy-cases">
          <div class="section-head">
            <div>
              <div class="section-marker">Buy Ideas</div>
              <h2>可以买的 6 条思路</h2>
              <p>每一张卡都回答 4 件事：它是什么、为什么在日本有效、该看什么、最容易看错什么。</p>
            </div>
          </div>
          <div class="market-grid jp2-idea-grid">
            ${pageData.buyIdeas.map((item) => renderJpMarketTwoIdeaCard(item, "primary")).join("")}
          </div>
        </section>

        <section class="section" id="avoid-cases">
          <div class="section-head">
            <div>
              <div class="section-marker">Avoid Ideas</div>
              <h2>不能碰的 6 类坑</h2>
              <p>日股最常见的亏钱方式，不是没找到便宜股，而是把不该碰的低质量样本误判成价值机会。</p>
            </div>
          </div>
          <div class="market-grid jp2-idea-grid">
            ${pageData.avoidIdeas.map((item) => renderJpMarketTwoIdeaCard(item, "danger")).join("")}
          </div>
        </section>

        <section class="section" id="framework">
          <div class="section-head">
            <div>
              <div class="section-marker">Framework</div>
              <h2>交互式选股框架图</h2>
              <p>按“宏观 → 板块 → 因子 → 基本面 → 催化 / 择时 → 风控”展开。点左侧节点，右侧会切换成对应说明。</p>
            </div>
          </div>
          <div class="jp2-framework-grid">
            <article class="section-panel jp2-framework-map-panel">
              <div class="panel-head">
                <div>
                  <strong class="panel-title">从 1000 只股票收敛到 10 只研究候选</strong>
                  <p>先缩小研究范围，再做基本面和事件确认，最后才是买点与仓位。</p>
                </div>
              </div>
              <div class="jp2-node-grid">
                ${pageData.frameworkNodes.map((item, index) => `
                  <button class="jp2-node-button${index === 0 ? " is-active" : ""}" type="button" data-framework-node="${item.id}">
                    <span class="jp2-node-step">${item.step}</span>
                    <strong>${item.title}</strong>
                    <span>${item.summary}</span>
                  </button>
                `).join("")}
              </div>
            </article>
            <article class="section-panel jp2-framework-panel" id="jp-framework-panel">
              ${renderJpMarketTwoFrameworkPanel(defaultNode)}
            </article>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Research Queue</div>
              <h2>从框架到样本：先研究哪几只</h2>
              <p>这不是推荐名单，而是示意如何把上面的逻辑收敛成一张可继续深挖的研究队列。</p>
            </div>
          </div>
          <div class="section-panel jp2-candidate-panel">
            <div class="jp2-candidate-table-wrap">
              <table class="jp2-candidate-table">
                <thead>
                  <tr>
                    <th>公司</th>
                    <th>归属思路</th>
                    <th>关键催化</th>
                    <th>主要风险</th>
                    <th>下一步</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageData.researchCandidates.map(renderJpMarketTwoResearchRow).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Path</div>
              <h2>如何从 1000 只股票里找出 10 只值得研究的股票</h2>
              <p>这部分故意做成流程，不是让用户记概念，而是让他知道下一步应该做什么。</p>
            </div>
          </div>
          <div class="section-panel">
            <div class="jp2-step-list">
              ${pageData.practicalSteps.map((item) => `
                <div class="jp2-step">
                  <span class="jp2-step-index">${item.step}</span>
                  <div>
                    <strong>${item.title}</strong>
                    <p>${item.description}</p>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <div class="section-marker">Next Step</div>
              <h2>继续往下做成产品功能</h2>
              <p>现在这页已经能作为“方法页”独立存在，下一步最自然的是把它接到筛选器、催化页和风控页。</p>
            </div>
          </div>
          <div class="jp2-cta-grid">
            ${pageData.ctas.map((item) => `
              <article class="card jp2-cta-card">
                ${pill(item.title, item.tone === "primary" ? "primary" : item.tone === "secondary" ? "dark" : "neutral")}
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="button-row">
                  <a class="button ${item.tone}" href="${item.href}">${item.title}</a>
                </div>
              </article>
            `).join("")}
          </div>
        </section>
      `
    );
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

  function bindUsMarketPage() {
    const navLinks = Array.from(app.querySelectorAll("[data-us-anchor-link]"));
    const sections = Array.from(app.querySelectorAll("[data-us-anchor-target]"));

    if (!navLinks.length || !sections.length) {
      return;
    }

    const linkById = Object.fromEntries(navLinks.map((link) => [link.dataset.usAnchorLink, link]));
    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(
        (entries) => {
          const visibleEntry = entries
            .filter((entry) => entry.isIntersecting)
            .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

          if (visibleEntry) {
            setActive(visibleEntry.target.id);
          }
        },
        { rootMargin: "-28% 0px -55% 0px", threshold: [0.18, 0.4, 0.65] }
      )
      : null;

    function setActive(activeId) {
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.usAnchorLink === activeId);
      });
    }

    function normalizeHash(hash) {
      if (hash === "#opportunity-board" || hash === "#avoid-board") {
        return "us-boards";
      }

      const targetId = (hash || "").replace("#", "");
      return linkById[targetId] ? targetId : sections[0].id;
    }

    navLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        const target = href ? document.querySelector(href) : null;

        if (!target) {
          return;
        }

        event.preventDefault();
        window.history.pushState({}, "", `${window.location.pathname}${window.location.search}${href}`);
        target.scrollIntoView({ block: "start", behavior: "smooth" });
        setActive(link.dataset.usAnchorLink);
      });
    });

    sections.forEach((section) => observer && observer.observe(section));

    window.addEventListener("hashchange", () => {
      setActive(normalizeHash(window.location.hash));
    });

    setActive(normalizeHash(window.location.hash));
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

  function bindScreenerPanel(marketId) {
    const root = app.querySelector(".screener-replica-page");

    if (!root || root.dataset.boundReplica === "true") {
      return;
    }

    root.dataset.boundReplica = "true";

    const state = getReplicaScreenerState(marketId);
    const storedColumns = safeReplicaColumns(window.localStorage.getItem(screenerReplicaStorageKeys.customColumns));

    if (!currentParams().get("scCols")) {
      state.customColumns = storedColumns;
    }

    const presetRow = root.querySelector("#screener-replica-presets");
    const categoryTabs = root.querySelector("#screener-replica-categories");
    const primaryFilters = root.querySelector("#screener-replica-primary-filters");
    const secondaryFilters = root.querySelector("#screener-replica-secondary-filters");
    const activeFilters = root.querySelector("#screener-replica-active-filters");
    const viewTabs = root.querySelector("#screener-replica-view-tabs");
    const customPanel = root.querySelector("#screener-replica-custom-panel");
    const savedPanel = root.querySelector("#screener-replica-saved-panel");
    const tablePanel = root.querySelector("#screener-replica-table-panel");
    const totalLabel = root.querySelector("#screener-replica-total");
    const appliedLabel = root.querySelector("#screener-replica-applied");
    const currentRowsLabel = root.querySelector("#screener-replica-current-rows");
    const selectedRowsLabel = root.querySelector("#screener-replica-selected");
    const searchInput = root.querySelector("#screener-replica-query");
    const numericColumns = new Set(["marketCap", "pe", "pb", "ps", "peg", "price", "dayChange", "dividendYield", "payoutRatio", "dividendGrowth5y", "weekChange", "monthChange", "ytdReturn", "oneYearReturn", "near52wHigh", "rsi", "revenueGrowth", "epsGrowth", "grossMargin", "netMargin", "roe", "roa", "debtEquity", "fcfMargin", "beta", "volatility30d", "maxDrawdown", "analystRating", "assetTurnover", "upside"]);

    function getReplicaColumnClassName(columnId) {
      const classes = [];

      if (columnId === "company") {
        classes.push("is-sticky", "is-sticky-company");
      }

      if (columnId === "name") {
        classes.push("is-sticky", "is-sticky-name");
      }

      if (numericColumns.has(columnId)) {
        classes.push("is-numeric");
      }

      return classes.join(" ");
    }

    function applyReplicaPreset(presetId) {
      const preset = screenerReplicaPresetById[presetId];

      if (!preset) {
        return;
      }

      state.preset = presetId;
      state.filters = defaultReplicaFilters();
      Object.entries(preset.filters).forEach(([key, value]) => {
        state.filters[key] = value;
      });
      state.selectedIds = [];
    }

    function renderReplicaTable(rows) {
      const visibleColumns = getVisibleReplicaColumns(state);
      const allSelected = rows.length > 0 && rows.every((row) => state.selectedIds.includes(row.id));
      const headerMarkup = visibleColumns
        .map((columnId) => {
          const label = screenerReplicaColumnLabels[columnId] || columnId;
          const sortable = !["fairValue", "fairValueUpside", "fairValueRating", "analystTarget"].includes(columnId);
          const isActiveSort = state.sortKey === columnId;
          const headerContent = sortable
            ? `<button class="screener-sort-button${isActiveSort ? " is-active" : ""}" data-screener-sort="${columnId}">${label}<span>${isActiveSort ? (state.sortDir === "asc" ? "↑" : "↓") : "↕"}</span></button>`
            : `<span class="screener-sort-static">${label}</span>`;

          if (columnId === "company") {
            return `<th class="${getReplicaColumnClassName(columnId)}"><div class="screener-company-head"><input type="checkbox" data-screener-select-all${allSelected ? " checked" : ""}>${headerContent}</div></th>`;
          }

          return `<th class="${getReplicaColumnClassName(columnId)}">${headerContent}</th>`;
        })
        .join("");

      const bodyMarkup = rows.length
        ? rows
          .map((row, index) => `
            <tr>
              ${visibleColumns
              .map((columnId) => `<td class="${getReplicaColumnClassName(columnId)}">${renderReplicaCell(columnId, row, index, state)}</td>`)
              .join("")}
            </tr>
          `)
          .join("")
        : `<tr><td colspan="${visibleColumns.length}">${renderEmpty("当前筛选条件下，没有符合要求的样本。")}</td></tr>`;

      tablePanel.innerHTML = `
        <div class="screener-grid-wrap">
          <table class="screener-grid-table">
            <thead><tr>${headerMarkup}</tr></thead>
            <tbody>${bodyMarkup}</tbody>
          </table>
        </div>
      `;
    }

    function renderReplica() {
      const category = screenerReplicaCategoryById[state.category];
      const filteredRows = sortReplicaRows(getFilteredReplicaRows(marketId, state), state);
      const totalCount = getReplicaVisibleResultCount(filteredRows, marketId);

      state.selectedIds = state.selectedIds.filter((id) => filteredRows.some((row) => row.id === id));

      presetRow.innerHTML = renderReplicaPresetRow(state);
      categoryTabs.innerHTML = renderReplicaCategoryTabs(state);
      primaryFilters.innerHTML = category.primary.map((filterId) => renderReplicaFilterField(filterId, state)).join("")
        + `<button class="screener-more-button${state.moreFilters ? " is-open" : ""}" data-screener-more>${state.moreFilters ? "收起更多筛选" : "更多筛选条件"}</button>`;
      secondaryFilters.innerHTML = state.moreFilters ? category.secondary.map((filterId) => renderReplicaFilterField(filterId, state)).join("") : "";
      activeFilters.innerHTML = renderReplicaActiveFilters(state);
      viewTabs.innerHTML = renderReplicaViewTabs(state);
      customPanel.innerHTML = renderReplicaCustomColumns(state);
      savedPanel.innerHTML = renderReplicaSavedPanel(state, marketId);
      totalLabel.textContent = totalCount.toLocaleString("zh-CN");
      appliedLabel.textContent = `已应用筛选条件 ${getReplicaAppliedFilterCount(state)}`;
      currentRowsLabel.textContent = `当前展示 ${filteredRows.length} 行样本`;
      selectedRowsLabel.textContent = `已选 ${state.selectedIds.length}`;
      searchInput.value = state.query;
      renderReplicaTable(filteredRows);
      bindActionButtons(root);
      syncReplicaStateToUrl(state);
    }

    root.addEventListener("click", (event) => {
      const target = event.target.closest("[data-screener-preset],[data-screener-category],[data-screener-view],[data-screener-remove],[data-screener-more],[data-screener-action],[data-screener-sort],[data-screener-load],[data-screener-delete]");

      if (!target) {
        return;
      }

      if (target.dataset.screenerPreset) {
        applyReplicaPreset(target.dataset.screenerPreset);
        renderReplica();
        return;
      }

      if (target.dataset.screenerCategory) {
        state.category = target.dataset.screenerCategory;
        renderReplica();
        return;
      }

      if (target.dataset.screenerView) {
        state.view = target.dataset.screenerView;
        renderReplica();
        return;
      }

      if (target.dataset.screenerRemove) {
        if (target.dataset.screenerRemove === "query") {
          state.query = "";
        } else {
          state.filters[target.dataset.screenerRemove] = "all";
        }
        renderReplica();
        return;
      }

      if (target.hasAttribute("data-screener-more")) {
        state.moreFilters = !state.moreFilters;
        renderReplica();
        return;
      }

      if (target.dataset.screenerSort) {
        state.sortDir = state.sortKey === target.dataset.screenerSort && state.sortDir === "desc" ? "asc" : "desc";
        state.sortKey = target.dataset.screenerSort;
        renderReplica();
        return;
      }

      if (target.dataset.screenerAction === "save") {
        const name = window.prompt("给这个选股器起个名字", `${data.markets[marketId].shortName} 我的选股器`);

        if (!name || !name.trim()) {
          return;
        }

        const items = getReplicaSavedScreeners();
        const summary = renderReplicaActiveFilters(state).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "未添加额外筛选条件";
        items.unshift({
          id: `save-${Date.now()}`,
          name: name.trim(),
          marketId,
          summary,
          state: {
            preset: state.preset,
            category: state.category,
            view: state.view,
            query: state.query,
            sortKey: state.sortKey,
            sortDir: state.sortDir,
            moreFilters: state.moreFilters,
            customColumns: state.customColumns.slice(),
            filters: Object.assign({}, state.filters)
          }
        });
        setReplicaSavedScreeners(items.slice(0, 8));
        state.savedOpen = true;
        showToast(`已保存 ${name.trim()}。`);
        renderReplica();
        return;
      }

      if (target.dataset.screenerAction === "saved") {
        state.savedOpen = !state.savedOpen;
        renderReplica();
        return;
      }

      if (target.dataset.screenerAction === "download") {
        exportReplicaRowsToCsv(getVisibleReplicaColumns(state), sortReplicaRows(getFilteredReplicaRows(marketId, state), state));
        showToast("已导出当前视图的 CSV。");
        return;
      }

      if (target.dataset.screenerLoad) {
        const item = getReplicaSavedScreeners().find((entry) => entry.id === target.dataset.screenerLoad);

        if (!item) {
          return;
        }

        state.preset = item.state.preset;
        state.category = item.state.category;
        state.view = item.state.view;
        state.query = item.state.query;
        state.sortKey = item.state.sortKey;
        state.sortDir = item.state.sortDir;
        state.moreFilters = item.state.moreFilters;
        state.customColumns = item.state.customColumns.slice();
        state.filters = Object.assign(defaultReplicaFilters(), item.state.filters);
        state.selectedIds = [];
        state.savedOpen = false;
        showToast(`已载入 ${item.name}。`);
        renderReplica();
        return;
      }

      if (target.dataset.screenerDelete) {
        setReplicaSavedScreeners(getReplicaSavedScreeners().filter((item) => item.id !== target.dataset.screenerDelete));
        showToast("已删除保存的选股器。");
        renderReplica();
      }
    });

    root.addEventListener("change", (event) => {
      const field = event.target;

      if (field.matches("[data-screener-field]")) {
        state.filters[field.dataset.screenerField] = field.value || "all";
        renderReplica();
        return;
      }

      if (field.matches("[data-screener-column]")) {
        const nextColumns = screenerReplicaConfig.customColumnPool
          .map((column) => column.id)
          .filter((columnId) => {
            const checkbox = root.querySelector(`[data-screener-column="${columnId}"]`);
            return checkbox && checkbox.checked;
          });

        state.customColumns = nextColumns.length ? nextColumns : screenerReplicaViewById.custom.columns.slice(2);
        window.localStorage.setItem(screenerReplicaStorageKeys.customColumns, state.customColumns.join(","));
        renderReplica();
        return;
      }

      if (field.matches("[data-screener-select]")) {
        state.selectedIds = field.checked
          ? Array.from(new Set(state.selectedIds.concat(field.dataset.screenerSelect)))
          : state.selectedIds.filter((id) => id !== field.dataset.screenerSelect);
        renderReplica();
        return;
      }

      if (field.matches("[data-screener-select-all]")) {
        const visibleIds = sortReplicaRows(getFilteredReplicaRows(marketId, state), state).map((row) => row.id);
        state.selectedIds = field.checked ? visibleIds : [];
        renderReplica();
      }
    });

    root.addEventListener("input", (event) => {
      if (event.target.matches("#screener-replica-query")) {
        state.query = event.target.value;
        renderReplica();
      }
    });

    renderReplica();
  }

  function renderScreenerPage() {
    const marketId = safeMarket(currentParams().get("market"));
    const market = data.markets[marketId];

    setTitle(`${market.name}选股器`);
    renderShell(
      "screener",
      marketId,
      `
        <section class="section screener-replica-page">
          <div class="screener-replica-head">
            <div>
              <div class="screener-replica-eyebrow">${market.name} / Screener</div>
              <h1 class="screener-replica-title">${screenerReplicaConfig.title}</h1>
              <p class="screener-replica-subtitle">${screenerReplicaConfig.subtitle}</p>
            </div>
          </div>

          <div class="screener-replica-toolbar">
            <div class="screener-replica-summary">找到 <strong id="screener-replica-total">0</strong> 支股票</div>
            <div class="screener-replica-actions">
              <button class="screener-head-button" data-screener-action="save">保存</button>
              <button class="screener-head-button is-primary" data-screener-action="saved">我的选股器</button>
            </div>
          </div>

          <div class="screener-preset-strip" id="screener-replica-presets"></div>

          <article class="screener-workbench-card">
            <div class="screener-filter-topline">
              <div class="screener-filter-left">
                <strong>筛选</strong>
                <span id="screener-replica-applied">已应用筛选条件 0</span>
              </div>
              <label class="screener-search-box">
                <input id="screener-replica-query" type="text" placeholder="搜索超150种指标、股票名称、代码或行业">
              </label>
            </div>
            <div class="screener-category-tabs" id="screener-replica-categories"></div>
            <div class="screener-filter-grid" id="screener-replica-primary-filters"></div>
            <div class="screener-filter-grid is-secondary" id="screener-replica-secondary-filters"></div>
            <div class="screener-active-filters" id="screener-replica-active-filters"></div>
          </article>

          <article class="screener-workbench-card">
            <div class="screener-view-toolbar">
              <div class="screener-market-pill">${market.shortName.toUpperCase()}</div>
              <div class="screener-view-tabs" id="screener-replica-view-tabs"></div>
              <div class="screener-view-status">
                <span id="screener-replica-current-rows">当前展示 0 行样本</span>
                <span id="screener-replica-selected">已选 0</span>
                <button class="screener-download-button" data-screener-action="download">下载</button>
              </div>
            </div>
            <div id="screener-replica-custom-panel"></div>
            <div id="screener-replica-table-panel"></div>
          </article>

          <div id="screener-replica-saved-panel"></div>
        </section>
      `
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
      if (marketId === "us") {
        bindUsMarketPage();
      }
    }
  } else if (page === "jp-market-two") {
    renderJpMarketTwoPage();
    bindJpMarketTwoPage();
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
