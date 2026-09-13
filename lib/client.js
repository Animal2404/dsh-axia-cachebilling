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
   早先给设置页也加了 zoom 是错的（用户反馈「连插件 UI 都跟着放大缩小」）*/
/* 与上下文弹层（client.ts）对齐的是「规范」而不是「缩放」：值域同源、机制同源，但不吃 --axia-fs 乘子。
   颜色——文字一律裸 --dsw-alias-label-primary / -secondary / -caption（同 client.ts 写法，不写 hex 兜底）；
         蓝 / 琥珀 / 绿 / 紫四族状态色直接取 client.ts 已在用的基准色；危险色取 --dsw-alias-state-error-primary；
         下拉浮层底色取 --dsw-alias-bg-layer-2；半透明底色沿用 client.ts 的 color-mix(currentColor N%)。
   圆角——只取基准档 6 / 7 / 9px（另有 50% 圆点、999px 胶囊）：外层卡片 9、面板与行 7、控件 6。
   字号——只取基准档 11 / 12 / 14px（client 基准为 7.5 / 8.5 / 9 / 9.5 / 10 / 11 / 12 / 14px + tabular-nums）。
   间距——只取基准 gap 档 2 / 3 / 4 / 5 / 6 / 8 / 10px，容器内边距 12px；不出现 9 / 13 / 14 / 16 这类孤立值。
   交互——hover 底色 color-mix(currentColor 6%)（与弹层芯片 hover 同款）、focus 靛蓝描边环、disabled 统一 opacity .5。 */
.axia_set_page{color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:10px;max-width:840px;padding:4px 0}
/* 自带 border-box：DSH 外壳不重置盒模型，缺了它 width:100% 的输入框会撑破网格、互相压边 */
.axia_set_page,.axia_set_page *{box-sizing:border-box}

