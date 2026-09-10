/**
 * meow-cachebilling — 设置页模块（喵缓存账单）。
 *
 * 独立模块：只管设置页的显示与读写，不掺和账单渲染；由 client.ts 引入（一行 applySettings(ctx)，失败仅警告不影响账单）。
 * 形态：设置页顶级分区（settings.section，与「通用」「模型」「插件」平级的独立标签页）。
 * 2026-08-30 猫猫拍板「我们需要在设置加个标签页，不是把信息加到别人的标签页里」——由旧形态（settings.plugin.item 卡片，住在官方插件 tab）升级而来。
 * 契约照官方 settings.section（ui-settings-general / ui-settings-models 同款）：
 *   - host 半身（index.ts）用 installSettingsSection 注册命名空间 meow-cachebilling，base = 包根 rates.yml 预填层（不变）
 *   - 浏览器半身挂 settings.section（list slot：id + order + label），整页渲染价目表
 *   - 快照三视图：value(合成) / base(预填) / user(用户覆盖)；scope.set(field, value) 写用户层、scope.unset(field) 清回预填
 *   - 双层语义：key 存在于 user 层即覆盖预填条目；「恢复预填」= unset；自定义条目删除 = unset
 *   - host 端 scope.watch → onChange → 重编译合成层：设置页改价目即时生效，无需重启
 */

import * as React from 'react'
import { loadPriceCatalog, lookupCatalog, serializeCatalogWhen, type CatalogMatch, type PriceCatalog } from './prices'

const SETTINGS_NS = 'meow-cachebilling'
const CSS_ID = 'meow-cachebilling-settings-css'

// ── 字号档位（大屏 / 远距离阅读）─────────────────────────────────────────────
//
// 账单弹层原本 9–10px、设置页 11.5–13px：32 寸 4K 屏在一米外用眼睛读会吃力。
// 给四档字号，写进 <html> 的 --meow-fs：账单弹层按它做 calc 缩放，设置页按它整体 zoom，
// 两边一起变大；存 localStorage（跟着浏览器走，不需要动 DSH 设置）。

const FONT_SCALE_KEY = 'meowcb-font-scale'
const DEFAULT_FONT_SCALE = 1.5
export const FONT_SCALES: Array<{ value: number; label: string }> = [
  { value: 1, label: '标准' },
  { value: 1.25, label: '大' },
  { value: 1.5, label: '超大' },
  { value: 2, label: '巨大' },
]

export function readFontScale(): number {
  try {
    const value = Number(localStorage.getItem(FONT_SCALE_KEY))
    if (Number.isFinite(value) && value >= 0.8 && value <= 2.5) return value
  } catch {
    /* 隐私模式 / 无 localStorage：用默认档 */
  }
  return DEFAULT_FONT_SCALE
}

export function applyFontScale(value: number): void {
  try {
    document.documentElement.style.setProperty('--meow-fs', String(value))
    localStorage.setItem(FONT_SCALE_KEY, String(value))
  } catch {
    /* 忽略：取不到就维持默认档 */
  }
}

const CSS = `
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
`

// ── 类型与工具 ──────────────────────────────────────────────────────────────

interface WhenGroup {
  days: string[]
  ranges: string[]
}
interface PricePart {
  hit: number
  miss: number
  output: number
  write?: number
}
interface UserEntry {
  model: string
  /** 人看的模型版本名（如 DeepSeek-V4.1-Flash），只用于显示，不参与匹配 */
  label?: string
  /** 计价币种：'CNY'（元，缺省）/ 'USD'（美元）。账单按币种分开合计，不混算 */
  currency?: 'CNY' | 'USD'
  provider?: string
  timezone?: string
  peak?: PricePart & { when: WhenGroup[] }
  valley?: PricePart
  const?: PricePart
  cacheSaving?: string | number | null
}
type EntryMap = Record<string, UserEntry>

/** provider → 计费方账单时区自动选表（后台没数据才让用户手填）。 */
const PROVIDER_TIMEZONE: Record<string, string> = {
  'deepseek-official': 'Asia/Shanghai',
  deepseek: 'Asia/Shanghai',
  zhipu: 'Asia/Shanghai',
  'zai-coding-cn': 'Asia/Shanghai',
  zai: 'Asia/Shanghai',
  bigmodel: 'Asia/Shanghai',
  siliconflow: 'Asia/Shanghai',
  moonshot: 'Asia/Shanghai',
  alibaba: 'Asia/Shanghai',
  openrouter: 'UTC',
  openai: 'UTC',
  anthropic: 'UTC',
}

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const RANGE_PATTERN = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/

/** 矩阵语法 → when 组：[mon-fri][09:00-12:00, 14:00-18:00] + [sat, sun][00:00-24:00] */
function parseWhenText(text: string): WhenGroup[] {
  const out: WhenGroup[] = []
  for (const g of text.split('+')) {
    const m = /^\s*\[([^\]]+)\]\s*\[([^\]]+)\]\s*$/.exec(g)
    if (!m) throw new Error(`每组应为 [天数][时段列表]，收到 "${g.trim() || '（空）'}"`)
    const days: string[] = []
    for (const part of m[1].split(/[,，]/)) {
      const p = part.trim().toLowerCase()
      if (!p) continue
      const span = /^([a-z]{3})-([a-z]{3})$/.exec(p)
      if (span) {
        const a = DAY_ORDER.indexOf(span[1])
        const b = DAY_ORDER.indexOf(span[2])
        if (a < 0 || b < 0) throw new Error(`未知星期 "${p}"（可用 mon tue wed thu fri sat sun）`)
        for (let i = a; ; i = (i + 1) % 7) {
          days.push(DAY_ORDER[i])
          if (i === b) break
        }
      } else {
        if (DAY_ORDER.indexOf(p) < 0) throw new Error(`未知星期 "${p}"`)
        days.push(p)
      }
    }
    const ranges = m[2]
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (days.length === 0) throw new Error('天数为空')
    for (const r of ranges) {
      if (!RANGE_PATTERN.test(r)) throw new Error(`时段格式应为 "HH:MM-HH:MM"，收到 "${r}"`)
    }
    if (ranges.length === 0) throw new Error('时段为空')
    out.push({ days, ranges })
  }
  if (out.length === 0) throw new Error('峰时段为空')
  return out
}

