/**
 * dsh-axia-cachebilling — 缓存账单浏览器端。
 *
 * 不再自带任何按钮或占位行：官方上下文圆环点开的弹层本来就是「这个会话用了多少」的语义，缓存账单的「这步花了多少、要不要换窗口」语义与之天然同源，用户拍板就该放到那里。因此监听官方弹层的打开，把账单区块直接贴进去。
 *
 * - CacheDataHook：仍经 slots 挂在 conversation.input.right 不可见处，唯一职责是让 useProjection 保持活跃，把最新投影同步进模块级 store 并刷新已打开的弹层区块。
 * - ContextPanelBridge：MutationObserver 观察官方弹层出现，role=dialog 且 aria-label 为「上下文已用 / of context used」，出现即在弹层末尾贴上账单区块，弹层关闭随 React 卸载自然消失。
 * - 第三方中转同样显示：provider 非空即放行；DeepSeek 官方路由（provider 名含 deepseek，沿用旧口径）按刊例价精确计价，第三方模型命中价目表按刊例价计、未命中按 flash 价估算并标注，provider 为空时不显示。
 * - 已知边界：官方若更改弹层结构或文案，贴装会静默失效，菜单里少了账单行，不影响其他功能，届时适配新选择器即可。
 */

import * as React from 'react'
import { applyFontScale, applySettings, readFontScale } from './settings'

/** 样式注入标识（防重复注入）。 */
const CSS_ID = 'dsh-axia-cachebilling-css'

/** 账单区块样式：高质感 Bento 财务卡片与微状态点，苹果级流体质感。 */
const CSS = `
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
.axia_chips { display: grid; gap: calc(4px * var(--axia-fs,1)); grid-template-columns: repeat(3, minmax(0,1fr)); }
.axia_chip > * { min-width: 0; }
.axia_chip {
  align-items: center;
  display: inline-flex;
  gap: calc(4px * var(--axia-fs, 1));
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  background: color-mix(in srgb, currentColor 3%, transparent);
  border: 1px solid color-mix(in srgb, currentColor 7%, transparent);
  border-radius: calc(5px * var(--axia-fs, 1));
  padding: calc(1.5px * var(--axia-fs, 1)) calc(6px * var(--axia-fs, 1));
  transition: background 0.15s ease;
}
.axia_chip:hover {
  background: color-mix(in srgb, currentColor 6%, transparent);
}
/* 芯片内部件：状态点 / 标签 / 金额。三行共用同一套，行与行之间没有任何差异。 */
.axia_chipdot { border-radius: 50%; flex: none; height: calc(5px * var(--axia-fs, 1)); width: calc(5px * var(--axia-fs, 1)); }
.axia_dot_hit { background: #10b981; }
.axia_dot_miss { background: #f59e0b; }
.axia_dot_out { background: #8b5cf6; }
.axia_chiplab { color: var(--dsw-alias-label-caption); font-size: calc(9px * var(--axia-fs, 1)); line-height: calc(13px * var(--axia-fs, 1)); }
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
.axia_legenditem { display: flex; flex-direction: column; min-width: 0; }
.axia_legendrow { align-items: baseline; display: flex; gap: calc(6px * var(--axia-fs,1)); }
.axia_legenddot { align-self: center; border-radius: 2px; flex: none; height: calc(7px * var(--axia-fs,1)); width: calc(7px * var(--axia-fs,1)); }
.axia_legendlab { color: var(--dsw-alias-label-secondary); flex: 1; font-size: calc(9.5px * var(--axia-fs,1)); line-height: calc(12px * var(--axia-fs,1)); min-width: 0; white-space: nowrap; }
.axia_legendval { color: var(--dsw-alias-label-primary); font-size: calc(10px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; font-weight: 600; }
/* token 数并到同一行（原来单独占一行，白吃 3×11px 行高）：等宽数字、右对齐，不与百分比抢视线 */
.axia_legendtokens { color: var(--dsw-alias-label-caption); font-size: calc(8.5px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; text-align: right; }
/* 图例每项的 token 数（子行，缩进对齐标签列） */
.axia_legendsub { color: var(--dsw-alias-label-caption); font-size: calc(8.5px * var(--axia-fs,1)); font-variant-numeric: tabular-nums; line-height: calc(11px * var(--axia-fs,1)); padding-left: calc(13px * var(--axia-fs,1)); }

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
`

/** 显示判定：默认全生效，不再按 provider 名过滤。任何 provider 只要报出用量，就按模型名匹配价目表显示估算金额，provider 为空时不显示。 */
function isBillableProvider(provider: unknown): boolean {
  return typeof provider === 'string' && provider !== ''
}

/** 金额格式化，无货币符号：小于 0.01 四舍五入保留一位有效数字（0.0047→0.005，0.0003 依稀可辨），大于等于 0.01 四舍五入到分，0 恒显示 0。 */
function formatAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '0'
  // 完整数值：最多 10 位小数后去尾随零；不缩写、不做有效数字截断（不丢位数）
  return Number(amount.toFixed(10)).toString()
}

/**
 * 统一币种换算（全渲染器唯一入口）：把同一笔钱的元部分与美元部分合成一个数字。
 *
 * - 方向由 view.currency（当前条目的计费币种）决定，绝不写死：USD 会话 → cny / 汇率 折进美元；
 *   CNY 会话 → usd * 汇率 折进元。汇率只认模块级 fxState（ensureFx 从 open.er-api.com 取，见下）。
 * - 拿不到汇率（keyless 首帧 / 离线且无缓存）→ unify 为 false，退回“两笔分列”的降级写法，
 *   调用方在 title 里说明原因（fxNote）；宁可慢一帧也不瞎算。
 */
interface UnifiedMoney {
  /** 换算成功：单一币种符号 + 单一数字，直接可用 */
  unified: boolean
  symbol: '$' | '¥'
  /** 无数字的纯文本形式：'1.04' / '2.65'（unified 时=折算后总额，否则=元的部分） */
  amount: string
  /** 纯文本形式：'$1.04' 或降级时的 '¥1.04 + $2.65' */
  text: string
}

