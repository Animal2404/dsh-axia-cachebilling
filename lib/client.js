window.__ModuleLoader__.load({
  id: "meow-cachebilling",
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
var SETTINGS_NS = "meow-cachebilling";
var CSS_ID = "meow-cachebilling-settings-css";
var FONT_SCALE_KEY = "meowcb-font-scale";
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
    document.documentElement.style.setProperty("--meow-fs", String(value));
    localStorage.setItem(FONT_SCALE_KEY, String(value));
  } catch {
  }
}
var CSS = `
.meowcb_set_page{color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:12px;max-width:min(calc(820px / var(--meow-fs,1)),100%);padding:4px 0;zoom:var(--meow-fs,1)}
/* 自带 border-box：DSH 外壳不重置盒模型，缺了它 width:100% 的输入框会撑破网格、互相压边 */
.meowcb_set_page,.meowcb_set_page *{box-sizing:border-box}
.meowcb_set_head{display:flex;flex-direction:column;gap:4px}
.meowcb_set_title{font-size:17px;font-weight:650;letter-spacing:.2px;margin:0}
.meowcb_set_subtitle{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.6;margin:0}
.meowcb_set_card{background:color-mix(in srgb,currentColor 3%,transparent);border:1px solid var(--dsw-alias-border-l3);border-radius:12px;display:flex;flex-direction:column;gap:10px;padding:14px}
.meowcb_set_legend{align-items:center;color:var(--dsw-alias-label-caption);display:flex;flex-wrap:wrap;font-size:12px;gap:6px 10px;line-height:1.6}
.meowcb_set_legend b{color:var(--dsw-alias-label-secondary);font-weight:600}
.meowcb_set_toolbar{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
.meowcb_set_count{color:var(--dsw-alias-label-caption);font-size:12px;font-variant-numeric:tabular-nums;margin-left:auto}
.meowcb_set_btn{align-items:center;background:transparent;border:1px solid var(--dsw-alias-border-l3);border-radius:8px;color:var(--dsw-alias-label-secondary);cursor:pointer;display:inline-flex;font-size:12.5px;gap:4px;padding:5px 11px;transition:background .15s,border-color .15s,color .15s;white-space:nowrap}
.meowcb_set_btn:hover{background:color-mix(in srgb,currentColor 7%,transparent);border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.meowcb_set_btn:disabled{cursor:default;opacity:.5}
/* 主按钮用自己的品牌蓝：--dsw-alias-button-primary-fill 在深色主题里是白色，配白字会白底白字 */
.meowcb_set_btn_primary{background:#4D6BFE;border-color:transparent;color:#fff;font-weight:600}
.meowcb_set_btn_primary:hover{background:#4D6BFE;color:#fff;filter:brightness(1.12)}
.meowcb_set_btn_danger:hover{border-color:#f43f5e;color:#f43f5e}
.meowcb_set_btn_mini{font-size:12px;padding:3px 8px}
.meowcb_set_group{display:flex;flex-direction:column;gap:6px}
.meowcb_set_grouphead{align-items:center;color:var(--dsw-alias-label-caption);display:flex;font-size:11.5px;gap:6px;letter-spacing:.3px;padding:2px 2px 0}
.meowcb_set_row{align-items:center;background:color-mix(in srgb,currentColor 4%,transparent);border:1px solid var(--dsw-alias-border-l3);border-radius:10px;cursor:pointer;display:flex;gap:10px;padding:9px 12px;transition:background .15s,border-color .15s}
.meowcb_set_row:hover{background:color-mix(in srgb,currentColor 7%,transparent);border-color:var(--dsw-alias-border-l2)}
.meowcb_set_rowmain{display:flex;flex-direction:column;gap:2px;min-width:0}
.meowcb_set_model{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.meowcb_set_ver{color:var(--dsw-alias-label-caption);font-size:11.5px}
.meowcb_set_spacer{flex:1}
.meowcb_set_chev{color:var(--dsw-alias-label-caption);flex:none;font-size:15px;line-height:1}
.meowcb_set_badge{border-radius:999px;font-size:11px;line-height:17px;padding:0 8px;white-space:nowrap}
.meowcb_set_badge_prefill{background:color-mix(in srgb,#4D6BFE 18%,transparent);color:#8AA0FF}
.meowcb_set_badge_override{background:color-mix(in srgb,#f59e0b 18%,transparent);color:#F0A63A}
.meowcb_set_badge_custom{background:color-mix(in srgb,#34d399 18%,transparent);color:#34d399}
.meowcb_set_badge_tier{background:color-mix(in srgb,currentColor 9%,transparent);color:var(--dsw-alias-label-secondary)}
.meowcb_set_editor{background:color-mix(in srgb,currentColor 3%,transparent);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;display:flex;flex-direction:column;gap:10px;padding:12px}
.meowcb_set_grid{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}
.meowcb_set_field{display:flex;flex-direction:column;gap:4px;min-width:0}
.meowcb_set_fieldrow{align-items:center;display:flex;gap:6px;min-width:0}
.meowcb_set_label{color:var(--dsw-alias-label-caption);flex:none;font-size:11.5px}
.meowcb_set_input{background:var(--dsw-alias-bg-layer-2,#26262b);border:1px solid var(--dsw-alias-border-l3);border-radius:8px;color:var(--dsw-alias-label-primary,#eee);font-size:13px;min-width:0;padding:5px 9px;transition:border-color .15s}
.meowcb_set_input:focus{border-color:var(--dsw-alias-border-l2);outline:none}
.meowcb_set_input::placeholder{color:var(--dsw-alias-label-caption);opacity:.7}
.meowcb_set_input_grow{flex:1;min-width:0}
/* 用 DSH 自己的字体（用户要求别改字体），只给数字加等宽数字特性 */
.meowcb_set_input_mono{font-variant-numeric:tabular-nums}
.meowcb_set_input_err{border-color:#f43f5e}
.meowcb_set_select{background:var(--dsw-alias-bg-layer-2,#26262b);border:1px solid var(--dsw-alias-border-l3);border-radius:8px;color:var(--dsw-alias-label-primary,#eee);font-size:13px;max-width:100%;min-width:0;padding:5px 8px}
.meowcb_set_select option{background:var(--dsw-alias-bg-layer-2,#26262b);color:var(--dsw-alias-label-primary,#eee)}
.meowcb_set_select:disabled{opacity:.6}
body[data-ds-dark-theme] .meowcb_set_input{color-scheme:dark}
body[data-ds-dark-theme] .meowcb_set_select{color-scheme:dark}
.meowcb_set_prices{background:color-mix(in srgb,currentColor 3%,transparent);border:1px solid var(--dsw-alias-border-l3);border-radius:10px;display:flex;flex-direction:column;gap:8px;padding:10px}
.meowcb_set_prices_head{align-items:center;display:flex;gap:6px}
.meowcb_set_prices_title{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:600}
.meowcb_set_unit{color:var(--dsw-alias-label-caption);font-size:11px;margin-left:auto}
.meowcb_set_pricerow{display:grid;gap:8px;grid-template-columns:repeat(3,minmax(0,1fr))}
.meowcb_set_pricecell{display:flex;flex-direction:column;gap:3px;min-width:0}
.meowcb_set_pricenum{font-variant-numeric:tabular-nums;width:100%}
.meowcb_set_seg{background:color-mix(in srgb,currentColor 6%,transparent);border-radius:8px;display:inline-flex;gap:2px;padding:2px}
.meowcb_set_segbtn{background:transparent;border:0;border-radius:6px;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12.5px;padding:4px 12px;transition:background .15s,color .15s}
.meowcb_set_segbtn:hover{color:var(--dsw-alias-label-primary)}
.meowcb_set_segbtn_on{background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-primary);font-weight:600}
.meowcb_set_note{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.5;margin:0}
.meowcb_set_err{color:#f43f5e;font-size:12px;line-height:1.5;margin:0;white-space:pre-wrap}
.meowcb_set_muted{color:var(--dsw-alias-label-caption);font-size:12px}
.meowcb_set_actions{align-items:center;display:flex;gap:8px}
.meowcb_set_hint{color:var(--dsw-alias-label-caption);font-size:11.5px;margin-left:auto}
@media (max-width:560px){
  .meowcb_set_card{padding:12px}
  .meowcb_set_grid{grid-template-columns:minmax(0,1fr)}
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
var field = (labelText, child) => el("div", { className: "meowcb_set_field" }, el("span", { className: "meowcb_set_label" }, labelText), child);
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
    { className: "meowcb_set_pricerow" },
    cells.map(
      ([text, key]) => el(
        "div",
        { key: String(key), className: "meowcb_set_pricecell" },
        el("span", { className: "meowcb_set_label" }, text),
        el("input", {
          className: "meowcb_set_input meowcb_set_pricenum",
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
  const open = (key) => {
    setError(null);
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
    return el("div", { className: "meowcb_set_card" }, el("span", { className: "meowcb_set_muted" }, "价目表加载中…"));
  }
  if (snap.status === "unavailable") {
    return el(
      "div",
      { className: "meowcb_set_card" },
      el("span", { className: "meowcb_set_muted" }, "当前连接不支持设置写入（仅本机回环连接可编辑）。")
    );
  }
  const tzFor = (provider) => {
    const p = provider.trim().toLowerCase();
    if (p && PROVIDER_TIMEZONE[p]) return { auto: true, tz: PROVIDER_TIMEZONE[p] };
    return { auto: false, tz: draft?.timezone ?? "Asia/Shanghai" };
  };
  const tried = error !== null;
  const editor = draft === null ? null : el(
    "div",
    { className: "meowcb_set_editor" },
    el(
      "div",
      { className: "meowcb_set_grid" },
      field(
        "供应商",
        el(
          "div",
          { className: "meowcb_set_fieldrow" },
          manual.provider ? el("input", {
            className: "meowcb_set_input meowcb_set_input_grow meowcb_set_input_mono",
            value: draft.provider,
            onChange: (e) => pickProvider(e.target.value),
            placeholder: "deepseek-official，留空 = 通配"
          }) : el(
            "select",
            {
              className: "meowcb_set_select meowcb_set_input_grow",
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
              className: "meowcb_set_btn meowcb_set_btn_mini",
              onClick: () => setManual((m) => ({ ...m, provider: !m.provider }))
            },
            manual.provider ? "下拉" : "手填"
          ),
          el(
            "button",
            {
              type: "button",
              className: "meowcb_set_btn meowcb_set_btn_mini",
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
          { className: "meowcb_set_fieldrow" },
          manual.model || modelOptions.length === 0 ? el("input", {
            className: "meowcb_set_input meowcb_set_input_grow meowcb_set_input_mono",
            value: draft.model,
            onChange: (e) => set({ model: e.target.value }),
            placeholder: "deepseek-flash"
          }) : el(
            "select",
            {
              className: "meowcb_set_select meowcb_set_input_grow",
              value: modelOptions.includes(draft.model) ? draft.model : "",
              onChange: (e) => set({ model: e.target.value })
            },
            el("option", { value: "" }, "（选一个模型）"),
            modelOptions.map((m) => el("option", { key: m, value: m }, m))
          ),
          el(
            "button",
            {
              type: "button",
              className: "meowcb_set_btn meowcb_set_btn_mini",
              disabled: probe.busy,
              onClick: () => void fetchModels()
            },
            probe.busy ? "获取中…" : "获取模型"
          ),
          el(
            "button",
            {
              type: "button",
              className: "meowcb_set_btn meowcb_set_btn_mini",
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
        className: "meowcb_set_input meowcb_set_input_mono",
        value: draft.label,
        onChange: (e) => set({ label: e.target.value }),
        placeholder: "DeepSeek-V4.1-Flash"
      })
    ),
    el(
      "div",
      { className: "meowcb_set_fieldrow" },
      el("span", { className: "meowcb_set_label" }, "计价方式"),
      el(
        "div",
        { className: "meowcb_set_seg" },
        el(
          "button",
          {
            type: "button",
            className: "meowcb_set_segbtn" + (draft.isPeak ? "" : " meowcb_set_segbtn_on"),
            onClick: () => set({ isPeak: false })
          },
          "一口价"
        ),
        el(
          "button",
          {
            type: "button",
            className: "meowcb_set_segbtn" + (draft.isPeak ? " meowcb_set_segbtn_on" : ""),
            onClick: () => set({ isPeak: true })
          },
          "峰谷价"
        )
      ),
      el("span", { className: "meowcb_set_label", style: { marginLeft: "10px" } }, "币种"),
      el(
        "div",
        { className: "meowcb_set_seg" },
        el(
          "button",
          {
            type: "button",
            className: "meowcb_set_segbtn" + (draft.currency === "USD" ? "" : " meowcb_set_segbtn_on"),
            onClick: () => set({ currency: "CNY" })
          },
          "元 ¥"
        ),
        el(
          "button",
          {
            type: "button",
            className: "meowcb_set_segbtn" + (draft.currency === "USD" ? " meowcb_set_segbtn_on" : ""),
            onClick: () => set({ currency: "USD" })
          },
          "美元 $"
        )
      )
    ),
    draft.isPeak ? el(
      "div",
      { className: "meowcb_set_grid" },
      field(
        "峰时段（[天][时段]，多组用 + 连接）",
        el("input", {
          className: "meowcb_set_input meowcb_set_input_mono" + (tried && !draft.whenText.trim() ? " meowcb_set_input_err" : ""),
          value: draft.whenText,
          onChange: (e) => set({ whenText: e.target.value }),
          placeholder: "[mon-fri][09:00-12:00, 14:00-18:00]"
        })
      ),
      tzFor(draft.provider).auto ? el(
        "div",
        { className: "meowcb_set_field" },
        el("span", { className: "meowcb_set_label" }, "时区"),
        el("span", { className: "meowcb_set_muted" }, `自动：${tzFor(draft.provider).tz}`)
      ) : field(
        "时区（IANA）",
        el("input", {
          className: "meowcb_set_input meowcb_set_input_mono" + (tried && !draft.timezone.trim() ? " meowcb_set_input_err" : ""),
          value: draft.timezone,
          onChange: (e) => set({ timezone: e.target.value }),
          placeholder: "Asia/Shanghai"
        })
      )
    ) : null,
    el(
      "div",
      { className: "meowcb_set_prices" },
      el(
        "div",
        { className: "meowcb_set_prices_head" },
        el("span", { className: "meowcb_set_prices_title" }, draft.isPeak ? "峰价" : "价格"),
        el("span", { className: "meowcb_set_unit" }, draft.currency === "USD" ? "美元 / 百万 token" : "元 / 百万 token")
      ),
      el(PriceInputs, { d: draft, set, mode: draft.isPeak ? "peak" : "flat" }),
      draft.isPeak ? el("div", { className: "meowcb_set_prices_head" }, el("span", { className: "meowcb_set_prices_title" }, "谷价")) : null,
      draft.isPeak ? el(PriceInputs, { d: draft, set, mode: "valley" }) : null
    ),
    catalog.note || probe.note ? el("p", { className: "meowcb_set_note" }, probe.note ?? catalog.note) : null,
    error ? el("div", { className: "meowcb_set_err" }, error) : null,
    el(
      "div",
      { className: "meowcb_set_actions" },
      el(
        "button",
        { type: "button", className: "meowcb_set_btn meowcb_set_btn_primary", disabled: busy, onClick: () => void save() },
        busy ? "保存中…" : "保存"
      ),
      el("button", { type: "button", className: "meowcb_set_btn", disabled: busy, onClick: () => open(null) }, "取消"),
      expanded !== null && expanded !== "__new__" ? el(
        "button",
        {
          type: "button",
          className: "meowcb_set_btn meowcb_set_btn_danger",
          disabled: busy,
          onClick: () => void remove(expanded)
        },
        "恢复预填 / 删除"
      ) : null,
      expanded !== null && expanded !== "__new__" && expanded in base ? el("span", { className: "meowcb_set_hint" }, "编辑预填会生成覆盖") : null
    )
  );
  const rowsFor = (key) => {
    const entry = user[key] ?? base[key];
    if (!entry) return null;
    const inBase = key in base;
    const inUser = key in user;
    const badge = inBase && inUser ? el("span", { className: "meowcb_set_badge meowcb_set_badge_override" }, "已覆盖") : inUser && !inBase ? el("span", { className: "meowcb_set_badge meowcb_set_badge_custom" }, "自定义") : el("span", { className: "meowcb_set_badge meowcb_set_badge_prefill" }, "预填");
    if (expanded === key) return editor;
    return el(
      "div",
      { key, className: "meowcb_set_row", onClick: () => open(key) },
      el(
        "div",
        { className: "meowcb_set_rowmain" },
        el("span", { className: "meowcb_set_model" }, entry.model),
        entry.label || entry.currency === "USD" ? el(
          "span",
          { className: "meowcb_set_ver" },
          [entry.label ?? "", entry.currency === "USD" ? "美元计价" : ""].filter(Boolean).join(" · ")
        ) : null
      ),
      el("span", { className: "meowcb_set_spacer" }),
      el("span", { className: "meowcb_set_badge meowcb_set_badge_tier" }, entry.peak ? "峰谷" : "一口价"),
      badge,
      el("span", { className: "meowcb_set_chev" }, "›")
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
    { className: "meowcb_set_card" },
    el(
      "p",
      { className: "meowcb_set_legend" },
      el("span", null, el("b", null, "预填"), " 插件自带，跟随版本更新"),
      el("span", null, el("b", null, "你的修改"), " 存在 DSH 设置里，改完即时生效"),
      el("span", null, el("b", null, "点任意一行"), " 展开编辑")
    ),
    !snap.writable ? el("span", { className: "meowcb_set_muted" }, "当前连接为只读（设置写入仅限本机回环连接）。") : null,
    el(
      "div",
      { className: "meowcb_set_toolbar" },
      el(
        "button",
        {
          type: "button",
          className: "meowcb_set_btn meowcb_set_btn_primary",
          onClick: () => open("__new__"),
          disabled: expandedIsNew || !snap.writable
        },
        "＋ 添加条目"
      ),
      el("span", { className: "meowcb_set_spacer" }),
      el("span", { className: "meowcb_set_label" }, "字号"),
      el(
        "div",
        { className: "meowcb_set_seg" },
        FONT_SCALES.map(
          (s) => el(
            "button",
            {
              key: s.value,
              type: "button",
              className: "meowcb_set_segbtn" + (scale === s.value ? " meowcb_set_segbtn_on" : ""),
              onClick: () => {
                setScale(s.value);
                applyFontScale(s.value);
              }
            },
            s.label
          )
        )
      ),
      el("span", { className: "meowcb_set_count" }, `共 ${total} 条`)
    ),
    expandedIsNew ? editor : null,
    ...groups.map(
      (g) => el(
        "div",
        { key: g.name, className: "meowcb_set_group" },
        el("div", { className: "meowcb_set_grouphead" }, el("span", null, g.name), el("span", null, `· ${g.rows.length}`)),
        ...g.rows
      )
    )
  );
}
function applySettings(ctx) {
  applyFontScale(readFontScale());
  if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${CSS_ID}"]`) === null) {
    const tag = document.createElement("style");
    tag.dataset.plugin = "meow-cachebilling-settings";
    tag.dataset.pluginCss = CSS_ID;
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }
  const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NS });
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
      {
        name: "settings.section",
        id: SETTINGS_NS,
        order: 30,
        label: () => "喵缓存账单",
        inject: () => ({ scope, remote: ctx.remote, settingsScope: ctx.settingsScope })
      },
      BillingSection
    )
  );
}
function BillingSection(props) {
  return el(
    "div",
    { className: "meowcb_set_page" },
    el(
      "div",
      { className: "meowcb_set_head" },
      el("h2", { className: "meowcb_set_title" }, "喵缓存账单"),
      el(
        "p",
        { className: "meowcb_set_subtitle" },
        "上下文缓存到底花了多少钱。供应商和模型直接从 DSH 已配置的列表里挑，模型可一键拉取清单；改完即时生效，无需重启。"
      )
    ),
    el(BillingCard, { scope: props.scope, remote: props.remote, settingsScope: props.settingsScope })
  );
}