.axia_set_head{display:flex;flex-direction:column;gap:6px;margin-bottom:2px}
.axia_set_title_wrap{align-items:center;display:flex;gap:8px}
.axia_set_title{background:linear-gradient(135deg,var(--dsw-alias-label-primary) 60%,color-mix(in srgb,var(--dsw-alias-label-primary) 70%,transparent) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:14px;font-weight:700;letter-spacing:-0.2px;margin:0}
/* 胶囊：靛蓝紫族底 + client 基准紫罗兰 #c4b5fd 字色（弹层 hero 行同一支） */
.axia_set_title_pill{background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);border-radius:999px;color:#c4b5fd;font-size:11px;font-weight:500;padding:2px 8px}
.axia_set_subtitle{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.6;margin:0}

/* 卡片容器：Bento 玻璃卡片质感 */
.axia_set_card{background:color-mix(in srgb,currentColor 4%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:0 solid transparent;box-shadow:0 4px 24px -2px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.04);border-radius:9px;display:flex;flex-direction:column;gap:8px;padding:12px}

/* 图例条：胶囊微芯片风格 */
.axia_set_legend{align-items:center;display:flex;flex-wrap:wrap;gap:8px;margin:0;padding-bottom:2px}
.axia_set_legend_chip{align-items:center;background:color-mix(in srgb,currentColor 4%,transparent);border:0 solid transparent;border-radius:999px;color:var(--dsw-alias-label-caption);display:inline-flex;font-size:11px;gap:6px;padding:3px 10px}
.axia_set_legend_chip b{color:var(--dsw-alias-label-secondary);font-weight:600}

/* 语义状态微光圆点（四族色与弹层 .axia_chipdot 同款） */
.axia_dot{border-radius:50%;display:inline-block;flex:none;height:6px;width:6px}
.axia_dot_blue{background:#3b82f6;box-shadow:0 0 6px rgba(59,130,246,0.6)}
.axia_dot_amber{background:#f59e0b;box-shadow:0 0 6px rgba(245,158,11,0.6)}
.axia_dot_zinc{background:var(--dsw-alias-label-caption)}
.axia_dot_hit{background:#10b981;box-shadow:0 0 5px rgba(16,185,129,0.5)}
.axia_dot_miss{background:#f59e0b;box-shadow:0 0 5px rgba(245,158,11,0.5)}
.axia_dot_out{background:#8b5cf6;box-shadow:0 0 5px rgba(139,92,246,0.5)}

/* 工具栏 */
.axia_set_toolbar{align-items:center;display:flex;flex-wrap:wrap;gap:8px}
.axia_set_count{background:color-mix(in srgb,currentColor 4%,transparent);border:0 solid transparent;border-radius:999px;color:var(--dsw-alias-label-caption);font-size:11px;font-variant-numeric:tabular-nums;margin-left:auto;padding:3px 8px}

/* 通用按钮 */
.axia_set_btn{align-items:center;background:color-mix(in srgb,currentColor 4%,transparent);border:1px solid var(--dsw-alias-border-l3,rgba(255,255,255,0.08));border-radius:6px;color:var(--dsw-alias-label-secondary);cursor:pointer;display:inline-flex;font-size:12px;gap:5px;padding:5px 10px;transition:all .15s cubic-bezier(0.16,1,0.3,1);white-space:nowrap}
.axia_set_btn:hover{background:color-mix(in srgb,currentColor 6%,transparent);border-color:var(--dsw-alias-border-l2,rgba(255,255,255,0.16));color:var(--dsw-alias-label-primary);transform:translateY(-0.5px)}
.axia_set_btn:active{transform:scale(0.97)}
.axia_set_btn:focus-visible{outline:2px solid rgba(99,102,241,0.5);outline-offset:1px}
.axia_set_btn:disabled{cursor:default;opacity:.5;pointer-events:none}

/* 主按钮：Linear 风格渐变紫色/靛蓝 + 柔和投影 */
/* 品牌靛蓝保留为字面量（DSH 令牌表里没有靛蓝：--dsw-alias-brand-primary 是中性黑/白，换上就不是紫了）：
   #4f46e5 = 渐变起点、#6366f1 = 渐变终点兼焦点描边色；两者与弹层紫族 rgba(99,102,241) / rgba(139,92,246) 同色系。 */
.axia_set_btn_primary{background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);border-color:transparent;box-shadow:0 2px 8px rgba(99,102,241,0.28),inset 0 1px 0 rgba(255,255,255,0.2);color:var(--dsw-static-neutral-bluish-00);font-weight:600}
.axia_set_btn_primary:hover{box-shadow:0 4px 14px rgba(99,102,241,0.4),inset 0 1px 0 rgba(255,255,255,0.25);filter:brightness(1.08);transform:translateY(-1px)}
.axia_set_btn_primary:active{transform:scale(0.97)}
.axia_set_btn_danger{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 25%,transparent);color:var(--dsw-alias-state-error-primary)}
.axia_set_btn_danger:hover{background:var(--dsw-alias-interactive-bg-hover-danger);border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.axia_set_btn_mini{font-size:11px;padding:3px 8px}

/* 供应商分组 */
.axia_set_group{display:flex;flex-direction:column;gap:6px;margin-top:4px}
.axia_set_grouphead{align-items:center;display:flex;gap:8px;padding:6px 2px 2px}
.axia_set_grouptag{align-items:center;background:color-mix(in srgb,currentColor 4%,transparent);border:0 solid transparent;border-radius:6px;color:var(--dsw-alias-label-secondary);display:inline-flex;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;font-weight:600;letter-spacing:0.3px;padding:2px 8px}
.axia_set_groupline{background:linear-gradient(90deg,rgba(255,255,255,0.08),transparent);flex:1;height:1px}
.axia_set_groupcount{color:var(--dsw-alias-label-caption);font-size:11px;font-variant-numeric:tabular-nums}

/* 模型列表行（Bento 卡片交互） */
.axia_set_row{align-items:center;background:color-mix(in srgb,currentColor 4%,transparent);border:0 solid transparent;border-radius:7px;cursor:pointer;display:flex;gap:8px;padding:8px 10px;transition:all .2s cubic-bezier(0.16,1,0.3,1)}
.axia_set_row:hover{background:color-mix(in srgb,currentColor 6%,transparent);border-color:rgba(99,102,241,0.3);box-shadow:0 4px 16px -2px rgba(0,0,0,0.25),0 0 12px -2px rgba(99,102,241,0.08);transform:translateY(-1.5px)}
.axia_set_row:active{transform:scale(0.99)}
.axia_set_rowmain{display:flex;flex-direction:column;gap:2px;min-width:0}
.axia_set_model{color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;font-weight:550;letter-spacing:-0.1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.axia_set_ver{color:var(--dsw-alias-label-caption);font-size:11px}
.axia_set_spacer{flex:1}
.axia_set_chev{color:var(--dsw-alias-label-caption);flex:none;font-size:14px;line-height:1;transition:transform .18s ease,color .18s ease}
.axia_set_row:hover .axia_set_chev{color:var(--dsw-alias-label-primary);transform:translateX(2px)}

/* 标签徽章（三族状态色取弹层基准：蓝 #60a5fa / 琥珀 #fbbf24 / 绿 #34d399） */
.axia_set_badge{border-radius:999px;font-size:11px;font-weight:500;line-height:18px;padding:0 8px;white-space:nowrap}
.axia_set_badge_prefill{background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.24);color:#60a5fa}
.axia_set_badge_override{background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.24);color:#fbbf24}
.axia_set_badge_custom{background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.24);color:#34d399}
.axia_set_badge_tier{background:color-mix(in srgb,currentColor 4%,transparent);border:0 solid transparent;color:var(--dsw-alias-label-secondary)}

/* 编辑器容器 */
.axia_set_editor{animation:axia_editor_in .22s cubic-bezier(0.16,1,0.3,1);background:color-mix(in srgb,currentColor 4%,transparent);border:1px solid rgba(99,102,241,0.3);border-radius:7px;box-shadow:0 8px 30px rgba(0,0,0,0.35),0 0 24px rgba(99,102,241,0.08);display:flex;flex-direction:column;gap:8px;padding:12px}
@keyframes axia_editor_in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.axia_set_grid{display:grid;gap:8px;grid-template-columns:repeat(2,minmax(0,1fr))}
.axia_set_field{display:flex;flex-direction:column;gap:4px;min-width:0}
.axia_set_fieldrow{align-items:center;display:flex;gap:8px;min-width:0}
.axia_set_label{color:var(--dsw-alias-label-caption);flex:none;font-size:11px;font-weight:500}
.axia_set_label_with_dot{align-items:center;display:inline-flex;gap:5px}

/* 输入框与选择框 */
.axia_set_input{background:rgba(0,0,0,0.3);border:0 solid transparent;border-radius:6px;color:var(--dsw-alias-label-primary);font-size:12px;min-width:0;padding:6px 10px;transition:border-color .15s,box-shadow .15s}
.axia_set_input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,0.22);outline:none}
.axia_set_input::placeholder{color:var(--dsw-alias-label-caption);opacity:.65}
.axia_set_input_grow{flex:1;min-width:0}
.axia_set_input_mono{font-variant-numeric:tabular-nums}
.axia_set_input_err{border-color:var(--dsw-alias-state-error-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-state-error-primary) 20%,transparent)}
.axia_set_select{background:rgba(0,0,0,0.3);border:0 solid transparent;border-radius:6px;color:var(--dsw-alias-label-primary);font-size:12px;max-width:100%;min-width:0;padding:6px 8px;transition:border-color .15s,box-shadow .15s}
.axia_set_select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,0.22);outline:none}
.axia_set_select option{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.axia_set_select:disabled{opacity:.5}
body[data-ds-dark-theme] .axia_set_input{color-scheme:dark}
body[data-ds-dark-theme] .axia_set_select{color-scheme:dark}

/* 价格区域 */
.axia_set_prices{background:rgba(0,0,0,0.22);border:0 solid transparent;border-radius:7px;display:flex;flex-direction:column;gap:8px;padding:10px}
.axia_set_prices_head{align-items:center;display:flex;gap:6px}
.axia_set_prices_title{color:var(--dsw-alias-label-primary);font-size:12px;font-weight:600}
.axia_set_unit{color:var(--dsw-alias-label-caption);font-size:11px;font-variant-numeric:tabular-nums;margin-left:auto}
.axia_set_pricerow{display:grid;gap:8px;grid-template-columns:repeat(3,minmax(0,1fr))}
.axia_set_pricecell{display:flex;flex-direction:column;gap:3px;min-width:0}
.axia_set_pricenum{font-variant-numeric:tabular-nums;width:100%}

/* 分段选择器（Apple 胶囊质感） */
.axia_set_seg{background:rgba(0,0,0,0.25);border:0 solid transparent;border-radius:999px;display:inline-flex;gap:2px;padding:2px}
.axia_set_segbtn{background:transparent;border:0;border-radius:999px;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:12px;font-weight:500;padding:4px 10px;transition:all .18s cubic-bezier(0.16,1,0.3,1)}
.axia_set_segbtn:hover{background:color-mix(in srgb,currentColor 6%,transparent);color:var(--dsw-alias-label-primary)}
.axia_set_segbtn:focus-visible{outline:2px solid rgba(99,102,241,0.5);outline-offset:1px}
.axia_set_segbtn_on{background:var(--dsw-alias-interactive-bg-active);box-shadow:0 1px 4px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.1);color:var(--dsw-alias-label-primary);font-weight:600}

.axia_set_note{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.5;margin:0}
.axia_set_err{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:1.5;margin:0;white-space:pre-wrap}
.axia_set_muted{color:var(--dsw-alias-label-caption);font-size:12px}
.axia_set_actions{align-items:center;display:flex;gap:8px}
.axia_set_hint{color:var(--dsw-alias-label-caption);font-size:11px;margin-left:auto}
@media (max-width:560px){
  .axia_set_card{padding:10px}
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
    ["缓存命中", "flatHit", "axia_dot_hit"],
    ["缓存未命中", "flatMiss", "axia_dot_miss"],
    ["输出", "flatOutput", "axia_dot_out"]
  ] : mode === "peak" ? [
    ["峰·缓存命中", "peakHit", "axia_dot_hit"],
    ["峰·缓存未命中", "peakMiss", "axia_dot_miss"],
    ["峰·输出", "peakOutput", "axia_dot_out"]
  ] : [
    ["谷·缓存命中", "valleyHit", "axia_dot_hit"],
    ["谷·缓存未命中", "valleyMiss", "axia_dot_miss"],
    ["谷·输出", "valleyOutput", "axia_dot_out"]
  ];
  return el(
    "div",
    { className: "axia_set_pricerow" },
    cells.map(
      ([text, key, dotClass]) => el(
        "div",
        { key: String(key), className: "axia_set_pricecell" },
        el(
          "span",
          { className: "axia_set_label axia_set_label_with_dot" },
          el("i", { className: "axia_dot " + dotClass }),
          text
        ),
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
      "div",
      { className: "axia_set_legend" },
      el(
        "span",
        { className: "axia_set_legend_chip" },
        el("i", { className: "axia_dot axia_dot_blue" }),
        el("b", null, "预填"),
        " 插件自带，跟随版本更新"
      ),
      el(
        "span",
        { className: "axia_set_legend_chip" },
        el("i", { className: "axia_dot axia_dot_amber" }),
        el("b", null, "已覆盖 / 自定义"),
        " 改完即时生效"
      ),
      el(
        "span",
        { className: "axia_set_legend_chip" },
        el("i", { className: "axia_dot axia_dot_zinc" }),
        el("b", null, "点任意一行"),
        " 展开编辑"
      )
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
        el(
          "div",
          { className: "axia_set_grouphead" },
          el("span", { className: "axia_set_grouptag" }, g.name),
          el("div", { className: "axia_set_groupline" }),
          el("span", { className: "axia_set_groupcount" }, `${g.rows.length} 款模型`)
        ),
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
      el(
        "div",
        { className: "axia_set_title_wrap" },
        el("h2", { className: "axia_set_title" }, "虾算账"),
        el("span", { className: "axia_set_title_pill" }, "Token 计费 & 缓存监控")
      ),
      el(
        "p",
        { className: "axia_set_subtitle" },
        "上下文缓存到底花了多少钱。供应商和模型直接从 DSH 已配置的列表里挑选，模型可一键拉取清单；配置修改即时生效，无需重启。"
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
  /* 无描边：与官方上下文区之间只留一道紫色渐变发丝线（::before），不再用白色 border-top */
  margin-top: calc(8px * var(--axia-fs, 1));
  padding-top: calc(8px * var(--axia-fs, 1));
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

/* 无描边基线：下面这些容器一律 0 宽 + 透明描边色——层次只用背景色/圆角/间距表达，
   绝不出现白色描边或内高光；探针量 borderTop 必须是「0px rgba(0,0,0,0)」。 */
.axia_card,
.axia_chip,
.axia_panel,
.axia_tile,
.axia_modelpill,
.axia_ledger,
.axia_lrow,
.axia_sechead_icon,
.axia_notice {
  border: 0 solid transparent;
}

/* 标题区：微发光货币芯片与排版 */
.axia_sechead {
  display: flex;
  align-items: center;
  gap: calc(6px * var(--axia-fs, 1));
  color: var(--dsw-alias-label-primary);
  margin: calc(2px * var(--axia-fs, 1)) 0 calc(4px * var(--axia-fs, 1));
  font-size: calc(12px * var(--axia-fs, 1));
  font-weight: 600;
  letter-spacing: 0.2px;
}
.axia_sechead_title { flex: 1; }
/* 节标题右侧的汇率小字（不占额外行高）：金额按哪个汇率折的，一眼可见，细节在 title 里 */
.axia_ratecap {
  color: var(--dsw-alias-label-caption);
  font-size: calc(9px * var(--axia-fs, 1));
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  white-space: nowrap;
}
.axia_sechead_icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(15px * var(--axia-fs, 1));
  height: calc(15px * var(--axia-fs, 1));
  border-radius: 4px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(236, 72, 153, 0.18) 100%);
  color: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.18);
  flex: none;
}
.axia_subhead { color: var(--dsw-alias-label-secondary); font-size: calc(10px * var(--axia-fs, 1)); line-height: calc(14px * var(--axia-fs, 1)); font-weight: 700; }
.axia_foot { margin-top: calc(6px * var(--axia-fs, 1)); color: var(--dsw-alias-label-caption); font-size: calc(10px * var(--axia-fs, 1)); line-height: calc(14px * var(--axia-fs, 1)); }
.axia_notice {
  /* 警示靠底色 + 左侧琥珀色内阴影条（不是 border），全程无描边 */
  background: rgba(245, 158, 11, 0.12);
  box-shadow: inset 3px 0 0 rgba(245, 158, 11, 0.55);
  border-radius: 6px;
  padding: calc(5px * var(--axia-fs, 1)) calc(8px * var(--axia-fs, 1));
  color: #fbbf24;
  font-size: calc(10px * var(--axia-fs, 1));
  line-height: calc(14px * var(--axia-fs, 1));
  margin-bottom: calc(4px * var(--axia-fs, 1));
}

/* 账表（Bento 单卡三行）：一行一项，列标签只在表头出现一次，金额右对齐 + 等宽数字。
   三行数据项一个不少（当前步/当前轮/本会话 × 合计/命中/未命中/输出），只是把三张卡压成一张账表。 */
.axia_ledger {
  background: color-mix(in srgb, currentColor 3.5%, transparent);
  border-radius: calc(9px * var(--axia-fs, 1));
  display: flex;
  flex-direction: column;
  gap: calc(1px * var(--axia-fs, 1));
  margin-top: calc(4px * var(--axia-fs, 1));
  padding: calc(4px * var(--axia-fs, 1)) calc(6px * var(--axia-fs, 1));
}
.axia_lhead,
.axia_lrow {
  align-items: baseline;
  column-gap: calc(6px * var(--axia-fs, 1));
  display: grid;
  grid-template-columns: max-content repeat(4, minmax(0, 1fr));
}
.axia_lhead {
  color: var(--dsw-alias-label-caption);
  font-size: calc(9px * var(--axia-fs, 1));
  font-weight: 500;
  line-height: calc(12px * var(--axia-fs, 1));
  padding: 0 calc(4px * var(--axia-fs, 1));
}
.axia_lcol { text-align: right; }
.axia_lrow {
  border-radius: calc(5px * var(--axia-fs, 1));
  font-size: calc(11px * var(--axia-fs, 1));
  font-variant-numeric: tabular-nums;
  line-height: calc(15px * var(--axia-fs, 1));
  padding: calc(1px * var(--axia-fs, 1)) calc(4px * var(--axia-fs, 1));
}
.axia_lname {
  color: var(--dsw-alias-label-secondary);
  font-size: calc(10px * var(--axia-fs, 1));
  white-space: nowrap;
}
.axia_lmoney {
  color: var(--dsw-alias-label-primary);
  font-weight: 550;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.axia_lmoney.is-total { font-weight: 700; }
/* 本会话行（Hero）：只用一层淡紫底色强调，不加描边也不加投影 */
.axia_lrow.is-hero {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.18) 0%, rgba(139, 92, 246, 0.1) 62%, transparent 100%);
  line-height: calc(17px * var(--axia-fs, 1));
}
.axia_lrow.is-hero .axia_lname { color: #c4b5fd; font-weight: 600; }
.axia_lrow.is-hero .axia_lmoney { font-size: calc(12px * var(--axia-fs, 1)); }
.axia_sym {
  font-size: 0.8em;
  font-weight: 600;
  margin-right: 1px;
  opacity: 0.7;
}
.axia_num { font-weight: inherit; }
/* 拿不到汇率时的退化写法：元 + 美元并列（不瞎算，符号小一号） */
.axia_dual { font-size: calc(10px * var(--axia-fs, 1)); }
.axia_plus {
  font-size: 0.85em;
  margin: 0 2px;
  opacity: 0.45;
}

/* 芯片明细行：固定 3 列网格——三行（当前步/当前轮/本会话）结构完全一致，
   不再 flex-wrap 造成「当前步」挤成 2+1 而另两行 3 个一排。 */
.axia_chips { display: grid; gap: calc(4px * var(--axia-fs,1)); grid-template-columns: repeat(3, minmax(max-content, 1fr)); }
.axia_chip > * { min-width: 0; }
.axia_chip { align-items: center; display: inline-flex; gap: calc(4px * var(--axia-fs,1)); min-width: 0; white-space: nowrap; }
.axia_chip:hover {
  background: color-mix(in srgb, currentColor 6%, transparent);
}
/* 芯片内部件：状态点 / 标签 / 金额。三行共用同一套，行与行之间没有任何差异。 */
.axia_chipdot { border-radius: 50%; flex: none; height: calc(5px * var(--axia-fs, 1)); width: calc(5px * var(--axia-fs, 1)); }
.axia_dot_hit { background: #10b981; }
.axia_dot_miss { background: #f59e0b; }
.axia_dot_out { background: #8b5cf6; }
.axia_chiplab { color: var(--dsw-alias-label-caption); flex: none; font-size: calc(9px * var(--axia-fs,1)); line-height: calc(13px * var(--axia-fs,1)); white-space: nowrap; }
.axia_chipval { flex: none; font-size: calc(8.5px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; white-space: nowrap; }
/* 账单行卡片：三行只差行名与金额，盒子样式完全同款（首行不做任何特殊化） */
.axia_card {
  background: color-mix(in srgb, currentColor 3.5%, transparent);
  border-radius: calc(9px * var(--axia-fs, 1));
  display: flex;
  flex-direction: column;
  gap: calc(2px * var(--axia-fs, 1));
  margin-top: calc(3px * var(--axia-fs, 1));
  padding: calc(4px * var(--axia-fs, 1)) calc(7px * var(--axia-fs, 1));
}
.axia_cardhead { align-items: baseline; display: flex; gap: calc(8px * var(--axia-fs, 1)); justify-content: space-between; }
.axia_cardname {
  color: var(--dsw-alias-label-secondary);
  font-size: calc(10px * var(--axia-fs, 1));
  font-weight: 500;
  line-height: calc(13px * var(--axia-fs, 1));
  white-space: nowrap;
}
.axia_cardsum { color: var(--dsw-alias-label-primary); font-size: calc(14px * var(--axia-fs, 1)); font-variant-numeric: tabular-nums; font-weight: 650; line-height: calc(17px * var(--axia-fs, 1)); white-space: nowrap; }
/* ── 数值卡片网格 + Token 环形图 ───────────────────── */
.axia_panel { background: color-mix(in srgb, currentColor 3.5%, transparent); border-radius: calc(9px * var(--axia-fs,1)); display: flex; flex-direction: column; gap: calc(2px * var(--axia-fs,1)); margin-top: calc(4px * var(--axia-fs,1)); padding: calc(4px * var(--axia-fs,1)); }
.axia_panelhead { color: var(--dsw-alias-label-primary); font-size: calc(11px * var(--axia-fs,1)); font-weight: 650; line-height: calc(14px * var(--axia-fs,1)); }
.axia_tiles { display: grid; gap: calc(3px * var(--axia-fs,1)); grid-template-columns: repeat(3, minmax(0,1fr)); }
.axia_tile { background: color-mix(in srgb, currentColor 4%, transparent); border-radius: calc(7px * var(--axia-fs,1)); align-items: baseline; display: flex; flex-direction: row; gap: calc(5px * var(--axia-fs,1)); justify-content: space-between; padding: calc(2px * var(--axia-fs,1)) calc(6px * var(--axia-fs,1)); }
.axia_tilelab { color: var(--dsw-alias-label-secondary); flex: 1; font-size: calc(9px * var(--axia-fs,1)); line-height: calc(11px * var(--axia-fs,1)); min-width: 0; white-space: nowrap; }
.axia_tileval { color: var(--dsw-alias-label-primary); flex: none; font-size: calc(12px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; font-weight: 600; line-height: calc(14px * var(--axia-fs,1)); text-align: right; }
   只用 grid 跨列，不写死像素、不做绝对定位。 */
.axia_tile.is-wide { grid-column: span 2; }
.axia_ringbody { align-items: center; display: flex; gap: calc(8px * var(--axia-fs,1)); }
.axia_ringwrap { flex: none; position: relative; width: calc(76px * var(--axia-fs,1)); }
.axia_ring { display: block; height: auto; width: 100%; }
/* 环心覆盖层：inset:0 + flex 居中——环径怎么变，环心文字都在正中间（旧版 top:37px/53px 是按 96px 环写死的） */
.axia_ringcenter {
  align-items: center;
  display: flex;
  flex-direction: column;
  inset: 0;
  justify-content: center;
  pointer-events: none;
  position: absolute;
}
/* 环心文字：环径 58px（--axia-fs=1）时环内切圆半径只有 ~18.45px，两行合起来总宽必须 ≤ 2×√(18.45²−(h/2)²)。
   按 8px 主数字（行高 9.6px，6 字符宽 ~19.3px）+ 6.5px 标签（行高 8.5px，4 字宽 ~18.1px）算：
   总高 18.1px → 允许宽 32.5px；两行都在 20px 内，稳稳落在环内、不压环带。字号同样挂 --axia-fs。 */
.axia_ringpct { color: var(--dsw-alias-label-primary); font-size: calc(11px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; font-weight: 700; line-height: calc(13px * var(--axia-fs,1)); text-align: center; white-space: nowrap; }
.axia_ringsub { color: var(--dsw-alias-label-caption); font-size: calc(7.5px * var(--axia-fs,1)); line-height: calc(9px * var(--axia-fs,1)); text-align: center; white-space: nowrap; }
.axia_legend { display: flex; flex: 1; flex-direction: column; gap: calc(2px * var(--axia-fs,1)); min-width: 0; }
.axia_legenditem { align-items: baseline; display: flex; gap: calc(6px * var(--axia-fs,1)); min-width: 0; }
.axia_legendrow { display: contents; }
.axia_legenddot { align-self: center; border-radius: 2px; flex: none; height: calc(7px * var(--axia-fs,1)); order: 0; width: calc(7px * var(--axia-fs,1)); }
.axia_legendlab { color: var(--dsw-alias-label-secondary); flex: none; font-size: calc(9.5px * var(--axia-fs,1)); line-height: calc(12px * var(--axia-fs,1)); min-width: 0; white-space: nowrap; order: 1; }
.axia_legendval { color: var(--dsw-alias-label-primary); font-size: calc(10px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; font-weight: 600; margin-left: auto; order: 3; }
/* token 数并到同一行（原来单独占一行，白吃 3×11px 行高）：等宽数字、右对齐，不与百分比抢视线 */
.axia_legendtokens { color: var(--dsw-alias-label-primary); font-size: calc(8.5px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; text-align: right; }
/* 图例每项的 token 数（子行，缩进对齐标签列） */
.axia_legendsub { color: var(--dsw-alias-label-primary); font-size: calc(8.5px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; line-height: calc(11px * var(--axia-fs,1)); order: 2; white-space: nowrap; }

/* 底部模型微胶囊 */
.axia_modelpill { align-self: flex-start; background: color-mix(in srgb, currentColor 3.5%, transparent); border-radius: 999px; color: var(--dsw-alias-label-secondary); display: inline-flex; font-size: calc(9px * var(--axia-fs,1)); gap: calc(5px * var(--axia-fs,1)); line-height: calc(12px * var(--axia-fs,1)); margin-top: calc(4px * var(--axia-fs,1)); padding: calc(2px * var(--axia-fs,1)) calc(8px * var(--axia-fs,1)); }
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
  color: var(--dsw-alias-label-caption);
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
  return Number(amount.toFixed(4)).toString();
}
function formatUnifiedMoney(cny, usd, currency) {
  const yuan = Number.isFinite(cny) ? cny : 0;
  const dollar = Number.isFinite(usd) ? usd : 0;
  const toUsd = currency === "USD";
  const fx = currentFx();
  if (fx !== null && fx.rate > 0) {
    const total = toUsd ? dollar + yuan / fx.rate : yuan + dollar * fx.rate;
    const symbol = toUsd ? "$" : "¥";
    const amount = formatAmount(total);
    return { unified: true, symbol, amount, text: `${symbol}${amount}` };
  }
  const parts = [];
  if (yuan <= 0 && dollar <= 0) {
    if (toUsd) return { unified: false, symbol: "$", amount: "0", text: "$0" };
    return { unified: false, symbol: "¥", amount: "0", text: "¥0" };
  }
  if (yuan > 0) parts.push(`¥${formatAmount(yuan)}`);
  if (dollar > 0) parts.push(`$${formatAmount(dollar)}`);
  return { unified: false, symbol: "¥", amount: formatAmount(yuan), text: parts.join(" + ") };
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
  const unit = view.currency === "USD" ? "美元" : "元";
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
function renderContextStats(doc, put, view) {
  const ctx = view.ctx;
  const num = (value) => Number.isFinite(value) ? value : null;
  const count = (value) => {
    const v = num(value);
    return v === null ? "—" : String(Math.round(v));
  };
  const panel = doc.createElement("div");
  panel.className = "axia_panel";
  const head = doc.createElement("div");
  head.className = "axia_panelhead";
  head.textContent = "上下文统计";
  panel.appendChild(head);
  const grid = doc.createElement("div");
  grid.className = "axia_tiles";
  const tile = (label, value, hint, extraClass) => {
    const box = doc.createElement("div");
    box.className = extraClass ? `axia_tile ${extraClass}` : "axia_tile";
    box.title = hint;
    const lab = doc.createElement("div");
    lab.className = "axia_tilelab";
    lab.textContent = label;
    const val = doc.createElement("div");
    val.className = "axia_tileval";
    val.textContent = value;
    box.appendChild(lab);
    box.appendChild(val);
    grid.appendChild(box);
  };
  const sum3 = (a, b, c) => {
    const parts = [num(a), num(b), num(c)];
    if (parts.some((v) => v === null)) return null;
    return parts.reduce((x, y) => x + y, 0);
  };
  const cny = sum3(view.sessionCacheHitCost, view.sessionMissCost, view.sessionOutputCost);
  const usd = sum3(view.sessionCacheHitCostUsd, view.sessionMissCostUsd, view.sessionOutputCostUsd);
  let costText = "—";
  if (cny !== null && usd !== null) {
    ensureFx();
    costText = formatUnifiedMoney(cny, usd, view.currency).text;
  }
  tile("轮次", count(ctx?.turns), "会话累计轮数：turn/start 事件数（一条用户消息开启一轮）");
  tile("步数", count(ctx?.steps), "会话累计步数：step/start 事件数（每次请求模型算一步）");
  tile("工具调用", count(ctx?.tools), "每次 tool/call 记一次：一次工具调用算一次，不看结果");
  tile("图片", count(ctx?.images), "用户消息里的图片数：user/message 的 content 中 type=image 的 part 数");
  tile("剪枝", count(ctx?.prunes), "工具结果剪枝次数：compaction/prune 事件数", "is-wide");
  tile("注入", count(ctx?.injections), "注入进会话的非用户消息数：agent/inbox/spliced 里 source.kind ≠ user（插件/父代理/子代理/目标/AGENTS.md 指令）");
  tile("压缩", count(ctx?.compactions), "上下文压缩次数：compaction/start 事件数");
  panel.appendChild(grid);
  put(panel);
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
  renderContextStats(doc, put, view);
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
    val.textContent = pct === null ? "" : `${pct.toFixed(1)}%`;
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
  legendRow("currentColor", "总 token", null, readTokens + missTokens + outputTokens, "本会话所有 token 的合计（缓存输入 + 未缓存输入 + 输出）");
  legendRow("#22c55e", "缓存输入", pctOf(readTokens), readTokens, "命中缓存、按缓存价计费的输入 token");
  legendRow("#a855f7", "未缓存输入", pctOf(missTokens), missTokens, "未命中缓存的输入 token（按未命中价计费）");
  legendRow("#3b82f6", "输出", pctOf(outputTokens), outputTokens, "模型生成的输出 token");
  body.appendChild(legend);
  second.appendChild(body);
  put(second);
}
var FX_KEY = "axia-fx-usd-cny";
var FX_TTL_MS = 6 * 3600 * 1e3;
var fxState = null;
var fxLoading = false;
function currentFx() {
  if (fxState === null) {
    const cached2 = readFxCache();
    if (cached2 !== null && Number.isFinite(Date.parse(cached2.updatedAt)) && Date.now() - Date.parse(cached2.updatedAt) < FX_TTL_MS) {
      fxState = cached2;
    }
  }
  return fxState;
}
function readFxCache() {
  try {
    const raw = window.localStorage.getItem(FX_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    const rate = Number(parsed?.rate);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return {
      rate,
      updatedAt: String(parsed?.updatedAt ?? ""),
      stale: true,
      source: String(parsed?.source ?? "本地缓存")
    };
  } catch {
    return null;
  }
}
function ensureFx() {
  if (fxState !== null || fxLoading) return;
  const cached2 = currentFx();
  if (cached2 !== null) return;
  fxLoading = true;
  fetch("https://open.er-api.com/v6/latest/USD").then((res) => res.json()).then((body) => {
    const rate = Number(body?.rates?.CNY);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("bad rate");
    fxState = {
      rate,
      updatedAt: String(body?.time_last_update_utc ?? (/* @__PURE__ */ new Date()).toUTCString()),
      stale: false,
      source: String(body?.provider ?? "open.er-api.com")
    };
    try {
      window.localStorage.setItem(
        FX_KEY,
        JSON.stringify({ rate: fxState.rate, updatedAt: fxState.updatedAt, source: fxState.source })
      );
    } catch {
    }
    refreshOpenPanels();
  }).catch(() => {
    fxState = cached2;
  }).finally(() => {
    fxLoading = false;
  });
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
  const fxNote = () => {
    const fx = currentFx();
    if (fx === null || !(fx.rate > 0)) return "未取到汇率，暂按币种分别列出";
    return `按 1 USD = ${fx.rate} CNY 折算（来源 ${fx.source}${fx.stale ? " · 本地缓存" : ""}，更新于 ${fx.updatedAt}）`;
  };
  const moneyPlain = (cny, usd) => {
    ensureFx();
    return formatUnifiedMoney(cny, usd, view.currency).text;
  };
  const moneyHtml = (cny, usd) => {
    const money = formatUnifiedMoney(cny, usd, view.currency);
    const note = fxNote();
    return `<span class="axia_sym" title="${note}">${money.symbol}</span><span class="axia_num" title="${note}">${money.amount}</span>`;
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
    moneyHtml(cost + missCost + outputCost, n(view.costUsd) + n(view.missCostUsd) + n(view.outputCostUsd)),
    moneyPlain(cost, n(view.costUsd)),
    moneyPlain(missCost, n(view.missCostUsd)),
    moneyPlain(outputCost, n(view.outputCostUsd)),
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
    moneyHtml(turnHit + turnMiss + turnOut, turnHitUsd + turnMissUsd + turnOutUsd),
    moneyPlain(turnHit, turnHitUsd),
    moneyPlain(turnMiss, turnMissUsd),
    moneyPlain(turnOut, turnOutUsd),
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
    moneyHtml(sessionHit + sessionMiss + sessionOut, sessionHitUsd + sessionMissUsd + sessionOutUsd),
    moneyPlain(sessionHit, sessionHitUsd),
    moneyPlain(sessionMiss, sessionMissUsd),
    moneyPlain(sessionOut, sessionOutUsd),
    true
    // Hero：只有「本会话」行加重（首行「当前步」与「当前轮」完全同款）
  );
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