/** when 组 → 矩阵语法（编辑回显用）。 */
function serializeWhen(groups: WhenGroup[]): string {
  return groups.map((g) => `[${g.days.join(',')}][${g.ranges.join(', ')}]`).join(' + ')
}

const entryKey = (e: { model: string; provider?: string }): string =>
  `${(e.provider ?? '*').toLowerCase()}/${e.model.trim().toLowerCase()}`

const toNum = (v: string): number => Number(v.trim())

// ── 编辑草稿 ────────────────────────────────────────────────────────────────

interface Draft {
  provider: string
  model: string
  label: string
  currency: 'CNY' | 'USD'
  timezone: string
  isPeak: boolean
  flatHit: string
  flatMiss: string
  flatOutput: string
  peakHit: string
  peakMiss: string
  peakOutput: string
  whenText: string
  valleyHit: string
  valleyMiss: string
  valleyOutput: string
  cacheSaving: string
}

const NUM = '0'
function draftFromEntry(e: UserEntry): Draft {
  return {
    provider: e.provider ?? '',
    model: e.model ?? '',
    label: e.label ?? '',
    currency: e.currency === 'USD' ? 'USD' : 'CNY',
    timezone: e.timezone ?? 'Asia/Shanghai',
    isPeak: Boolean(e.peak),
    flatHit: e.const ? String(e.const.hit) : NUM,
    flatMiss: e.const ? String(e.const.miss) : NUM,
    flatOutput: e.const ? String(e.const.output) : NUM,
    peakHit: e.peak ? String(e.peak.hit) : NUM,
    peakMiss: e.peak ? String(e.peak.miss) : NUM,
    peakOutput: e.peak ? String(e.peak.output) : NUM,
    whenText: e.peak ? serializeWhen(e.peak.when) : '[mon-fri][09:00-12:00, 14:00-18:00]',
    valleyHit: e.valley ? String(e.valley.hit) : NUM,
    valleyMiss: e.valley ? String(e.valley.miss) : NUM,
    valleyOutput: e.valley ? String(e.valley.output) : NUM,
    cacheSaving: e.cacheSaving == null ? '' : String(e.cacheSaving),
  }
}
const emptyDraft = (): Draft => ({
  provider: '',
  model: '',
  label: '',
  currency: 'CNY',
  timezone: 'Asia/Shanghai',
  isPeak: false,
  flatHit: NUM,
  flatMiss: NUM,
  flatOutput: NUM,
  peakHit: NUM,
  peakMiss: NUM,
  peakOutput: NUM,
  whenText: '[mon-fri][09:00-12:00, 14:00-18:00]',
  valleyHit: NUM,
  valleyMiss: NUM,
  valleyOutput: NUM,
  cacheSaving: '',
})

/** 保存前校验：返回错误文案或 null。价格必须是非负数字；峰谷必须配齐时间与时区（一口价不需要时区）。 */
function validateDraft(d: Draft): string | null {
  if (!d.model.trim()) return '模型不能为空'
  const numOk = (v: string): boolean => v.trim() !== '' && Number.isFinite(toNum(v)) && toNum(v) >= 0
  const partOk = (hit: string, miss: string, output: string): string | null => {
    if (!numOk(hit) || !numOk(miss) || !numOk(output)) return '价格必须是非负数字（元 / 百万 token）'
    return null
  }
  if (d.isPeak) {
    if (!d.timezone.trim()) return '时区不能为空（内置供应商会自动带出，其余填 IANA 名）'
    try {
      parseWhenText(d.whenText)
    } catch (e) {
      return `峰时段：${e instanceof Error ? e.message : String(e)}`
    }
    return partOk(d.peakHit, d.peakMiss, d.peakOutput) ?? partOk(d.valleyHit, d.valleyMiss, d.valleyOutput)
  }
  return partOk(d.flatHit, d.flatMiss, d.flatOutput)
}

function buildEntry(d: Draft): UserEntry {
  const e: UserEntry = { model: d.model.trim() }
  if (d.label.trim()) e.label = d.label.trim()
  if (d.currency === 'USD') e.currency = 'USD'
  const provider = d.provider.trim().toLowerCase()
  if (provider) e.provider = provider
  // 时区只在峰谷条目上有意义（一口价不判峰谷，host 侧缺省 Asia/Shanghai）
  if (d.isPeak) e.timezone = d.timezone.trim()
  const part = (hit: string, miss: string, output: string): PricePart => {
    const p: PricePart = { hit: toNum(hit), miss: toNum(miss), output: toNum(output) }
    return p
  }
  if (d.isPeak) {
    e.peak = { ...part(d.peakHit, d.peakMiss, d.peakOutput), when: parseWhenText(d.whenText) }
    e.valley = part(d.valleyHit, d.valleyMiss, d.valleyOutput)
  } else {
    e.const = part(d.flatHit, d.flatMiss, d.flatOutput)
  }
  if (d.cacheSaving.trim()) e.cacheSaving = d.cacheSaving.trim()
  return e
}