// src/client.ts
var CSS_ID2 = "meow-cachebilling-css";
var CSS2 = `
/* 所有尺寸乘 --meow-fs（字号档位，见 settings.ts 的 applyFontScale）：大屏远距离直接调档，不用动浏览器缩放 */
.meowcb_bill{margin-top:calc(8px * var(--meow-fs,1));padding-top:calc(8px * var(--meow-fs,1));border-top:1px solid var(--dsw-alias-border-l3)}
.meowcb_grid{display:grid;grid-template-columns:max-content repeat(4,minmax(0,1fr));column-gap:calc(10px * var(--meow-fs,1));row-gap:calc(2px * var(--meow-fs,1));margin-top:calc(4px * var(--meow-fs,1));align-items:baseline;font-size:calc(10px * var(--meow-fs,1));line-height:calc(14px * var(--meow-fs,1));text-align:center}
.meowcb_lab{color:var(--dsw-alias-label-secondary);font-weight:400;white-space:nowrap}
.meowcb_t{color:var(--dsw-alias-label-primary);font-weight:500;font-variant-numeric:tabular-nums}
.meowcb_h{color:var(--dsw-alias-label-secondary);font-weight:400;text-align:center;white-space:nowrap}
.meowcb_v{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-weight:500;text-align:center}
.meowcb_sechead{display:flex;align-items:center;gap:calc(6px * var(--meow-fs,1));color:var(--dsw-alias-label-secondary);margin:calc(2px * var(--meow-fs,1)) 0;font-size:calc(12px * var(--meow-fs,1));line-height:calc(20px * var(--meow-fs,1))}
.meowcb_secheadsw{width:calc(8px * var(--meow-fs,1));height:calc(8px * var(--meow-fs,1));border-radius:2px;flex:none}
.meowcb_subhead{color:var(--dsw-alias-label-secondary);font-size:calc(10px * var(--meow-fs,1));line-height:calc(14px * var(--meow-fs,1));font-weight:700}
.meowcb_modeline{color:var(--dsw-alias-label-secondary);font-size:calc(10px * var(--meow-fs,1));line-height:calc(14px * var(--meow-fs,1))}
.meowcb_foot{margin-top:calc(6px * var(--meow-fs,1));color:var(--dsw-alias-label-caption);font-size:calc(10px * var(--meow-fs,1));line-height:calc(14px * var(--meow-fs,1))}
.meowcb_notice{color:#f59e0b;font-size:calc(10px * var(--meow-fs,1));line-height:calc(14px * var(--meow-fs,1))}
.meowcb_chartwrap{display:flex;gap:calc(12px * var(--meow-fs,1));align-items:center;margin-top:calc(4px * var(--meow-fs,1))}
.meowcb_chartcol{flex:none;width:calc(124px * var(--meow-fs,1))}
.meowcb_chartside{flex:1;min-width:0;display:flex;flex-direction:column;gap:calc(2px * var(--meow-fs,1))}
.meowcb_svg{display:block;width:100%;height:auto}
.meowcb_axis{stroke:var(--dsw-alias-border-l3);stroke-width:1}
.meowcb_avgarea{fill:#60a5fa;fill-opacity:.2;stroke:none}
.meowcb_avghitarea{fill:#bef264;fill-opacity:.1;stroke:none}
.meowcb_avgblock{fill:#60a5fa;fill-opacity:.2}
.meowcb_avghitblock{fill:#bef264;fill-opacity:.1}
.meowcb_cur{stroke:#f59e0b;stroke-width:1.5;fill:none}
.meowcb_dotcur{fill:#f59e0b}
.meowcb_axlabel{fill:var(--dsw-alias-label-caption);font-size:calc(9px * var(--meow-fs,1))}
.meowcb_cmplab{color:var(--dsw-alias-label-secondary);white-space:nowrap;display:flex;justify-content:space-between;gap:calc(8px * var(--meow-fs,1));align-items:baseline;font-size:calc(10px * var(--meow-fs,1));line-height:calc(14px * var(--meow-fs,1))}
.meowcb_cmpv{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-weight:500}

/* 手机矮视口适配：官方弹层 bottom 锚定向上生长且无高度上限（桌面假设），贴入账单后在手机竖屏会顶出屏幕外；
   同理 width 写死 264px，折叠屏折叠态外屏 CSS 视口更窄（<264px+边距）时弹层左缘整体被推出屏幕左缘外。
   按属性选择器双语匹配官方弹层（同 startPanelBridge 的判定口径，不硬编码官方 CSS modules hash 类名）。
   max-height/max-width 是 JS 失效时的兜底（先 vh/vw 再 dvh/dvw）；text-size-adjust 顺带拦掉安卓 text autosizing——
   字体提升会把 10px 小字放大，横竖两头挤爆 5 列账表。
   字号档位放大后内容比 264px 宽 → 用 min-width 让弹层跟着变宽（上限仍受视口限制），否则会横向溢出。 */
[role="dialog"][aria-label*="上下文已用"],
[role="dialog"][aria-label*="of context used"] {
  max-height: calc(100vh - 140px);
  max-height: calc(100dvh - 140px);
  min-width: min(calc(264px * var(--meow-fs,1)), calc(100vw - 20px));
  min-width: min(calc(264px * var(--meow-fs,1)), calc(100dvw - 20px));
  max-width: calc(100vw - 20px);
  max-width: calc(100dvw - 20px);
  overflow-y: auto;
  /* 内容永不横向溢出：宁可让数字列变窄，也不出那条横向滚动条（用户明确不喜欢） */
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
  head.className = "meowcb_sechead";
  const sw = doc.createElement("span");
  sw.className = "meowcb_secheadsw";
  sw.style.background = color;
  head.appendChild(sw);
  head.appendChild(doc.createTextNode(text));
  return head;
}
var latestView;
function isContextPanel(node) {
  if (!(node instanceof HTMLElement)) return false;
  if (node.getAttribute("role") !== "dialog") return false;
  const label = node.getAttribute("aria-label") ?? "";
  return /of context used|上下文已用/i.test(label);
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
    empty.className = "meowcb_foot";
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
    notice.className = "meowcb_notice";
    notice.textContent = "［喵缓存账单］当前模型无价格数据，请去设置界面添加。以下为Deepseek价格，仅供参考：";
    put(notice);
  }
  put(secHead(doc, "#f59e0b", "当前会话统计"));
  const grid = doc.createElement("div");
  grid.className = "meowcb_grid";
  const cell = (className, text) => {
    const el2 = doc.createElement("div");
    el2.className = className;
    el2.textContent = text;
    grid.appendChild(el2);
  };
  cell("meowcb_lab", "消耗");
  cell("meowcb_h", "总价");
  const head = (text, full) => {
    const el2 = doc.createElement("div");
    el2.className = "meowcb_h";
    el2.textContent = text;
    el2.title = full;
    grid.appendChild(el2);
  };
  head("命中", "缓存命中");
  head("未命中", "缓存未命中");
  head("输出", "输出");
  const money2 = (cny, usd) => {
    const parts = [];
    if (cny > 0 || usd <= 0) parts.push(`¥${formatAmount(cny)}`);
    if (usd > 0) parts.push(`$${formatAmount(usd)}`);
    return parts.join(" + ");
  };
  const n = (value) => Number.isFinite(value) ? value : 0;
  const tableRow = (label, total, hit, miss, out) => {
    cell("meowcb_lab", label);
    cell("meowcb_v", total);
    cell("meowcb_v", hit);
    cell("meowcb_v", miss);
    cell("meowcb_v", out);
  };
  tableRow(
    "当前步",
    money2(cost + missCost + outputCost, n(view.costUsd) + n(view.missCostUsd) + n(view.outputCostUsd)),
    money2(cost, n(view.costUsd)),
    money2(missCost, n(view.missCostUsd)),
    money2(outputCost, n(view.outputCostUsd))
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
    money2(turnHit, turnHitUsd),
    money2(turnMiss, turnMissUsd),
    money2(turnOut, turnOutUsd)
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
    money2(sessionHit, sessionHitUsd),
    money2(sessionMiss, sessionMissUsd),
    money2(sessionOut, sessionOutUsd)
  );
  put(grid);
  if (view.mixedCurrency === true) {
    const mixed = doc.createElement("div");
    mixed.className = "meowcb_foot";
    mixed.textContent = "本会话含两种币种，已按币种分开合计（元在前、美元在后）";
    put(mixed);
  }
  renderChart(doc, put, view);
}
function renderChart(doc, put, view) {
  const curve = view.curve;
  const cmp = view.compare;
  if (!curve && !cmp) return;
  const official = isOfficialDeepSeek(view.provider);
  const labels = official ? TIER_LABEL : TIER_LABEL_GENERIC;
  const modelPart = typeof view.model === "string" && view.model !== "" ? view.model : "当前模型";
  const namePart = typeof view.provider === "string" && view.provider !== "" ? `${view.provider}/${modelPart}` : modelPart;
  const tierWord = view.tier === "peak" ? labels.peak : view.tier === "offPeak" ? labels.offPeak : null;
  put(secHead(doc, "#60a5fa", "当前模型统计"));
  const modeline = doc.createElement("div");
  modeline.className = "meowcb_modeline";
  modeline.textContent = tierWord ? `${namePart} · ${tierWord}` : namePart;
  put(modeline);
  const wrap = doc.createElement("div");
  wrap.className = "meowcb_chartwrap";
  if (curve) {
    const col = doc.createElement("div");
    col.className = "meowcb_chartcol";
    const W = 120;
    const H = 130;
    const L = 8;
    const R = 6;
    const TOP = 2;
    const B = 10;
    const lastCurN = curve.cur.length > 0 ? curve.cur[curve.cur.length - 1][0] : 0;
    const xmax = Math.max(curve.avg.length, lastCurN, 1);
    const avgHit = curve.avgHit ?? [];
    let ymax = 0;
    for (const v of curve.avg) if (v > ymax) ymax = v;
    for (const v of avgHit) if (v > ymax) ymax = v;
    for (const [, v] of curve.cur) if (v > ymax) ymax = v;
    if (ymax <= 0) ymax = 1;
    const x = (n) => L + (n - 1) / Math.max(xmax - 1, 1) * (W - L - R);
    const y = (v) => H - B - v / ymax * (H - B - TOP);
    const NS = "http://www.w3.org/2000/svg";
    const el2 = (tag, cls) => {
      const node = doc.createElementNS(NS, tag);
      node.setAttribute("class", cls);
      return node;
    };
    const svg = el2("svg", "meowcb_svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const legendSwatch = (kind, cls, cy, text) => {
      if (kind === "block") {
        const block = doc.createElementNS(NS, "rect");
        block.setAttribute("x", "6");
        block.setAttribute("y", String(cy - 4));
        block.setAttribute("width", "8");
        block.setAttribute("height", "8");
        block.setAttribute("class", cls);
        svg.appendChild(block);
      } else {
        const line = el2("line", cls);
        line.setAttribute("x1", "6");
        line.setAttribute("y1", String(cy));
        line.setAttribute("x2", "14");
        line.setAttribute("y2", String(cy));
        svg.appendChild(line);
      }
      const label = el2("text", "meowcb_axlabel");
      label.setAttribute("x", "17");
      label.setAttribute("y", String(cy + 3));
      label.textContent = text;
      svg.appendChild(label);
    };
    legendSwatch("block", "meowcb_avgblock", 24, "平均（总）");
    legendSwatch("block", "meowcb_avghitblock", 35, "平均缓存");
    legendSwatch("line", "meowcb_cur", 46, "本会话（总）");
    const axisY = el2("line", "meowcb_axis");
    axisY.setAttribute("x1", String(L));
    axisY.setAttribute("y1", String(TOP));
    axisY.setAttribute("x2", String(L));
    axisY.setAttribute("y2", String(H - B));
    const axisX = el2("line", "meowcb_axis");
    axisX.setAttribute("x1", String(L));
    axisX.setAttribute("y1", String(H - B));
    axisX.setAttribute("x2", String(W - R));
    axisX.setAttribute("y2", String(H - B));
    svg.appendChild(axisY);
    svg.appendChild(axisX);
    if (curve.avg.length > 0) {
      const area = el2("polygon", "meowcb_avgarea");
      const yBase = String(H - B);
      area.setAttribute(
        "points",
        `${x(1)},${yBase} ${curve.avg.map((v, i) => `${x(i + 1)},${y(v)}`).join(" ")} ${x(curve.avg.length)},${yBase}`
      );
      svg.appendChild(area);
    }
    if (avgHit.length > 0) {
      const area = el2("polygon", "meowcb_avghitarea");
      const yBase = String(H - B);
      area.setAttribute(
        "points",
        `${x(1)},${yBase} ${avgHit.map((v, i) => `${x(i + 1)},${y(v)}`).join(" ")} ${x(avgHit.length)},${yBase}`
      );
      svg.appendChild(area);
    }
    if (curve.cur.length > 0) {
      const line = el2("polyline", "meowcb_cur");
      line.setAttribute("points", curve.cur.map(([n, v]) => `${x(n)},${y(v)}`).join(" "));
      svg.appendChild(line);
      const dot = el2("circle", "meowcb_dotcur");
      dot.setAttribute("cx", String(x(curve.cur[curve.cur.length - 1][0])));
      dot.setAttribute("cy", String(y(curve.cur[curve.cur.length - 1][1])));
      dot.setAttribute("r", "2");
      svg.appendChild(dot);
    }
    const yLabel = el2("text", "meowcb_axlabel");
    yLabel.setAttribute("x", String(L + 4));
    yLabel.setAttribute("y", "12");
    yLabel.textContent = `¥${formatAmount(ymax)}`;
    const xLabel = el2("text", "meowcb_axlabel");
    xLabel.setAttribute("x", String(W - R));
    xLabel.setAttribute("y", String(H - 2));
    xLabel.setAttribute("text-anchor", "end");
    xLabel.textContent = `${xmax} 步`;
    svg.appendChild(yLabel);
    svg.appendChild(xLabel);
    col.appendChild(svg);
    wrap.appendChild(col);
  }
  const side = doc.createElement("div");
  side.className = "meowcb_chartside";
  const subHead = (text, gapBefore) => {
    const head = doc.createElement("div");
    head.className = "meowcb_subhead";
    if (gapBefore) head.style.marginTop = "14px";
    head.textContent = text;
    return head;
  };
  if (cmp) {
    side.appendChild(subHead("消耗比较"));
    const item = (label, hint, value) => {
      const row = doc.createElement("div");
      row.className = "meowcb_cmplab";
      row.title = hint;
      const lab = doc.createElement("span");
      lab.textContent = label;
      row.appendChild(lab);
      const num = doc.createElement("span");
      num.className = "meowcb_cmpv";
      num.textContent = `${view.currency === "USD" ? "$" : "¥"}${formatAmount(value)}`;
      row.appendChild(num);
      side.appendChild(row);
    };
    item(
      "读代码",
      "前两轮的所有MISS输入，AI 一般会在前两轮大量、集中地读取项目代码。这个数据衡量了你新开窗口后，AI 重读代码的消耗。",
      cmp.readCode
    );
    item("缓存", "当前每次API请求的缓存命中价格。", cmp.cache);
    item("缓存失效", "如果服务器缓存已失效，本窗口上下文全按MISS算的价格。", cmp.fullMiss);
    side.appendChild(subHead("缓存", true));
    const statRow = (label, value, hint) => {
      const row = doc.createElement("div");
      row.className = "meowcb_cmplab";
      if (hint) row.title = hint;
      const lab = doc.createElement("span");
      lab.textContent = label;
      row.appendChild(lab);
      const num = doc.createElement("span");
      num.className = "meowcb_cmpv";
      num.textContent = value;
      row.appendChild(num);
      side.appendChild(row);
    };
    const fullMissSteps = Number.isFinite(view.sessionFullMissSteps) ? view.sessionFullMissSteps : 0;
    statRow("完全失效次数", `${fullMissSteps} 次`, "有输入但缓存命中为 0 的调用次数，任何路由都可靠");
    const missSteps = Number.isFinite(view.sessionMissSteps) ? view.sessionMissSteps : 0;
    if (missSteps > 0) {
      statRow(
        "缓存失效次数",
        `${missSteps} 次`,
        "发生过缓存写入的调用次数，写入即前缀变更；官方 API 不报此字段，仅部分中转有值"
      );
    }
    statRow("缓存时间估算", "暂未实现");
    statRow("现在失效可能", "暂未实现");
  }
  wrap.appendChild(side);
  put(wrap);
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
  let bill = panel.querySelector(":scope > .meowcb_bill");
  if (bill === null) {
    bill = panel.ownerDocument.createElement("div");
    bill.className = "meowcb_bill";
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
    "data-meow-cachebilling": "hook",
    "data-meowcb-version": "cmp-31",
    style: { display: "none" }
  });
}
var inject = ["slots", "connection", "remote", "remote.llm", "settingsScope", "settingsSchema"];
function apply(ctx) {
  console.log("[meow-cachebilling] client bundle: cmp-31");
  applyFontScale(readFontScale());
  if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${CSS_ID2}"]`) === null) {
    const tag = document.createElement("style");
    tag.dataset.plugin = "meow-cachebilling";
    tag.dataset.pluginCss = CSS_ID2;
    tag.textContent = CSS2;
    document.head.appendChild(tag);
  }
  if (typeof document !== "undefined") {
    startPanelBridge();
  }
  ctx.slots.inject("conversation.input.right", () => {
    const dispose = ctx.slots.register(
      {
        name: "conversation.input.right",
        id: "meow-cachebilling-data-hook",
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
    console.warn("[meow-cachebilling] 设置页注册失败（不影响账单）：", e);
  }
}
    return module.exports;
  }
});
//# sourceMappingURL=client.js.map
