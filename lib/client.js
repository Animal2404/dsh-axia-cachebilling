window.__ModuleLoader__.load({
  id: "dsh-axia-cachebilling",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  startPanelBridge: () => startPanelBridge
});
module.exports = __toCommonJS(client_exports);
var React2 = __toESM(require("react"), 1);

// src/settings.ts
var React = __toESM(require("react"), 1);

// src/prices.ts
var PRICE_CATALOG_URL = "https://raw.githubusercontent.com/Animal2404/dsh-axia-cachebilling/main/price-catalog.json";
var CACHE_MS = 10 * 60 * 1e3;
var cached = null;
var cachedAt = 0;
async function loadPriceCatalog(force = false) {
  if (!force && cached !== null && Date.now() - cachedAt < CACHE_MS) return cached;
  try {
    const res = await fetch(PRICE_CATALOG_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.entries)) throw new Error("目录格式不对");
    cached = data;
    cachedAt = Date.now();
    return data;
  } catch {
    return cached;
  }
}
function serializeCatalogWhen(when) {
  return when.map((g) => `[${g.days.join(",")}][${g.ranges.join(", ")}]`).join(" + ");
}
function lookupCatalog(catalog, provider, model) {
  if (catalog === null) return null;
  const p = provider.trim().toLowerCase();
  const m = model.trim().toLowerCase();
  if (m === "") return null;
  const exact = [];
  const loose = [];
  for (const entry of catalog.entries) {
    const names = [entry.model, ...entry.modelAliases ?? []].map((s) => s.toLowerCase());
    const nameHit = names.includes(m);
    const looseHit = names.some((n) => m.startsWith(n));
    if (!nameHit && !looseHit) continue;
    const providerMatched = (entry.providers ?? []).map((s) => s.toLowerCase()).includes(p);
    const match = { entry, providerMatched };
    if (providerMatched && nameHit) return match;
    (nameHit ? exact : loose).push(match);
  }
  const pool = exact.length > 0 ? exact : loose;
  if (pool.length === 0) return null;
  if (pool.some((x) => x.providerMatched)) return pool[0];
  const distinct = new Set(pool.map((x) => x.entry));
  return distinct.size === 1 ? pool[0] : null;
}