// ── UI 基元 ─────────────────────────────────────────────────────────────────

const el = React.createElement

/** 表单字段：标签在上、控件在下的竖排小格子。 */
const field = (labelText: string, child: any): any =>
  el('div', { className: 'meowcb_set_field' }, el('span', { className: 'meowcb_set_label' }, labelText), child)

/** 三格价格输入（缓存命中 / 缓存未命中 / 输出）；标题与单位由外层的 .meowcb_set_prices 卡片给。 */
function PriceInputs(props: { d: Draft; set: (patch: Partial<Draft>) => void; mode: 'flat' | 'peak' | 'valley' }): any {
  const { d, set, mode } = props
  const cells: Array<[string, keyof Draft]> =
    mode === 'flat'
      ? [
          ['缓存命中', 'flatHit'],
          ['缓存未命中', 'flatMiss'],
          ['输出', 'flatOutput'],
        ]
      : mode === 'peak'
        ? [
            ['缓存命中', 'peakHit'],
            ['缓存未命中', 'peakMiss'],
            ['输出', 'peakOutput'],
          ]
        : [
            ['缓存命中', 'valleyHit'],
            ['缓存未命中', 'valleyMiss'],
            ['输出', 'valleyOutput'],
          ]
  return el(
    'div',
    { className: 'meowcb_set_pricerow' },
    cells.map(([text, key]) =>
      el(
        'div',
        { key: String(key), className: 'meowcb_set_pricecell' },
        el('span', { className: 'meowcb_set_label' }, text),
        el('input', {
          className: 'meowcb_set_input meowcb_set_pricenum',
          value: d[key] as string,
          onChange: (e: any) => set({ [key]: e.target.value } as Partial<Draft>),
          inputMode: 'decimal',
          placeholder: '0',
        }),
      ),
    ),
  )
}

// ── DSH 供应商 / 模型目录 ────────────────────────────────────────────────────
//
// 不再让用户凭记忆手打 provider / model：供应商列表直接读 DSH 自己的 LLM 服务
// （活跃路由 listProviders + 可配置目录 listConfigurableProviders，后者含未启用的），
// 模型列表用官方同款「获取模型」探测（remote.llm.discoverModels，按供应商的 settingsNs 问端点）。

interface CatalogProvider {
  id: string
  label: string
  /** 该供应商在 DSH 里的设置命名空间；「获取模型」探测要用它。 */
  settingsNs?: string
  /** 该命名空间里到供应商 profile 的路径（如 ['providers','jyld']）。 */
  settingsPath?: readonly string[]
  /** DSH 当前是否已启用该路由（活跃路由 = true，只是可配置 = false）。 */
  live?: boolean
}

/** 下拉项的显示文案：活跃路由带 ●，只可配置的带 ○。 */
function providerOptionLabel(p: CatalogProvider): string {
  const name = p.label === p.id ? p.id : `${p.label} · ${p.id}`
  return p.live ? `● ${name}` : `○ ${name}`
}

/** 远程调用可能直接给数组，也可能包一层信封；两种都认。 */
function asRows(value: any): any[] {
  if (Array.isArray(value)) return value
  for (const key of ['value', 'result', 'items', 'rows', 'data']) {
    if (Array.isArray(value?.[key])) return value[key]
  }
  return []
}

/** 合并活跃路由与可配置目录：小写 id → { 原始 id, 显示名, settingsNs }。 */
async function loadProviderCatalog(remote: any): Promise<CatalogProvider[]> {
  const llm = remote?.llm
  if (!llm || typeof llm.listProviders !== 'function') throw new Error('当前连接读不到 DSH 的供应商列表')
  const live = await llm.listProviders()
  const configurable =
    typeof llm.listConfigurableProviders === 'function' ? await llm.listConfigurableProviders() : []
  const byId = new Map<string, CatalogProvider>()
  for (const row of asRows(configurable)) {
    const id = String(row?.provider ?? '').trim()
    if (!id) continue
    byId.set(id.toLowerCase(), {
      id,
      label: String(row?.displayName ?? '').trim() || id,
      settingsNs: typeof row?.settingsNs === 'string' && row.settingsNs !== '' ? row.settingsNs : undefined,
      settingsPath: Array.isArray(row?.settingsPath) ? row.settingsPath.map((s: any) => String(s)) : undefined,
    })
  }
  for (const row of asRows(live)) {
    const id = String(row?.id ?? row?.provider ?? '').trim()
    if (!id) continue
    const hit = byId.get(id.toLowerCase())
    byId.set(id.toLowerCase(), {
      id,
      label: hit?.label ?? (String(row?.name ?? row?.displayName ?? '').trim() || id),
      settingsNs: hit?.settingsNs,
      settingsPath: hit?.settingsPath,
      live: true,
    })
  }
  // 已启用的排前面（这些才是用户平时在用的），其余按 id 排
  return [...byId.values()].sort(
    (a, b) => Number(b.live === true) - Number(a.live === true) || a.id.localeCompare(b.id),
  )
}

/**
 * 从 DSH 的设置视图里读该供应商的 profile（只取 baseURL / api）。
 * 密钥字段在客户端是脱敏的，而且主机侧 pi-ai 自己会取凭据，所以这里不需要、也拿不到 key。
 */
