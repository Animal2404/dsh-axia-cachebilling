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

const SETTINGS_NS = 'meow-cachebilling'
const CSS_ID = 'meow-cachebilling-settings-css'

const CSS = `
.meowcb_set_card{color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:8px}
.meowcb_set_intro{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.6;margin:0}
.meowcb_set_row{align-items:center;background:color-mix(in srgb,currentColor 4%,transparent);border:1px solid var(--dsw-alias-border-l3);border-radius:8px;cursor:pointer;display:flex;gap:8px;padding:8px 10px}
.meowcb_set_row:hover{border-color:var(--dsw-alias-border-l2)}
.meowcb_set_badge{border-radius:999px;font-size:11px;line-height:16px;padding:0 8px}
.meowcb_set_badge_prefill{background:color-mix(in srgb,#60a5fa 18%,transparent);color:#60a5fa}
.meowcb_set_badge_override{background:color-mix(in srgb,#f59e0b 18%,transparent);color:#f59e0b}
.meowcb_set_badge_custom{background:color-mix(in srgb,#34d399 18%,transparent);color:#34d399}
.meowcb_set_editor{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;display:flex;flex-direction:column;gap:8px;padding:12px}
.meowcb_set_line{align-items:center;display:flex;gap:8px;flex-wrap:wrap}
.meowcb_set_label{color:var(--dsw-alias-label-secondary);font-size:12px;flex:none}
.meowcb_set_input{background:transparent;border:1px solid var(--dsw-alias-border-l3);border-radius:6px;color:inherit;font-size:13px;padding:4px 8px}
.meowcb_set_input_num{width:64px}
.meowcb_set_input_time{flex:1;min-width:200px;font-family:ui-monospace,monospace}
.meowcb_set_input_grow{flex:1;min-width:80px}
.meowcb_set_input_save{width:112px}
.meowcb_set_price{align-items:center;display:flex;gap:4px;flex:none}
.meowcb_set_check{align-items:center;cursor:pointer;display:flex;gap:4px;flex:none}
.meowcb_set_input_err{border-color:#f43f5e}
.meowcb_set_err{color:#f43f5e;font-size:12px;line-height:1.5;margin:0;white-space:pre-wrap}
.meowcb_set_actions{display:flex;gap:8px;margin-top:2px}
.meowcb_set_mini{flex:none;font-size:12px;padding:2px 8px;white-space:nowrap}
/* select 必须自带不透明背景与字色：DSH 不声明 color-scheme，原生弹层默认浅色，
   只继承字色就会变成白底白字（option 也要显式上色） */
.meowcb_set_select{background:var(--dsw-alias-bg-layer-2,#26262b);border:1px solid var(--dsw-alias-border-l3);border-radius:6px;color:var(--dsw-alias-label-primary,#eee);font-size:13px;max-width:100%;padding:4px 8px}
.meowcb_set_select option{background:var(--dsw-alias-bg-layer-2,#26262b);color:var(--dsw-alias-label-primary,#eee)}
.meowcb_set_select:disabled{opacity:.6}
@media (prefers-color-scheme:dark){.meowcb_set_select{color-scheme:dark}}
.meowcb_set_note{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.5;margin:0}
.meowcb_set_muted{color:var(--dsw-alias-label-caption);font-size:12px}
.meowcb_set_section{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:600;margin-top:4px}
.meowcb_set_tier{font-weight:600}
.meowcb_set_title{font-size:16px;font-weight:600;margin:0}
.meowcb_set_subtitle{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.6;margin:0}
.meowcb_set_page{color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:10px;max-width:760px;padding:4px 0}
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
    timezone: e.timezone ?? '',
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
  timezone: '',
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

function PriceInputs(props: { d: Draft; set: (patch: Partial<Draft>) => void; mode: 'flat' | 'peak' | 'valley' }): any {
  const { d, set, mode } = props
  const key = (k: keyof Draft): keyof Draft => k
  const hit = mode === 'flat' ? key('flatHit') : mode === 'peak' ? key('peakHit') : key('valleyHit')
  const miss = mode === 'flat' ? key('flatMiss') : mode === 'peak' ? key('peakMiss') : key('valleyMiss')
  const output = mode === 'flat' ? key('flatOutput') : mode === 'peak' ? key('peakOutput') : key('valleyOutput')
  const cell = (labelText: string, k: keyof Draft): any =>
    el(
      'span',
      { className: 'meowcb_set_price' },
      el('span', { className: 'meowcb_set_label' }, labelText),
      el('input', {
        className: 'meowcb_set_input meowcb_set_input_num',
        value: d[k] as string,
        onChange: (e: any) => set({ [k]: e.target.value } as Partial<Draft>),
        inputMode: 'decimal',
        placeholder: '元/百万',
      }),
    )
  return el(
    'div',
    { className: 'meowcb_set_line' },
    cell('缓存命中', hit),
    cell('缓存未命中', miss),
    cell('输出', output),
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

  const open = (key: string | null): void => {
    setError(null)
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
    if (!draft || !expanded) return
    const err = validateDraft(draft)
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
    return { auto: false, tz: draft?.timezone ?? 'UTC' }
  }

  const editor =
    draft === null
      ? null
      : el(
          'div',
          { className: 'meowcb_set_editor' },
          // 第一行：供应商 + 模型 + 峰谷开关
          el(
            'div',
            { className: 'meowcb_set_line' },
            el('span', { className: 'meowcb_set_label' }, '供应商'),
            manual.provider
              ? el('input', {
                  className: 'meowcb_set_input meowcb_set_input_grow',
                  value: draft.provider,
                  onChange: (e: any) => pickProvider(e.target.value),
                  placeholder: 'deepseek-official / openrouter，留空=通配',
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
                className: 'meowcb_set_input meowcb_set_mini',
                onClick: () => setManual((m) => ({ ...m, provider: !m.provider })),
              },
              manual.provider ? '用下拉' : '手填',
            ),
            el(
              'button',
              {
                type: 'button',
                className: 'meowcb_set_input meowcb_set_mini',
                disabled: catalog.status === 'loading',
                onClick: () => reloadCatalog(),
              },
              catalog.status === 'loading' ? '读取中…' : '刷新',
            ),
            el('span', { className: 'meowcb_set_label' }, '模型'),
            manual.model || modelOptions.length === 0
              ? el('input', {
                  className: 'meowcb_set_input meowcb_set_input_grow',
                  value: draft.model,
                  onChange: (e: any) => set({ model: e.target.value }),
                  placeholder: 'glm-5.3-flash',
                })
              : el(
                  'select',
                  {
                    className: 'meowcb_set_select meowcb_set_input_grow',
                    value: modelOptions.includes(draft.model) ? draft.model : '',
                    onChange: (e: any) => set({ model: e.target.value }),
                  },
                  el('option', { value: '' }, '（选一个模型）'),
                  modelOptions.map((m) => el('option', { key: m, value: m }, m)),
                ),
            el(
              'button',
              {
                type: 'button',
                className: 'meowcb_set_input meowcb_set_mini',
                disabled: probe.busy,
                onClick: () => void fetchModels(),
              },
              probe.busy ? '获取中…' : '获取模型',
            ),
            el(
              'button',
              {
                type: 'button',
                className: 'meowcb_set_input meowcb_set_mini',
                onClick: () => setManual((m) => ({ ...m, model: !m.model })),
              },
              manual.model ? '用下拉' : '手填',
            ),
            el(
              'label',
              { className: 'meowcb_set_check' },
              el('input', {
                type: 'checkbox',
                checked: draft.isPeak,
                onChange: (e: any) => set({ isPeak: e.target.checked }),
              }),
              el('span', null, '是峰谷价'),
            ),
          ),
          catalog.note || probe.note ? el('p', { className: 'meowcb_set_note' }, probe.note ?? catalog.note) : null,
          draft.isPeak
            ? el(
                'div',
                { className: 'meowcb_set_editor' },
                // 峰价 + 时间同行；时区仅供应商不在内置表时出现
                el(
                  'div',
                  { className: 'meowcb_set_line' },
                  el('span', { className: 'meowcb_set_label' }, '峰价'),
                  el('input', {
                    className:
                      'meowcb_set_input meowcb_set_input_time' +
                      (draft.whenText.trim() ? '' : ' meowcb_set_input_err'),
                    value: draft.whenText,
                    onChange: (e: any) => set({ whenText: e.target.value }),
                    placeholder: '[mon-fri][09:00-12:00, 14:00-18:00]，多组用 + 连接',
                  }),
                  tzFor(draft.provider).auto
                    ? null
                    : el(
                        'span',
                        { className: 'meowcb_set_price' },
                        el('span', { className: 'meowcb_set_label' }, '时区'),
                        el('input', {
                          className: 'meowcb_set_input meowcb_set_input_save' + (draft.timezone.trim() ? '' : ' meowcb_set_input_err'),
                          value: draft.timezone,
                          onChange: (e: any) => set({ timezone: e.target.value }),
                          placeholder: 'Asia/Shanghai',
                        }),
                      ),
                ),
                el(PriceInputs, { d: draft, set, mode: 'peak' }),
                el('div', { className: 'meowcb_set_section' }, '谷价'),
                el(PriceInputs, { d: draft, set, mode: 'valley' }),
              )
            : el(PriceInputs, { d: draft, set, mode: 'flat' }),
          error ? el('div', { className: 'meowcb_set_err' }, error) : null,
          el(
            'div',
            { className: 'meowcb_set_actions' },
            el(
              'button',
              { className: 'meowcb_set_input', disabled: busy, onClick: () => void save() },
              busy ? '保存中…' : '保存',
            ),
            el(
              'button',
              { className: 'meowcb_set_input', disabled: busy, onClick: () => open(null) },
              '取消',
            ),
          ),
        )

  const rows = keys.map((key) => {
    const entry = user[key] ?? base[key]
    if (!entry) return null
    const inBase = key in base
    const inUser = key in user
    const overridden = inBase && inUser
    const custom = inUser && !inBase
    const isExpanded = expanded === key
    const badge = overridden
      ? el('span', { className: 'meowcb_set_badge meowcb_set_badge_override' }, '已覆盖')
      : custom
        ? el('span', { className: 'meowcb_set_badge meowcb_set_badge_custom' }, '自定义')
        : el('span', { className: 'meowcb_set_badge meowcb_set_badge_prefill' }, '预填')
    const tier = entry.peak ? '（峰谷）' : ''
    return isExpanded
      ? editor
      : el(
          'div',
          {
            key,
            className: 'meowcb_set_row',
            onClick: () => open(key),
          },
          el('span', null, `${entry.provider ?? '全部路由'} / ${entry.model}${tier}`),
          badge,
        )
  })

  const expandedIsNew = expanded === '__new__'

  return el(
    'div',
    { className: 'meowcb_set_card' },
    el(
      'p',
      { className: 'meowcb_set_intro' },
      '价目表分两层：插件自带的预填（跟随版本更新）+ 你在下面的修改（保存在 DSH 设置里，改完即时生效）。点击任意一行展开编辑；编辑预填条目会生成覆盖，可随时恢复预填。新增条目时，供应商和模型可直接从 DSH 已配置的列表里挑，模型点「获取模型」就能问出供应商支持的清单。',
    ),
    !snap.writable
      ? el('span', { className: 'meowcb_set_muted' }, '当前连接为只读（设置写入仅限本机回环连接）。')
      : null,
    expandedIsNew ? editor : null,
    el(
      'div',
      { className: 'meowcb_set_actions' },
      el(
        'button',
        { className: 'meowcb_set_input', onClick: () => open('__new__'), disabled: expandedIsNew },
        '添加条目',
      ),
    ),
    ...rows,
  )
}

// ── 挂载 ────────────────────────────────────────────────────────────────────

export function applySettings(ctx: any): void {
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
    el('h2', { className: 'meowcb_set_title' }, '喵缓存账单'),
    el(
      'p',
      { className: 'meowcb_set_subtitle' },
      '上下文缓存到底花了多少钱，这里能改价、能补价。改完即时生效，无需重启。',
    ),
    el(BillingCard, { scope: props.scope, remote: props.remote, settingsScope: props.settingsScope }),
  )
}