function formatUnifiedMoney(cny: number, usd: number, currency: string | undefined): UnifiedMoney {
  const yuan = Number.isFinite(cny) ? cny : 0
  const dollar = Number.isFinite(usd) ? usd : 0
  const toUsd = currency === 'USD'
  const fx = currentFx()
  if (fx !== null && fx.rate > 0) {
    const total = toUsd ? dollar + yuan / fx.rate : yuan + dollar * fx.rate
    const symbol = toUsd ? '$' : '¥'
    const amount = formatAmount(total)
    return { unified: true, symbol, amount, text: `${symbol}${amount}` }
  }
  const parts: string[] = []
  // 两笔都是 0：符号跟随 view.currency（否则 USD 会话里会冒出 ¥0，看着像混币）
  if (yuan <= 0 && dollar <= 0) {
    if (toUsd) return { unified: false, symbol: '$', amount: '0', text: '$0' }
    return { unified: false, symbol: '¥', amount: '0', text: '¥0' }
  }
  if (yuan > 0) parts.push(`¥${formatAmount(yuan)}`)
  if (dollar > 0) parts.push(`$${formatAmount(dollar)}`)
  return { unified: false, symbol: '¥', amount: formatAmount(yuan), text: parts.join(' + ') }
}

const TIER_LABEL: Record<string, string> = {
  peak: '梁文峰',
  offPeak: '梁文谷',
}

/** 非 DeepSeek 官方路由的峰谷标注：直白写峰价/谷价，彩蛋只留给官方路由（口径沿用旧版：provider 名含 deepseek 即视为官方）。 */
const TIER_LABEL_GENERIC: Record<string, string> = {
  peak: '峰价',
  offPeak: '谷价',
}

/** 是否 DeepSeek 官方路由：provider 名含 deepseek 即视为官方，第三方网关一般以自家名作 provider，模型名才带 deepseek 字样。 */
function isOfficialDeepSeek(provider: unknown): boolean {
  if (typeof provider !== 'string' || provider === '') return false
  return provider.toLowerCase().includes('deepseek')
}

interface CacheBillingView {
  available?: boolean
  cost?: number
  missCost?: number
  outputCost?: number
  /** 当前步的美元部分（币种=USD 的条目只进这三个字段） */
  costUsd?: number
  missCostUsd?: number
  outputCostUsd?: number
  /** 本会话同时出现两种币种时为 true，账单按币种分开合计并提示 */
  mixedCurrency?: boolean
  currency?: string
  model?: string | null
  provider?: string | null
  tier?: string | null
  priceMatched?: boolean
  sessionMissSteps?: number
  sessionFullMissSteps?: number
  turnHitCost?: number
  turnMissCost?: number
  turnOutputCost?: number
  turnHitCostUsd?: number
  turnMissCostUsd?: number
  turnOutputCostUsd?: number
  sessionCacheHitCost?: number
  sessionMissCost?: number
  sessionOutputCost?: number
  sessionCacheHitCostUsd?: number
  sessionMissCostUsd?: number
  sessionOutputCostUsd?: number
  /** 曲线块（第二块）：null = 当前模型未命中价目表（估算步不入曲线）；avgHit=平均缓存累计（空数组=无 hc 数据不画） */
  curve?: {
    key: string
    sessions: number
    avg: number[]
    avgHit: number[]
    cur: Array<[number, number]>
  } | null
  /** 消耗比较块（第三块）：null = 尚无用量样本 */
  compare?: {
    readCode: number
    cache: number
    fullMiss: number
  } | null
  /** 上下文计数器（宿主按会话事件流计数）；缺失时「上下文统计」面板整格显示「—」 */
  ctx?: {
    turns?: number
    steps?: number
    tools?: number
    images?: number
    injections?: number
    compactions?: number
    prunes?: number
  }
}

/** 小节标题：微发光货币图标 + 标题层级。 */
function secHead(doc: Document, color: string, text: string): HTMLElement {
  const head = doc.createElement('div')
  head.className = 'axia_sechead'
  const icon = doc.createElement('span')
  icon.className = 'axia_sechead_icon'
  icon.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
  head.appendChild(icon)
  const title = doc.createElement('span')
  title.className = 'axia_sechead_title'
  title.textContent = text
  head.appendChild(title)
  return head
}

/** 模块级投影镜像：React hook 侧写入，命令式贴装侧读取。 */
let latestView: CacheBillingView | undefined

/** 官方弹层判定：role=dialog 加 aria-label 双语匹配上下文圆环弹层，官方 trigger 的 aria-haspopup=dialog，panel 的 aria-label 为「上下文已用」或「of context used」。 */
function isContextPanel(node: Node): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false
  if (node.getAttribute('role') !== 'dialog') return false
  const label = node.getAttribute('aria-label') ?? ''
  return /of context used|上下文已用/i.test(label)
}

/**
 * 上下文弹层里的账单明细（重做版）：结构化微胶囊模型行。
 */
function renderDetails(doc: Document, put: (el: HTMLElement) => void, view: CacheBillingView): void {
  const provider = view.provider ?? ''
  const tierMap = isOfficialDeepSeek(provider) ? TIER_LABEL : TIER_LABEL_GENERIC
  const tier = view.tier ? tierMap[view.tier] : ''

  const modelLine = doc.createElement('div')
  modelLine.className = 'axia_modelpill'
  const unit = view.currency === 'USD' ? '美元' : '元'
  const tierClass = tier.includes('谷') ? 'is-valley' : tier.includes('峰') ? 'is-peak' : 'is-flat'
  modelLine.innerHTML = `
    <span class="axia_pill_model">${provider}/${view.model ?? ''}</span>
    ${tier ? `<span class="axia_pill_tier ${tierClass}">${tier}</span>` : ''}
    <span class="axia_pill_unit">${unit}</span>
  `
  put(modelLine)
}

