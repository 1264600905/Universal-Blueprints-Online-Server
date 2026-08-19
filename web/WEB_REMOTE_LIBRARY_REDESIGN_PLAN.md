# Web Remote Library Redesign Plan

## 1. Scope
- 目标：把 `关于搭建蓝图服务器的想法/web` 重构为“远程蓝图页面”的 Web 化版本，保留列表筛选、排序、角标、统计、详情、大图缩放、模组清单、描述和下载。
- 约束：保持纯静态部署，兼容 GitHub Pages；不引入服务端；继续使用同一个 `index.json` 作为列表数据源。
- 规则检查：未发现 `\.trae/rules/project_rules.md`，本计划以当前 `web` 与游戏端实现为准。

## 2. Data Model
- 列表页只解析 `index.json`，字段对齐游戏端 `IndexBlueprintItem`：[RemoteBlueprintData.cs](file:///d:/RimworldProject/RimworldPrefabProject/Core/Data/RemoteBlueprintData.cs#L21-L43)

```csharp
public string id; public string n; public string a; public string sid;
public int w; public int h; public string v; public string c;
public string t; public string p; public List<string> m;
public int fe; public int? am; public int? s_l; public int? s_d; public int? s_dl;
public string dt; public string ut;
```

- 列表映射规则直接对齐游戏端 ViewModel 构建：[RemoteBlueprintManager.cs](file:///d:/RimworldProject/RimworldPrefabProject/Core/PrefabPlace/RemoteBlueprintManager.cs#L371-L397)

```csharp
Id = item.id; Name = item.n; Author = item.a; Width = item.w; Height = item.h;
GitHubPath = item.p; RequiredMods = item.m ?? new List<string>();
IsFeatured = item.fe == 1; IsArchitecturalMedal = item.am == 1;
LikeCount = item.s_l ?? 0; AddToLibraryCount = item.s_dl ?? 0;
CreatedAt = ParseDateString(item.dt); UpdatedAt = ParseDateString(item.ut ?? item.dt);
```

- 详情页不扩展 `index.json`，沿用游戏端“点击后按需下载 XML”方案：[RemoteBlueprintBrowser.cs](file:///d:/RimworldProject/RimworldPrefabProject/UI/PrefabLibrary/RemoteBlueprintBrowser.cs#L295-L385)
- 描述、扩展信息和更完整模组显示来自 XML，而不是继续滥用当前 `t` 字段；现有 `BlueprintDetail.tsx` 把 `t` 当描述显示，需要替换：[BlueprintDetail.tsx](file:///d:/RimworldProject/RimworldPrefabProject/%E5%85%B3%E4%BA%8E%E6%90%AD%E5%BB%BA%E8%93%9D%E5%9B%BE%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%9A%84%E6%83%B3%E6%B3%95/web/components/BlueprintDetail.tsx#L74-L82)

## 3. Target UX
- 桌面端：顶部标题栏 + 第二行工具栏 + 中央卡片网格；点击卡片打开居中详情弹层；点击主图打开全屏图片查看器。
- 手机端：顶部紧凑标题栏；筛选改为底部抽屉或顶部弹出层；卡片双列；详情为全屏面板；大图为全屏缩放模式。
- 详情信息顺序：标题/作者/分类/尺寸/时间/版本 -> 主图 -> 描述 -> 模组 -> 统计 -> 下载。

## 4. Exact Changes
- `web/App.tsx`
  - 现状：承担全部状态与布局。
  - 修改：只保留页面编排；新增 `selectedBlueprint`、`isDetailOpen`、`isImageViewerOpen`、`isMobileFilterOpen` 状态。
  - 当前需替换的代码段：
    - 列表点击空实现 [App.tsx](file:///d:/RimworldProject/RimworldPrefabProject/%E5%85%B3%E4%BA%8E%E6%90%AD%E5%BB%BA%E8%93%9D%E5%9B%BE%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%9A%84%E6%83%B3%E6%B3%95/web/App.tsx#L245-L255)
    - 顶部工具栏整体布局 [App.tsx](file:///d:/RimworldProject/RimworldPrefabProject/%E5%85%B3%E4%BA%8E%E6%90%AD%E5%BB%BA%E8%93%9D%E5%9B%BE%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%9A%84%E6%83%B3%E6%B3%95/web/App.tsx#L104-L223)
- `web/components/BlueprintCard.tsx`
  - 现状：卡片承担下载，但没有进入详情的有效行为。
  - 修改：卡片点击打开详情；保留下载按钮；新增时间/版本副信息；保持精选/奖章角标；保留缩略图失败回退。
  - 必改：删除硬编码 `"/Featured.png"`、`"/Medal.png"` 路径，改为 `import.meta.env.BASE_URL` 或静态导入。
- `web/components/BlueprintDetail.tsx`
  - 现状：已有基础弹层，但数据全来自 `BlueprintDerived`，描述来源错误。
  - 修改：改为接收 `listItem + detailData + loading + error`；描述区改用 XML 解析结果；模组区优先用 XML 详情，回退 `m`。
- `web/hooks/useBlueprintData.ts`
  - 保留现有 `index.json` 读取策略：[useBlueprintData.ts](file:///d:/RimworldProject/RimworldPrefabProject/%E5%85%B3%E4%BA%8E%E6%90%AD%E5%BB%BA%E8%93%9D%E5%9B%BE%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%9A%84%E6%83%B3%E6%B3%95/web/hooks/useBlueprintData.ts#L19-L59)
  - 修改：补充 `basePath` 透传，供详情 XML URL 和图片 URL 共用。
- `web/utils/blueprintUtils.ts`
  - 保留分类映射、时间筛选、人气排序：[blueprintUtils.ts](file:///d:/RimworldProject/RimworldPrefabProject/%E5%85%B3%E4%BA%8E%E6%90%AD%E5%BB%BA%E8%93%9D%E5%9B%BE%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%9A%84%E6%83%B3%E6%B3%95/web/utils/blueprintUtils.ts#L103-L143)
  - 修改：新增 `buildXmlUrl(raw, basePath)`、`formatBlueprintDate(dt, lang)`、`resolveAssetUrl(path)`。
- `web/types.ts`
  - 保留 `BlueprintRaw` / `BlueprintDerived`。
  - 新增：
    - `BlueprintListItem`：列表页模型，替代 UI 直接依赖 `BlueprintDerived`
    - `BlueprintDetailData`：XML 解析出的详情模型，至少包括 `description`, `mods`, `referenceUrl`, `rawXml`
- `web/constants.ts`
  - 继续保留 `DATA_PATH` 和远程回退源。
  - 新增 `ASSET_BASE_URL`、`XML_FETCH_TIMEOUT_MS`、GitHub Pages 项目名常量。
- `web/vite.config.ts`
  - 固定为新公开仓库的 `base`，不要再默认 `'/'` 直出。
  - 保持 `build.outDir = 'docs'`，除非决定切换 GitHub Actions artifact Pages。
- 新增 `web/hooks/useBlueprintDetail.ts`
  - 功能：点击卡片后请求 `buildXmlUrl()` 结果；解析 XML；缓存详情；暴露 `loading/error/data`。
- 新增 `web/utils/xmlDetailParser.ts`
  - 功能：用 DOMParser 解析 XML。
  - 目标节点：`extraInfo/name`、`extraInfo/author`、`extraInfo/description`、`extraInfo/modPackages/mod/packageId`、`extraInfo/url`、可选 `tags`。
- 新增 `web/components/RemoteToolbar.tsx`
  - 拆出搜索、排序、时间、分类、刷新按钮。
- 新增 `web/components/MobileFilterSheet.tsx`
  - 手机端筛选 UI。
- 新增 `web/components/BlueprintImageViewer.tsx`
  - 实现全屏图片查看器；支持滚轮缩放、拖拽平移、移动端双击缩放或按钮缩放。

## 5. Implementation Order
1. 重构类型层：`types.ts`、`constants.ts`、`blueprintUtils.ts`
2. 稳定列表层：`useBlueprintData.ts`、`BlueprintCard.tsx`、`RemoteToolbar.tsx`
3. 接入详情层：`useBlueprintDetail.ts`、`xmlDetailParser.ts`、`BlueprintDetail.tsx`
4. 接入图片查看器：`BlueprintImageViewer.tsx`
5. 回收 `App.tsx` 为页面编排层
6. 调整 `vite.config.ts` 和 `README.md` 为新公开仓库部署模型
7. 新增 `.github/workflows/deploy.yml`

## 6. XML Parsing Rules
- URL 由 `p` 直接构造，不自行猜测文件名。
- 先显示列表层基础信息，再显示 XML 详情，避免点击后白屏。
- 解析失败时：
  - 描述显示“暂无详情”
  - 模组回退显示 `m`
  - 仍允许查看主图与下载
- 不将 `t` 当作描述；`t` 仍保持标签字符串用途。

## 7. GitHub Pages Deployment
- 新公开仓库建议结构：
  - `src/` React 页面
  - `public/` 静态徽章资源
  - `docs/` 构建产物
- 部署策略：
  - `main` 分支维护源码
  - GitHub Actions 构建后发布到 Pages
  - `base` 固定为 `/<new-repo-name>/`
- 资源路径规则：
  - 所有站内资源使用 `import.meta.env.BASE_URL`
  - 所有远程蓝图资源使用配置化 `REMOTE_BASE_URL`
  - 禁止组件内写死以 `/` 开头的站内路径

## 8. Validation Checklist
- PC 端：1920 宽度下卡片、筛选栏、详情弹层不重叠
- 手机端：375 宽度下卡片与详情可完整浏览
- `Newest`、`Popularity`、`Featured`、`Medal` 排序结果与当前游戏端一致
- `index.json` 本地读取失败时，远程回退仍可展示
- GitHub Pages 子路径部署后，徽章图标和站内静态资源不丢失
- XML 失败时，页面仍可浏览列表并查看主图

## 9. Minimal Snippet Justification
- 当前详情错误来源：

```tsx
{blueprint.t ? blueprint.t : <span className="italic opacity-50">No description provided.</span>}
```

- 当前列表点击未接详情：

```tsx
onClick={() => {}}
```

- 当前基础解析已够支撑列表：

```ts
const processed = data.blueprints.map(bp => parseBlueprintData(bp, basePath));
```

**Execution Difficulty**
- 4/5

**Risk Points**
- XML 节点不统一会导致描述或扩展字段解析不稳定。
- 当前站内绝对路径资源在 GitHub Pages 子路径下会失效。
- 若详情层承担过多逻辑，`App.tsx` 容易再次膨胀。
- 如果新公开仓库与数据仓库分离，跨仓资源 URL 需要集中配置，不能散落在组件里。

**Better Alternatives**
- 推荐方案：继续 `Vite + React + TypeScript + Tailwind`，单页状态管理，详情按需读取 XML。
- 若未来需要分享详情链接，可在第二阶段引入 `HashRouter`，不建议第一阶段用普通 History 路由。
- 若未来想进一步优化详情首开速度，再考虑把描述静态化进 `index.json`，但当前不是必需。

**Open Questions**
- XML 中描述字段的节点名是否完全稳定，还是需要多节点兜底解析？
- 新公开仓库名是否已经确定，以便锁定 `base` 路径？
- 详情层桌面端最终形态更偏向“居中弹层”还是“右侧抽屉”？
- 是否需要在第一阶段加入“复制 Blueprint ID”与“下载原图/缩略图切换”？