// src/settings.ts
var SETTINGS_NS = "meow-cachebilling";
var CSS_ID = "dsh-axia-cachebilling-settings-css";
var FONT_SCALE_KEY = "axia-font-scale";
var DEFAULT_FONT_SCALE = 1.5;
var FONT_SCALES = [
  { value: 1, label: "标准" },
  { value: 1.25, label: "大" },
  { value: 1.5, label: "超大" },
  { value: 2, label: "巨大" }
];
function readFontScale() {
  try {
    const value = Number(localStorage.getItem(FONT_SCALE_KEY));
    if (Number.isFinite(value) && value >= 0.8 && value <= 2.5) return value;
  } catch {
  }
  return DEFAULT_FONT_SCALE;
}
function applyFontScale(value) {
  try {
    document.documentElement.style.setProperty("--axia-fs", String(value));
    localStorage.setItem(FONT_SCALE_KEY, String(value));
  } catch {
  }
}
var CSS = `
/* 设置页永远标准大小：字号档位只作用于上下文弹层里的账单（见 client.ts 的 --axia-fs），
   早先给设置页也加了 zoom 是错的（用户反馈「连插件 UI 都跟着放大缩小」） */
.axia_set_page{color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:12px;max-width:820px;padding:4px 0}
/* 自带 border-box：DSH 外壳不重置盒模型，缺了它 width:100% 的输入框会撑破网格、互相压边 */
.axia_set_page,.axia_set_page *{box-sizing:border-box}
.axia_set_head{display:flex;flex-direction:column;gap:4px}
.axia_set_title{font-size:17px;font-weight:650;letter-spacing:.2px;margin:0}
.axia_set_subtitle{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.6;margin:0}
.axia_set_card{background:color-mix(in srgb,currentColor 3%,transparent);border:1px solid var(--dsw-alias-border-l3);border-radius:12px;display:flex;flex-direction:column;gap:10px;padding:14px}
.axia_set_legend{align-items:center;color:var(--dsw-alias-label-caption);display:flex;flex-wrap:wrap;font-size:12px;gap:6px 10px;line-height:1.6}
.axia_set_legend b{color:var(--dsw-alias-label-secondary);font-weight:600}
.axia_set_toolbar{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
.axia_set_count{color:var(--dsw-alias-label-caption);font-size:12px;font-variant-numeric:tabular-nums;margin-left:auto}
.axia_set_btn{align-items:center;background:transparent;border:1px solid var(--dsw-alias-border-l3);border-radius:8px;color:var(--dsw-alias-label-secondary);cursor:pointer;display:inline-flex;font-size:12.5px;gap:4px;padding:5px 11px;transition:background .15s,border-color .15s,color .15s;white-space:nowrap}
.axia_set_btn:hover{background:color-mix(in srgb,currentColor 7%,transparent);border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.axia_set_btn:disabled{cursor:default;opacity:.5}
/* 主按钮用自己的品牌蓝：--dsw-alias-button-primary-fill 在深色主题里是白色，配白字会白底白字 */
.axia_set_btn_primary{background:#4D6BFE;border-color:transparent;color:#fff;font-weight:600}
.axia_set_btn_primary:hover{background:#4D6BFE;color:#fff;filter:brightness(1.12)}
.axia_set_btn_danger:hover{border-color:#f43f5e;color:#f43f5e}
.axia_set_btn_mini{font-size:12px;padding:3px 8px}
.axia_set_group{display:flex;flex-direction:column;gap:6px}
.axia_set_grouphead{align-items:center;color:var(--dsw-alias-label-caption);display:flex;font-size:11.5px;gap:6px;letter-spacing:.3px;padding:2px 2px 0}
.axia_set_row{align-items:center;background:color-mix(in srgb,currentColor 4%,transparent);border:1px solid var(--dsw-alias-border-l3);border-radius:10px;cursor:pointer;display:flex;gap:10px;padding:9px 12px;transition:background .15s,border-color .15s}
.axia_set_row:hover{background:color-mix(in srgb,currentColor 7%,transparent);border-color:var(--dsw-alias-border-l2)}
.axia_set_rowmain{display:flex;flex-direction:column;gap:2px;min-width:0}
.axia_set_model{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.axia_set_ver{color:var(--dsw-alias-label-caption);font-size:11.5px}
.axia_set_spacer{flex:1}
.axia_set_chev{color:var(--dsw-alias-label-caption);flex:none;font-size:15px;line-height:1}
.axia_set_badge{border-radius:999px;font-size:11px;line-height:17px;padding:0 8px;white-space:nowrap}
.axia_set_badge_prefill{background:color-mix(in srgb,#4D6BFE 18%,transparent);color:#8AA0FF}
.axia_set_badge_override{background:color-mix(in srgb,#f59e0b 18%,transparent);color:#F0A63A}
.axia_set_badge_custom{background:color-mix(in srgb,#34d399 18%,transparent);color:#34d399}
.axia_set_badge_tier{background:color-mix(in srgb,currentColor 9%,transparent);color:var(--dsw-alias-label-secondary)}
.axia_set_editor{background:color-mix(in srgb,currentColor 3%,transparent);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;display:flex;flex-direction:column;gap:10px;padding:12px}
.axia_set_grid{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}
.axia_set_field{display:flex;flex-direction:column;gap:4px;min-width:0}
.axia_set_fieldrow{align-items:center;display:flex;gap:6px;min-width:0}
.axia_set_label{color:var(--dsw-alias-label-caption);flex:none;font-size:11.5px}
.axia_set_input{background:var(--dsw-alias-bg-layer-2,#26262b);border:1px solid var(--dsw-alias-border-l3);border-radius:8px;color:var(--dsw-alias-label-primary,#eee);font-size:13px;min-width:0;padding:5px 9px;transition:border-color .15s}
.axia_set_input:focus{border-color:var(--dsw-alias-border-l2);outline:none}
.axia_set_input::placeholder{color:var(--dsw-alias-label-caption);opacity:.7}
.axia_set_input_grow{flex:1;min-width:0}
/* 用 DSH 自己的字体（用户要求别改字体），只给数字加等宽数字特性 */
.axia_set_input_mono{font-variant-numeric:tabular-nums}
.axia_set_input_err{border-color:#f43f5e}
.axia_set_select{background:var(--dsw-alias-bg-layer-2,#26262b);border:1px solid var(--dsw-alias-border-l3);border-radius:8px;color:var(--dsw-alias-label-primary,#eee);font-size:13px;max-width:100%;min-width:0;padding:5px 8px}
.axia_set_select option{background:var(--dsw-alias-bg-layer-2,#26262b);color:var(--dsw-alias-label-primary,#eee)}
.axia_set_select:disabled{opacity:.6}
body[data-ds-dark-theme] .axia_set_input{color-scheme:dark}
body[data-ds-dark-theme] .axia_set_select{color-scheme:dark}
.axia_set_prices{background:color-mix(in srgb,currentColor 3%,transparent);border:1px solid var(--dsw-alias-border-l3);border-radius:10px;display:flex;flex-direction:column;gap:8px;padding:10px}
.axia_set_prices_head{align-items:center;display:flex;gap:6px}
.axia_set_prices_title{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:600}
.axia_set_unit{color:var(--dsw-alias-label-caption);font-size:11px;margin-left:auto}
.axia_set_pricerow{display:grid;gap:8px;grid-template-columns:repeat(3,minmax(0,1fr))}
.axia_set_pricecell{display:flex;flex-direction:column;gap:3px;min-width:0}
.axia_set_pricenum{font-variant-numeric:tabular-nums;width:100%}
.axia_set_seg{background:color-mix(in srgb,currentColor 6%,transparent);border-radius:8px;display:inline-flex;gap:2px;padding:2px}
.axia_set_segbtn{background:transparent;border:0;border-radius:6px;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12.5px;padding:4px 12px;transition:background .15s,color .15s}
.axia_set_segbtn:hover{color:var(--dsw-alias-label-primary)}
.axia_set_segbtn_on{background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-primary);font-weight:600}
.axia_set_note{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.5;margin:0}
.axia_set_err{color:#f43f5e;font-size:12px;line-height:1.5;margin:0;white-space:pre-wrap}
.axia_set_muted{color:var(--dsw-alias-label-caption);font-size:12px}
.axia_set_actions{align-items:center;display:flex;gap:8px}
.axia_set_hint{color:var(--dsw-alias-label-caption);font-size:11.5px;margin-left:auto}
@media (max-width:560px){
  .axia_set_card{padding:12px}
  .axia_set_grid{grid-template-columns:minmax(0,1fr)}
}
`;
var PROVIDER_TIMEZONE = {
  "deepseek-official": "Asia/Shanghai",
  deepseek: "Asia/Shanghai",
  zhipu: "Asia/Shanghai",
  "zai-coding-cn": "Asia/Shanghai",
  zai: "Asia/Shanghai",
  bigmodel: "Asia/Shanghai",
  siliconflow: "Asia/Shanghai",
  moonshot: "Asia/Shanghai",
  alibaba: "Asia/Shanghai",
  openrouter: "UTC",
  openai: "UTC",
  anthropic: "UTC"
};
var DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
var RANGE_PATTERN = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;
function parseWhenText(text) {
  const out = [];
  for (const g of text.split("+")) {
    const m = /^\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*$/.exec(g);
    if (!m) throw new Error(`每组应为 [天数][时段列表]，收到 "${g.trim() || "（空）"}"`);
    const days = [];
    for (const part of m[1].split(/[,，]/)) {
      const p = part.trim().toLowerCase();
      if (!p) continue;
      const span = /^([a-z]{3})-([a-z]{3})$/.exec(p);
      if (span) {
        const a = DAY_ORDER.indexOf(span[1]);
        const b = DAY_ORDER.indexOf(span[2]);
        if (a < 0 || b < 0) throw new Error(`未知星期 "${p}"（可用 mon tue wed thu fri sat sun）`);
        for (let i = a; ; i = (i + 1) % 7) {
          days.push(DAY_ORDER[i]);
          if (i === b) break;
        }
      } else {
        if (DAY_ORDER.indexOf(p) < 0) throw new Error(`未知星期 "${p}"`);
        days.push(p);
      }
    }
    const ranges = m[2].split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    if (days.length === 0) throw new Error("天数为空");
    for (const r of ranges) {
      if (!RANGE_PATTERN.test(r)) throw new Error(`时段格式应为 "HH:MM-HH:MM"，收到 "${r}"`);
    }
    if (ranges.length === 0) throw new Error("时段为空");
    out.push({ days, ranges });
  }
  if (out.length === 0) throw new Error("峰时段为空");
  return out;
}
function serializeWhen(groups) {
  return groups.map((g) => `[${g.days.join(",")}][${g.ranges.join(", ")}]`).join(" + ");
}
var entryKey = (e) => `${(e.provider ?? "*").toLowerCase()}/${e.model.trim().toLowerCase()}`;
var toNum = (v) => Number(v.trim());
var NUM = "0";
function draftFromEntry(e) {
  return {
    provider: e.provider ?? "",
    model: e.model ?? "",
    label: e.label ?? "",
    currency: e.currency === "USD" ? "USD" : "CNY",
    timezone: e.timezone ?? "Asia/Shanghai",
    isPeak: Boolean(e.peak),
    flatHit: e.const ? String(e.const.hit) : NUM,
    flatMiss: e.const ? String(e.const.miss) : NUM,
    flatOutput: e.const ? String(e.const.output) : NUM,
    peakHit: e.peak ? String(e.peak.hit) : NUM,
    peakMiss: e.peak ? String(e.peak.miss) : NUM,
    peakOutput: e.peak ? String(e.peak.output) : NUM,
    whenText: e.peak ? serializeWhen(e.peak.when) : "[mon-fri][09:00-12:00, 14:00-18:00]",
    valleyHit: e.valley ? String(e.valley.hit) : NUM,
    valleyMiss: e.valley ? String(e.valley.miss) : NUM,
    valleyOutput: e.valley ? String(e.valley.output) : NUM,
    cacheSaving: e.cacheSaving == null ? "" : String(e.cacheSaving)
  };
}
var emptyDraft = () => ({
  provider: "",
  model: "",
  label: "",
  currency: "CNY",
  timezone: "Asia/Shanghai",
  isPeak: false,
  flatHit: NUM,
  flatMiss: NUM,
  flatOutput: NUM,
  peakHit: NUM,
  peakMiss: NUM,
  peakOutput: NUM,
  whenText: "[mon-fri][09:00-12:00, 14:00-18:00]",
  valleyHit: NUM,
  valleyMiss: NUM,
  valleyOutput: NUM,
  cacheSaving: ""
});
function validateDraft(d) {
  if (!d.model.trim()) return "模型不能为空";
  const numOk = (v) => v.trim() !== "" && Number.isFinite(toNum(v)) && toNum(v) >= 0;
  const partOk = (hit, miss, output) => {
    if (!numOk(hit) || !numOk(miss) || !numOk(output)) return "价格必须是非负数字（元 / 百万 token）";
    return null;
  };
  if (d.isPeak) {
    if (!d.timezone.trim()) return "时区不能为空（内置供应商会自动带出，其余填 IANA 名）";
    try {
      parseWhenText(d.whenText);
    } catch (e) {
      return `峰时段：${e instanceof Error ? e.message : String(e)}`;
    }
    return partOk(d.peakHit, d.peakMiss, d.peakOutput) ?? partOk(d.valleyHit, d.valleyMiss, d.valleyOutput);
  }
  return partOk(d.flatHit, d.flatMiss, d.flatOutput);
}
function buildEntry(d) {
  const e = { model: d.model.trim() };
  if (d.label.trim()) e.label = d.label.trim();
  if (d.currency === "USD") e.currency = "USD";
  const provider = d.provider.trim().toLowerCase();
  if (provider) e.provider = provider;
  if (d.isPeak) e.timezone = d.timezone.trim();
  const part = (hit, miss, output) => {
    const p = { hit: toNum(hit), miss: toNum(miss), output: toNum(output) };
    return p;
  };
  if (d.isPeak) {
    e.peak = { ...part(d.peakHit, d.peakMiss, d.peakOutput), when: parseWhenText(d.whenText) };
    e.valley = part(d.valleyHit, d.valleyMiss, d.valleyOutput);
  } else {
    e.const = part(d.flatHit, d.flatMiss, d.flatOutput);
  }
  if (d.cacheSaving.trim()) e.cacheSaving = d.cacheSaving.trim();
  return e;
}
var el = React.createElement;
var field = (labelText, child) => el("div", { className: "axia_set_field" }, el("span", { className: "axia_set_label" }, labelText), child);
function PriceInputs(props) {
  const { d, set, mode } = props;
  const cells = mode === "flat" ? [
    ["缓存命中", "flatHit"],
    ["缓存未命中", "flatMiss"],
    ["输出", "flatOutput"]
  ] : mode === "peak" ? [
    ["缓存命中", "peakHit"],
    ["缓存未命中", "peakMiss"],
    ["输出", "peakOutput"]
  ] : [
    ["缓存命中", "valleyHit"],
    ["缓存未命中", "valleyMiss"],
    ["输出", "valleyOutput"]
  ];
  return el(
    "div",
    { className: "axia_set_pricerow" },
    cells.map(
      ([text, key]) => el(
        "div",
        { key: String(key), className: "axia_set_pricecell" },
        el("span", { className: "axia_set_label" }, text),
        el("input", {
          className: "axia_set_input axia_set_pricenum",
          value: d[key],
          onChange: (e) => set({ [key]: e.target.value }),
          inputMode: "decimal",
          placeholder: "0"
        })
      )
    )
  );
}
function providerOptionLabel(p) {
  const name = p.label === p.id ? p.id : `${p.label} · ${p.id}`;
  return p.live ? `● ${name}` : `○ ${name}`;
}
function asRows(value) {
  if (Array.isArray(value)) return value;
  for (const key of ["value", "result", "items", "rows", "data"]) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}
