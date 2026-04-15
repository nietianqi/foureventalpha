window.prototypeData = {};

(function () {
  const data = window.prototypeData;

  const marketPathById = {
    cn: "market-cn.html",
    us: "market-us.html",
    jp: "market-jp.html",
    hk: "market-hk.html"
  };

  function marketUrl(marketId) {
    return marketPathById[marketId] || marketPathById.cn;
  }

  function stockUrl(stockId) {
    return `stock.html?stock=${stockId}`;
  }

  function boardUrl(marketId, boardType, filters) {
    const params = new URLSearchParams();
    const prefix = boardType === "avoid" ? "av" : "op";
    const config = filters || {};

    [
      [`${prefix}Strategy`, config.strategy],
      [`${prefix}Risk`, config.risk],
      [`${prefix}Scene`, config.scene]
    ].forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      }
    });

    const hash = boardType === "avoid" ? "#avoid-board" : "#opportunity-board";
    const query = params.toString();
    return `${marketUrl(marketId)}${query ? `?${query}` : ""}${hash}`;
  }

  function metric(label, value, comment) {
    return { label, value, comment };
  }

  function alternative(stockId, reason) {
    return { stockId, reason };
  }

  function rankingLink(label, marketId, boardType, filters) {
    return { label, url: boardUrl(marketId, boardType, filters) };
  }

  data.site = {
    name: "四大市场股票思路",
    tagLine: "四个市场，四套判断框架",
    updatedAt: "2026-04-15 21:00 JST",
    note: "以下内容为原型示意数据，用于页面结构与交互演示，不构成任何投资建议。"
  };

  data.marketOrder = ["cn", "us", "jp", "hk"];

  data.markets = {
    cn: {
      id: "cn",
      name: "中国市场",
      shortName: "中国",
      headline: "政策与盈利修复并行，先看景气确认，再谈便宜。",
      currentState: "政策预期抬升，但真正决定估值能否扩张的是订单兑现和现金流转正。",
      fitStyle: "景气切换、国产替代、现金流红利",
      pitfall: "题材末端、低流动性、伪反转",
      intro: "中国市场更适合把政策、景气和兑现顺序拆开看，不能只看估值便宜。",
      strategyIds: [
        "cn-policy-repair",
        "cn-domestic-substitution",
        "cn-export-upgrade",
        "cn-high-dividend"
      ],
      avoidSceneIds: [
        "cn-crowded-theme",
        "cn-low-float",
        "cn-fake-turnaround",
        "cn-major-selloff",
        "cn-balance-sheet-stress",
        "cn-fad-story"
      ],
      opportunityStockIds: ["cn-galaxy-energy", "cn-river-grid", "cn-sea-auto"],
      avoidStockIds: ["cn-orbit-medtech", "cn-morning-chips"],
      valuationDefaults: {
        preset: "undervalued",
        band: "undervalued",
        quality: "q70",
        margin: "m15",
        size: "all"
      },
      trendOverview: "政策修复给了方向，但最终是订单兑现和现金流决定上涨质量。",
      education: [
        "先判断政策是否提供方向，再判断盈利能否兑现。",
        "只看便宜容易买到伪反转，必须叠加现金流与订单验证。",
        "强题材阶段更要用风险标签约束仓位和节奏。"
      ]
    },
    us: {
      id: "us",
      name: "美国市场",
      shortName: "美国",
      headline: "成长、现金流、趋势和估值修复可以共存，但优先级不同。",
      currentState: "高估值主线仍拥挤，但市场已经更奖励兑现而不是讲故事。",
      fitStyle: "成长兑现、自由现金流、趋势延续、价值修复",
      pitfall: "AI 过热、指引下修、利润率未验证",
      intro: "美国市场需要区分叙事驱动和现金流驱动，不能把所有高增速都当作好公司。",
      strategyIds: [
        "us-growth-confirmation",
        "us-free-cashflow",
        "us-trend-following",
        "us-value-rebound"
      ],
      avoidSceneIds: [
        "us-guidance-cut",
        "us-cash-burn",
        "us-ai-crowding",
        "us-regulatory-hangover",
        "us-unproven-margin"
      ],
      opportunityStockIds: ["us-cascade-pay", "us-atlas-medical", "us-summit-energy"],
      avoidStockIds: ["us-pioneer-cloud", "us-nova-retail"],
      valuationDefaults: {
        preset: "cashflow",
        band: "all",
        quality: "q80",
        margin: "m15",
        size: "all"
      },
      trendOverview: "美股当下更奖励现金流兑现和趋势健康度，而不是单纯更高的收入故事。",
      education: [
        "先看公司是否把收入转成自由现金流，再谈估值天花板。",
        "趋势股可以跟，但必须用指引和利润率做止损线。",
        "当市场只听故事不看现金流时，风险榜要放在机会榜前面。"
      ]
    },
    jp: {
      id: "jp",
      name: "日本市场",
      shortName: "日本",
      headline: "回购、低 PBR 改善、业绩上修和高股息，是最值得拆开的四条主线。",
      currentState: "治理改善仍是主线，但真假改善开始分化，回购兑现比口头承诺更重要。",
      fitStyle: "回购增配、低 PBR 改善、业绩上修、高股息",
      pitfall: "价值陷阱、口惠实不至、汇率顺风反转",
      intro: "日本市场不能只看低估值，更要看治理改善是否真正落到 ROE 和股东回报上。",
      strategyIds: [
        "jp-buyback-rotation",
        "jp-low-pbr-reform",
        "jp-earnings-upgrade",
        "jp-high-dividend"
      ],
      avoidSceneIds: [
        "jp-value-trap",
        "jp-weak-shareholder-return",
        "jp-export-fx-reversal",
        "jp-capex-burden",
        "jp-thin-liquidity"
      ],
      opportunityStockIds: ["jp-sakura-machinery", "jp-koyo-banks", "jp-mirai-rail"],
      avoidStockIds: ["jp-hinode-logistics", "jp-aoi-electronics"],
      valuationDefaults: {
        preset: "dividend",
        band: "all",
        quality: "q70",
        margin: "m5",
        size: "all"
      },
      trendOverview: "日股的估值修复关键不在低 PBR 本身，而在治理改善是否真的落到回购和 ROE。",
      education: [
        "先看治理动作是否真实发生，再看低估值有没有修复空间。",
        "日股高股息并不等于低风险，资本开支和汇率会直接改变判断。",
        "适合中期持有，但需要用股东回报和业绩上修做筛选。"
      ]
    },
    hk: {
      id: "hk",
      name: "香港市场",
      shortName: "香港",
      headline: "南向偏好、估值修复、高股息和核心资产重估，是港股的四个观察入口。",
      currentState: "港股修复仍取决于资金回流节奏，估值折价只有在资产质量站住后才有持续性。",
      fitStyle: "南向偏好、估值修复、高股息、防守型核心资产",
      pitfall: "流动性折价、政策 Beta 单驱动、高股息不可持续",
      intro: "香港市场更像流动性和资产质量的组合判断，不适合只靠一句政策利好就追涨。",
      strategyIds: [
        "hk-southbound-core",
        "hk-valuation-recovery",
        "hk-high-dividend",
        "hk-platform-turnaround"
      ],
      avoidSceneIds: [
        "hk-liquidity-discount",
        "hk-policy-beta-only",
        "hk-dividend-fragile",
        "hk-property-chain-shadow",
        "hk-story-before-profit"
      ],
      opportunityStockIds: ["hk-pearl-infra", "hk-harbor-finance", "hk-victory-consumer"],
      avoidStockIds: ["hk-orion-health", "hk-lotus-tech"],
      valuationDefaults: {
        preset: "trend-calm",
        band: "all",
        quality: "q70",
        margin: "m15",
        size: "all"
      },
      trendOverview: "港股重估既要看南向资金，也要看股息安全和资产质量能不能同时成立。",
      education: [
        "先看资金回流和流动性，再谈估值修复能走多远。",
        "港股高股息需要看分红来源，不然容易掉进收益率陷阱。",
        "南向偏好是很强的加分项，但不能替代基本面判断。"
      ]
    }
  };

  data.strategyCards = [
    {
      id: "cn-policy-repair",
      market: "cn",
      name: "政策催化修复",
      summary: "政策方向明确、订单边际改善、盈利从底部抬升。",
      fitFor: "希望抓住一到两个季度修复弹性的用户",
      cycle: "1-2 个季度",
      catalyst: "补贴、设备更新、行业库存拐点"
    },
    {
      id: "cn-domestic-substitution",
      market: "cn",
      name: "国产替代景气",
      summary: "订单验证配合份额提升，适合看产业升级而不是纯题材。",
      fitFor: "能接受波动、重视验证节点的成长型用户",
      cycle: "2-4 个季度",
      catalyst: "验证单落地、国产供应链放量"
    },
    {
      id: "cn-export-upgrade",
      market: "cn",
      name: "出海制造升级",
      summary: "全球份额扩张配合利润率改善，重点看产品结构升级。",
      fitFor: "偏好多因子验证的中期配置用户",
      cycle: "2-6 个季度",
      catalyst: "海外订单、渠道扩张、毛利率抬升"
    },
    {
      id: "cn-high-dividend",
      market: "cn",
      name: "现金流红利",
      summary: "现金流稳、分红确定、估值不拥挤，适合作为回撤缓冲。",
      fitFor: "偏防守、重视波动控制的用户",
      cycle: "中长期",
      catalyst: "分红提升、利率下行、防守需求"
    },
    {
      id: "us-growth-confirmation",
      market: "us",
      name: "成长兑现",
      summary: "增长与利润率同步兑现，市场给高估值但容错率有限。",
      fitFor: "擅长跟踪财报和指引的成长型用户",
      cycle: "1-3 个财报季",
      catalyst: "财报超预期、客户扩张、价格力"
    },
    {
      id: "us-free-cashflow",
      market: "us",
      name: "自由现金流扩张",
      summary: "收入质量高、现金转化强，更适合当核心持仓。",
      fitFor: "偏好确定性与复利的配置型用户",
      cycle: "中长期",
      catalyst: "费用率改善、回购、现金流超预期"
    },
    {
      id: "us-trend-following",
      market: "us",
      name: "趋势延续",
      summary: "尊重价格趋势，但必须绑定盈利与订单的继续验证。",
      fitFor: "纪律强、接受止损的趋势型用户",
      cycle: "数周到数月",
      catalyst: "产业催化、订单连增、强势突破"
    },
    {
      id: "us-value-rebound",
      market: "us",
      name: "价值修复",
      summary: "估值回到历史低位后，等待利润率和资产负债表改善。",
      fitFor: "能忍受等待、偏好赔率的逆向用户",
      cycle: "2-4 个财报季",
      catalyst: "去库存结束、资本回收、经营重组"
    },
    {
      id: "jp-buyback-rotation",
      market: "jp",
      name: "回购增配",
      summary: "真实回购配合资本配置优化，是日股估值提升的重要来源。",
      fitFor: "关注治理改善与股东回报的配置型用户",
      cycle: "中期",
      catalyst: "回购计划、资本政策、股东沟通"
    },
    {
      id: "jp-low-pbr-reform",
      market: "jp",
      name: "低 PBR 改善",
      summary: "低估值本身不是理由，改善路径才是定价关键。",
      fitFor: "能辨别价值陷阱的逆向用户",
      cycle: "中期",
      catalyst: "治理改革、资产处置、ROE 改善"
    },
    {
      id: "jp-earnings-upgrade",
      market: "jp",
      name: "业绩上修",
      summary: "订单和利润率同时改善，适合业绩驱动而非题材驱动。",
      fitFor: "偏好基本面拐点的中期用户",
      cycle: "1-3 个财报季",
      catalyst: "订单改善、利润率上修、资本开支见顶"
    },
    {
      id: "jp-high-dividend",
      market: "jp",
      name: "高股息防守",
      summary: "股东回报稳定、估值不贵，适合在震荡期承担防守角色。",
      fitFor: "偏好收益和稳定性的配置型用户",
      cycle: "中长期",
      catalyst: "分红政策、资本优化、避险资金回流"
    },
    {
      id: "hk-southbound-core",
      market: "hk",
      name: "南向资金核心资产",
      summary: "资金偏好明确、流动性改善同步出现时，港股核心资产更容易修复。",
      fitFor: "看重资金方向和资产质量的用户",
      cycle: "1-2 个季度",
      catalyst: "南向净流入、消费修复、盈利稳定"
    },
    {
      id: "hk-valuation-recovery",
      market: "hk",
      name: "估值修复",
      summary: "估值折价收敛前提是流动性改善与盈利可解释。",
      fitFor: "能忍受震荡、等待赔率兑现的逆向用户",
      cycle: "数月",
      catalyst: "风险偏好修复、资金回流、资产质量改善"
    },
    {
      id: "hk-high-dividend",
      market: "hk",
      name: "高股息防守",
      summary: "高股息是防守手段，不是忽略基本面的理由。",
      fitFor: "追求收益率但重视资产质量的用户",
      cycle: "中长期",
      catalyst: "股息率稳定、经营现金流改善"
    },
    {
      id: "hk-platform-turnaround",
      market: "hk",
      name: "平台现金流重估",
      summary: "平台型资产重估必须依赖现金流和监管预期双改善。",
      fitFor: "看重现金流拐点的成长价值用户",
      cycle: "2-4 个财报季",
      catalyst: "利润率改善、回购、监管预期稳定"
    }
  ];

  data.avoidSceneCards = [
    { id: "cn-crowded-theme", market: "cn", name: "情绪末端追高", level: "高", signal: "换手和成交额突然失真放大，情绪开始盖过基本面。", summary: "热点拥挤时，风险来自接力位置而不是公司本身。", substitute: "回到现金流更清楚、验证更充分的方向。" },
    { id: "cn-low-float", market: "cn", name: "低流动性拉升", level: "高", signal: "小票快速拉升但机构承接不足，成交结构失衡。", summary: "流动性错觉会让用户误把脉冲行情当成趋势。", substitute: "切回中大市值、可持续交易的验证样本。" },
    { id: "cn-fake-turnaround", market: "cn", name: "伪反转低估", level: "中", signal: "估值看起来很便宜，但订单和现金流并未同步修复。", summary: "只看估值容易买到没有兑现路径的便宜货。", substitute: "等景气与现金流一起回到正向区间。" },
    { id: "cn-major-selloff", market: "cn", name: "补跌后的防守切换", level: "低", signal: "高波动方向退潮后，防守资金重新回到红利与公用事业。", summary: "不是所有回撤都该抄底，先看谁能承担组合稳定器。", substitute: "优先选择红利、电网、公用事业等防守资产。" },
    { id: "cn-balance-sheet-stress", market: "cn", name: "高杠杆扩产", level: "高", signal: "景气还没兑现，资本开支和负债表先恶化。", summary: "扩产故事如果早于订单兑现，股价弹性会变成财务风险。", substitute: "选择现金流更稳、扩产节奏更克制的样本。" },
    { id: "cn-fad-story", market: "cn", name: "故事先行兑现落后", level: "高", signal: "管理层叙事很满，但订单、产品和客户验证没有跟上。", summary: "最危险的不是贵，而是验证永远晚一步。", substitute: "回到已经出现订单或现金流证据的赛道。" },
    { id: "us-guidance-cut", market: "us", name: "指引下修前夜", level: "高", signal: "管理层口径转保守，估值却仍停留在高成长假设。", summary: "财报下修会让高估值与基本面同时受压。", substitute: "优先看自由现金流更稳的龙头。" },
    { id: "us-cash-burn", market: "us", name: "现金流失速", level: "高", signal: "收入增长还在，但现金转化和回款开始变弱。", summary: "当现金流跟不上叙事，估值溢价会迅速收缩。", substitute: "切回有回购和现金回流支撑的标的。" },
    { id: "us-ai-crowding", market: "us", name: "AI 拥挤交易", level: "中", signal: "趋势很强，但拥挤度已经快过利润兑现速度。", summary: "方向未必错，错的是在市场最热的时候追最拥挤的位置。", substitute: "看还没被过度拥挤、但现金流已改善的次主线。" },
    { id: "us-regulatory-hangover", market: "us", name: "监管余波", level: "中", signal: "商业模式没坏，但监管不确定性拉长估值修复时间。", summary: "赔率可以存在，但节奏必须更保守。", substitute: "优先看已经跨过监管窗口的行业龙头。" },
    { id: "us-unproven-margin", market: "us", name: "利润率未验证", level: "中", signal: "收入继续增长，但利润率改善慢于市场预期。", summary: "美国市场会给成长溢价，但不会一直容忍利润率拖后腿。", substitute: "等利润率确认后再提高仓位。" },
    { id: "jp-value-trap", market: "jp", name: "价值陷阱", level: "高", signal: "低估值长期存在，但治理和资本效率始终没有改善。", summary: "日股里最危险的是把长期便宜当成马上重估。", substitute: "回到回购、ROE 改善已经落地的公司。" },
    { id: "jp-weak-shareholder-return", market: "jp", name: "股东回报空转", level: "中", signal: "口头承诺回购分红，但实际执行节奏弱于预期。", summary: "治理改善只要少一步落实，估值修复就会慢很多。", substitute: "优先看已经执行回购和派息提升的样本。" },
    { id: "jp-export-fx-reversal", market: "jp", name: "汇率顺风反转", level: "中", signal: "盈利改善更多依赖汇率，而非产品或订单本身。", summary: "一旦汇率风向变掉，股价弹性就会被快速回吐。", substitute: "看靠资本效率或回购改善驱动的公司。" },
    { id: "jp-capex-burden", market: "jp", name: "资本开支负担", level: "中", signal: "业绩上修成立，但现金流被高资本开支锁住。", summary: "日股里不只是利润重要，现金释放节奏同样决定重估速度。", substitute: "优先看资本开支高峰已过的公司。" },
    { id: "jp-thin-liquidity", market: "jp", name: "小票流动性不足", level: "高", signal: "估值很低，但成交和持仓结构不支持机构参与。", summary: "流动性不足会让看起来很便宜的股票变成难参与的陷阱。", substitute: "选择中大盘且治理改善明确的标的。" },
    { id: "hk-liquidity-discount", market: "hk", name: "流动性折价", level: "高", signal: "基本面并不差，但资金承接不足导致折价长期存在。", summary: "港股很多好公司输在流动性，不是输在逻辑。", substitute: "优先看南向资金偏好更强的核心资产。" },
    { id: "hk-policy-beta-only", market: "hk", name: "只剩政策 Beta", level: "中", signal: "上涨更多靠政策预期，经营兑现跟不上。", summary: "政策利好可以点火，但不能独自支撑估值修复。", substitute: "配合盈利修复和资金流入一起看。" },
    { id: "hk-dividend-fragile", market: "hk", name: "高股息脆弱", level: "中", signal: "账面股息率很高，但分红来源和现金覆盖不足。", summary: "收益率高不等于可持续，港股尤其要看现金分红质量。", substitute: "切回现金流覆盖更强的高股息资产。" },
    { id: "hk-property-chain-shadow", market: "hk", name: "地产链阴影", level: "高", signal: "资产质量表面稳定，但地产链拖累仍未出清。", summary: "港股资产端风险一旦暴露，估值修复会被迫中断。", substitute: "优先看地产敞口更低的防守资产。" },
    { id: "hk-story-before-profit", market: "hk", name: "故事先于盈利", level: "高", signal: "平台故事足够大，但利润和现金流兑现仍然很远。", summary: "在港股环境里，故事能抬估值，但很难长期托住估值。", substitute: "等待利润率和经营现金流先出现改善。" }
  ];

  const stockSeeds = [
    {
      id: "cn-galaxy-energy",
      symbol: "688712",
      name: "星河储能",
      market: "cn",
      industry: "电力设备",
      price: "38.20",
      marketCap: "328 亿",
      liquidity: "高",
      strategyId: "cn-domestic-substitution",
      primarySceneId: "cn-crowded-theme",
      riskLevel: "中",
      detail: {
        conclusion: { state: "关注", risk: "中", cycle: "6-12 个月", summary: "订单修复与国产替代验证同时出现，适合分段跟踪而不是情绪化追高。" },
        thesis: ["储能订单连续两个季度抬升，景气信号比板块热度更扎实。", "核心部件国产替代比例提升，毛利率改善开始具备延续性。", "海外客户量产节点更清楚，第二增长曲线不再只是口头叙事。"],
        avoid: { sceneIds: ["cn-crowded-theme", "cn-balance-sheet-stress"], tags: ["情绪末端", "扩产压力"], reason: "如果板块进入情绪加速而公司同步加杠杆扩产，买点会从成长验证转成题材接力。" },
        metrics: [metric("订单能见度", "8 个月", "高于行业均值"), metric("国产替代率", "67%", "核心驱动指标"), metric("经营现金流", "连续转正", "验证质量"), metric("风险分", "58/100", "需防拥挤交易")],
        alternatives: [alternative("cn-river-grid", "若想降低波动，可切换到现金流更稳的红利方向。")]
      }
    },
    {
      id: "cn-river-grid",
      symbol: "600816",
      name: "江河电网",
      market: "cn",
      industry: "公用事业",
      price: "15.60",
      marketCap: "614 亿",
      liquidity: "高",
      strategyId: "cn-high-dividend",
      primarySceneId: "cn-major-selloff",
      riskLevel: "低",
      detail: {
        conclusion: { state: "关注", risk: "低", cycle: "中长期", summary: "现金流与分红都具备确定性，更适合作为防守型主线而不是博弈弹性。" },
        thesis: ["电网投资节奏稳定，收入质量高于大多数高弹性赛道。", "自由现金流连续为正，股息覆盖和资本开支都处在舒适区。", "在题材退潮阶段，它能承担组合的低波动底仓角色。"],
        avoid: { sceneIds: ["cn-major-selloff"], tags: ["防守底仓", "回撤缓冲"], reason: "如果市场重新进入高 Beta 追涨期，它的相对收益会被短期压制，但这并不改变它作为稳定器的价值。" },
        metrics: [metric("股息率", "5.4%", "分红有覆盖"), metric("自由现金流", "稳步改善", "低波动来源"), metric("资本开支", "可控", "没有激进扩产"), metric("风险分", "32/100", "偏低")],
        alternatives: [alternative("cn-galaxy-energy", "若想提升弹性，可以回到景气验证更强的储能方向。")]
      }
    },
    {
      id: "cn-orbit-medtech",
      symbol: "301188",
      name: "轨道医械",
      market: "cn",
      industry: "医疗器械",
      price: "29.40",
      marketCap: "142 亿",
      liquidity: "中",
      strategyId: "cn-policy-repair",
      primarySceneId: "cn-fad-story",
      riskLevel: "高",
      detail: {
        conclusion: { state: "回避", risk: "高", cycle: "等待验证", summary: "修复故事很完整，但订单与产品验证跟不上，是典型的叙事先行样本。" },
        thesis: ["政策支持给了想象空间，但真实订单释放斜率仍然偏慢。", "新品进院节奏不够连续，商业化验证还没有足够证据。", "估值先走，兑现后走，会把投资从判断变成押故事。"],
        avoid: { sceneIds: ["cn-fad-story", "cn-fake-turnaround"], tags: ["伪创新", "估值先行"], reason: "如果只看政策标题而不看订单兑现，很容易把一次反弹误判成持续重估。" },
        metrics: [metric("新品进院", "偏慢", "兑现不足"), metric("收入增速", "低于预期", "不支撑高估值"), metric("经营现金流", "仍承压", "商业化不足"), metric("风险分", "86/100", "高风险")],
        alternatives: [alternative("cn-galaxy-energy", "如果想保留成长属性，优先切到验证更充分的制造升级方向。")]
      }
    },
    {
      id: "cn-sea-auto",
      symbol: "603982",
      name: "海岳汽配",
      market: "cn",
      industry: "汽车零部件",
      price: "24.80",
      marketCap: "186 亿",
      liquidity: "高",
      strategyId: "cn-export-upgrade",
      primarySceneId: "cn-balance-sheet-stress",
      riskLevel: "中",
      detail: {
        conclusion: { state: "关注", risk: "中", cycle: "2-4 个季度", summary: "出海订单和产品升级同时验证，属于赔率和质量比较均衡的中国制造样本。" },
        thesis: ["海外订单连续增长，客户结构不再依赖单一车厂。", "高附加值产品占比提升，毛利率改善比单纯销量增长更重要。", "估值仍停留在零部件平均区间，修复空间来自结构升级。"],
        avoid: { sceneIds: ["cn-balance-sheet-stress", "cn-major-selloff"], tags: ["扩产节奏", "出口验证"], reason: "如果扩产太快而海外需求验证没有继续跟上，资产负债表会先反映压力。" },
        metrics: [metric("海外订单", "+18%", "验证核心逻辑"), metric("高附加值占比", "42%", "产品升级"), metric("净现金", "保持充裕", "可承接扩产"), metric("风险分", "47/100", "中等偏稳")],
        alternatives: [alternative("cn-river-grid", "若想把波动再压低，可以切回更防守的红利公用事业。")]
      }
    },
    {
      id: "cn-morning-chips",
      symbol: "688128",
      name: "晨光芯材",
      market: "cn",
      industry: "半导体材料",
      price: "51.30",
      marketCap: "208 亿",
      liquidity: "中高",
      strategyId: "cn-domestic-substitution",
      primarySceneId: "cn-low-float",
      riskLevel: "中",
      detail: {
        conclusion: { state: "观察", risk: "中", cycle: "1-2 个财报季", summary: "技术替代逻辑存在，但当前更适合盯验证节点，而不是把它当成无风险成长股。" },
        thesis: ["国产客户验证在推进，但放量节奏仍然偏慢。", "高端材料良率改善是核心变量，不是单看主题情绪。", "股价对好消息反应很快，对坏消息容错率却很低。"],
        avoid: { sceneIds: ["cn-low-float", "cn-crowded-theme"], tags: ["小票波动", "高位换手"], reason: "当流动性不够厚的时候，任何验证推迟都会被放大成趋势破坏。" },
        metrics: [metric("良率水平", "93%", "仍需爬坡"), metric("客户验证", "持续推进", "尚未全面放量"), metric("资本开支率", "31%", "短期拖累现金流"), metric("风险分", "61/100", "波动偏高")],
        alternatives: [alternative("cn-sea-auto", "若偏好成长但想降低波动，可以切换到订单验证更直观的出海制造。")]
      }
    },
    {
      id: "cn-bridge-port",
      symbol: "601928",
      name: "桥港航运",
      market: "cn",
      industry: "港口物流",
      price: "12.10",
      marketCap: "276 亿",
      liquidity: "中高",
      strategyId: "cn-high-dividend",
      primarySceneId: "cn-balance-sheet-stress",
      riskLevel: "中",
      detail: {
        conclusion: { state: "观察", risk: "中", cycle: "中期", summary: "资产质量和分红都还不错，但债务和资本开支节奏决定它只能先观察、不能无脑高配。" },
        thesis: ["港口吞吐量稳步回升，现金流基础比多数顺周期资产更稳。", "分红政策具备吸引力，是组合里可选的收益来源。", "估值不贵，但债务与资本开支需要持续跟踪。"],
        avoid: { sceneIds: ["cn-balance-sheet-stress", "cn-fake-turnaround"], tags: ["债务观察", "修复斜率"], reason: "一旦资本开支先上去而景气恢复慢于预期，红利逻辑会被资产负债表压力削弱。" },
        metrics: [metric("港口吞吐量", "+6%", "基本面回暖"), metric("分红支付率", "63%", "具备吸引力"), metric("净负债率", "54%", "需持续盯防"), metric("风险分", "49/100", "中性")],
        alternatives: [alternative("cn-river-grid", "若想要更纯粹的防守红利，可切回现金流更扎实的电网方向。")]
      }
    },
    {
      id: "us-cascade-pay",
      symbol: "CPAY",
      name: "Cascade Pay",
      market: "us",
      industry: "Fintech",
      price: "126.50",
      marketCap: "412 亿美元",
      liquidity: "高",
      strategyId: "us-free-cashflow",
      primarySceneId: "us-regulatory-hangover",
      riskLevel: "低",
      detail: {
        conclusion: { state: "关注", risk: "低", cycle: "中长期", summary: "现金流和回购共同支撑估值，是美国市场里少数兼具成长和防守的样本。" },
        thesis: ["支付商户扩张继续推进，但费用率下降让现金流质量更亮眼。", "回购计划执行稳定，资本回收直接提升估值安全垫。", "监管压力还在，但已经从核心风险降为估值折价项。"],
        avoid: { sceneIds: ["us-regulatory-hangover"], tags: ["监管余波", "现金流为王"], reason: "如果监管窗口再度拉长，估值提升会变慢，但并不改变它作为高质量现金流资产的逻辑。" },
        metrics: [metric("自由现金流率", "24%", "核心亮点"), metric("净留存", "118%", "增长质量"), metric("回购进度", "超计划", "股东回报"), metric("风险分", "28/100", "偏低")],
        alternatives: [alternative("us-atlas-medical", "若想要更低拥挤度的低估值样本，可切向医疗设备价值修复。")]
      }
    },
    {
      id: "us-helix-robotics",
      symbol: "HLRX",
      name: "Helix Robotics",
      market: "us",
      industry: "Industrial AI",
      price: "84.70",
      marketCap: "258 亿美元",
      liquidity: "高",
      strategyId: "us-trend-following",
      primarySceneId: "us-ai-crowding",
      riskLevel: "中",
      detail: {
        conclusion: { state: "观察", risk: "中", cycle: "1-2 个财报季", summary: "趋势依旧强，但当前位置更适合带着纪律观察，而不是把它当成无风险成长资产。" },
        thesis: ["工业客户自动化订单延续增长，产业趋势仍在强化。", "软件订阅收入占比提升，利润率改善开始兑现。", "最大问题不是公司本身，而是拥挤交易已经抬高了犯错成本。"],
        avoid: { sceneIds: ["us-ai-crowding", "us-unproven-margin"], tags: ["拥挤交易", "利润率验证"], reason: "如果后续财报只兑现收入不兑现利润率，趋势溢价会明显收缩。" },
        metrics: [metric("新增订单", "+22%", "趋势基础"), metric("软件收入占比", "31%", "提高估值质量"), metric("营业利润率", "仍在爬坡", "需要继续验证"), metric("风险分", "56/100", "中风险")],
        alternatives: [alternative("us-cascade-pay", "若更偏确定性，可以切回现金流更强、拥挤度更低的金融科技。")]
      }
    },
    {
      id: "us-pioneer-cloud",
      symbol: "PNCL",
      name: "Pioneer Cloud",
      market: "us",
      industry: "SaaS",
      price: "61.30",
      marketCap: "196 亿美元",
      liquidity: "高",
      strategyId: "us-growth-confirmation",
      primarySceneId: "us-guidance-cut",
      riskLevel: "高",
      detail: {
        conclusion: { state: "回避", risk: "高", cycle: "等待下修落地", summary: "高估值与指引转弱同时出现，不需要急着在最难的时点抄底。" },
        thesis: ["客户扩张放缓，但市场仍按高成长逻辑定价。", "费用率下不来，现金流和利润率都支撑不了当前溢价。", "管理层口径偏保守，财报前后的风险收益比不划算。"],
        avoid: { sceneIds: ["us-guidance-cut", "us-cash-burn"], tags: ["高估值", "现金流失速"], reason: "财报前后可能同时遭遇指引和估值双杀，是典型先回避、后观察的样本。" },
        metrics: [metric("收入增速", "放缓", "不支持高估值"), metric("自由现金流", "转弱", "核心风险"), metric("估值区间", "高于历史中枢", "保护垫不足"), metric("风险分", "88/100", "高风险")],
        alternatives: [alternative("us-cascade-pay", "若仍想留在美国成长资产，可先切到自由现金流更强的方向。")]
      }
    },
    {
      id: "us-atlas-medical",
      symbol: "ATMD",
      name: "Atlas Medical",
      market: "us",
      industry: "Medical Devices",
      price: "93.40",
      marketCap: "148 亿美元",
      liquidity: "中高",
      strategyId: "us-value-rebound",
      primarySceneId: "us-regulatory-hangover",
      riskLevel: "低",
      detail: {
        conclusion: { state: "关注", risk: "低", cycle: "2-4 个财报季", summary: "低估值、稳定现金流与库存改善同时出现，是美国市场里更舒服的价值修复样本。" },
        thesis: ["去库存接近尾声，利润率恢复空间比市场预期更清楚。", "医院设备更新周期重新启动，需求质量比消费 SaaS 更可见。", "监管不确定性仍在，但已经主要体现在估值折价，而不是业务破坏。"],
        avoid: { sceneIds: ["us-regulatory-hangover"], tags: ["监管折价", "价值修复"], reason: "如果政策审批节奏重新变慢，修复周期会被拉长，但不改其中长期赔率。" },
        metrics: [metric("库存周转", "改善中", "修复触发器"), metric("自由现金流", "连续回升", "安全垫"), metric("毛利率", "重新扩张", "质量验证"), metric("风险分", "34/100", "偏低")],
        alternatives: [alternative("us-summit-energy", "若想保留价值修复逻辑但提高股东回报属性，可切向能源服务。")]
      }
    },
    {
      id: "us-nova-retail",
      symbol: "NVAR",
      name: "Nova Retail",
      market: "us",
      industry: "Consumer Internet",
      price: "44.20",
      marketCap: "86 亿美元",
      liquidity: "中高",
      strategyId: "us-growth-confirmation",
      primarySceneId: "us-cash-burn",
      riskLevel: "中",
      detail: {
        conclusion: { state: "观察", risk: "中", cycle: "1-2 个财报季", summary: "增长仍在，但现金流质量和营销效率让它更适合观察，而不是当成确定性成长。" },
        thesis: ["活跃用户恢复不错，但营销投放依赖仍然偏高。", "平台效率改善开始出现迹象，可惜还没有形成稳定现金流。", "估值比高成长软件低，但市场仍会按现金流纪律来要求它。"],
        avoid: { sceneIds: ["us-cash-burn", "us-guidance-cut"], tags: ["营销依赖", "现金流观察"], reason: "只要现金流迟迟不转正，任何增长故事都很难真正进入主升段。" },
        metrics: [metric("活跃用户", "+11%", "需求仍在"), metric("营销效率", "改善中", "尚未定型"), metric("自由现金流", "接近盈亏平衡", "关键节点"), metric("风险分", "59/100", "中风险")],
        alternatives: [alternative("us-atlas-medical", "若想要更稳的赔率，可切向低拥挤、现金流更扎实的医疗设备。")]
      }
    },
    {
      id: "us-summit-energy",
      symbol: "SMET",
      name: "Summit Energy",
      market: "us",
      industry: "Energy Services",
      price: "58.80",
      marketCap: "172 亿美元",
      liquidity: "高",
      strategyId: "us-value-rebound",
      primarySceneId: "us-unproven-margin",
      riskLevel: "低",
      detail: {
        conclusion: { state: "关注", risk: "低", cycle: "中期", summary: "估值仍处在历史低位附近，但现金回收、资本纪律和股东回报已经开始改善。" },
        thesis: ["油服设备订单回暖，但资本开支纪律比上一轮更健康。", "回购和分红一起抬升，给估值提供了向下保护。", "利润率修复还在路上，但市场已经不再要求它像成长股一样定价。"],
        avoid: { sceneIds: ["us-unproven-margin"], tags: ["利润率验证", "价值修复"], reason: "如果毛利率修复慢于预期，价值修复的节奏也会被压慢，仓位不宜过激。" },
        metrics: [metric("回购收益率", "4.1%", "股东回报"), metric("自由现金流", "明显改善", "估值基础"), metric("订单储备", "持续上行", "支撑修复"), metric("风险分", "36/100", "偏低")],
        alternatives: [alternative("us-cascade-pay", "若想把现金流确定性再抬高，可切到回购更稳定的金融科技。")]
      }
    }
    ,
    {
      id: "jp-sakura-machinery",
      symbol: "6324",
      name: "樱桥机械",
      market: "jp",
      industry: "工业设备",
      price: "JPY 2,480",
      marketCap: "5,260 亿日元",
      liquidity: "中高",
      strategyId: "jp-buyback-rotation",
      primarySceneId: "jp-weak-shareholder-return",
      riskLevel: "低",
      detail: {
        conclusion: { state: "关注", risk: "低", cycle: "中期", summary: "回购与资本效率改善同时发生，是标准的日股治理改善样本。" },
        thesis: ["回购方案明确且执行节奏稳定，不只是口头表态。", "资产负债表健康，资本效率改善路径清楚。", "海外订单稳定，利润率改善不只依赖汇率。"],
        avoid: { sceneIds: ["jp-weak-shareholder-return"], tags: ["回购兑现", "治理改善"], reason: "若回购执行弱于承诺，估值提升逻辑会明显减弱。" },
        metrics: [metric("回购比例", "3.2%", "治理改善"), metric("ROE 目标", "9%", "修复路径明确"), metric("净现金", "充裕", "支撑股东回报"), metric("风险分", "30/100", "偏低")],
        alternatives: [alternative("jp-koyo-banks", "若更偏高股息和低波动，可以切向同样受益治理改善的金控方向。")]
      }
    },
    {
      id: "jp-mirai-rail",
      symbol: "9048",
      name: "未来轨交",
      market: "jp",
      industry: "交通运输",
      price: "JPY 3,120",
      marketCap: "3,980 亿日元",
      liquidity: "中",
      strategyId: "jp-earnings-upgrade",
      primarySceneId: "jp-capex-burden",
      riskLevel: "中",
      detail: {
        conclusion: { state: "观察", risk: "中", cycle: "2-3 个财报季", summary: "业绩上修正在发生，但资本开支压力要求我们对节奏保持克制。" },
        thesis: ["客流与票价恢复让收入改善具备确定性。", "运营效率抬升带来利润率改善，但自由现金流释放慢于利润表。", "如果 capex 高位持续，日股投资者不会很快给它更高估值。"],
        avoid: { sceneIds: ["jp-capex-burden"], tags: ["高资本开支", "现金释放慢"], reason: "在日股里，利润上修不足以单独支撑重估，还要看现金流何时真正释放。" },
        metrics: [metric("客流修复", "+9%", "收入改善"), metric("营业利润率", "继续上修", "业绩兑现"), metric("资本开支", "高位", "拖慢现金回收"), metric("风险分", "52/100", "中风险")],
        alternatives: [alternative("jp-sakura-machinery", "若更看重治理改善和股东回报确定性，可切回回购主线。")]
      }
    },
    {
      id: "jp-hinode-logistics",
      symbol: "9173",
      name: "日出物流",
      market: "jp",
      industry: "物流",
      price: "JPY 1,180",
      marketCap: "680 亿日元",
      liquidity: "低",
      strategyId: "jp-low-pbr-reform",
      primarySceneId: "jp-thin-liquidity",
      riskLevel: "高",
      detail: {
        conclusion: { state: "回避", risk: "高", cycle: "等待流动性改善", summary: "低估值和小票流动性问题叠加，是典型看起来便宜、实际难参与的日股样本。" },
        thesis: ["账面估值足够低，但治理改善几乎没有实质动作。", "交易量太薄，任何基本面变化都会被流动性放大。", "如果把长期低估误判成即将重估，很容易掉进价值陷阱。"],
        avoid: { sceneIds: ["jp-thin-liquidity", "jp-value-trap"], tags: ["小票流动性", "价值陷阱"], reason: "便宜并不自动等于值得买，尤其当流动性和治理都没有改善时。" },
        metrics: [metric("PBR", "0.58x", "看似便宜"), metric("日均成交", "偏低", "机构难参与"), metric("回购动作", "暂无", "治理不足"), metric("风险分", "84/100", "高风险")],
        alternatives: [alternative("jp-koyo-banks", "如果仍想布局日股低估值修复，可换到流动性和股东回报更好的金控样本。")]
      }
    },
    {
      id: "jp-koyo-banks",
      symbol: "8368",
      name: "光洋金控",
      market: "jp",
      industry: "金融",
      price: "JPY 1,540",
      marketCap: "4,120 亿日元",
      liquidity: "中高",
      strategyId: "jp-high-dividend",
      primarySceneId: "jp-weak-shareholder-return",
      riskLevel: "低",
      detail: {
        conclusion: { state: "关注", risk: "低", cycle: "中长期", summary: "高股息与资本优化同步推进，是日股里更适合稳态持有的防守型样本。" },
        thesis: ["派息和回购开始同步推进，股东回报不再停留在口头层面。", "资本充足率健康，给持续分红提供了现实支撑。", "低估值本身不是亮点，亮点是资本配置真的在变好。"],
        avoid: { sceneIds: ["jp-weak-shareholder-return"], tags: ["分红兑现", "治理观察"], reason: "如果后续股东回报动作放缓，低估值就会重新变回普通的便宜。" },
        metrics: [metric("股息率", "4.8%", "具备吸引力"), metric("回购授权", "已启动", "治理改善"), metric("资本充足率", "稳健", "支撑防守属性"), metric("风险分", "29/100", "偏低")],
        alternatives: [alternative("jp-sakura-machinery", "若想要更强的制造业治理改善弹性，可以切回回购驱动的工业样本。")]
      }
    },
    {
      id: "jp-aoi-electronics",
      symbol: "6842",
      name: "葵电子",
      market: "jp",
      industry: "自动化设备",
      price: "JPY 4,360",
      marketCap: "2,860 亿日元",
      liquidity: "中",
      strategyId: "jp-earnings-upgrade",
      primarySceneId: "jp-export-fx-reversal",
      riskLevel: "中",
      detail: {
        conclusion: { state: "观察", risk: "中", cycle: "1-2 个财报季", summary: "订单和利润率改善在发生，但汇率和出口节奏仍会决定它是不是值得更大仓位。" },
        thesis: ["自动化订单稳定改善，基本面拐点具备雏形。", "利润率弹性一部分来自产品升级，一部分来自汇率顺风。", "更适合当业绩观察样本，而不是提前给太多重估预期。"],
        avoid: { sceneIds: ["jp-export-fx-reversal", "jp-capex-burden"], tags: ["汇率依赖", "观察优先"], reason: "如果盈利改善更多来自汇率而不是经营，股价对环境变化会非常敏感。" },
        metrics: [metric("自动化订单", "+14%", "基本面改善"), metric("营业利润率", "边际改善", "仍需验证"), metric("外销占比", "较高", "汇率敏感"), metric("风险分", "55/100", "中风险")],
        alternatives: [alternative("jp-mirai-rail", "若想继续看业绩上修，但希望需求更稳定，可切向交通运输恢复样本。")]
      }
    },
    {
      id: "jp-tsubasa-food",
      symbol: "2877",
      name: "翼食品",
      market: "jp",
      industry: "日常消费",
      price: "JPY 2,050",
      marketCap: "1,920 亿日元",
      liquidity: "中",
      strategyId: "jp-high-dividend",
      primarySceneId: "jp-value-trap",
      riskLevel: "中",
      detail: {
        conclusion: { state: "观察", risk: "中", cycle: "中长期", summary: "防守属性不错，但估值修复空间要依赖经营提效，而不只是高股息。" },
        thesis: ["消费需求稳定，分红政策具备连续性。", "经营效率改善有空间，但尚未完全体现到利润率。", "更适合拿来做防守观察，而不是期待短期大幅重估。"],
        avoid: { sceneIds: ["jp-value-trap"], tags: ["高股息不等于高成长", "效率观察"], reason: "如果经营效率长期没有改善，高股息也只会让它停留在低估值区间。" },
        metrics: [metric("股息率", "3.9%", "稳定"), metric("门店效率", "改善中", "仍需兑现"), metric("ROE", "温和回升", "修复较慢"), metric("风险分", "43/100", "中性")],
        alternatives: [alternative("jp-koyo-banks", "若更重视股东回报的确定性，可切向回购和分红同时改善的金融方向。")]
      }
    },
    {
      id: "hk-pearl-infra",
      symbol: "1108",
      name: "珠港基建",
      market: "hk",
      industry: "基建运营",
      price: "HKD 9.80",
      marketCap: "584 亿港元",
      liquidity: "中高",
      strategyId: "hk-high-dividend",
      primarySceneId: "hk-dividend-fragile",
      riskLevel: "低",
      detail: {
        conclusion: { state: "关注", risk: "低", cycle: "中长期", summary: "现金流支持分红，资产质量稳定，是港股防守仓位的优先候选。" },
        thesis: ["运营现金流稳定，分红来源足够扎实。", "南向资金对高股息基建资产的偏好仍在恢复。", "估值不拥挤，适合承担港股组合里的稳定器角色。"],
        avoid: { sceneIds: ["hk-dividend-fragile"], tags: ["高股息质量", "防守底仓"], reason: "一旦分红覆盖下降，高股息就会从优点变成风险点，因此必须持续看现金覆盖。" },
        metrics: [metric("股息率", "6.2%", "现金流覆盖"), metric("经营现金流", "稳定", "防守基础"), metric("南向持股", "回升", "资金偏好改善"), metric("风险分", "31/100", "偏低")],
        alternatives: [alternative("hk-harbor-finance", "若想保留港股防守风格但增加估值修复弹性，可切向金融股。")]
      }
    },
    {
      id: "hk-victory-consumer",
      symbol: "3312",
      name: "胜景消费",
      market: "hk",
      industry: "可选消费",
      price: "HKD 28.60",
      marketCap: "242 亿港元",
      liquidity: "中高",
      strategyId: "hk-southbound-core",
      primarySceneId: "hk-policy-beta-only",
      riskLevel: "中",
      detail: {
        conclusion: { state: "观察", risk: "中", cycle: "1-2 个季度", summary: "南向偏好和消费修复逻辑都在，但盈利兑现节奏仍需要继续确认。" },
        thesis: ["南向资金偏好回暖，对核心消费形成估值支撑。", "同店和毛利率都在恢复，但还没有强到足以无视波动。", "更像是赔率开始变好，而不是已经进入无脑买区间。"],
        avoid: { sceneIds: ["hk-policy-beta-only", "hk-liquidity-discount"], tags: ["政策 Beta", "流动性观察"], reason: "如果上涨只剩政策预期而经营数据没有继续跟上，港股里的容错率会很快下降。" },
        metrics: [metric("同店增长", "改善中", "需求回暖"), metric("南向净买入", "连续回升", "资金支撑"), metric("库存水平", "正常化", "压力缓解"), metric("风险分", "54/100", "中风险")],
        alternatives: [alternative("hk-pearl-infra", "若更看重防守和现金流，可回到更稳的高股息基建资产。")]
      }
    },
    {
      id: "hk-orion-health",
      symbol: "9926",
      name: "远望健康",
      market: "hk",
      industry: "平台医疗",
      price: "HKD 16.40",
      marketCap: "136 亿港元",
      liquidity: "中",
      strategyId: "hk-platform-turnaround",
      primarySceneId: "hk-story-before-profit",
      riskLevel: "高",
      detail: {
        conclusion: { state: "回避", risk: "高", cycle: "等待盈利验证", summary: "故事空间很大，但盈利兑现没有按预期到来，是典型先看不买的港股平台样本。" },
        thesis: ["用户侧叙事仍然动听，但商业化节奏不够快。", "平台转型需要时间，而港股通常不会长期为远端故事买单。", "价格看起来便宜，不代表风险回报已经划算。"],
        avoid: { sceneIds: ["hk-story-before-profit", "hk-liquidity-discount"], tags: ["平台故事", "盈利太远"], reason: "在港股里，盈利和现金流如果看不到拐点，再大的故事也很难撑住估值。" },
        metrics: [metric("经营亏损", "仍在收窄", "尚未转正"), metric("现金消耗", "偏高", "主要风险"), metric("月活增长", "仍在", "不能替代盈利"), metric("风险分", "87/100", "高风险")],
        alternatives: [alternative("hk-harbor-finance", "若想留在港股但降低风险，可切向低估值、股东回报更明确的金融资产。")]
      }
    },
    {
      id: "hk-harbor-finance",
      symbol: "2388",
      name: "港湾金控",
      market: "hk",
      industry: "金融",
      price: "HKD 14.20",
      marketCap: "408 亿港元",
      liquidity: "高",
      strategyId: "hk-valuation-recovery",
      primarySceneId: "hk-liquidity-discount",
      riskLevel: "低",
      detail: {
        conclusion: { state: "关注", risk: "低", cycle: "中长期", summary: "低估值、股东回报和资金回流三件事开始同时成立，是港股里更舒服的修复样本。" },
        thesis: ["估值长期折价的核心原因是流动性，而不是资产质量恶化。", "股息和回购一起提供保护垫，修复节奏比纯故事股更可控。", "南向增持改善后，金融龙头更容易走出折价收敛。"],
        avoid: { sceneIds: ["hk-liquidity-discount"], tags: ["流动性折价", "估值修复"], reason: "若市场资金重新转弱，折价会被重新放大，因此仍需盯住南向资金与成交结构。" },
        metrics: [metric("PB", "0.78x", "仍处折价"), metric("股息率", "5.7%", "保护垫"), metric("南向持股", "上行", "修复催化"), metric("风险分", "33/100", "偏低")],
        alternatives: [alternative("hk-pearl-infra", "若更重视纯防守属性，可回到现金流覆盖更强的基建高股息。")]
      }
    },
    {
      id: "hk-lotus-tech",
      symbol: "1788",
      name: "莲科网络",
      market: "hk",
      industry: "互联网服务",
      price: "HKD 7.90",
      marketCap: "96 亿港元",
      liquidity: "中",
      strategyId: "hk-platform-turnaround",
      primarySceneId: "hk-story-before-profit",
      riskLevel: "中",
      detail: {
        conclusion: { state: "观察", risk: "中", cycle: "等待利润率改善", summary: "平台修复故事开始变得可讲，但盈利拐点还不足以支撑持续追价。" },
        thesis: ["成本优化推动亏损收窄，平台效率开始改善。", "用户和商家活跃度恢复，但经营现金流尚未稳定。", "如果港股风险偏好下降，它会比核心资产更先受压。"],
        avoid: { sceneIds: ["hk-story-before-profit", "hk-policy-beta-only"], tags: ["盈利尚早", "Beta 交易"], reason: "只要盈利和现金流还没真正拐头，任何政策情绪催化都只适合看、不适合追。" },
        metrics: [metric("经营亏损", "持续收窄", "有改善"), metric("平台活跃度", "回升", "故事仍在"), metric("经营现金流", "未稳定转正", "核心短板"), metric("风险分", "67/100", "偏高")],
        alternatives: [alternative("hk-victory-consumer", "若想保留修复弹性但降低远端风险，可切向消费龙头修复。")]
      }
    },
    {
      id: "hk-bauhinia-utilities",
      symbol: "0836",
      name: "紫荆公用",
      market: "hk",
      industry: "公用事业",
      price: "HKD 5.60",
      marketCap: "316 亿港元",
      liquidity: "中高",
      strategyId: "hk-high-dividend",
      primarySceneId: "hk-dividend-fragile",
      riskLevel: "低",
      detail: {
        conclusion: { state: "关注", risk: "低", cycle: "中长期", summary: "现金流和分红覆盖都更清楚，是港股里更适合慢慢拿的防守型样本。" },
        thesis: ["公用事业现金流稳，给高股息提供了真实来源。", "估值仍然折价，但风险主要在流动性而不是资产质量。", "在港股里，这类公司更适合作为回撤缓冲和收益率底仓。"],
        avoid: { sceneIds: ["hk-dividend-fragile"], tags: ["收益率陷阱排除", "稳态持有"], reason: "高股息最怕现金覆盖变差，因此必须持续确认资本开支和派息来源。" },
        metrics: [metric("经营现金流", "稳定", "分红基础"), metric("股息率", "5.9%", "具吸引力"), metric("资本开支", "可控", "覆盖压力小"), metric("风险分", "30/100", "偏低")],
        alternatives: [alternative("hk-pearl-infra", "若想在防守里加一点资金修复弹性，可切向基建高股息方向。")]
      }
    }
  ];

  data.stockSummaries = stockSeeds.map((item) => ({
    id: item.id,
    symbol: item.symbol,
    name: item.name,
    market: item.market,
    industry: item.industry,
    price: item.price,
    marketCap: item.marketCap,
    liquidity: item.liquidity,
    strategyId: item.strategyId,
    primarySceneId: item.primarySceneId,
    riskLevel: item.riskLevel
  }));

  const summaryById = Object.fromEntries(data.stockSummaries.map((item) => [item.id, item]));

  data.stockDetails = Object.fromEntries(
    stockSeeds.map((item) => {
      const market = data.markets[item.market];
      return [
        item.id,
        {
          conclusion: item.detail.conclusion,
          thesis: item.detail.thesis,
          avoid: item.detail.avoid,
          metrics: item.detail.metrics,
          related: {
            rankings: [
              rankingLink(`${market.name}机会榜`, item.market, "opportunity"),
              rankingLink(`${market.name}不能买榜`, item.market, "avoid", { scene: item.detail.avoid.sceneIds[0] })
            ],
            alternatives: item.detail.alternatives.map((entry) => ({
              label: summaryById[entry.stockId].name,
              url: stockUrl(entry.stockId),
              reason: entry.reason
            }))
          }
        }
      ];
    })
  );

  data.rankingMeta = {
    opportunity: {
      id: "opportunity",
      title: "今日机会榜",
      subtitle: "把市场逻辑、当前催化和风险约束放在同一张表里。",
      intro: "优先展示逻辑清晰、催化明确、同时能解释风险的标的。",
      tone: "opportunity"
    },
    avoid: {
      id: "avoid",
      title: "今日不能买榜",
      subtitle: "高风险、便宜陷阱、情绪末端和低流动性集中展示。",
      intro: "先把不该碰的坑讲清楚，再谈什么时候回来看。",
      tone: "risk"
    }
  };

  const rankingItems = [];

  function addRanking(id, type, stockId, sceneId, score, reason, comment) {
    const summary = summaryById[stockId];
    rankingItems.push({
      id,
      type,
      stockId,
      market: summary.market,
      strategyId: summary.strategyId,
      riskLevel: summary.riskLevel,
      sceneId,
      score,
      reason,
      comment
    });
  }

  addRanking("op-01", "opportunity", "cn-galaxy-energy", "cn-crowded-theme", 88, "订单改善与国产替代率同步抬升，是中国市场里更偏基本面验证的成长样本。", "适合分段观察，不建议高潮位追价。");
  addRanking("op-02", "opportunity", "cn-river-grid", "cn-major-selloff", 82, "红利与电网投资主线叠加，能承担组合的低波动角色。", "更适合作为防守底仓。");
  addRanking("op-03", "opportunity", "cn-sea-auto", "cn-balance-sheet-stress", 79, "出海订单和产品升级一起出现，让制造升级逻辑更容易兑现。", "重点看扩产节奏和海外验证。");
  addRanking("av-01", "avoid", "cn-orbit-medtech", "cn-fad-story", 90, "故事热度明显高于订单与产品验证，是典型伪创新风险样本。", "先回避，等验证而不是等情绪。");
  addRanking("av-02", "avoid", "cn-morning-chips", "cn-low-float", 74, "技术路线没坏，但小票流动性和高位换手让买点过于考验节奏。", "不是方向错，而是位置太拥挤。");
  addRanking("av-03", "avoid", "cn-galaxy-energy", "cn-crowded-theme", 66, "即使是好公司，情绪末端也可能把交易从成长验证变成高位接力。", "看对方向，也要避开错误时点。");
  addRanking("op-04", "opportunity", "us-cascade-pay", "us-regulatory-hangover", 91, "现金流和回购一起改善，使它在美国市场里兼具成长和防守。", "适合中长期跟踪。");
  addRanking("op-05", "opportunity", "us-atlas-medical", "us-regulatory-hangover", 84, "去库存见底后，医疗设备龙头的价值修复赔率开始变得更清楚。", "低拥挤、低估值，是更舒服的美股样本。");
  addRanking("op-06", "opportunity", "us-summit-energy", "us-unproven-margin", 78, "能源服务的现金回收和股东回报一起改善，适合做价值修复观察。", "看利润率，也看资本纪律。");
  addRanking("av-04", "avoid", "us-pioneer-cloud", "us-guidance-cut", 93, "高估值叠加指引转弱，财报前后容易遭遇双杀。", "等下修完成再看也不迟。");
  addRanking("av-05", "avoid", "us-nova-retail", "us-cash-burn", 72, "增长仍在，但现金流没有跟上，市场不会长期为故事买单。", "先看现金流拐点，再谈仓位。");
  addRanking("av-06", "avoid", "us-helix-robotics", "us-ai-crowding", 70, "工业 AI 趋势很强，但拥挤交易本身已经成为主要风险。", "不是方向错，而是位置太晚。");
  addRanking("op-07", "opportunity", "jp-sakura-machinery", "jp-weak-shareholder-return", 86, "回购和资本效率改善都已落地，是日股治理改善的标准样本。", "适合作为日股核心持仓候选。");
  addRanking("op-08", "opportunity", "jp-koyo-banks", "jp-weak-shareholder-return", 83, "高股息和回购同时推进，让低估值修复更有抓手。", "适合稳态配置。");
  addRanking("op-09", "opportunity", "jp-mirai-rail", "jp-capex-burden", 74, "客流修复和利润率改善都在进行，但更适合带着现金流视角观察。", "上修成立，节奏仍要克制。");
  addRanking("av-07", "avoid", "jp-hinode-logistics", "jp-thin-liquidity", 85, "低估值没有治理改善配合，小票流动性又差，容易成为价值陷阱。", "日股里尤其要警惕看起来很便宜的小票。");
  addRanking("av-08", "avoid", "jp-aoi-electronics", "jp-export-fx-reversal", 69, "盈利改善里汇率成分偏高，基本面质量还不够让人完全放心。", "等经营改善更扎实再看。");
  addRanking("av-09", "avoid", "jp-mirai-rail", "jp-capex-burden", 65, "资本开支过高时，业绩上修也不足以支撑立刻重估。", "适合持续观察，不适合高确信度下注。");
  addRanking("op-10", "opportunity", "hk-pearl-infra", "hk-dividend-fragile", 84, "现金流支持分红，叠加南向偏好回升，是港股里更稳的底仓方向。", "偏防守，适合稳住波动。");
  addRanking("op-11", "opportunity", "hk-harbor-finance", "hk-liquidity-discount", 82, "低估值、股东回报和资金回流开始同向，是港股估值修复更顺的样本。", "看南向回流，也看资产质量。");
  addRanking("op-12", "opportunity", "hk-victory-consumer", "hk-policy-beta-only", 73, "资金偏好和消费修复都在，但需要继续验证盈利恢复斜率。", "更像观察名单，而非无脑买入名单。");
  addRanking("av-10", "avoid", "hk-orion-health", "hk-story-before-profit", 89, "平台故事很大，但盈利兑现时间仍远，港股环境下容错率很低。", "先看现金流拐点，再谈重估。");
  addRanking("av-11", "avoid", "hk-lotus-tech", "hk-story-before-profit", 71, "修复故事开始能讲，但盈利和现金流离真正安全区还远。", "情绪好时能涨，验证慢时也会跌得快。");
  addRanking("av-12", "avoid", "hk-victory-consumer", "hk-policy-beta-only", 66, "如果上涨只剩政策预期，胜率会明显下降。", "需要等经营数据继续跟上。");

  data.rankingItems = rankingItems;

  data.valuationFilterOptions = {
    band: [
      { value: "all", label: "全部估值带" },
      { value: "undervalued", label: "低估带" },
      { value: "fair-zone", label: "合理区" },
      { value: "quality-premium", label: "质量溢价区" }
    ],
    quality: [
      { value: "all", label: "全部质量" },
      { value: "q80", label: "质量 80+" },
      { value: "q70", label: "质量 70+" },
      { value: "q60", label: "质量 60+" }
    ],
    margin: [
      { value: "all", label: "全部边际" },
      { value: "m25", label: "边际 25%+" },
      { value: "m15", label: "边际 15%+" },
      { value: "m5", label: "边际 5%+" }
    ],
    size: [
      { value: "all", label: "全部市值段" },
      { value: "mega", label: "大市值核心" },
      { value: "mid-large", label: "中大市值" },
      { value: "mid", label: "中盘弹性" },
      { value: "niche", label: "小而专观察" }
    ]
  };

  data.valuationPresets = [
    { id: "undervalued", label: "合理低估", summary: "优先找低估值带里，已经能解释修复路径和安全边际的股票。", defaultFilters: { band: "undervalued", quality: "q70", margin: "m15", size: "all" }, sortKey: "margin" },
    { id: "cashflow", label: "现金流定价", summary: "优先看自由现金流、回购和资本纪律能否支撑当前价格。", defaultFilters: { band: "all", quality: "q80", margin: "m15", size: "all" }, sortKey: "quality" },
    { id: "dividend", label: "分红安全", summary: "优先筛掉收益率陷阱，只留下分红来源和资产质量都足够稳的样本。", defaultFilters: { band: "all", quality: "q70", margin: "m5", size: "all" }, sortKey: "quality" },
    { id: "trend-calm", label: "趋势不过热", summary: "不追最热，优先看拥挤度还可控、趋势与基本面同步的样本。", defaultFilters: { band: "all", quality: "q70", margin: "m15", size: "all" }, sortKey: "crowding" }
  ];

  const valuationItems = [];

  function addValuation(config) {
    valuationItems.push({
      id: config.id,
      market: summaryById[config.stockId].market,
      stockId: config.stockId,
      presetIds: config.presetIds,
      valuationBand: config.valuationBand,
      qualityGate: config.qualityValue >= 80 ? "q80" : config.qualityValue >= 70 ? "q70" : "q60",
      marginBucket: config.marginValue >= 25 ? "m25" : config.marginValue >= 15 ? "m15" : "m5",
      sizeBucket: config.sizeBucket,
      fairValueLow: config.fairValueLow,
      fairValueHigh: config.fairValueHigh,
      marginOfSafety: config.marginOfSafety,
      marginValue: config.marginValue,
      qualityScore: `${config.qualityValue}/100`,
      qualityValue: config.qualityValue,
      crowdingScore: config.crowdingScore,
      verdict: config.verdict,
      note: config.note
    });
  }

  addValuation({ id: "val-01", stockId: "cn-galaxy-energy", presetIds: ["cashflow", "trend-calm"], valuationBand: "fair-zone", sizeBucket: "mid", fairValueLow: "42.00", fairValueHigh: "47.00", marginOfSafety: "18%", marginValue: 18, qualityValue: 84, crowdingScore: 56, verdict: "合理可跟踪", note: "订单兑现先于估值扩张，适合顺着验证走。" });
  addValuation({ id: "val-02", stockId: "cn-river-grid", presetIds: ["undervalued", "cashflow", "dividend", "trend-calm"], valuationBand: "undervalued", sizeBucket: "mega", fairValueLow: "18.10", fairValueHigh: "19.60", marginOfSafety: "26%", marginValue: 26, qualityValue: 88, crowdingScore: 24, verdict: "分红型可守", note: "现金流和分红覆盖都很扎实，是低波动样本。" });
  addValuation({ id: "val-03", stockId: "cn-orbit-medtech", presetIds: ["undervalued"], valuationBand: "quality-premium", sizeBucket: "niche", fairValueLow: "21.00", fairValueHigh: "24.00", marginOfSafety: "-18%", marginValue: -18, qualityValue: 61, crowdingScore: 68, verdict: "估值陷阱回避", note: "价格先走、验证未到，便宜感来自故事而不来自安全边际。" });
  addValuation({ id: "val-04", stockId: "cn-sea-auto", presetIds: ["undervalued", "cashflow", "trend-calm"], valuationBand: "undervalued", sizeBucket: "mid-large", fairValueLow: "29.00", fairValueHigh: "31.50", marginOfSafety: "21%", marginValue: 21, qualityValue: 76, crowdingScore: 34, verdict: "低估可跟踪", note: "出海订单验证比题材情绪更清楚，修复路径可解释。" });
  addValuation({ id: "val-05", stockId: "cn-morning-chips", presetIds: ["cashflow"], valuationBand: "quality-premium", sizeBucket: "mid", fairValueLow: "48.00", fairValueHigh: "53.00", marginOfSafety: "6%", marginValue: 6, qualityValue: 68, crowdingScore: 62, verdict: "等待更好价格", note: "技术方向没错，但流动性和估值都不够舒服。" });
  addValuation({ id: "val-06", stockId: "cn-bridge-port", presetIds: ["undervalued", "cashflow", "dividend", "trend-calm"], valuationBand: "fair-zone", sizeBucket: "mid-large", fairValueLow: "13.80", fairValueHigh: "14.60", marginOfSafety: "16%", marginValue: 16, qualityValue: 79, crowdingScore: 28, verdict: "合理可持有", note: "收益率不错，但仍要盯住债务与资本开支。" });
  addValuation({ id: "val-07", stockId: "us-cascade-pay", presetIds: ["cashflow", "dividend", "trend-calm"], valuationBand: "fair-zone", sizeBucket: "mega", fairValueLow: "138.00", fairValueHigh: "145.00", marginOfSafety: "16%", marginValue: 16, qualityValue: 91, crowdingScore: 26, verdict: "合理可持有", note: "回购和自由现金流一起托底，质量在美股里很稀缺。" });
  addValuation({ id: "val-08", stockId: "us-helix-robotics", presetIds: ["trend-calm"], valuationBand: "quality-premium", sizeBucket: "mid-large", fairValueLow: "78.00", fairValueHigh: "86.00", marginOfSafety: "2%", marginValue: 2, qualityValue: 83, crowdingScore: 77, verdict: "趋势过热不追", note: "趋势仍强，但拥挤度太高，安全边际不足。" });
  addValuation({ id: "val-09", stockId: "us-pioneer-cloud", presetIds: ["undervalued"], valuationBand: "quality-premium", sizeBucket: "mid-large", fairValueLow: "46.00", fairValueHigh: "52.00", marginOfSafety: "-22%", marginValue: -22, qualityValue: 60, crowdingScore: 70, verdict: "估值陷阱回避", note: "并不是低估，而是仍在高估区域里讲放缓故事。" });
  addValuation({ id: "val-10", stockId: "us-atlas-medical", presetIds: ["undervalued", "cashflow", "dividend", "trend-calm"], valuationBand: "undervalued", sizeBucket: "mid-large", fairValueLow: "112.00", fairValueHigh: "120.00", marginOfSafety: "24%", marginValue: 24, qualityValue: 87, crowdingScore: 21, verdict: "低估可跟踪", note: "价值修复路径清楚，拥挤度也比热门科技低很多。" });
  addValuation({ id: "val-11", stockId: "us-nova-retail", presetIds: ["cashflow", "trend-calm"], valuationBand: "fair-zone", sizeBucket: "mid", fairValueLow: "50.00", fairValueHigh: "55.00", marginOfSafety: "17%", marginValue: 17, qualityValue: 72, crowdingScore: 39, verdict: "合理可跟踪", note: "需求仍在，但必须继续盯现金流转正节点。" });
  addValuation({ id: "val-12", stockId: "us-summit-energy", presetIds: ["undervalued", "dividend", "trend-calm"], valuationBand: "undervalued", sizeBucket: "mid-large", fairValueLow: "69.00", fairValueHigh: "74.00", marginOfSafety: "23%", marginValue: 23, qualityValue: 80, crowdingScore: 33, verdict: "分红型可守", note: "修复和股东回报同时成立，估值还不贵。" });
  addValuation({ id: "val-13", stockId: "jp-sakura-machinery", presetIds: ["cashflow", "dividend", "trend-calm"], valuationBand: "fair-zone", sizeBucket: "mid-large", fairValueLow: "JPY 2,930", fairValueHigh: "JPY 3,120", marginOfSafety: "17%", marginValue: 17, qualityValue: 89, crowdingScore: 20, verdict: "合理可持有", note: "回购落地后，估值提升逻辑比普通低估值更可靠。" });
  addValuation({ id: "val-14", stockId: "jp-mirai-rail", presetIds: ["undervalued", "trend-calm"], valuationBand: "undervalued", sizeBucket: "mid", fairValueLow: "JPY 3,620", fairValueHigh: "JPY 3,860", marginOfSafety: "18%", marginValue: 18, qualityValue: 74, crowdingScore: 35, verdict: "修复中观察", note: "业绩上修成立，但现金释放仍慢一步。" });
  addValuation({ id: "val-15", stockId: "jp-hinode-logistics", presetIds: ["undervalued"], valuationBand: "undervalued", sizeBucket: "niche", fairValueLow: "JPY 980", fairValueHigh: "JPY 1,050", marginOfSafety: "-11%", marginValue: -11, qualityValue: 58, crowdingScore: 41, verdict: "估值陷阱回避", note: "长期便宜不等于马上重估，流动性会放大失误。" });
  addValuation({ id: "val-16", stockId: "jp-koyo-banks", presetIds: ["undervalued", "dividend", "trend-calm"], valuationBand: "undervalued", sizeBucket: "mega", fairValueLow: "JPY 1,910", fairValueHigh: "JPY 2,020", marginOfSafety: "24%", marginValue: 24, qualityValue: 86, crowdingScore: 23, verdict: "分红型可守", note: "股东回报动作开始兑现，低估值更容易被看见。" });
  addValuation({ id: "val-17", stockId: "jp-aoi-electronics", presetIds: ["cashflow", "trend-calm"], valuationBand: "fair-zone", sizeBucket: "mid", fairValueLow: "JPY 4,950", fairValueHigh: "JPY 5,160", marginOfSafety: "15%", marginValue: 15, qualityValue: 77, crowdingScore: 37, verdict: "合理可跟踪", note: "经营改善有迹象，但还不适合给太高溢价。" });
  addValuation({ id: "val-18", stockId: "jp-tsubasa-food", presetIds: ["dividend", "trend-calm"], valuationBand: "fair-zone", sizeBucket: "mid", fairValueLow: "JPY 2,260", fairValueHigh: "JPY 2,360", marginOfSafety: "12%", marginValue: 12, qualityValue: 73, crowdingScore: 19, verdict: "等待更好价格", note: "防守属性不错，但真正的效率修复还需要更多证据。" });
  addValuation({ id: "val-19", stockId: "hk-pearl-infra", presetIds: ["cashflow", "dividend", "trend-calm"], valuationBand: "fair-zone", sizeBucket: "mega", fairValueLow: "HKD 11.30", fairValueHigh: "HKD 11.90", marginOfSafety: "15%", marginValue: 15, qualityValue: 85, crowdingScore: 24, verdict: "分红型可守", note: "现金流和分红覆盖都清楚，是港股防守底仓。" });
  addValuation({ id: "val-20", stockId: "hk-victory-consumer", presetIds: ["undervalued", "trend-calm"], valuationBand: "fair-zone", sizeBucket: "mid", fairValueLow: "HKD 33.50", fairValueHigh: "HKD 36.20", marginOfSafety: "20%", marginValue: 20, qualityValue: 74, crowdingScore: 42, verdict: "修复中观察", note: "南向偏好和消费修复都有，但盈利斜率仍需确认。" });
  addValuation({ id: "val-21", stockId: "hk-orion-health", presetIds: ["undervalued"], valuationBand: "undervalued", sizeBucket: "niche", fairValueLow: "HKD 10.20", fairValueHigh: "HKD 12.10", marginOfSafety: "-26%", marginValue: -26, qualityValue: 59, crowdingScore: 58, verdict: "估值陷阱回避", note: "看起来便宜，但盈利和现金流都还太远。" });
  addValuation({ id: "val-22", stockId: "hk-harbor-finance", presetIds: ["undervalued", "dividend", "trend-calm"], valuationBand: "undervalued", sizeBucket: "mega", fairValueLow: "HKD 17.90", fairValueHigh: "HKD 18.80", marginOfSafety: "26%", marginValue: 26, qualityValue: 88, crowdingScore: 22, verdict: "低估可跟踪", note: "低估值、股东回报和资金回流开始同向成立。" });
  addValuation({ id: "val-23", stockId: "hk-lotus-tech", presetIds: ["trend-calm"], valuationBand: "quality-premium", sizeBucket: "mid", fairValueLow: "HKD 7.10", fairValueHigh: "HKD 8.00", marginOfSafety: "1%", marginValue: 1, qualityValue: 67, crowdingScore: 64, verdict: "趋势过热不追", note: "叙事开始改善，但盈利质量还不够支持持续追价。" });
  addValuation({ id: "val-24", stockId: "hk-bauhinia-utilities", presetIds: ["undervalued", "cashflow", "dividend", "trend-calm"], valuationBand: "fair-zone", sizeBucket: "mid-large", fairValueLow: "HKD 6.40", fairValueHigh: "HKD 6.80", marginOfSafety: "16%", marginValue: 16, qualityValue: 84, crowdingScore: 18, verdict: "分红型可守", note: "股息来源清楚，是港股里更安心的慢变量资产。" });

  data.valuationItems = valuationItems;

  data.trendSignals = [
    {
      market: "cn",
      regime: { label: "修复升温", temperature: 64, summary: "政策方向更清楚了，但真正驱动胜率的是订单兑现和现金流回正。" },
      sparkline: [42, 46, 50, 55, 58, 61, 64],
      factorScores: [
        { label: "资金偏好", value: 62, summary: "防守资金重新回到红利和公用事业。" },
        { label: "盈利预期", value: 69, summary: "订单验证比单纯题材更受欢迎。" },
        { label: "拥挤度", value: 55, summary: "热点仍热，但已经不是所有方向都能追。" }
      ],
      leaders: ["高股息和电网资产仍是回撤缓冲区。", "出海制造里有订单验证的公司更容易获得估值修复。"],
      warnings: ["题材末端拥挤度重新抬头，交易位置很关键。", "高杠杆扩产会比景气兑现更早伤到股价。"],
      ctaLinks: [
        { title: "顺风方向", description: "先看现金流红利和政策修复，优先筛验证更清楚的样本。", url: boardUrl("cn", "opportunity", { strategy: "cn-high-dividend" }), tone: "success" },
        { title: "警惕拐点", description: "把情绪末端追高从左侧不能买榜里先筛掉。", url: boardUrl("cn", "avoid", { scene: "cn-crowded-theme" }), tone: "warning" }
      ]
    },
    {
      market: "us",
      regime: { label: "趋势高温但可控", temperature: 71, summary: "美股依然奖励趋势，但真正的上限来自现金流和利润率是否同步兑现。" },
      sparkline: [58, 60, 63, 67, 69, 70, 71],
      factorScores: [
        { label: "资金偏好", value: 74, summary: "龙头现金流资产持续得到配置。" },
        { label: "盈利预期", value: 67, summary: "市场开始要求更多真实利润，而不是单纯增速。" },
        { label: "拥挤度", value: 72, summary: "AI 和高估值成长仍然偏热。" }
      ],
      leaders: ["自由现金流扩张型龙头仍是最稳的主线。", "低拥挤价值修复股开始吸走部分资金。"],
      warnings: ["高估值成长一旦指引下修，会非常脆弱。", "趋势再强也要尊重拥挤度和利润率验证。"],
      ctaLinks: [
        { title: "顺风方向", description: "回到机会榜，先看自由现金流扩张和价值修复样本。", url: boardUrl("us", "opportunity", { strategy: "us-free-cashflow" }), tone: "success" },
        { title: "警惕拐点", description: "把 AI 拥挤交易和指引下修风险先筛到不能买榜。", url: boardUrl("us", "avoid", { scene: "us-ai-crowding" }), tone: "warning" }
      ]
    },
    {
      market: "jp",
      regime: { label: "治理修复稳态", temperature: 58, summary: "日股的修复更像慢变量，回购、ROE 和现金释放决定上行质量。" },
      sparkline: [46, 48, 51, 52, 55, 56, 58],
      factorScores: [
        { label: "资金偏好", value: 55, summary: "外资仍愿意看治理改善，但节奏更挑剔。" },
        { label: "盈利预期", value: 61, summary: "业绩上修与高股息方向更容易被认可。" },
        { label: "拥挤度", value: 34, summary: "拥挤不高，更适合中期筛选。" }
      ],
      leaders: ["回购兑现和高股息方向更容易走出慢牛节奏。", "低 PBR 改善仍然有效，但必须配治理证据。"],
      warnings: ["小票流动性不足，会让低估值变成难参与的陷阱。", "汇率顺风如果反转，出口链弹性会被快速回吐。"],
      ctaLinks: [
        { title: "顺风方向", description: "回到机会榜，先看回购和高股息并行的治理改善样本。", url: boardUrl("jp", "opportunity", { strategy: "jp-buyback-rotation" }), tone: "success" },
        { title: "警惕拐点", description: "先把薄流动性和价值陷阱从不能买榜里筛掉。", url: boardUrl("jp", "avoid", { scene: "jp-thin-liquidity" }), tone: "warning" }
      ]
    },
    {
      market: "hk",
      regime: { label: "资金回流试探期", temperature: 61, summary: "港股正在修复，但能不能走远，取决于南向资金、股息安全和资产质量是否同时站住。" },
      sparkline: [41, 44, 48, 52, 55, 58, 61],
      factorScores: [
        { label: "资金偏好", value: 66, summary: "南向资金对核心资产偏好在恢复。" },
        { label: "盈利预期", value: 57, summary: "修复在路上，但盈利兑现仍慢半拍。" },
        { label: "拥挤度", value: 49, summary: "核心防守资产不热，平台叙事仍偏波动。" }
      ],
      leaders: ["高股息和金融龙头更容易率先完成折价收敛。", "南向偏好回升后，核心消费的赔率开始好转。"],
      warnings: ["故事先于盈利的平台股依然容错率很低。", "如果只剩政策 Beta，上涨持续性会明显变差。"],
      ctaLinks: [
        { title: "顺风方向", description: "回到机会榜，优先看高股息和估值修复已经同向的样本。", url: boardUrl("hk", "opportunity", { strategy: "hk-high-dividend" }), tone: "success" },
        { title: "警惕拐点", description: "把故事先于盈利的方向先放进不能买榜过滤。", url: boardUrl("hk", "avoid", { scene: "hk-story-before-profit" }), tone: "warning" }
      ]
    }
  ];
})();