async function readProviderProfile(
  settingsScope: any,
  provider: CatalogProvider,
): Promise<{ baseURL?: string; api?: string }> {
  try {
    // describe() 返回的是设置镜像（SettingsDescribeMirror）：先 ensure 拉一次，再从快照里取 view
    const mirror: any = settingsScope?.describe?.()
    if (typeof mirror?.ensure === 'function') await mirror.ensure()
    const snap: any = typeof mirror?.getSnapshot === 'function' ? mirror.getSnapshot() : undefined
    const described: any = snap?.view
    const views: any[] = Array.isArray(described) ? described : (described?.namespaces ?? [])
    const ns = provider.settingsNs
    if (!ns) return {}
    const view = views.find((v) => v?.ns === ns)
    let node: any = view?.value
    for (const key of provider.settingsPath ?? []) node = node?.[key]
    const pick = (key: string): string | undefined => {
      const value = node?.[key]
      return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
    }
    const out: { baseURL?: string; api?: string } = {}
    const baseURL = pick('baseURL') ?? pick('baseUrl')
    if (baseURL) out.baseURL = baseURL
    const api = pick('api')
    if (api) out.api = api
    return out
  } catch {
    return {}
  }
}

/** 「获取模型」的错误文案：把宿主的口径翻译成用户能懂的一句话。 */
function explainDiscoveryFailure(e: any, provider: CatalogProvider): string {
  const msg = String(e?.error?.message ?? e?.message ?? e ?? '未知错误')
  if (/no model discovery/i.test(msg)) {
    return `「${provider.id}」用的 DSH 适配器不支持自动获取模型——下拉里已经列出价目表里记录过的模型，也可以点「手填」自己写`
  }
  if (/ships no catalog/i.test(msg)) {
    return `「${provider.id}」是自定义路由，DSH 里没给它 baseURL，问不到模型清单——去「模型」页补个 baseURL，或在这里点「手填」`
  }
  return `获取失败：${msg}`
}

/** 「获取模型」：让 DSH 去问该供应商端点；适配器认识的路由不必联网也有答案。 */
async function discoverProviderModels(
  remote: any,
  provider: CatalogProvider,
  profile: { baseURL?: string; api?: string } = {},
): Promise<string[]> {
  const llm = remote?.llm
  if (!llm || typeof llm.discoverModels !== 'function') throw new Error('当前连接不支持自动获取模型')
  if (!provider.settingsNs) throw new Error(`DSH 里没有「${provider.id}」的可配置条目，取不了模型——请手动填写`)
  const request: any = { provider: provider.id }
  if (profile.baseURL) request.baseURL = profile.baseURL
  if (profile.api) request.api = profile.api
  let answer: any
  try {
    answer = await llm.discoverModels(provider.settingsNs, request)
  } catch (e) {
    throw new Error(explainDiscoveryFailure(e, provider))
  }
  if (answer && answer.ok === false) throw new Error(explainDiscoveryFailure(answer, provider))
  if (answer?.kind === 'refused') throw new Error(String(answer.message ?? '供应商拒绝了这次探测'))
  const rows = asRows(answer?.models ?? answer?.value ?? answer)
  const ids = rows.map((row: any) => String(row?.id ?? row ?? '').trim()).filter(Boolean)
  if (ids.length === 0) {
    throw new Error(`「${provider.id}」没有返回模型；下拉里已有价目表记录过的模型，也可以点「手填」自己写`)
  }
  return [...new Set(ids)]
}

// ── 卡片组件 ────────────────────────────────────────────────────────────────