async function loadProviderCatalog(remote) {
  const llm = remote?.llm;
  if (!llm || typeof llm.listProviders !== "function") throw new Error("当前连接读不到 DSH 的供应商列表");
  const live = await llm.listProviders();
  const configurable = typeof llm.listConfigurableProviders === "function" ? await llm.listConfigurableProviders() : [];
  const byId = /* @__PURE__ */ new Map();
  for (const row of asRows(configurable)) {
    const id = String(row?.provider ?? "").trim();
    if (!id) continue;
    byId.set(id.toLowerCase(), {
      id,
      label: String(row?.displayName ?? "").trim() || id,
      settingsNs: typeof row?.settingsNs === "string" && row.settingsNs !== "" ? row.settingsNs : void 0,
      settingsPath: Array.isArray(row?.settingsPath) ? row.settingsPath.map((s) => String(s)) : void 0
    });
  }
  for (const row of asRows(live)) {
    const id = String(row?.id ?? row?.provider ?? "").trim();
    if (!id) continue;
    const hit = byId.get(id.toLowerCase());
    byId.set(id.toLowerCase(), {
      id,
      label: hit?.label ?? (String(row?.name ?? row?.displayName ?? "").trim() || id),
      settingsNs: hit?.settingsNs,
      settingsPath: hit?.settingsPath,
      live: true
    });
  }
  return [...byId.values()].sort(
    (a, b) => Number(b.live === true) - Number(a.live === true) || a.id.localeCompare(b.id)
  );
}
async function readProviderProfile(settingsScope, provider) {
  try {
    const mirror = settingsScope?.describe?.();
    if (typeof mirror?.ensure === "function") await mirror.ensure();
    const snap = typeof mirror?.getSnapshot === "function" ? mirror.getSnapshot() : void 0;
    const described = snap?.view;
    const views = Array.isArray(described) ? described : described?.namespaces ?? [];
    const ns = provider.settingsNs;
    if (!ns) return {};
    const view = views.find((v) => v?.ns === ns);
    let node = view?.value;
    for (const key of provider.settingsPath ?? []) node = node?.[key];
    const pick = (key) => {
      const value = node?.[key];
      return typeof value === "string" && value.trim() !== "" ? value.trim() : void 0;
    };
    const out = {};
    const baseURL = pick("baseURL") ?? pick("baseUrl");
    if (baseURL) out.baseURL = baseURL;
    const api = pick("api");
    if (api) out.api = api;
    return out;
  } catch {
    return {};
  }
}
function explainDiscoveryFailure(e, provider) {
  const msg = String(e?.error?.message ?? e?.message ?? e ?? "未知错误");
  if (/no model discovery/i.test(msg)) {
    return `「${provider.id}」用的 DSH 适配器不支持自动获取模型——下拉里已经列出价目表里记录过的模型，也可以点「手填」自己写`;
  }
  if (/ships no catalog/i.test(msg)) {
    return `「${provider.id}」是自定义路由，DSH 里没给它 baseURL，问不到模型清单——去「模型」页补个 baseURL，或在这里点「手填」`;
  }
  return `获取失败：${msg}`;
}
async function discoverProviderModels(remote, provider, profile = {}) {
  const llm = remote?.llm;
  if (!llm || typeof llm.discoverModels !== "function") throw new Error("当前连接不支持自动获取模型");
  if (!provider.settingsNs) throw new Error(`DSH 里没有「${provider.id}」的可配置条目，取不了模型——请手动填写`);
  const request = { provider: provider.id };
  if (profile.baseURL) request.baseURL = profile.baseURL;
  if (profile.api) request.api = profile.api;
  let answer;
  try {
    answer = await llm.discoverModels(provider.settingsNs, request);
  } catch (e) {
    throw new Error(explainDiscoveryFailure(e, provider));
  }
  if (answer && answer.ok === false) throw new Error(explainDiscoveryFailure(answer, provider));
  if (answer?.kind === "refused") throw new Error(String(answer.message ?? "供应商拒绝了这次探测"));
  const rows = asRows(answer?.models ?? answer?.value ?? answer);
  const ids = rows.map((row) => String(row?.id ?? row ?? "").trim()).filter(Boolean);
  if (ids.length === 0) {
    throw new Error(`「${provider.id}」没有返回模型；下拉里已有价目表记录过的模型，也可以点「手填」自己写`);
  }
  return [...new Set(ids)];
}
function BillingCard(props) {
  const scope = props.scope;
  const remote = props.remote;
  const subscribe = React.useCallback((cb) => scope.subscribe(cb), [scope]);
  const getSnapshot = React.useCallback(() => scope.getSnapshot(), [scope]);
  const snap = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [expanded, setExpanded] = React.useState(null);
  const [draft, setDraft] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [catalog, setCatalog] = React.useState({
    status: "loading",
    providers: [],
    note: null
  });
  const [discovered, setDiscovered] = React.useState([]);
  const [probe, setProbe] = React.useState({ busy: false, note: null });
  const [manual, setManual] = React.useState({ provider: false, model: false });
  const [scale, setScale] = React.useState(() => readFontScale());
  const [prices, setPrices] = React.useState({ status: "idle", catalog: null, note: null });
  const modelTouched = React.useRef(false);
  const autoLabel = React.useRef(null);
  const base = snap.base ?? {};
  const user = snap.user ?? {};
  const keys = Array.from(/* @__PURE__ */ new Set([...Object.keys(base), ...Object.keys(user)]));
  const set = (patch) => {
    setError(null);
    setDraft((prev) => prev ? { ...prev, ...patch } : prev);
  };
  const reloadCatalog = React.useCallback(() => {
    setCatalog((prev) => ({ ...prev, status: "loading", note: null }));
    loadProviderCatalog(remote).then(
      (providers) => setCatalog({
        status: "ready",
        providers,
        note: providers.length > 0 ? null : "DSH 里还没有配置任何供应商，先到「模型」页添加一个"
      })
    ).catch(
      (e) => setCatalog({ status: "error", providers: [], note: `读取 DSH 供应商失败：${e instanceof Error ? e.message : String(e)}` })
    );
  }, [remote]);
  React.useEffect(() => {
    reloadCatalog();
  }, [reloadCatalog]);
  const providerId = (draft?.provider ?? "").trim();
  React.useEffect(() => {
    setDiscovered([]);
    setProbe({ busy: false, note: null });
  }, [providerId]);
  const tableModels = React.useMemo(() => {
    const out = /* @__PURE__ */ new Set();
    for (const entry of [...Object.values(base), ...Object.values(user)]) {
      if (!entry) continue;
      const p = (entry.provider ?? "").toLowerCase();
      if (p !== "" && p !== providerId.toLowerCase()) continue;
      if (entry.model) out.add(entry.model);
    }
    return [...out].sort((a, b) => a.localeCompare(b));
  }, [base, user, providerId]);
  const modelOptions = React.useMemo(() => {
    const out = new Set(discovered);
    for (const m of tableModels) out.add(m);
    if (draft?.model) out.add(draft.model);
    return [...out];
  }, [discovered, tableModels, draft?.model]);
  const matchedProviderId = (() => {
    const cur = (draft?.provider ?? "").trim().toLowerCase();
    if (!cur) return "";
    const hit = catalog.providers.find((p) => p.id.toLowerCase() === cur);
    return hit ? hit.id : "";
  })();
  const providerSelectValue = matchedProviderId || (draft?.provider ?? "").trim();
  const pickProvider = (value) => {
    const known = PROVIDER_TIMEZONE[value.trim().toLowerCase()];
    set(known ? { provider: value, timezone: known } : { provider: value });
  };
  const fetchModels = async () => {
    if (!draft) return;
    const id = draft.provider.trim();
    if (!id) {
      setProbe({ busy: false, note: "先在左边选一个供应商，再点「获取模型」" });
      return;
    }
    setProbe({ busy: true, note: "正在向供应商查询模型…" });
    try {
      const target = catalog.providers.find((p) => p.id.toLowerCase() === id.toLowerCase()) ?? { id, label: id };
      const profile = await readProviderProfile(props.settingsScope, target);
      const ids = await discoverProviderModels(remote, target, profile);
      setDiscovered(ids);
      setProbe({ busy: false, note: `拿到 ${ids.length} 个模型，从下拉里挑一个；价格照旧填好再保存` });
      if (!draft.model.trim() || !ids.includes(draft.model)) set({ model: ids[0] });
    } catch (e) {
      setProbe({ busy: false, note: e instanceof Error ? e.message : String(e) });
    }
  };
  const applyCatalogPrices = (match) => {
    const entry = match.entry;
    const patch = { currency: entry.currency === "USD" ? "USD" : "CNY" };
    if (entry.peak && entry.valley) {
      patch.isPeak = true;
      patch.peakHit = String(entry.peak.hit);
      patch.peakMiss = String(entry.peak.miss);
      patch.peakOutput = String(entry.peak.output);
      patch.valleyHit = String(entry.valley.hit);
      patch.valleyMiss = String(entry.valley.miss);
      patch.valleyOutput = String(entry.valley.output);
      if (Array.isArray(entry.peak.when) && entry.peak.when.length > 0) {
        patch.whenText = serializeCatalogWhen(entry.peak.when);
      }
      if (entry.timezone) patch.timezone = entry.timezone;
    } else if (entry.const) {
      patch.isPeak = false;
      patch.flatHit = String(entry.const.hit);
      patch.flatMiss = String(entry.const.miss);
      patch.flatOutput = String(entry.const.output);
    } else {
      return;
    }
    const currentLabel = draft === null ? "" : draft.label.trim();
    if (entry.label && (currentLabel === "" || currentLabel === autoLabel.current)) {
      patch.label = entry.label;
      autoLabel.current = entry.label;
    }
    set(patch);
    const shape = entry.peak && entry.valley ? "峰谷价" : "一口价";
    const scope2 = match.providerMatched ? "" : "（仅按模型名匹配，供应商没识别出来）";
    setPrices((prev) => ({ ...prev, note: `${scope2}已按目录价填入${shape}：${entry.label ?? entry.model}` }));
  };
  const refreshPrices = async (force, thenApply) => {
    setPrices((prev) => ({ ...prev, status: "loading" }));
    const catalog2 = await loadPriceCatalog(force);
    if (catalog2 === null) {
      setPrices({ status: "error", catalog: null, note: "价格目录拉取失败：稍后再点一次「刷新价格」，或直接手填" });
      return;
    }
    setPrices({ status: "ready", catalog: catalog2, note: null });
    if (!thenApply || draft === null) return;
    const match = lookupCatalog(catalog2, draft.provider, draft.model);
    if (match === null) {
      setPrices((prev) => ({ ...prev, note: `目录里没有「${draft.model.trim() || "（模型为空）"}」或其供应商不匹配` }));
      return;
    }
    applyCatalogPrices(match);
  };
  React.useEffect(() => {
    if (draft === null) return;
    if (expanded !== "__new__" && !modelTouched.current) return;
    const model = draft.model.trim();
    if (model === "") return;
    let cancelled = false;
    void (async () => {
      const catalog2 = await loadPriceCatalog(false);
      if (cancelled || catalog2 === null) return;
      const match = lookupCatalog(catalog2, draft.provider, model);
      if (match !== null) applyCatalogPrices(match);
    })();
    return () => {
      cancelled = true;
    };
  }, [expanded, draft?.provider, draft?.model]);
  const open = (key) => {
    setError(null);
    modelTouched.current = false;
    if (key === null) {
      setExpanded(null);
      setDraft(null);
      return;
    }
    const entry = key === "__new__" ? void 0 : user[key] ?? base[key];
    setDraft(entry ? draftFromEntry(entry) : emptyDraft());
    setExpanded(key);
  };
  const save = async () => {
    if (!draft || !expanded) return;
    const err = validateDraft(draft);
    if (err) {
      setError(err);
      return;
    }
    const entry = buildEntry(draft);
    const key = expanded === "__new__" ? entryKey(entry) : expanded;
    setBusy(true);
    try {
      const r = await scope.set(key, entry);
      const bad = r && r.result && r.result.ok === false ? r.result.error?.message : null;
      if (bad) {
        setError(`保存被拒绝：${bad}`);
        return;
      }
      setExpanded(null);
      setDraft(null);
    } catch (e) {
      setError(`保存失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (key) => {
    setBusy(true);
    try {
      await scope.unset(key);
      setExpanded(null);
      setDraft(null);
    } catch (e) {
      setError(`操作失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };
  if (snap.status === "loading") {
    return el("div", { className: "axia_set_card" }, el("span", { className: "axia_set_muted" }, "价目表加载中…"));
  }
  if (snap.status === "unavailable") {
    const anyKnown = Object.keys(snap.base ?? {}).length > 0 || Object.keys(snap.user ?? {}).length > 0;
    if (!anyKnown) {
      return el(
        "div",
        { className: "axia_set_card" },
        el(
          "span",
          { className: "axia_set_muted" },
          "当前连接不是本机回环（例如手机经局域网打开），DSH 不回传价目表内容，所以这里看不到条目。"
        ),
        el(
          "span",
          { className: "axia_set_muted" },
          "在跑 dsh 的那台机器上用 127.0.0.1:3080 打开设置即可查看/编辑；上下文圆环里的账单不受影响，手机上照常显示。"
        )
      );
    }
  }
  const tzFor = (provider) => {
    const p = provider.trim().toLowerCase();
    if (p && PROVIDER_TIMEZONE[p]) return { auto: true, tz: PROVIDER_TIMEZONE[p] };
    return { auto: false, tz: draft?.timezone ?? "Asia/Shanghai" };
  };
  const tried = error !== null;
  const editor = draft === null ? null : el(
    "div",
    { className: "axia_set_editor" },
    el(
      "div",
      { className: "axia_set_grid" },
      field(
        "供应商",
        el(
          "div",
          { className: "axia_set_fieldrow" },
          manual.provider ? el("input", {
            className: "axia_set_input axia_set_input_grow axia_set_input_mono",
            value: draft.provider,
            onChange: (e) => pickProvider(e.target.value),
            placeholder: "deepseek-official，留空 = 通配"
          }) : el(
            "select",
            {
              className: "axia_set_select axia_set_input_grow",
              value: providerSelectValue,
              disabled: catalog.status !== "ready",
              onChange: (e) => pickProvider(e.target.value)
            },
            el("option", { value: "" }, "（留空 = 全部路由通配）"),
            catalog.providers.map((p) => el("option", { key: p.id, value: p.id }, providerOptionLabel(p))),
            matchedProviderId === "" && providerSelectValue !== "" ? el("option", { value: providerSelectValue }, `（当前：${providerSelectValue}）`) : null
          ),
          el(
            "button",
            {
              type: "button",
              className: "axia_set_btn axia_set_btn_mini",
              onClick: () => setManual((m) => ({ ...m, provider: !m.provider }))
            },
            manual.provider ? "下拉" : "手填"
          ),
          el(
            "button",
            {
              type: "button",
              className: "axia_set_btn axia_set_btn_mini",
              disabled: catalog.status === "loading",
              onClick: () => reloadCatalog()
            },
            catalog.status === "loading" ? "读取中…" : "刷新"
          )
        )
      ),
      field(
        "模型",
        el(
          "div",
          { className: "axia_set_fieldrow" },
          manual.model || modelOptions.length === 0 ? el("input", {
            className: "axia_set_input axia_set_input_grow axia_set_input_mono",
            value: draft.model,
            onChange: (e) => {
              modelTouched.current = true;
              set({ model: e.target.value });
            },
            placeholder: "deepseek-flash"
          }) : el(
            "select",
            {
              className: "axia_set_select axia_set_input_grow",
              value: modelOptions.includes(draft.model) ? draft.model : "",
              onChange: (e) => {
                modelTouched.current = true;
                set({ model: e.target.value });
              }
            },
            el("option", { value: "" }, "（选一个模型）"),
            modelOptions.map((m) => el("option", { key: m, value: m }, m))
          ),
          el(
            "button",
            {
              type: "button",
              className: "axia_set_btn axia_set_btn_mini",
              disabled: probe.busy,
              onClick: () => void fetchModels()
            },
            probe.busy ? "获取中…" : "获取模型"
          ),
          el(
            "button",
            {
              type: "button",
              className: "axia_set_btn axia_set_btn_mini",
              onClick: () => setManual((m) => ({ ...m, model: !m.model }))
            },
            manual.model ? "下拉" : "手填"
          )
        )
      )
    ),
    field(
      "版本名（可选，只用于显示）",
      el("input", {
        className: "axia_set_input axia_set_input_mono",
        value: draft.label,
        onChange: (e) => set({ label: e.target.value }),
        placeholder: "DeepSeek-V4.1-Flash"
      })
    ),
    el(
      "div",
      { className: "axia_set_fieldrow" },
      el("span", { className: "axia_set_label" }, "计价方式"),
      el(
        "div",
        { className: "axia_set_seg" },
        el(
          "button",
          {
            type: "button",
            className: "axia_set_segbtn" + (draft.isPeak ? "" : " axia_set_segbtn_on"),
            onClick: () => set({ isPeak: false })
          },
          "一口价"
        ),
        el(
          "button",
          {
            type: "button",
            className: "axia_set_segbtn" + (draft.isPeak ? " axia_set_segbtn_on" : ""),
            onClick: () => set({ isPeak: true })
          },
          "峰谷价"
        )
      ),
      el("span", { className: "axia_set_label", style: { marginLeft: "10px" } }, "币种"),
      el(
        "div",
        { className: "axia_set_seg" },
        el(
          "button",
          {
            type: "button",
            className: "axia_set_segbtn" + (draft.currency === "USD" ? "" : " axia_set_segbtn_on"),
            onClick: () => set({ currency: "CNY" })
          },
          "元 ¥"
        ),
        el(
          "button",
          {
            type: "button",
            className: "axia_set_segbtn" + (draft.currency === "USD" ? " axia_set_segbtn_on" : ""),
            onClick: () => set({ currency: "USD" })
          },
          "美元 $"
        )
      )
    ),
    draft.isPeak ? el(
      "div",
      { className: "axia_set_grid" },
      field(
        "峰时段（[天][时段]，多组用 + 连接）",
        el("input", {
          className: "axia_set_input axia_set_input_mono" + (tried && !draft.whenText.trim() ? " axia_set_input_err" : ""),
          value: draft.whenText,
          onChange: (e) => set({ whenText: e.target.value }),
          placeholder: "[mon-fri][09:00-12:00, 14:00-18:00]"
        })
      ),
      tzFor(draft.provider).auto ? el(
        "div",
        { className: "axia_set_field" },
        el("span", { className: "axia_set_label" }, "时区"),
        el("span", { className: "axia_set_muted" }, `自动：${tzFor(draft.provider).tz}`)
      ) : field(
        "时区（IANA）",
        el("input", {
          className: "axia_set_input axia_set_input_mono" + (tried && !draft.timezone.trim() ? " axia_set_input_err" : ""),
          value: draft.timezone,
          onChange: (e) => set({ timezone: e.target.value }),
          placeholder: "Asia/Shanghai"
        })
      )
    ) : null,
    el(
      "div",
      { className: "axia_set_fieldrow" },
      el("span", { className: "axia_set_label" }, "价格目录"),
      el(
        "button",
        {
          type: "button",
          className: "axia_set_btn axia_set_btn_mini",
          onClick: () => void refreshPrices(false, true)
        },
        "套用目录价"
      ),
      el(
        "button",
        {
          type: "button",
          className: "axia_set_btn axia_set_btn_mini",
          disabled: prices.status === "loading",
          onClick: () => void refreshPrices(true, true)
        },
        prices.status === "loading" ? "拉取中…" : "刷新价格"
      ),
      prices.catalog !== null ? el("span", { className: "axia_set_hint" }, `目录更新于 ${prices.catalog.updatedAt}`) : null
    ),
    prices.note ? el("p", { className: "axia_set_note" }, prices.note) : null,
    el(
      "div",
      { className: "axia_set_prices" },
      el(
        "div",
        { className: "axia_set_prices_head" },
        el("span", { className: "axia_set_prices_title" }, draft.isPeak ? "峰价" : "价格"),
        el("span", { className: "axia_set_unit" }, draft.currency === "USD" ? "美元 / 百万 token" : "元 / 百万 token")
      ),
      el(PriceInputs, { d: draft, set, mode: draft.isPeak ? "peak" : "flat" }),
      draft.isPeak ? el("div", { className: "axia_set_prices_head" }, el("span", { className: "axia_set_prices_title" }, "谷价")) : null,
      draft.isPeak ? el(PriceInputs, { d: draft, set, mode: "valley" }) : null
    ),
    catalog.note || probe.note ? el("p", { className: "axia_set_note" }, probe.note ?? catalog.note) : null,
    error ? el("div", { className: "axia_set_err" }, error) : null,
    el(
      "div",
      { className: "axia_set_actions" },
      el(
        "button",
        { type: "button", className: "axia_set_btn axia_set_btn_primary", disabled: busy, onClick: () => void save() },
        busy ? "保存中…" : "保存"
      ),
      el("button", { type: "button", className: "axia_set_btn", disabled: busy, onClick: () => open(null) }, "取消"),
      expanded !== null && expanded !== "__new__" ? el(
        "button",
        {
          type: "button",
          className: "axia_set_btn axia_set_btn_danger",
          disabled: busy,
          onClick: () => void remove(expanded)
        },
        "恢复预填 / 删除"
      ) : null,
      expanded !== null && expanded !== "__new__" && expanded in base ? el("span", { className: "axia_set_hint" }, "编辑预填会生成覆盖") : null
    )
  );
  const rowsFor = (key) => {
    const entry = user[key] ?? base[key];
    if (!entry) return null;
    const inBase = key in base;
    const inUser = key in user;
    const badge = inBase && inUser ? el("span", { className: "axia_set_badge axia_set_badge_override" }, "已覆盖") : inUser && !inBase ? el("span", { className: "axia_set_badge axia_set_badge_custom" }, "自定义") : el("span", { className: "axia_set_badge axia_set_badge_prefill" }, "预填");
    if (expanded === key) return editor;
    return el(
      "div",
      { key, className: "axia_set_row", onClick: () => open(key) },
      el(
        "div",
        { className: "axia_set_rowmain" },
        el("span", { className: "axia_set_model" }, entry.model),
        entry.label || entry.currency === "USD" ? el(
          "span",
          { className: "axia_set_ver" },
          [entry.label ?? "", entry.currency === "USD" ? "美元计价" : ""].filter(Boolean).join(" · ")
        ) : null
      ),
      el("span", { className: "axia_set_spacer" }),
      el("span", { className: "axia_set_badge axia_set_badge_tier" }, entry.peak ? "峰谷" : "一口价"),
      badge,
      el("span", { className: "axia_set_chev" }, "›")
    );
  };
  const groups = (() => {
    const map = /* @__PURE__ */ new Map();
    for (const key of keys) {
      const entry = user[key] ?? base[key];
      if (!entry) continue;
      const name = entry.provider ?? "全部路由";
      const list = map.get(name) ?? [];
      list.push(rowsFor(key));
      map.set(name, list);
    }
    return [...map.entries()].map(([name, rows]) => ({ name, rows }));
  })();
  const total = groups.reduce((sum, g) => sum + g.rows.length, 0);
  const expandedIsNew = expanded === "__new__";
  return el(
    "div",
    { className: "axia_set_card" },
    el(
      "p",
      { className: "axia_set_legend" },
      el("span", null, el("b", null, "预填"), " 插件自带，跟随版本更新"),
      el("span", null, el("b", null, "你的修改"), " 存在 DSH 设置里，改完即时生效"),
      el("span", null, el("b", null, "点任意一行"), " 展开编辑")
    ),
    !snap.writable ? el("span", { className: "axia_set_muted" }, "当前连接为只读（设置写入仅限本机回环连接）。") : null,
    el(
      "div",
      { className: "axia_set_toolbar" },
      el(
        "button",
        {
          type: "button",
          className: "axia_set_btn axia_set_btn_primary",
          onClick: () => open("__new__"),
          disabled: expandedIsNew || !snap.writable
        },
        "＋ 添加条目"
      ),
      el("span", { className: "axia_set_spacer" }),
      el("span", { className: "axia_set_label" }, "弹层字号"),
      el(
        "div",
        {
          className: "axia_set_seg",
          title: "只放大/缩小上下文弹层里的账单；本设置页永远保持标准大小"
        },
        FONT_SCALES.map(
          (s) => el(
            "button",
            {
              key: s.value,
              type: "button",
              className: "axia_set_segbtn" + (scale === s.value ? " axia_set_segbtn_on" : ""),
              onClick: () => {
                setScale(s.value);
                applyFontScale(s.value);
              }
            },
            s.label
          )
        )
      ),
      el("span", { className: "axia_set_hint" }, "只影响上下文弹层（账单区），设置页保持标准"),
      el("span", { className: "axia_set_count" }, `共 ${total} 条`)
    ),
    expandedIsNew ? editor : null,
    ...groups.map(
      (g) => el(
        "div",
        { key: g.name, className: "axia_set_group" },
        el("div", { className: "axia_set_grouphead" }, el("span", null, g.name), el("span", null, `· ${g.rows.length}`)),
        ...g.rows
      )
    )
  );
}
function applySettings(ctx) {
  applyFontScale(readFontScale());
  if (typeof document !== "undefined") {
    const existing = document.querySelector(`style[data-plugin-css="${CSS_ID}"]`);
    if (existing !== null) {
      existing.textContent = CSS;
    } else {
      const tag = document.createElement("style");
      tag.dataset.plugin = "dsh-axia-cachebilling-settings";
      tag.dataset.pluginCss = CSS_ID;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }
  }
  const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NS });
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
      {
        name: "settings.section",
        id: SETTINGS_NS,
        order: 30,
        label: () => "虾算账",
        inject: () => ({ scope, remote: ctx.remote, settingsScope: ctx.settingsScope })
      },
      BillingSection
    )
  );
}
function BillingSection(props) {
  return el(
    "div",
    { className: "axia_set_page" },
    el(
      "div",
      { className: "axia_set_head" },
      el("h2", { className: "axia_set_title" }, "虾算账"),
      el(
        "p",
        { className: "axia_set_subtitle" },
        "上下文缓存到底花了多少钱。供应商和模型直接从 DSH 已配置的列表里挑，模型可一键拉取清单；改完即时生效，无需重启。"
      )
    ),
    el(BillingCard, { scope: props.scope, remote: props.remote, settingsScope: props.settingsScope })
  );
}

