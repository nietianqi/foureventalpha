# 四大市场股票思路原型

本项目是一个本地静态 HTML 原型，用来演示四大市场股票思路网站的 P0 主链路。当前正式入口包含首页、四个市场页、独立合理股价估值页、独立趋势页和股票详情页。

## 页面地图

- `prototype/index.html`
- `prototype/market-cn.html`
- `prototype/market-us.html`
- `prototype/market-jp.html`
- `prototype/market-hk.html`
- `prototype/valuation.html?market=cn|us|jp|hk`
- `prototype/trend.html?market=cn|us|jp|hk`
- `prototype/stock.html?stock=<stockId>`

## 路由与参数

### 顶部导航

- 全站导航统一为：`首页 / 市场页 / 合理股价估值 / 趋势 / 股票详情`
- `市场页` 默认回到当前市场上下文；无上下文时默认中国市场
- `合理股价估值` 进入 `valuation.html?market=...`
- `趋势` 进入 `trend.html?market=...`
- `股票详情` 进入当前页面上下文下的代表样本详情页

### 市场页

- 采用 4 个独立入口文件，不再依赖 `?market=`
- 榜单深链参数：
  - `opStrategy`
  - `opRisk`
  - `opScene`
  - `avStrategy`
  - `avRisk`
  - `avScene`

### 合理股价估值页

- 入口：`valuation.html?market=cn|us|jp|hk`
- 支持参数：
  - `valPreset`
  - `valBand`
  - `valQuality`
  - `valMargin`
  - `valSize`
- `val*` 只在估值页生效，不再由市场页承载
- 页面内市场切换 chip 只切换 `market` 上下文，并重置为目标市场默认 `valuationDefaults`

### 趋势页

- 入口：`trend.html?market=cn|us|jp|hk`
- 当前只使用 `market` 控制市场上下文，不额外增加筛选参数
- 页面内市场切换 chip 只保留趋势页上下文，不跳回市场页

## 数据结构

核心 mock 数据定义在 `prototype/assets/data.js`，当前主要包含：

- `markets`
- `strategyCards`
- `avoidSceneCards`
- `rankingItems`
- `stockSummaries`
- `stockDetails`
- `valuationFilterOptions`
- `valuationPresets`
- `valuationItems`
- `trendSignals`

其中：

- `markets` 额外承载页面级方法论字段：
  - `methodSummary`
  - `valuationFocus`
  - `trendFocus`
- `strategyCards` 除摘要外，还包含：
  - `coreQuestion`
  - `mustConfirm`
  - `falsePositive`
  - `sampleStockIds`
- `avoidSceneCards` 除风险摘要外，还包含：
  - `whyDangerous`
  - `reentrySignal`
  - `sampleStockIds`
- `valuationItems` 支撑独立估值页筛选和结果表
- `trendSignals` 支撑独立趋势页的温度、火花线、三因子、行动卡片和跟踪样本区
  - `watchlistItems` 至少包含 `stockId`、`role`、`whyWatch`

## 内容补全完成态

当前原型中的“四市场方法论补全”以以下标准为完成态：

- 市场页在 Hero 下方就能看出每个市场的判断顺序、估值重点、趋势重点和最怕的假信号
- 市场页“怎么买”卡明确展示适用场景、必须验证、最容易看错什么和对应样本
- 市场页“不能买什么”卡明确展示为什么危险、何时能重看、替代打法和对应样本
- 四个市场的双榜单默认数据都覆盖主要主策略和主要风险场景，且默认不会出现空列表
- 估值页会直接展示该市场的估值方法锚点，而不是只展示统一筛选器
- 趋势页的跟踪样本区不仅列股票，还说明每只样本当前的跟踪角色和跟踪理由
- 详情页会把股票重新放回对应市场的方法框架里，明确该思路先确认什么、最容易看错什么

## 本地预览

在项目根目录执行任意一个简单静态服务即可，例如：

```powershell
cd F:\foureventalpha
python -m http.server 8000
```

然后访问：

- `http://localhost:8000/prototype/index.html`
- `http://localhost:8000/prototype/valuation.html?market=cn`
- `http://localhost:8000/prototype/trend.html?market=us`

## 兼容规则

- 旧链接 `market-*.html#valuation-board` 会自动重定向到对应 `valuation.html?market=...#valuation-board`
- 旧链接 `market-*.html#trend-board` 会自动重定向到对应 `trend.html?market=...#trend-board`
- 市场页仍保留 `op* / av*` 双榜单深链；估值页和趋势页不复用这些参数

## 说明

- 所有内容均为原型示意，不构成投资建议
- PDF 和 DOCX 需求文档保留在仓库根目录，作为参考资料使用
- 可维护实现说明以本 README 和 `prototype/assets/*.js` / `prototype/assets/styles.css` 为准