function BillingCard(props: { scope: any; remote?: any; settingsScope?: any }): any {
  const scope = props.scope
  const remote = props.remote
  const subscribe = React.useCallback((cb: () => void) => scope.subscribe(cb), [scope])
  const getSnapshot = React.useCallback(() => scope.getSnapshot(), [scope])
  const snap: {
    status: string
    value: EntryMap | undefined
    base: EntryMap | undefined
    user: EntryMap | undefined
    writable: boolean
    mode: string
  } = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const [expanded, setExpanded] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [catalog, setCatalog] = React.useState<{ status: 'loading' | 'ready' | 'error'; providers: CatalogProvider[]; note: string | null }>({
    status: 'loading',
    providers: [],
    note: null,
  })
  const [discovered, setDiscovered] = React.useState<string[]>([])
  const [probe, setProbe] = React.useState<{ busy: boolean; note: string | null }>({ busy: false, note: null })
  const [manual, setManual] = React.useState<{ provider: boolean; model: boolean }>({ provider: false, model: false })
  const [scale, setScale] = React.useState<number>(() => readFontScale())
  const [prices, setPrices] = React.useState<{
    status: 'idle' | 'loading' | 'ready' | 'error'
    catalog: PriceCatalog | null
    note: string | null
  }>({ status: 'idle', catalog: null, note: null })
  /** 用户是否亲手改过模型字段：只有新条目或手改过模型才自动套目录价，编辑旧条目时不能覆盖已存的价格 */
  const modelTouched = React.useRef(false)

  const base = snap.base ?? {}
  const user = snap.user ?? {}
  const keys = Array.from(new Set([...Object.keys(base), ...Object.keys(user)]))

  const set = (patch: Partial<Draft>): void => {
    setError(null)
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  // 供应商目录：进设置页拉一次，也可手动刷新
  const reloadCatalog = React.useCallback((): void => {
    setCatalog((prev) => ({ ...prev, status: 'loading', note: null }))
    loadProviderCatalog(remote)
      .then((providers) =>
        setCatalog({
          status: 'ready',
          providers,
          note: providers.length > 0 ? null : 'DSH 里还没有配置任何供应商，先到「模型」页添加一个',
        }),
      )
      .catch((e) =>
        setCatalog({ status: 'error', providers: [], note: `读取 DSH 供应商失败：${e instanceof Error ? e.message : String(e)}` }),
      )
  }, [remote])

  React.useEffect(() => {
    reloadCatalog()
  }, [reloadCatalog])

  const providerId = (draft?.provider ?? '').trim()
  React.useEffect(() => {
    setDiscovered([])
    setProbe({ busy: false, note: null })
  }, [providerId])

  /** 价目表里已出现过的模型（同供应商或通配），先当下拉备选。 */
  const tableModels = React.useMemo((): string[] => {
    const out = new Set<string>()
    for (const entry of [...Object.values(base), ...Object.values(user)]) {
      if (!entry) continue
      const p = (entry.provider ?? '').toLowerCase()
      if (p !== '' && p !== providerId.toLowerCase()) continue
      if (entry.model) out.add(entry.model)
    }
    return [...out].sort((a, b) => a.localeCompare(b))
  }, [base, user, providerId])

  /** 模型下拉 = 探测结果 ∪ 价目表里已有的 ∪ 当前值。 */
  const modelOptions = React.useMemo((): string[] => {
    const out = new Set<string>(discovered)
    for (const m of tableModels) out.add(m)
    if (draft?.model) out.add(draft.model)
    return [...out]
  }, [discovered, tableModels, draft?.model])

  const matchedProviderId = ((): string => {
    const cur = (draft?.provider ?? '').trim().toLowerCase()
    if (!cur) return ''
    const hit = catalog.providers.find((p) => p.id.toLowerCase() === cur)
    return hit ? hit.id : ''
  })()
  const providerSelectValue = matchedProviderId || (draft?.provider ?? '').trim()

  const pickProvider = (value: string): void => {
    const known = PROVIDER_TIMEZONE[value.trim().toLowerCase()]
    set(known ? { provider: value, timezone: known } : { provider: value })
  }

  const fetchModels = async (): Promise<void> => {
    if (!draft) return
    const id = draft.provider.trim()
    if (!id) {
      setProbe({ busy: false, note: '先在左边选一个供应商，再点「获取模型」' })
      return
    }
    setProbe({ busy: true, note: '正在向供应商查询模型…' })
    try {
      const target = catalog.providers.find((p) => p.id.toLowerCase() === id.toLowerCase()) ?? { id, label: id }
      const profile = await readProviderProfile(props.settingsScope, target)
      const ids = await discoverProviderModels(remote, target, profile)
      setDiscovered(ids)
      setProbe({ busy: false, note: `拿到 ${ids.length} 个模型，从下拉里挑一个；价格照旧填好再保存` })
      if (!draft.model.trim() || !ids.includes(draft.model)) set({ model: ids[0] })
    } catch (e) {
      setProbe({ busy: false, note: e instanceof Error ? e.message : String(e) })
    }
  }

  /** 目录命中 → 填进草稿：峰谷条目连峰时段/时区一起填，一口价只填三档；版本名为空时顺手补上。 */
  const applyCatalogPrices = (match: CatalogMatch): void => {
    const entry = match.entry
    const patch: Partial<Draft> = { currency: entry.currency === 'USD' ? 'USD' : 'CNY' }
    if (entry.peak && entry.valley) {
      patch.isPeak = true
      patch.peakHit = String(entry.peak.hit)
      patch.peakMiss = String(entry.peak.miss)
      patch.peakOutput = String(entry.peak.output)
      patch.valleyHit = String(entry.valley.hit)
      patch.valleyMiss = String(entry.valley.miss)
      patch.valleyOutput = String(entry.valley.output)
      if (Array.isArray(entry.peak.when) && entry.peak.when.length > 0) {
        patch.whenText = serializeCatalogWhen(entry.peak.when)
      }
      if (entry.timezone) patch.timezone = entry.timezone
    } else if (entry.const) {
      patch.isPeak = false
      patch.flatHit = String(entry.const.hit)
      patch.flatMiss = String(entry.const.miss)
      patch.flatOutput = String(entry.const.output)
    } else {
      return
    }
    if (entry.label && (draft === null || draft.label.trim() === '')) patch.label = entry.label
    set(patch)
    const shape = entry.peak && entry.valley ? '峰谷价' : '一口价'
    const scope = match.providerMatched ? '' : '（仅按模型名匹配，供应商没识别出来）'
    setPrices((prev) => ({ ...prev, note: `${scope}已按目录价填入${shape}：${entry.label ?? entry.model}` }))
  }

  /** 拉目录；thenApply=true 时命中就填价（「套用目录价」「刷新价格」走这条）。 */
  const refreshPrices = async (force: boolean, thenApply: boolean): Promise<void> => {
    setPrices((prev) => ({ ...prev, status: 'loading' }))
    const catalog = await loadPriceCatalog(force)
    if (catalog === null) {
      setPrices({ status: 'error', catalog: null, note: '价格目录拉取失败：稍后再点一次「刷新价格」，或直接手填' })
      return
    }
    setPrices({ status: 'ready', catalog, note: null })
    if (!thenApply || draft === null) return
    const match = lookupCatalog(catalog, draft.provider, draft.model)
    if (match === null) {
      setPrices((prev) => ({ ...prev, note: `目录里没有「${draft.model.trim() || '（模型为空）'}」或其供应商不匹配` }))
      return
    }
    applyCatalogPrices(match)
  }

  // 选完模型自动套目录价：只在「新条目」或「用户亲手改过模型」时生效，编辑旧条目绝不覆盖已存价格
  React.useEffect(() => {
    if (draft === null) return
    if (expanded !== '__new__' && !modelTouched.current) return
    const model = draft.model.trim()
    if (model === '') return
    let cancelled = false
    void (async () => {
      const catalog = await loadPriceCatalog(false)
      if (cancelled || catalog === null) return
      const match = lookupCatalog(catalog, draft.provider, model)
      if (match !== null) applyCatalogPrices(match)
    })()
    return () => {
      cancelled = true
    }
  }, [expanded, draft?.provider, draft?.model])

  const open = (key: string | null): void => {
    setError(null)
    modelTouched.current = false
    if (key === null) {
      setExpanded(null)
      setDraft(null)
      return
    }
    const entry = key === '__new__' ? undefined : (user[key] ?? base[key])
    setDraft(entry ? draftFromEntry(entry) : emptyDraft())
    setExpanded(key)
  }

  const save = async (): Promise<void> => {
    if (!draft || !expanded) return    const err = validateDraft(draft)
    if (err) {
      setError(err)
      return
    }
    const entry = buildEntry(draft)
    const key = expanded === '__new__' ? entryKey(entry) : expanded
    setBusy(true)
    try {
      const r = await scope.set(key, entry)
      const bad = r && r.result && r.result.ok === false ? r.result.error?.message : null
      if (bad) {
        setError(`保存被拒绝：${bad}`)
        return
      }
      setExpanded(null)
      setDraft(null)
    } catch (e) {
      setError(`保存失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (key: string): Promise<void> => {
    setBusy(true)
    try {
      await scope.unset(key)
      setExpanded(null)
      setDraft(null)
    } catch (e) {
      setError(`操作失败：${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  if (snap.status === 'loading') {
    return el('div', { className: 'meowcb_set_card' }, el('span', { className: 'meowcb_set_muted' }, '价目表加载中…'))
  }
  if (snap.status === 'unavailable') {
    return el(
      'div',
      { className: 'meowcb_set_card' },
      el('span', { className: 'meowcb_set_muted' }, '当前连接不支持设置写入（仅本机回环连接可编辑）。'),
    )
  }

  const tzFor = (provider: string): { auto: boolean; tz: string } => {
    const p = provider.trim().toLowerCase()
    if (p && PROVIDER_TIMEZONE[p]) return { auto: true, tz: PROVIDER_TIMEZONE[p] }
    // 兜底给北京时间：绝大多数中转按中国时区出账单，省得每次手填
    return { auto: false, tz: draft?.timezone ?? 'Asia/Shanghai' }
  }
  /** 只在用户提交过一次之后再标红，避免一打开就满屏"报错"。 */
  const tried = error !== null

  const editor =
    draft === null
      ? null
      : el(
          'div',
          { className: 'meowcb_set_editor' },
          el(
            'div',
            { className: 'meowcb_set_grid' },
            field(
              '供应商',
              el(
                'div',
                { className: 'meowcb_set_fieldrow' },
                manual.provider
                  ? el('input', {
                      className: 'meowcb_set_input meowcb_set_input_grow meowcb_set_input_mono',
                      value: draft.provider,
                      onChange: (e: any) => pickProvider(e.target.value),
                      placeholder: 'deepseek-official，留空 = 通配',
                    })
                  : el(
                      'select',
                      {
                        className: 'meowcb_set_select meowcb_set_input_grow',
                        value: providerSelectValue,
                        disabled: catalog.status !== 'ready',
                        onChange: (e: any) => pickProvider(e.target.value),
                      },
                      el('option', { value: '' }, '（留空 = 全部路由通配）'),
                      catalog.providers.map((p) => el('option', { key: p.id, value: p.id }, providerOptionLabel(p))),
                      matchedProviderId === '' && providerSelectValue !== ''
                        ? el('option', { value: providerSelectValue }, `（当前：${providerSelectValue}）`)
                        : null,
                    ),
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'meowcb_set_btn meowcb_set_btn_mini',
                    onClick: () => setManual((m) => ({ ...m, provider: !m.provider })),
                  },
                  manual.provider ? '下拉' : '手填',
                ),
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'meowcb_set_btn meowcb_set_btn_mini',
                    disabled: catalog.status === 'loading',
                    onClick: () => reloadCatalog(),
                  },
                  catalog.status === 'loading' ? '读取中…' : '刷新',
                ),
              ),
            ),
            field(
              '模型',
              el(
                'div',
                { className: 'meowcb_set_fieldrow' },
                manual.model || modelOptions.length === 0
                  ? el('input', {
                      className: 'meowcb_set_input meowcb_set_input_grow meowcb_set_input_mono',
                      value: draft.model,
                      onChange: (e: any) => {
                    modelTouched.current = true
                    set({ model: e.target.value })
                  },
                      placeholder: 'deepseek-flash',
                    })
                  : el(
                      'select',
                      {
                        className: 'meowcb_set_select meowcb_set_input_grow',
                        value: modelOptions.includes(draft.model) ? draft.model : '',
                        onChange: (e: any) => {
                    modelTouched.current = true
                    set({ model: e.target.value })
                  },
                      },
                      el('option', { value: '' }, '（选一个模型）'),
                      modelOptions.map((m) => el('option', { key: m, value: m }, m)),
                    ),
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'meowcb_set_btn meowcb_set_btn_mini',
                    disabled: probe.busy,
                    onClick: () => void fetchModels(),
                  },
                  probe.busy ? '获取中…' : '获取模型',
                ),
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'meowcb_set_btn meowcb_set_btn_mini',
                    onClick: () => setManual((m) => ({ ...m, model: !m.model })),
                  },
                  manual.model ? '下拉' : '手填',
                ),
              ),
            ),
          ),
          field(
            '版本名（可选，只用于显示）',
            el('input', {
              className: 'meowcb_set_input meowcb_set_input_mono',
              value: draft.label,
              onChange: (e: any) => set({ label: e.target.value }),
              placeholder: 'DeepSeek-V4.1-Flash',
            }),
          ),
          el(
            'div',
            { className: 'meowcb_set_fieldrow' },
            el('span', { className: 'meowcb_set_label' }, '计价方式'),
            el(
              'div',
              { className: 'meowcb_set_seg' },
              el(
                'button',
                {
                  type: 'button',
                  className: 'meowcb_set_segbtn' + (draft.isPeak ? '' : ' meowcb_set_segbtn_on'),
                  onClick: () => set({ isPeak: false }),
                },
                '一口价',
              ),
              el(
                'button',
                {
                  type: 'button',
                  className: 'meowcb_set_segbtn' + (draft.isPeak ? ' meowcb_set_segbtn_on' : ''),
                  onClick: () => set({ isPeak: true }),
                },
                '峰谷价',
              ),
            ),
            el('span', { className: 'meowcb_set_label', style: { marginLeft: '10px' } }, '币种'),
            el(
              'div',
              { className: 'meowcb_set_seg' },
              el(
                'button',
                {
                  type: 'button',
                  className: 'meowcb_set_segbtn' + (draft.currency === 'USD' ? '' : ' meowcb_set_segbtn_on'),
                  onClick: () => set({ currency: 'CNY' }),
                },
                '元 ¥',
              ),
              el(
                'button',
                {
                  type: 'button',
                  className: 'meowcb_set_segbtn' + (draft.currency === 'USD' ? ' meowcb_set_segbtn_on' : ''),
                  onClick: () => set({ currency: 'USD' }),
                },
                '美元 $',
              ),
            ),
          ),
          draft.isPeak
            ? el(
                'div',
                { className: 'meowcb_set_grid' },
                field(
                  '峰时段（[天][时段]，多组用 + 连接）',
                  el('input', {
                    className:
                      'meowcb_set_input meowcb_set_input_mono' +
                      (tried && !draft.whenText.trim() ? ' meowcb_set_input_err' : ''),
                    value: draft.whenText,
                    onChange: (e: any) => set({ whenText: e.target.value }),
                    placeholder: '[mon-fri][09:00-12:00, 14:00-18:00]',
                  }),
                ),
                tzFor(draft.provider).auto
                  ? el(
                      'div',
                      { className: 'meowcb_set_field' },
                      el('span', { className: 'meowcb_set_label' }, '时区'),
                      el('span', { className: 'meowcb_set_muted' }, `自动：${tzFor(draft.provider).tz}`),
                    )
                  : field(
                      '时区（IANA）',
                      el('input', {
                        className:
                          'meowcb_set_input meowcb_set_input_mono' + (tried && !draft.timezone.trim() ? ' meowcb_set_input_err' : ''),
                        value: draft.timezone,
                        onChange: (e: any) => set({ timezone: e.target.value }),
                        placeholder: 'Asia/Shanghai',
                      }),
                    ),
              )
            : null,
          el(
            'div',
            { className: 'meowcb_set_fieldrow' },
            el('span', { className: 'meowcb_set_label' }, '价格目录'),
            el(
              'button',
              {
                type: 'button',
                className: 'meowcb_set_btn meowcb_set_btn_mini',
                onClick: () => void refreshPrices(false, true),
              },
              '套用目录价',
            ),
            el(
              'button',
              {
                type: 'button',
                className: 'meowcb_set_btn meowcb_set_btn_mini',
                disabled: prices.status === 'loading',
                onClick: () => void refreshPrices(true, true),
              },
              prices.status === 'loading' ? '拉取中…' : '刷新价格',
            ),
            prices.catalog !== null
              ? el('span', { className: 'meowcb_set_hint' }, `目录更新于 ${prices.catalog.updatedAt}`)
              : null,
          ),
          prices.note ? el('p', { className: 'meowcb_set_note' }, prices.note) : null,
          el(
            'div',
            { className: 'meowcb_set_prices' },
            el(
              'div',
              { className: 'meowcb_set_prices_head' },
              el('span', { className: 'meowcb_set_prices_title' }, draft.isPeak ? '峰价' : '价格'),
              el('span', { className: 'meowcb_set_unit' }, draft.currency === 'USD' ? '美元 / 百万 token' : '元 / 百万 token'),
            ),
            el(PriceInputs, { d: draft, set, mode: draft.isPeak ? 'peak' : 'flat' }),
            draft.isPeak
              ? el('div', { className: 'meowcb_set_prices_head' }, el('span', { className: 'meowcb_set_prices_title' }, '谷价'))
              : null,
            draft.isPeak ? el(PriceInputs, { d: draft, set, mode: 'valley' }) : null,
          ),
          catalog.note || probe.note ? el('p', { className: 'meowcb_set_note' }, probe.note ?? catalog.note) : null,
          error ? el('div', { className: 'meowcb_set_err' }, error) : null,
          el(
            'div',
            { className: 'meowcb_set_actions' },
            el(
              'button',
              { type: 'button', className: 'meowcb_set_btn meowcb_set_btn_primary', disabled: busy, onClick: () => void save() },
              busy ? '保存中…' : '保存',
            ),
            el('button', { type: 'button', className: 'meowcb_set_btn', disabled: busy, onClick: () => open(null) }, '取消'),
            expanded !== null && expanded !== '__new__'
              ? el(
                  'button',
                  {
                    type: 'button',
                    className: 'meowcb_set_btn meowcb_set_btn_danger',
                    disabled: busy,
                    onClick: () => void remove(expanded as string),
                  },
                  '恢复预填 / 删除',
                )
              : null,
            expanded !== null && expanded !== '__new__' && expanded in base
              ? el('span', { className: 'meowcb_set_hint' }, '编辑预填会生成覆盖')
              : null,
          ),
        )

  const rowsFor = (key: string): any => {
    const entry = user[key] ?? base[key]
    if (!entry) return null
    const inBase = key in base
    const inUser = key in user
    const badge =
      inBase && inUser
        ? el('span', { className: 'meowcb_set_badge meowcb_set_badge_override' }, '已覆盖')
        : inUser && !inBase
          ? el('span', { className: 'meowcb_set_badge meowcb_set_badge_custom' }, '自定义')
          : el('span', { className: 'meowcb_set_badge meowcb_set_badge_prefill' }, '预填')
    if (expanded === key) return editor
    return el(
      'div',
      { key, className: 'meowcb_set_row', onClick: () => open(key) },
      el(
        'div',
        { className: 'meowcb_set_rowmain' },
        el('span', { className: 'meowcb_set_model' }, entry.model),
        entry.label || entry.currency === 'USD'
          ? el(
              'span',
              { className: 'meowcb_set_ver' },
              [entry.label ?? '', entry.currency === 'USD' ? '美元计价' : ''].filter(Boolean).join(' · '),
            )
          : null,
      ),
      el('span', { className: 'meowcb_set_spacer' }),
      el('span', { className: 'meowcb_set_badge meowcb_set_badge_tier' }, entry.peak ? '峰谷' : '一口价'),
      badge,
      el('span', { className: 'meowcb_set_chev' }, '›'),
    )
  }

  /** 按供应商分组，一组一个小标题。 */
  const groups = ((): Array<{ name: string; rows: any[] }> => {
    const map = new Map<string, any[]>()
    for (const key of keys) {
      const entry = user[key] ?? base[key]
      if (!entry) continue
      const name = entry.provider ?? '全部路由'
      const list = map.get(name) ?? []
      list.push(rowsFor(key))
      map.set(name, list)
    }
    return [...map.entries()].map(([name, rows]) => ({ name, rows }))
  })()
  const total = groups.reduce((sum, g) => sum + g.rows.length, 0)
  const expandedIsNew = expanded === '__new__'

  return el(
    'div',
    { className: 'meowcb_set_card' },
    el(
      'p',
      { className: 'meowcb_set_legend' },
      el('span', null, el('b', null, '预填'), ' 插件自带，跟随版本更新'),
      el('span', null, el('b', null, '你的修改'), ' 存在 DSH 设置里，改完即时生效'),
      el('span', null, el('b', null, '点任意一行'), ' 展开编辑'),
    ),
    !snap.writable
      ? el('span', { className: 'meowcb_set_muted' }, '当前连接为只读（设置写入仅限本机回环连接）。')
      : null,
    el(
      'div',
      { className: 'meowcb_set_toolbar' },
      el(
        'button',
        {
          type: 'button',
          className: 'meowcb_set_btn meowcb_set_btn_primary',
          onClick: () => open('__new__'),
          disabled: expandedIsNew || !snap.writable,
        },
        '＋ 添加条目',
      ),
      el('span', { className: 'meowcb_set_spacer' }),
      el('span', { className: 'meowcb_set_label' }, '字号'),
      el(
        'div',
        { className: 'meowcb_set_seg' },
        FONT_SCALES.map((s) =>
          el(
            'button',
            {
              key: s.value,
              type: 'button',
              className: 'meowcb_set_segbtn' + (scale === s.value ? ' meowcb_set_segbtn_on' : ''),
              onClick: () => {
                setScale(s.value)
                applyFontScale(s.value)
              },
            },
            s.label,
          ),
        ),
      ),
      el('span', { className: 'meowcb_set_count' }, `共 ${total} 条`),
    ),
    expandedIsNew ? editor : null,
    ...groups.map((g) =>
      el(
        'div',
        { key: g.name, className: 'meowcb_set_group' },
        el('div', { className: 'meowcb_set_grouphead' }, el('span', null, g.name), el('span', null, `· ${g.rows.length}`)),
        ...g.rows,
      ),
    ),
  )
}