// src/client.ts
var CSS_ID2 = "dsh-axia-cachebilling-css";
var CSS2 = `
/* 所有尺寸乘 --axia-fs（字号档位，见 settings.ts 的 applyFontScale）：大屏远距离直接调档，不用动浏览器缩放 */
.axia_bill {
  margin-top: calc(10px * var(--axia-fs, 1));
  padding-top: calc(10px * var(--axia-fs, 1));
  border-top: 1px solid var(--dsw-alias-border-l3, rgba(255, 255, 255, 0.08));
  position: relative;
}
.axia_bill::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent);
}
.axia_grid {
  display: grid;
  grid-template-columns: max-content repeat(4, minmax(0, 1fr));
  column-gap: calc(10px * var(--axia-fs, 1));
  row-gap: calc(2px * var(--axia-fs, 1));
  margin-top: calc(4px * var(--axia-fs, 1));
  align-items: baseline;
  font-size: calc(10px * var(--axia-fs, 1));
  line-height: calc(14px * var(--axia-fs, 1));
  text-align: center;
}
.axia_lab { color: var(--dsw-alias-label-secondary); font-weight: 400; white-space: nowrap; }
.axia_t { color: var(--dsw-alias-label-primary); font-weight: 500; font-variant-numeric: tabular-nums; }
.axia_h { color: var(--dsw-alias-label-secondary); font-weight: 400; text-align: center; white-space: nowrap; }
.axia_v { font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-primary); font-weight: 500; text-align: center; }

/* 标题区：微发光货币芯片与排版 */
.axia_sechead {
  display: flex;
  align-items: center;
  gap: calc(7px * var(--axia-fs, 1));
  color: var(--dsw-alias-label-primary, #ffffff);
  margin: calc(4px * var(--axia-fs, 1)) 0 calc(6px * var(--axia-fs, 1));
  font-size: calc(12px * var(--axia-fs, 1));
  font-weight: 600;
  letter-spacing: 0.2px;
}
.axia_sechead_icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(18px * var(--axia-fs, 1));
  height: calc(18px * var(--axia-fs, 1));
  border-radius: 5px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(236, 72, 153, 0.18) 100%);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.35);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.15);
  flex: none;
}
.axia_subhead { color: var(--dsw-alias-label-secondary); font-size: calc(10px * var(--axia-fs, 1)); line-height: calc(14px * var(--axia-fs, 1)); font-weight: 700; }
.axia_foot { margin-top: calc(6px * var(--axia-fs, 1)); color: var(--dsw-alias-label-caption); font-size: calc(10px * var(--axia-fs, 1)); line-height: calc(14px * var(--axia-fs, 1)); }
.axia_notice {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 8px;
  padding: calc(6px * var(--axia-fs, 1)) calc(9px * var(--axia-fs, 1));
  color: #fbbf24;
  font-size: calc(10px * var(--axia-fs, 1));
  line-height: calc(14px * var(--axia-fs, 1));
  margin-bottom: calc(6px * var(--axia-fs, 1));
}

/* 账单卡片（现代化 Bento 质感）：浅底 + 细微渐变描边 + 悬浮微动效 */
.axia_card {
  position: relative;
  background: color-mix(in srgb, currentColor 3.5%, transparent);
  border: 1px solid var(--dsw-alias-border-l4, rgba(255, 255, 255, 0.08));
  border-radius: calc(10px * var(--axia-fs, 1));
  display: flex;
  flex-direction: column;
  gap: calc(5px * var(--axia-fs, 1));
  margin-top: calc(6px * var(--axia-fs, 1));
  padding: calc(8px * var(--axia-fs, 1)) calc(12px * var(--axia-fs, 1));
  transition: border-color 0.18s ease, transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease, background 0.18s ease;
  backdrop-filter: blur(12px);
}
.axia_card:hover {
  border-color: var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.18));
  background: color-mix(in srgb, currentColor 6%, transparent);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.3);
}

/* 本会话总卡片（Hero Card 高光瞩目）：渐变微光 + 优雅淡紫光环 */
.axia_card_hero {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.06) 50%, color-mix(in srgb, currentColor 3%, transparent) 100%);
  border: 1px solid rgba(139, 92, 246, 0.32);
  box-shadow: 0 4px 18px -4px rgba(99, 102, 241, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.08);
}
.axia_card_hero:hover {
  border-color: rgba(168, 85, 247, 0.55);
  box-shadow: 0 6px 22px -4px rgba(139, 92, 246, 0.32), inset 0 1px 1px rgba(255, 255, 255, 0.15);
}
.axia_cardhead {
  align-items: baseline;
  display: flex;
  gap: calc(8px * var(--axia-fs, 1));
  justify-content: space-between;
}
.axia_cardname {
  color: var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.7));
  font-size: calc(10.5px * var(--axia-fs, 1));
  font-weight: 500;
  letter-spacing: 0.1px;
}
.axia_card_hero .axia_cardname {
  color: #c4b5fd;
  font-weight: 600;
}
.axia_cardsum {
  color: var(--dsw-alias-label-primary, #ffffff);
  font-size: calc(14.5px * var(--axia-fs, 1));
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: calc(18px * var(--axia-fs, 1));
  white-space: nowrap;
}
.axia_card_hero .axia_cardsum {
  font-size: calc(15.5px * var(--axia-fs, 1));
  color: #ffffff;
  text-shadow: 0 0 12px rgba(168, 85, 247, 0.35);
}
.axia_sym {
  font-size: 0.82em;
  opacity: 0.75;
  margin-right: 1px;
  font-weight: 600;
}
.axia_num {
  font-weight: 700;
}
.axia_plus {
  opacity: 0.45;
  font-size: 0.85em;
  margin: 0 2px;
}

/* 芯片明细行 */
.axia_chips {
  display: flex;
  flex-wrap: wrap;
  gap: calc(3px * var(--axia-fs, 1)) calc(8px * var(--axia-fs, 1));
}
.axia_chip {
  align-items: center;
  display: inline-flex;
  gap: calc(4px * var(--axia-fs, 1));
  white-space: nowrap;
  background: color-mix(in srgb, currentColor 3%, transparent);
  border: 1px solid var(--dsw-alias-border-l4, rgba(255, 255, 255, 0.05));
  border-radius: calc(5px * var(--axia-fs, 1));
  padding: calc(1.5px * var(--axia-fs, 1)) calc(6px * var(--axia-fs, 1));
  transition: background 0.15s ease;
}
.axia_chip:hover {
  background: color-mix(in srgb, currentColor 6%, transparent);
}
.axia_chipdot {
  width: calc(5px * var(--axia-fs, 1));
  height: calc(5px * var(--axia-fs, 1));
  border-radius: 50%;
  flex: none;
}
.axia_dot_hit {
  background: #10b981;
  box-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
}
.axia_dot_miss {
  background: #f59e0b;
  box-shadow: 0 0 5px rgba(245, 158, 11, 0.5);
}
.axia_dot_out {
  background: #8b5cf6;
  box-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
}
.axia_chiplab {
  color: var(--dsw-alias-label-caption, rgba(255, 255, 255, 0.5));
  font-size: calc(9px * var(--axia-fs, 1));
  line-height: calc(13px * var(--axia-fs, 1));
}
.axia_chipval {
  color: var(--dsw-alias-label-primary, rgba(255, 255, 255, 0.9));
  font-size: calc(9.5px * var(--axia-fs, 1));
  font-variant-numeric: tabular-nums;
  line-height: calc(13px * var(--axia-fs, 1));
  font-weight: 550;
}
/* ── 参考图版式：数值卡片网格 + Token 环形图 ───────────────────── */
.axia_panel { background: color-mix(in srgb, currentColor 3.5%, transparent); border: 1px solid var(--dsw-alias-border-l4, rgba(255,255,255,.08)); border-radius: calc(12px * var(--axia-fs,1)); display: flex; flex-direction: column; gap: calc(7px * var(--axia-fs,1)); margin-top: calc(7px * var(--axia-fs,1)); padding: calc(9px * var(--axia-fs,1)); }
.axia_panelhead { color: var(--dsw-alias-label-primary); font-size: calc(11px * var(--axia-fs,1)); font-weight: 650; line-height: calc(15px * var(--axia-fs,1)); }
.axia_tiles { display: grid; gap: calc(6px * var(--axia-fs,1)); grid-template-columns: repeat(2, minmax(0,1fr)); }
.axia_tile { background: color-mix(in srgb, currentColor 4%, transparent); border: 1px solid var(--dsw-alias-border-l4, rgba(255,255,255,.08)); border-radius: calc(9px * var(--axia-fs,1)); display: flex; flex-direction: column; gap: calc(3px * var(--axia-fs,1)); padding: calc(6px * var(--axia-fs,1)) calc(8px * var(--axia-fs,1)); }
.axia_tilelab { color: var(--dsw-alias-label-secondary); font-size: calc(9px * var(--axia-fs,1)); line-height: calc(12px * var(--axia-fs,1)); }
.axia_tileval { color: var(--dsw-alias-label-primary); font-size: calc(15px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; font-weight: 600; line-height: calc(19px * var(--axia-fs,1)); text-align: right; }
.axia_ringbody { align-items: center; display: flex; gap: calc(12px * var(--axia-fs,1)); }
.axia_ringwrap { flex: none; position: relative; width: calc(96px * var(--axia-fs,1)); }
.axia_ring { display: block; height: auto; width: 100%; }
.axia_ringpct { color: var(--dsw-alias-label-primary); font-size: calc(13px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; font-weight: 650; left: 0; line-height: calc(16px * var(--axia-fs,1)); position: absolute; right: 0; text-align: center; top: calc(37px * var(--axia-fs,1)); }
.axia_ringsub { color: var(--dsw-alias-label-caption); font-size: calc(8.5px * var(--axia-fs,1)); left: 0; line-height: calc(11px * var(--axia-fs,1)); position: absolute; right: 0; text-align: center; top: calc(53px * var(--axia-fs,1)); }
.axia_legend { display: flex; flex: 1; flex-direction: column; gap: calc(5px * var(--axia-fs,1)); min-width: 0; }
.axia_legenditem { display: flex; flex-direction: column; gap: calc(1px * var(--axia-fs,1)); }
.axia_legendrow { align-items: center; display: flex; gap: calc(6px * var(--axia-fs,1)); }
.axia_legenddot { border-radius: 2px; flex: none; height: calc(8px * var(--axia-fs,1)); width: calc(8px * var(--axia-fs,1)); }
.axia_legendlab { color: var(--dsw-alias-label-secondary); flex: 1; font-size: calc(9.5px * var(--axia-fs,1)); line-height: calc(13px * var(--axia-fs,1)); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.axia_legendval { color: var(--dsw-alias-label-primary); font-size: calc(10px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; font-weight: 600; }
.axia_legendsub { color: var(--dsw-alias-label-caption); font-size: calc(8.5px * var(--axia-fs,1)); line-height: calc(11px * var(--axia-fs,1)); padding-left: calc(14px * var(--axia-fs,1)); }

/* 底部模型微胶囊 */
.axia_modelpill {
  display: inline-flex;
  align-items: center;
  gap: calc(6px * var(--axia-fs, 1));
  align-self: flex-start;
  background: color-mix(in srgb, currentColor 3.5%, transparent);
  border: 1px solid var(--dsw-alias-border-l4, rgba(255, 255, 255, 0.08));
  border-radius: 999px;
  color: var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.7));
  font-size: calc(9.5px * var(--axia-fs, 1));
  line-height: calc(13px * var(--axia-fs, 1));
  margin-top: calc(7px * var(--axia-fs, 1));
  padding: calc(3px * var(--axia-fs, 1)) calc(10px * var(--axia-fs, 1));
  backdrop-filter: blur(8px);
}
.axia_pill_model {
  font-weight: 500;
}
.axia_pill_tier {
  font-size: calc(8.5px * var(--axia-fs, 1));
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 600;
}
.axia_pill_tier.is-valley {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}
.axia_pill_tier.is-peak {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}
.axia_pill_tier.is-flat {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}
.axia_pill_unit {
  color: var(--dsw-alias-label-caption, rgba(255, 255, 255, 0.45));
}

/* 手机矮视口适配 */
[role="dialog"][aria-label*="上下文已用"],
[role="dialog"][aria-label*="of context used"] {
  max-height: calc(100vh - 140px);
  max-height: calc(100dvh - 140px);
  min-width: min(calc(264px * var(--axia-fs,1)), calc(100vw - 20px));
  min-width: min(calc(264px * var(--axia-fs,1)), calc(100dvw - 20px));
  max-width: calc(100vw - 20px);
  max-width: calc(100dvw - 20px);
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
`;
function isBillableProvider(provider) {
  return typeof provider === "string" && provider !== "";
}
function formatAmount(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return "0";
  if (amount >= 0.01) return amount.toFixed(2);
  let exp = Math.floor(Math.log10(amount));
  let sig = Math.round(amount / Math.pow(10, exp));
  if (sig >= 10) {
    exp += 1;
    sig = 1;
  }
  const value = sig * Math.pow(10, exp);
  return value >= 0.01 ? value.toFixed(2) : value.toFixed(-exp);
}
var TIER_LABEL = {
  peak: "梁文峰",
  offPeak: "梁文谷"
};
var TIER_LABEL_GENERIC = {
  peak: "峰价",
  offPeak: "谷价"
};
function isOfficialDeepSeek(provider) {
  if (typeof provider !== "string" || provider === "") return false;
  return provider.toLowerCase().includes("deepseek");
}
function secHead(doc, color, text) {
  const head = doc.createElement("div");
  head.className = "axia_sechead";
  const icon = doc.createElement("span");
  icon.className = "axia_sechead_icon";
  icon.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
  head.appendChild(icon);
  const title = doc.createElement("span");
  title.className = "axia_sechead_title";
  title.textContent = text;
  head.appendChild(title);
  return head;
}
var latestView;
function isContextPanel(node) {
  if (!(node instanceof HTMLElement)) return false;
  if (node.getAttribute("role") !== "dialog") return false;
  const label = node.getAttribute("aria-label") ?? "";
  return /of context used|上下文已用/i.test(label);
}
function renderDetails(doc, put, view) {
  const provider = view.provider ?? "";
  const tierMap = isOfficialDeepSeek(provider) ? TIER_LABEL : TIER_LABEL_GENERIC;
  const tier = view.tier ? tierMap[view.tier] : "";
  const modelLine = doc.createElement("div");
  modelLine.className = "axia_modelpill";
  const unit = view.mixedCurrency === true ? "元 + 美元" : view.currency === "USD" ? "美元" : "元";
  const tierClass = tier.includes("谷") ? "is-valley" : tier.includes("峰") ? "is-peak" : "is-flat";
  modelLine.innerHTML = `
    <span class="axia_pill_model">${provider}/${view.model ?? ""}</span>
    ${tier ? `<span class="axia_pill_tier ${tierClass}">${tier}</span>` : ""}
    <span class="axia_pill_unit">${unit}</span>
  `;
  put(modelLine);
}
function compactTokens(value) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
  return String(Math.round(value));
}
function renderStats(doc, put, view) {
  const num = (value) => Number.isFinite(value) ? value : 0;
  const money = (cny, usd) => {
    const yuan = num(cny);
    const dollar = num(usd);
    const parts = [];
    if (yuan > 0 || dollar <= 0) parts.push(`¥${formatAmount(yuan)}`);
    if (dollar > 0) parts.push(`$${formatAmount(dollar)}`);
    return parts.join(" + ");
  };
  const inputTokens = num(view.sessionInputTokens);
  const readTokens = Math.min(num(view.sessionCacheReadTokens), inputTokens);
  const outputTokens = num(view.sessionOutputTokens);
  const missTokens = Math.max(0, inputTokens - readTokens);
  const totalTokens = inputTokens + outputTokens;
  if (totalTokens <= 0) return;
  const pctOf = (value) => totalTokens > 0 ? value / totalTokens * 100 : 0;
  const hitPct = inputTokens > 0 ? readTokens / inputTokens * 100 : 0;
  const slices = [
    { pct: pctOf(readTokens), color: "#22c55e" },
    { pct: pctOf(missTokens), color: "#a855f7" },
    { pct: pctOf(outputTokens), color: "#3b82f6" }
  ];
  const second = doc.createElement("div");
  second.className = "axia_panel";
  const head2 = doc.createElement("div");
  head2.className = "axia_panelhead";
  head2.textContent = "Token 统计";
  second.appendChild(head2);
  const body = doc.createElement("div");
  body.className = "axia_ringbody";
  const SVG_NS = "http://www.w3.org/2000/svg";
  const size = 96;
  const radius = 36;
  const stroke = 11;
  const circumference = 2 * Math.PI * radius;
  const svg = doc.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("class", "axia_ring");
  let consumed = 0;
  for (const slice of slices) {
    if (slice.pct <= 0) continue;
    const arc = doc.createElementNS(SVG_NS, "circle");
    arc.setAttribute("cx", String(size / 2));
    arc.setAttribute("cy", String(size / 2));
    arc.setAttribute("r", String(radius));
    arc.setAttribute("fill", "none");
    arc.setAttribute("stroke", slice.color);
    arc.setAttribute("stroke-width", String(stroke));
    arc.setAttribute("stroke-dasharray", `${circumference * slice.pct / 100} ${circumference}`);
    arc.setAttribute("stroke-dashoffset", String(-consumed));
    arc.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
    consumed += circumference * slice.pct / 100;
    svg.appendChild(arc);
  }
  const ringWrap = doc.createElement("div");
  ringWrap.className = "axia_ringwrap";
  ringWrap.appendChild(svg);
  const centerPct = doc.createElement("div");
  centerPct.className = "axia_ringpct";
  centerPct.textContent = `${hitPct.toFixed(2)}%`;
  const centerSub = doc.createElement("div");
  centerSub.className = "axia_ringsub";
  centerSub.textContent = "缓存命中";
  ringWrap.appendChild(centerPct);
  ringWrap.appendChild(centerSub);
  body.appendChild(ringWrap);
  const legend = doc.createElement("div");
  legend.className = "axia_legend";
  const legendRow = (color, label, pct, tokens, hint) => {
    const item = doc.createElement("div");
    item.className = "axia_legenditem";
    const line = doc.createElement("div");
    line.className = "axia_legendrow";
    line.title = hint;
    const dot = doc.createElement("span");
    dot.className = "axia_legenddot";
    dot.style.background = color;
    const lab = doc.createElement("span");
    lab.className = "axia_legendlab";
    lab.textContent = label;
    const val = doc.createElement("span");
    val.className = "axia_legendval";
    val.textContent = `${pct.toFixed(1)}%`;
    line.appendChild(dot);
    line.appendChild(lab);
    line.appendChild(val);
    const sub = doc.createElement("div");
    sub.className = "axia_legendsub";
    sub.textContent = compactTokens(tokens);
    item.appendChild(line);
    item.appendChild(sub);
    legend.appendChild(item);
  };
  legendRow("#22c55e", "缓存输入", pctOf(readTokens), readTokens, "命中缓存、按缓存价计费的输入 token");
  legendRow("#a855f7", "未缓存输入", pctOf(missTokens), missTokens, "未命中缓存的输入 token（按未命中价计费）");
  legendRow("#3b82f6", "输出", pctOf(outputTokens), outputTokens, "模型生成的输出 token");
  body.appendChild(legend);
  second.appendChild(body);
  put(second);
}
function renderBill(bill) {
  const doc = bill.ownerDocument;
  if (!doc) return;
  bill.textContent = "";
  const view = latestView;
  const put = (el2) => {
    bill.appendChild(el2);
  };
  if (!view || !isBillableProvider(view.provider)) {
    return;
  }
  if (view.available !== true) {
    const empty = doc.createElement("div");
    empty.className = "axia_foot";
    empty.textContent = "缓存账单：本会话暂无 Token 用量";
    put(empty);
    return;
  }
  const cost = Number.isFinite(view.cost) ? view.cost : 0;
  const missCost = Number.isFinite(view.missCost) ? view.missCost : 0;
  const outputCost = Number.isFinite(view.outputCost) ? view.outputCost : 0;
  const symbol = view.currency === "USD" ? "$" : "¥";
  if (view.priceMatched === false) {
    const notice = doc.createElement("div");
    notice.className = "axia_notice";
    notice.textContent = "［虾算账］当前模型无价格数据，请去设置界面添加。以下为Deepseek价格，仅供参考：";
    put(notice);
  }
  put(secHead(doc, "#f59e0b", "当前会话统计"));
  const money2 = (cny, usd) => {
    const parts = [];
    if (cny > 0 || usd <= 0) {
      parts.push(`<span class="axia_sym">¥</span><span class="axia_num">${formatAmount(cny)}</span>`);
    }
    if (usd > 0) {
      parts.push(`<span class="axia_sym">$</span><span class="axia_num">${formatAmount(usd)}</span>`);
    }
    return parts.join('<span class="axia_plus"> + </span>');
  };
  const moneyChip = (cny, usd) => {
    const parts = [];
    if (cny > 0 || usd <= 0) parts.push(`¥${formatAmount(cny)}`);
    if (usd > 0) parts.push(`$${formatAmount(usd)}`);
    return parts.join(" + ");
  };
  const n = (value) => Number.isFinite(value) ? value : 0;
  const tableRow = (label, totalHtml, hit, miss, out, isHero = false) => {
    const box = doc.createElement("div");
    box.className = `axia_card ${isHero ? "axia_card_hero" : ""}`;
    const head = doc.createElement("div");
    head.className = "axia_cardhead";
    const name = doc.createElement("span");
    name.className = "axia_cardname";
    name.textContent = label;
    const sum = doc.createElement("span");
    sum.className = "axia_cardsum";
    sum.innerHTML = totalHtml;
    head.appendChild(name);
    head.appendChild(sum);
    box.appendChild(head);
    const chips = doc.createElement("div");
    chips.className = "axia_chips";
    const chip = (lab, val, dotClass, hint) => {
      const item = doc.createElement("span");
      item.className = "axia_chip";
      item.title = hint;
      const dot = doc.createElement("span");
      dot.className = `axia_chipdot ${dotClass}`;
      const l = doc.createElement("span");
      l.className = "axia_chiplab";
      l.textContent = lab;
      const v = doc.createElement("span");
      v.className = "axia_chipval";
      v.textContent = val;
      item.appendChild(dot);
      item.appendChild(l);
      item.appendChild(v);
      chips.appendChild(item);
    };
    chip("命中", hit, "axia_dot_hit", "缓存命中部分的费用");
    chip("未命中", miss, "axia_dot_miss", "未命中输入（含缓存写入）的费用");
    chip("输出", out, "axia_dot_out", "输出 token 的费用");
    box.appendChild(chips);
    put(box);
  };
  tableRow(
    "当前步",
    money2(cost + missCost + outputCost, n(view.costUsd) + n(view.missCostUsd) + n(view.outputCostUsd)),
    moneyChip(cost, n(view.costUsd)),
    moneyChip(missCost, n(view.missCostUsd)),
    moneyChip(outputCost, n(view.outputCostUsd)),
    false
  );
  const turnHit = n(view.turnHitCost);
  const turnMiss = n(view.turnMissCost);
  const turnOut = n(view.turnOutputCost);
  const turnHitUsd = n(view.turnHitCostUsd);
  const turnMissUsd = n(view.turnMissCostUsd);
  const turnOutUsd = n(view.turnOutputCostUsd);
  tableRow(
    "当前轮",
    money2(turnHit + turnMiss + turnOut, turnHitUsd + turnMissUsd + turnOutUsd),
    moneyChip(turnHit, turnHitUsd),
    moneyChip(turnMiss, turnMissUsd),
    moneyChip(turnOut, turnOutUsd),
    false
  );
  const sessionHit = n(view.sessionCacheHitCost);
  const sessionMiss = n(view.sessionMissCost);
  const sessionOut = n(view.sessionOutputCost);
  const sessionHitUsd = n(view.sessionCacheHitCostUsd);
  const sessionMissUsd = n(view.sessionMissCostUsd);
  const sessionOutUsd = n(view.sessionOutputCostUsd);
  tableRow(
    "本会话",
    money2(sessionHit + sessionMiss + sessionOut, sessionHitUsd + sessionMissUsd + sessionOutUsd),
    moneyChip(sessionHit, sessionHitUsd),
    moneyChip(sessionMiss, sessionMissUsd),
    moneyChip(sessionOut, sessionOutUsd),
    true
  );
  if (view.mixedCurrency === true) {
    const mixed = doc.createElement("div");
    mixed.className = "axia_foot";
    mixed.textContent = "本会话含两种币种，已按币种分开合计（元在前、美元在后）";
    put(mixed);
  }
  renderStats(doc, put, view);
  renderDetails(doc, put, view);
}
function fitPanel(panel) {
  panel.style.transform = "";
  const visual = typeof window !== "undefined" ? window.visualViewport : null;
  const viewportWidth = visual ? visual.width : window.innerWidth;
  panel.style.maxWidth = `${Math.floor(viewportWidth - 16)}px`;
  const rect = panel.getBoundingClientRect();
  const room = rect.bottom - (visual ? visual.offsetTop : 0) - 8;
  if (Number.isFinite(room) && room > 0) {
    panel.style.maxHeight = `${Math.floor(room)}px`;
  }
  const viewportLeft = visual ? visual.offsetLeft : 0;
  let dx = 0;
  if (rect.right > viewportLeft + viewportWidth - 8) {
    dx = viewportLeft + viewportWidth - 8 - rect.right;
  }
  if (rect.left + dx < viewportLeft + 8) {
    dx = viewportLeft + 8 - rect.left;
  }
  panel.style.transform = dx !== 0 ? `translateX(${Math.round(dx)}px)` : "";
}
function ensureBill(panel) {
  let bill = panel.querySelector(":scope > .axia_bill");
  if (bill === null) {
    bill = panel.ownerDocument.createElement("div");
    bill.className = "axia_bill";
    panel.appendChild(bill);
  }
  renderBill(bill);
  fitPanel(panel);
}
function refreshOpenPanels() {
  if (typeof document === "undefined") return;
  const dialogs = document.querySelectorAll('[role="dialog"]');
  for (const dlg of dialogs) {
    if (isContextPanel(dlg)) ensureBill(dlg);
  }
}
function startPanelBridge() {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return () => {
    };
  }
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (isContextPanel(node)) {
          ensureBill(node);
          return;
        }
        if (node instanceof HTMLElement) {
          const dialogs = node.querySelectorAll('[role="dialog"]');
          for (const dlg of dialogs) {
            if (isContextPanel(dlg)) {
              ensureBill(dlg);
              return;
            }
          }
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  const onViewportResize = () => refreshOpenPanels();
  window.visualViewport?.addEventListener("resize", onViewportResize);
  return () => {
    observer.disconnect();
    window.visualViewport?.removeEventListener("resize", onViewportResize);
  };
}
function CacheDataHook(props) {
  const data = typeof props.useProjection === "function" ? props.useProjection("cacheBilling") : void 0;
  (0, React2.useEffect)(() => {
    latestView = data ?? void 0;
    refreshOpenPanels();
  }, [data]);
  return React2.createElement("span", {
    "data-dsh-axia-cachebilling": "hook",
    "data-axia-version": "cmp-31",
    style: { display: "none" }
  });
}
var inject = ["slots", "connection", "remote", "remote.llm", "settingsScope", "settingsSchema"];
function apply(ctx) {
  console.log("[dsh-axia-cachebilling] client bundle: cmp-31");
  applyFontScale(readFontScale());
  if (typeof document !== "undefined") {
    const existing = document.querySelector(`style[data-plugin-css="${CSS_ID2}"]`);
    if (existing !== null) {
      existing.textContent = CSS2;
    } else {
      const tag = document.createElement("style");
      tag.dataset.plugin = "dsh-axia-cachebilling";
      tag.dataset.pluginCss = CSS_ID2;
      tag.textContent = CSS2;
      document.head.appendChild(tag);
    }
  }
  if (typeof document !== "undefined") {
    startPanelBridge();
  }
  ctx.slots.inject("conversation.input.right", () => {
    const dispose = ctx.slots.register(
      {
        name: "conversation.input.right",
        id: "dsh-axia-cachebilling-data-hook",
        order: 1
      },
      CacheDataHook
    );
    return () => {
      dispose();
    };
  });
  try {
    applySettings(ctx);
  } catch (e) {
    console.warn("[dsh-axia-cachebilling] 设置页注册失败（不影响账单）：", e);
  }
}
    return module.exports;
  }
});
//# sourceMappingURL=client.js.map