/** token 数紧凑写法：845.3M / 3.7M / 1.5k */
function compactTokens(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0'
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`
  return String(Math.round(value))
}

/**
 *
 * 数据全部来自宿主投影的事件计数器（src/index.ts 的 countContext），是会话日志里真实事件的数量，
 * 客户端不做任何折算、不补零：宿主没上报（view.ctx 缺失，例如旧构建）时整格显示「—」，绝不用别的数字凑。
 * 不加进场动画是刻意的：计数器随事件流重绘，动效会变成持续闪烁（高频更新的数字不做入场动画）。
 */
function renderContextStats(doc: Document, put: (el: HTMLElement) => void, view: CacheBillingView): void {
  const ctx = view.ctx
  const num = (value: unknown): number | null => (Number.isFinite(value) ? (value as number) : null)
  /** 计数文本：拿不到就是「—」——0 和「没有这项数据」是两件事，不能混。 */
  const count = (value: unknown): string => {
    const v = num(value)
    return v === null ? '—' : String(Math.round(v))
  }

  const panel = doc.createElement('div')
  panel.className = 'axia_panel'
  const head = doc.createElement('div')
  head.className = 'axia_panelhead'
  head.textContent = '上下文统计'
  panel.appendChild(head)

  const grid = doc.createElement('div')
  grid.className = 'axia_tiles'
  /** 一格 = 标签在左、数值在右；extraClass 传 'is-wide' 时跨两列（CSS 里 grid-column: span 2）。 */
  const tile = (label: string, value: string, hint: string, extraClass?: string): void => {
    const box = doc.createElement('div')
    box.className = extraClass ? `axia_tile ${extraClass}` : 'axia_tile'
    box.title = hint
    const lab = doc.createElement('div')
    lab.className = 'axia_tilelab'
    lab.textContent = label
    const val = doc.createElement('div')
    val.className = 'axia_tileval'
    val.textContent = value
    box.appendChild(lab)
    box.appendChild(val)
    grid.appendChild(box)
  }

  const sum3 = (a: unknown, b: unknown, c: unknown): number | null => {
    const parts = [num(a), num(b), num(c)]
    if (parts.some((v) => v === null)) return null
    return (parts as number[]).reduce((x, y) => x + y, 0)
  }
  const cny = sum3(view.sessionCacheHitCost, view.sessionMissCost, view.sessionOutputCost)
  const usd = sum3(view.sessionCacheHitCostUsd, view.sessionMissCostUsd, view.sessionOutputCostUsd)
  let costText = '—'
  if (cny !== null && usd !== null) {
    ensureFx()
    costText = formatUnifiedMoney(cny, usd, view.currency).text
  }

  tile('轮次', count(ctx?.turns), '会话累计轮数：turn/start 事件数（一条用户消息开启一轮）')
  tile('步数', count(ctx?.steps), '会话累计步数：step/start 事件数（每次请求模型算一步）')
  tile('工具调用', count(ctx?.tools), '每次 tool/call 记一次：一次工具调用算一次，不看结果')
  tile('图片', count(ctx?.images), '用户消息里的图片数：user/message 的 content 中 type=image 的 part 数')
  tile('剪枝', count(ctx?.prunes), '工具结果剪枝次数：compaction/prune 事件数', 'is-wide')

  tile('注入', count(ctx?.injections), '注入进会话的非用户消息数：agent/inbox/spliced 里 source.kind ≠ user（插件/父代理/子代理/目标/AGENTS.md 指令）')
  tile('压缩', count(ctx?.compactions), '上下文压缩次数：compaction/start 事件数')

  panel.appendChild(grid)
  put(panel)
}

/**
 * 两块面板：①「上下文统计」2×4 数值卡片网格（真实事件计数）；②「Token 统计」环形图 + 图例 + 环心命中率。
 *
 * 不加进场动画是刻意的：账单每来一个 usage 事件就重绘一次，动效会变成持续闪烁（Emil 的规矩：
 * 高频更新的数字不要做入场动画）。环图只表达比例，不做插值补间，避免和重绘打架。
 */
function renderStats(doc: Document, put: (el: HTMLElement) => void, view: CacheBillingView): void {
  const num = (value: unknown): number => (Number.isFinite(value) ? (value as number) : 0)
  /** 金额文本：元与美元分开合计再拼（与上方金额卡同一口径）。
   *  只读 cny 字段会让美元会话整列显示 $0 —— 这是上一版把「当前步/当前轮」显示成 0 的根因。 */
  const money = (cny: unknown, usd: unknown): string => {
    const yuan = num(cny)
    const dollar = num(usd)
    const parts: string[] = []
    if (yuan > 0 || dollar <= 0) parts.push(`¥${formatAmount(yuan)}`)
    if (dollar > 0) parts.push(`$${formatAmount(dollar)}`)
    return parts.join(' + ')
  }

  // 「账单统计」数值卡片面板已按用户要求删除（2026-09-13）：那是我按参考图样式硬凑的账单分解，
  // 所以这里换成真实事件计数的「上下文统计」面板；它不依赖 token 用量，故在下面的 early-return 之前渲染。
  renderContextStats(doc, put, view)

  const inputTokens = num(view.sessionInputTokens)
  const readTokens = Math.min(num(view.sessionCacheReadTokens), inputTokens)
  const outputTokens = num(view.sessionOutputTokens)
  const missTokens = Math.max(0, inputTokens - readTokens)
  const totalTokens = inputTokens + outputTokens
  if (totalTokens <= 0) return

  const pctOf = (value: number): number => (totalTokens > 0 ? (value / totalTokens) * 100 : 0)
  const hitPct = inputTokens > 0 ? (readTokens / inputTokens) * 100 : 0
  const slices = [
    { pct: pctOf(readTokens), color: '#22c55e' },
    { pct: pctOf(missTokens), color: '#a855f7' },
    { pct: pctOf(outputTokens), color: '#3b82f6' },
  ]

  const second = doc.createElement('div')
  second.className = 'axia_panel'
  const head2 = doc.createElement('div')
  head2.className = 'axia_panelhead'
  head2.textContent = 'Token 统计'
  second.appendChild(head2)
  const body = doc.createElement('div')
  body.className = 'axia_ringbody'

  const SVG_NS = 'http://www.w3.org/2000/svg'
  const size = 96
  const radius = 36
  const stroke = 11
  const circumference = 2 * Math.PI * radius
  const svg = doc.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`)
  svg.setAttribute('class', 'axia_ring')
  let consumed = 0
  for (const slice of slices) {
    if (slice.pct <= 0) continue
    const arc = doc.createElementNS(SVG_NS, 'circle')
    arc.setAttribute('cx', String(size / 2))
    arc.setAttribute('cy', String(size / 2))
    arc.setAttribute('r', String(radius))
    arc.setAttribute('fill', 'none')
    arc.setAttribute('stroke', slice.color)
    arc.setAttribute('stroke-width', String(stroke))
    arc.setAttribute('stroke-dasharray', `${(circumference * slice.pct) / 100} ${circumference}`)
    arc.setAttribute('stroke-dashoffset', String(-consumed))
    arc.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`)
    consumed += (circumference * slice.pct) / 100
    svg.appendChild(arc)
  }
  const ringWrap = doc.createElement('div')
  ringWrap.className = 'axia_ringwrap'
  ringWrap.appendChild(svg as unknown as HTMLElement)
  // 环心文字必须住在覆盖层里：覆盖层 inset:0 + flex 居中（见 CSS .axia_ringcenter），
  // 直接挂 ringWrap 会被当成 flex 兄弟挤到环下方/外侧。
  const ringCenter = doc.createElement('div')
  ringCenter.className = 'axia_ringcenter'
  const centerPct = doc.createElement('div')
  centerPct.className = 'axia_ringpct'
  centerPct.textContent = `${hitPct.toFixed(2)}%`
  const centerSub = doc.createElement('div')
  centerSub.className = 'axia_ringsub'
  centerSub.textContent = '缓存命中'
  ringCenter.appendChild(centerPct)
  ringCenter.appendChild(centerSub)
  ringWrap.appendChild(ringCenter)
  body.appendChild(ringWrap)

  const legend = doc.createElement('div')
  legend.className = 'axia_legend'
  const legendRow = (color: string, label: string, pct: number, tokens: number, hint: string): void => {
    const item = doc.createElement('div')
    item.className = 'axia_legenditem'
    const line = doc.createElement('div')
    line.className = 'axia_legendrow'
    line.title = hint
    const dot = doc.createElement('span')
    dot.className = 'axia_legenddot'
    dot.style.background = color
    const lab = doc.createElement('span')
    lab.className = 'axia_legendlab'
    lab.textContent = label
    const val = doc.createElement('span')
    val.className = 'axia_legendval'
    val.textContent = `${pct.toFixed(1)}%`
    line.appendChild(dot)
    line.appendChild(lab)
    line.appendChild(val)
    const sub = doc.createElement('div')
    sub.className = 'axia_legendsub'
    sub.textContent = compactTokens(tokens)
    item.appendChild(line)
    item.appendChild(sub)
    legend.appendChild(item)
  }
  legendRow('#22c55e', '缓存输入', pctOf(readTokens), readTokens, '命中缓存、按缓存价计费的输入 token')
  legendRow('#a855f7', '未缓存输入', pctOf(missTokens), missTokens, '未命中缓存的输入 token（按未命中价计费）')
  legendRow('#3b82f6', '输出', pctOf(outputTokens), outputTokens, '模型生成的输出 token')
  body.appendChild(legend)
  second.appendChild(body)
  put(second)
}

/* ── 汇率：把「元」与「美元」统一成条目计费币种 ─────────────────────────
   来源必须可核实：open.er-api.com（返回 rates.CNY 与 time_last_update_utc）。
   成功 → 内存 + localStorage 缓存（TTL 6 小时）；拉取失败 → 用上次成功的；两者都无 → 不换算（退化为并列展示，
   绝不瞎算）。方向由 view.currency（当前条目的计费币种）决定，不写死。 */
const FX_KEY = 'axia-fx-usd-cny'
const FX_TTL_MS = 6 * 3600 * 1000
interface FxState {
  rate: number
  updatedAt: string
  stale: boolean
  source: string
}
let fxState: FxState | null = null
let fxLoading = false

/**
 * 当前可用汇率（只读）：内存 → 本地缓存的同步兜底。
 *
 * 为什么加这一层：本会话首帧渲染发生在 ensureFx 的 fetch 落地之前，若只看内存，首帧会走「两笔分列」的降级
 * 写法（USD 会话里冒出 ¥0），下一帧才跳成单币种——同一块面板两次渲染两种口径。缓存本来就是同步可读的，
 * 所以首帧也直接用它：有缓存（TTL 内）就立刻统一；真的没缓存才降级，且降级同样只此一帧。
 */
function currentFx(): FxState | null {
  if (fxState === null) {
    const cached = readFxCache()
    if (cached !== null && Number.isFinite(Date.parse(cached.updatedAt)) && Date.now() - Date.parse(cached.updatedAt) < FX_TTL_MS) {
      fxState = cached
    }
  }
  return fxState
}

function readFxCache(): FxState | null {
  try {
    const raw = window.localStorage.getItem(FX_KEY)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as Partial<FxState>
    const rate = Number(parsed?.rate)
    if (!Number.isFinite(rate) || rate <= 0) return null
    return {
      rate,
      updatedAt: String(parsed?.updatedAt ?? ''),
      stale: true,
      source: String(parsed?.source ?? '本地缓存'),
    }
  } catch {
    return null
  }
}

/** 幂等：只在没汇率时拉一次（含进行中的去重），拿到后刷新已打开的弹层。 */
function ensureFx(): void {
  if (fxState !== null || fxLoading) return
  const cached = currentFx()
  if (cached !== null) return
  fxLoading = true
  fetch('https://open.er-api.com/v6/latest/USD')
    .then((res) => res.json())
    .then((body: any) => {
      const rate = Number(body?.rates?.CNY)
      if (!Number.isFinite(rate) || rate <= 0) throw new Error('bad rate')
      fxState = {
        rate,
        updatedAt: String(body?.time_last_update_utc ?? new Date().toUTCString()),
        stale: false,
        source: String(body?.provider ?? 'open.er-api.com'),
      }
      try {
        window.localStorage.setItem(
          FX_KEY,
          JSON.stringify({ rate: fxState.rate, updatedAt: fxState.updatedAt, source: fxState.source }),
        )
      } catch {
        /* 隐私模式 / 禁用存储：只用内存值 */
      }
      refreshOpenPanels()
    })
    .catch(() => {
      fxState = cached
    })
    .finally(() => {
      fxLoading = false
    })
}

/** 用最新投影刷新账单区块内容，区块骨架已在贴装时建好。 */
function renderBill(bill: HTMLElement): void {
  const doc = bill.ownerDocument
  if (!doc) return
  bill.textContent = ''

  const view = latestView
  const put = (el: HTMLElement): void => {
    bill.appendChild(el)
  }

  if (!view || !isBillableProvider(view.provider)) {
    // 无 provider 或无投影：什么都不贴，宁可不算。
    return
  }

  if (view.available !== true) {
    const empty = doc.createElement('div')
    empty.className = 'axia_foot'
    empty.textContent = '缓存账单：本会话暂无 Token 用量'
    put(empty)
    return
  }

  const cost = Number.isFinite(view.cost) ? (view.cost as number) : 0
  const missCost = Number.isFinite(view.missCost) ? (view.missCost as number) : 0
  const outputCost = Number.isFinite(view.outputCost) ? (view.outputCost as number) : 0
  const symbol = view.currency === 'USD' ? '$' : '¥'

  // 未命中价目表的醒目提示行仍在最顶：金额是 flash 价估算，不能穿着精确数据的外衣
  if (view.priceMatched === false) {
    const notice = doc.createElement('div')
    notice.className = 'axia_notice'
    notice.textContent =
      '［虾算账］当前模型无价格数据，请去设置界面添加。以下为Deepseek价格，仅供参考：'
    put(notice)
  }

  // 账表节标题：微发光货币图标 + 现代排版
  put(secHead(doc, '#f59e0b', '当前会话统计'))

  /** 汇率说明（tooltip 共用）：金额按哪个汇率折的，一眼可见；没汇率时说明为什么分列。 */
  const fxNote = (): string => {
    const fx = currentFx()
    if (fx === null || !(fx.rate > 0)) return '未取到汇率，暂按币种分别列出'
    return `按 1 USD = ${fx.rate} CNY 折算（来源 ${fx.source}${fx.stale ? ' · 本地缓存' : ''}，更新于 ${fx.updatedAt}）`
  }
  const moneyPlain = (cny: number, usd: number): string => {
    ensureFx()
    return formatUnifiedMoney(cny, usd, view.currency).text
  }
  /** 金额 → 统一币种后的 HTML（符号与数字分离，供大字号总额用）；换算逻辑全在 formatUnifiedMoney 里。 */
  const moneyHtml = (cny: number, usd: number): string => {
    const money = formatUnifiedMoney(cny, usd, view.currency)
    const note = fxNote()
    return `<span class="axia_sym" title="${note}">${money.symbol}</span><span class="axia_num" title="${note}">${money.amount}</span>`
  }
  const n = (value: unknown): number => (Number.isFinite(value) ? (value as number) : 0)

  /** 一行账单 = 一张圆角 Bento 卡片：行名 + 大字总额（右对齐），下面一行状态点小芯片。 */
  const tableRow = (label: string, totalHtml: string, hit: string, miss: string, out: string, isHero: boolean = false): void => {
    const box = doc.createElement('div')
    box.className = `axia_card ${isHero ? 'axia_card_hero' : ''}`
    const head = doc.createElement('div')
    head.className = 'axia_cardhead'
    const name = doc.createElement('span')
    name.className = 'axia_cardname'
    name.textContent = label
    const sum = doc.createElement('span')
    sum.className = 'axia_cardsum'
    sum.innerHTML = totalHtml
    head.appendChild(name)
    head.appendChild(sum)
    box.appendChild(head)
    const chips = doc.createElement('div')
    chips.className = 'axia_chips'
    const chip = (lab: string, val: string, dotClass: string, hint: string): void => {
      const item = doc.createElement('span')
      item.className = 'axia_chip'
      item.title = hint
      const dot = doc.createElement('span')
      dot.className = `axia_chipdot ${dotClass}`
      const l = doc.createElement('span')
      l.className = 'axia_chiplab'
      l.textContent = lab
      const v = doc.createElement('span')
      v.className = 'axia_chipval'
      v.textContent = val
      item.appendChild(dot)
      item.appendChild(l)
      item.appendChild(v)
      chips.appendChild(item)
    }
    chip('命中', hit, 'axia_dot_hit', '缓存命中部分的费用')
    chip('未命中', miss, 'axia_dot_miss', '未命中输入（含缓存写入）的费用')
    chip('输出', out, 'axia_dot_out', '输出 token 的费用')
    box.appendChild(chips)
    put(box)
  }

  tableRow(
    '当前步',
    moneyHtml(cost + missCost + outputCost, n(view.costUsd) + n(view.missCostUsd) + n(view.outputCostUsd)),
    moneyPlain(cost, n(view.costUsd)),
    moneyPlain(missCost, n(view.missCostUsd)),
    moneyPlain(outputCost, n(view.outputCostUsd)),
    false,
  )

  // 当前轮：turn 内多步累计（元与美元分开合计）
  const turnHit = n(view.turnHitCost)
  const turnMiss = n(view.turnMissCost)
  const turnOut = n(view.turnOutputCost)
  const turnHitUsd = n(view.turnHitCostUsd)
  const turnMissUsd = n(view.turnMissCostUsd)
  const turnOutUsd = n(view.turnOutputCostUsd)
  tableRow(
    '当前轮',
    moneyHtml(turnHit + turnMiss + turnOut, turnHitUsd + turnMissUsd + turnOutUsd),
    moneyPlain(turnHit, turnHitUsd),
    moneyPlain(turnMiss, turnMissUsd),
    moneyPlain(turnOut, turnOutUsd),
    false,
  )

  // 本会话累计（Hero Card 视觉焦点）
  const sessionHit = n(view.sessionCacheHitCost)
  const sessionMiss = n(view.sessionMissCost)
  const sessionOut = n(view.sessionOutputCost)
  const sessionHitUsd = n(view.sessionCacheHitCostUsd)
  const sessionMissUsd = n(view.sessionMissCostUsd)
  const sessionOutUsd = n(view.sessionOutputCostUsd)
  tableRow(
    '本会话',
    moneyHtml(sessionHit + sessionMiss + sessionOut, sessionHitUsd + sessionMissUsd + sessionOutUsd),
    moneyPlain(sessionHit, sessionHitUsd),
    moneyPlain(sessionMiss, sessionMissUsd),
    moneyPlain(sessionOut, sessionOutUsd),
    true, // Hero：只有「本会话」行加重（首行「当前步」与「当前轮」完全同款）
  )

  renderStats(doc, put, view)
  renderDetails(doc, put, view)
}

/** 块 2+3 合并布局（猫猫 2026-08-31 定稿，cmp-24 面积图）：标题横贯顶部「对于 provider/model」（峰谷带括号：官方梁文峰/梁文谷、其他峰价/谷价；一口价不加括号），底部灰字删除。左半边竖长方形手写 SVG——两条平均值画曲线下面积（平均（总）蓝/平均缓存绿，半透明填色无描边，缓存嵌套透色可辨），本会话（总）保持橙色描边线；图例（蓝块/橙线/绿块）竖排图内左上，轴标签紧凑贴边；右半边两节：「■ 消耗比较」三数 + 「■ 缓存」失效统计（完全失效次数；缓存时间估算/现在失效可能占位「暂未实现」待口径）。curve 与 compare 任一存在即渲染，估算场景 curve 为 null 只出右列。 */
function renderChart(doc: Document, put: (el: HTMLElement) => void, view: CacheBillingView): void {
  const curve = view.curve
  const cmp = view.compare
  if (!curve && !cmp) return

  // 顶部标题：色块 + 大字「当前模型统计」（猫猫 09-01 定稿）；模型信息另起一行小字，峰谷标注跟在模型名后（一口价不加）
  const official = isOfficialDeepSeek(view.provider)
  const labels = official ? TIER_LABEL : TIER_LABEL_GENERIC
  const modelPart = typeof view.model === 'string' && view.model !== '' ? view.model : '当前模型'
  const namePart =
    typeof view.provider === 'string' && view.provider !== '' ? `${view.provider}/${modelPart}` : modelPart
  const tierWord =
    view.tier === 'peak' ? labels.peak : view.tier === 'offPeak' ? labels.offPeak : null
  put(secHead(doc, '#60a5fa', '当前模型统计'))
  const modeline = doc.createElement('div')
  modeline.className = 'axia_modeline'
  modeline.textContent = tierWord ? `${namePart} · ${tierWord}` : namePart
  put(modeline)

  const wrap = doc.createElement('div')
  wrap.className = 'axia_chartwrap'

  // 左列：竖长方形曲线图（仅价目表命中时画——估算步不入曲线）
  if (curve) {
    const col = doc.createElement('div')
    col.className = 'axia_chartcol'

    const W = 120
    const H = 130
    const L = 8
    const R = 6
    const TOP = 2 // 曲线区顶到图边（去掉顶部留白，猫猫 09-01）；留 2px 防曲线端点圆被 viewBox 裁切
    const B = 10
    const lastCurN = curve.cur.length > 0 ? curve.cur[curve.cur.length - 1][0] : 0
    const xmax = Math.max(curve.avg.length, lastCurN, 1)
    // avgHit 防御解构：旧投影快照（stateVersion 9 前生成）无此字段
    const avgHit = curve.avgHit ?? []
    let ymax = 0
    for (const v of curve.avg) if (v > ymax) ymax = v
    for (const v of avgHit) if (v > ymax) ymax = v
    for (const [, v] of curve.cur) if (v > ymax) ymax = v
    if (ymax <= 0) ymax = 1
    const x = (n: number): number => L + ((n - 1) / Math.max(xmax - 1, 1)) * (W - L - R)
    const y = (v: number): number => H - B - (v / ymax) * (H - B - TOP)
    const NS = 'http://www.w3.org/2000/svg'
    const el = (tag: string, cls: string): SVGElement => {
      const node = doc.createElementNS(NS, tag)
      node.setAttribute('class', cls)
      return node as unknown as SVGElement
    }

    const svg = el('svg', 'axia_svg')
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)

    // 图例浮在图内左上角（二次增长曲线左上恒空，正好放）——面积图配色块样例，本会话线配线段样例（猫猫 09-02 面积图定稿）
    const legendSwatch = (kind: 'block' | 'line', cls: string, cy: number, text: string): void => {
      if (kind === 'block') {
        const block = doc.createElementNS(NS, 'rect')
        block.setAttribute('x', '6')
        block.setAttribute('y', String(cy - 4))
        block.setAttribute('width', '8')
        block.setAttribute('height', '8')
        block.setAttribute('class', cls)
        svg.appendChild(block)
      } else {
        const line = el('line', cls)
        line.setAttribute('x1', '6')
        line.setAttribute('y1', String(cy))
        line.setAttribute('x2', '14')
        line.setAttribute('y2', String(cy))
        svg.appendChild(line)
      }
      const label = el('text', 'axia_axlabel')
      label.setAttribute('x', '17')
      label.setAttribute('y', String(cy + 3))
      label.textContent = text
      svg.appendChild(label)
    }
    legendSwatch('block', 'axia_avgblock', 24, '平均（总）')
    legendSwatch('block', 'axia_avghitblock', 35, '平均缓存')
    legendSwatch('line', 'axia_cur', 46, '本会话（总）')

    // L 形坐标轴：左纵 + 下横，紧凑贴边
    const axisY = el('line', 'axia_axis')
    axisY.setAttribute('x1', String(L))
    axisY.setAttribute('y1', String(TOP))
    axisY.setAttribute('x2', String(L))
    axisY.setAttribute('y2', String(H - B))
    const axisX = el('line', 'axia_axis')
    axisX.setAttribute('x1', String(L))
    axisX.setAttribute('y1', String(H - B))
    axisX.setAttribute('x2', String(W - R))
    axisX.setAttribute('y2', String(H - B))
    svg.appendChild(axisY)
    svg.appendChild(axisX)

    // 平均累计面积（步 1..N 稠密）——曲线下填色、不描边（猫猫 09-02 面积图定稿）
    if (curve.avg.length > 0) {
      const area = el('polygon', 'axia_avgarea')
      const yBase = String(H - B)
      area.setAttribute(
        'points',
        `${x(1)},${yBase} ${curve.avg.map((v, i) => `${x(i + 1)},${y(v)}`).join(' ')} ${x(curve.avg.length)},${yBase}`,
      )
      svg.appendChild(area)
    }

    // 平均缓存面积（同算法同 x 轴，仅带 hc 数据的步参与；空数组=无数据不画）——叠在总面积上，嵌套关系透色可辨
    if (avgHit.length > 0) {
      const area = el('polygon', 'axia_avghitarea')
      const yBase = String(H - B)
      area.setAttribute(
        'points',
        `${x(1)},${yBase} ${avgHit.map((v, i) => `${x(i + 1)},${y(v)}`).join(' ')} ${x(avgHit.length)},${yBase}`,
      )
      svg.appendChild(area)
    }

    // 本会话实际累计曲线（全部精确步，x 落在真实调用序号上，混模型也如实）
    if (curve.cur.length > 0) {
      const line = el('polyline', 'axia_cur')
      line.setAttribute('points', curve.cur.map(([n, v]) => `${x(n)},${y(v)}`).join(' '))
      svg.appendChild(line)
      const dot = el('circle', 'axia_dotcur')
      dot.setAttribute('cx', String(x(curve.cur[curve.cur.length - 1][0])))
      dot.setAttribute('cy', String(y(curve.cur[curve.cur.length - 1][1])))
      dot.setAttribute('r', '2')
      svg.appendChild(dot)
    }

    // Y 轴金额：图内左上角、Y 轴右侧（在 Y 轴高度范围内）；图例两行排其下
    const yLabel = el('text', 'axia_axlabel')
    yLabel.setAttribute('x', String(L + 4))
    yLabel.setAttribute('y', '12')
    yLabel.textContent = `${view.currency === 'USD' ? '$' : '¥'}${formatAmount(ymax)}`
    const xLabel = el('text', 'axia_axlabel')
    xLabel.setAttribute('x', String(W - R))
    xLabel.setAttribute('y', String(H - 2))
    xLabel.setAttribute('text-anchor', 'end')
    xLabel.textContent = `${xmax} 步`
    svg.appendChild(yLabel)
    svg.appendChild(xLabel)
    col.appendChild(svg as unknown as HTMLElement)
    wrap.appendChild(col)
  }

  // 右列：两节小节标题=小字加粗无色块（猫猫 09-01 定稿），「缓存」节前空一行
  const side = doc.createElement('div')
  side.className = 'axia_chartside'
  const subHead = (text: string, gapBefore?: boolean): HTMLElement => {
    const head = doc.createElement('div')
    head.className = 'axia_subhead'
    if (gapBefore) head.style.marginTop = '14px'
    head.textContent = text
    return head
  }
  if (cmp) {
    side.appendChild(subHead('消耗比较'))
    const item = (label: string, hint: string, value: number): void => {
      const row = doc.createElement('div')
      row.className = 'axia_cmplab'
      row.title = hint
      const lab = doc.createElement('span')
      lab.textContent = label
      row.appendChild(lab)
      const num = doc.createElement('span')
      num.className = 'axia_cmpv'
      num.textContent = `${view.currency === 'USD' ? '$' : '¥'}${formatAmount(value)}`
      row.appendChild(num)
      side.appendChild(row)
    }
    item(
      '读代码',
      '前两轮的所有MISS输入，AI 一般会在前两轮大量、集中地读取项目代码。这个数据衡量了你新开窗口后，AI 重读代码的消耗。',
      cmp.readCode,
    )
    item('缓存', '当前每次API请求的缓存命中价格。', cmp.cache)
    item('缓存失效', '如果服务器缓存已失效，本窗口上下文全按MISS算的价格。', cmp.fullMiss)

    side.appendChild(subHead('缓存', true))
    const statRow = (label: string, value: string, hint?: string): void => {
      const row = doc.createElement('div')
      row.className = 'axia_cmplab'
      if (hint) row.title = hint
      const lab = doc.createElement('span')
      lab.textContent = label
      row.appendChild(lab)
      const num = doc.createElement('span')
      num.className = 'axia_cmpv'
      num.textContent = value
      row.appendChild(num)
      side.appendChild(row)
    }
    // 完全失效：有输入但缓存命中为 0（官方路由也可靠推导）；缓存失效次数：写入即失效，仅部分中转报值
    const fullMissSteps = Number.isFinite(view.sessionFullMissSteps)
      ? (view.sessionFullMissSteps as number)
      : 0
    statRow('完全失效次数', `${fullMissSteps} 次`, '有输入但缓存命中为 0 的调用次数，任何路由都可靠')
    const missSteps = Number.isFinite(view.sessionMissSteps) ? (view.sessionMissSteps as number) : 0
    if (missSteps > 0) {
      statRow(
        '缓存失效次数',
        `${missSteps} 次`,
        '发生过缓存写入的调用次数，写入即前缀变更；官方 API 不报此字段，仅部分中转有值',
      )
    }
    // 猫猫预留位：数据源口径待定义，先明示「暂未实现」（2026-09-01 猫猫要求）
    statRow('缓存时间估算', '暂未实现')
    statRow('现在失效可能', '暂未实现')
  }
  wrap.appendChild(side)
  put(wrap)
}

/** 手机窄/矮视口适配（精确版）：官方弹层 bottom+right 锚定、尺寸写死（width 264px、无高度上限），小视口（手机竖屏/折叠屏折叠态/分屏窗格）放不下时超出屏幕。兜底 CSS 按视口估算，这里用真实几何修正——①maxWidth/maxHeight 按 visualViewport 实测设置；②横向如仍超出可视区（锚点被页面横向溢出带出屏外的场景），用 translateX 平移回屏内，纯视觉平移不影响布局。大屏放得下时所有修正都不触发，桌面与 iPhone 现状不变。 */
function fitPanel(panel: HTMLElement): void {
  // 先清上次平移再测量，避免 rect 叠加旧位移导致重算漂移
  panel.style.transform = ''
  const visual = typeof window !== 'undefined' ? window.visualViewport : null
  const viewportWidth = visual ? visual.width : window.innerWidth
  // 尺寸上限：先设宽度再测量，rect 即反映缩窄后的几何（bottom 锚定下限高不改 rect.bottom）
  panel.style.maxWidth = `${Math.floor(viewportWidth - 16)}px`
  const rect = panel.getBoundingClientRect()
  const room = rect.bottom - (visual ? visual.offsetTop : 0) - 8
  if (Number.isFinite(room) && room > 0) {
    panel.style.maxHeight = `${Math.floor(room)}px`
  }
  // 横向钳制：超出可视区左右缘时平移回屏内
  const viewportLeft = visual ? visual.offsetLeft : 0
  let dx = 0
  if (rect.right > viewportLeft + viewportWidth - 8) {
    dx = viewportLeft + viewportWidth - 8 - rect.right
  }
  if (rect.left + dx < viewportLeft + 8) {
    dx = viewportLeft + 8 - rect.left
  }
  panel.style.transform = dx !== 0 ? `translateX(${Math.round(dx)}px)` : ''
}

/** 在官方弹层末尾贴上（或刷新）账单区块。 */
function ensureBill(panel: HTMLElement): void {
  let bill = panel.querySelector<HTMLElement>(':scope > .axia_bill')
  if (bill === null) {
    bill = panel.ownerDocument.createElement('div')
    bill.className = 'axia_bill'
    panel.appendChild(bill)
  }
  renderBill(bill)
  fitPanel(panel)
}

/** 刷新当前文档中所有已打开的官方弹层（通常至多一个）。 */
function refreshOpenPanels(): void {
  if (typeof document === 'undefined') return
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]')
  for (const dlg of dialogs) {
    if (isContextPanel(dlg)) ensureBill(dlg)
  }
}

/** 监听官方弹层出现：流式期间 mutation 频繁，这里只做轻量子树扫描，命中判定失败的开销是一次 aria-label 读取，可忽略。 */
export function startPanelBridge(): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {}
  }
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (isContextPanel(node)) {
          ensureBill(node)
          return
        }
        if (node instanceof HTMLElement) {
          const dialogs = node.querySelectorAll<HTMLElement>('[role="dialog"]')
          for (const dlg of dialogs) {
            if (isContextPanel(dlg)) {
              ensureBill(dlg)
              return
            }
          }
        }
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
  // 手机上地址栏收展/旋转会改变可视区高度，弹层的精确上限跟着重算（refreshOpenPanels 内部会顺带 fit）
  const onViewportResize = (): void => refreshOpenPanels()
  window.visualViewport?.addEventListener('resize', onViewportResize)
  return () => {
    observer.disconnect()
    window.visualViewport?.removeEventListener('resize', onViewportResize)
  }
}

/** 数据挂钩组件：props 由 slots 注入，useProjection 同官方条目。渲染为零尺寸占位，仅保持投影订阅存活并把数据镜像进模块级 store。 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CacheDataHook(props: any) {
  const data: CacheBillingView | undefined =
    typeof props.useProjection === 'function' ? props.useProjection('cacheBilling') : undefined

  ;(0, React.useEffect)(() => {
    latestView = data ?? undefined
    refreshOpenPanels()
  }, [data])

  return React.createElement('span', {
    'data-dsh-axia-cachebilling': 'hook',
    'data-axia-version': 'cmp-31',
    style: { display: 'none' },
  })
}

export const inject = ['slots', 'connection', 'remote', 'remote.llm', 'settingsScope', 'settingsSchema']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apply(ctx: any): void {
  // 版本标记：排障用，每次改动 bump——rev 滞后时看控制台标记就知道浏览器跑的是哪一版
  console.log('[dsh-axia-cachebilling] client bundle: cmp-31')
  // 字号档位落到 <html> 的 --axia-fs：账单弹层（本文件 CSS）与设置页（settings.ts CSS）一起生效
  applyFontScale(readFontScale())
  // 样式注入「存在则更新」：只跳过会导致热重载后旧 CSS 一直生效（改样式要整页刷新才看出）
  if (typeof document !== 'undefined') {
    const existing = document.querySelector(`style[data-plugin-css="${CSS_ID}"]`)
    if (existing !== null) {
      existing.textContent = CSS
    } else {
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-axia-cachebilling'
      tag.dataset.pluginCss = CSS_ID
      tag.textContent = CSS
      document.head.appendChild(tag)
    }
  }
  if (typeof document !== 'undefined') {
    startPanelBridge()
  }
  // 数据挂钩仍走 slots：拿到 slots 注入的 useProjection，同官方条目的取数通道。
  ctx.slots.inject('conversation.input.right', () => {
    const dispose = ctx.slots.register(
      {
        name: 'conversation.input.right',
        id: 'dsh-axia-cachebilling-data-hook',
        order: 1,
      },
      CacheDataHook,
    )
    return () => {
      dispose()
    }
  })
  // 设置页模块（独立文件 src/settings.ts，不掺和账单渲染）：探针阶段失败也只警告，绝不影响账单。
  try {
    applySettings(ctx)
  } catch (e) {
    console.warn('[dsh-axia-cachebilling] 设置页注册失败（不影响账单）：', e)
  }
}