// ── 挂载 ────────────────────────────────────────────────────────────────────

export function applySettings(ctx: any): void {
  applyFontScale(readFontScale())
  if (typeof document !== 'undefined' && document.querySelector(`style[data-plugin-css="${CSS_ID}"]`) === null) {
    const tag = document.createElement('style')
    tag.dataset.plugin = 'meow-cachebilling-settings'
    tag.dataset.pluginCss = CSS_ID
    tag.textContent = CSS
    document.head.appendChild(tag)
  }

  const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NS })

  // 顶级分区（与「通用」「模型」「插件」平级）：list slot 契约 = id + order + label；
  // label 直接返回中文——不挂 locale 字典（第三方字典注册在官方外壳没有席位，旧卡片形态实测注册不上）。
  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: SETTINGS_NS,
        order: 30,
        label: () => '喵缓存账单',
        inject: (): unknown => ({ scope, remote: ctx.remote, settingsScope: ctx.settingsScope }),
      },
      BillingSection,
    ),
  )
}

/** 顶级分区整页：标题 + 说明 + 价目表主体（BillingCard）。 */
function BillingSection(props: { scope: any; remote?: any; settingsScope?: any }): any {
  return el(
    'div',
    { className: 'meowcb_set_page' },
    el(
      'div',
      { className: 'meowcb_set_head' },
      el('h2', { className: 'meowcb_set_title' }, '喵缓存账单'),
      el(
        'p',
        { className: 'meowcb_set_subtitle' },
        '上下文缓存到底花了多少钱。供应商和模型直接从 DSH 已配置的列表里挑，模型可一键拉取清单；改完即时生效，无需重启。',
      ),
    ),
    el(BillingCard, { scope: props.scope, remote: props.remote, settingsScope: props.settingsScope }),
  )
}
