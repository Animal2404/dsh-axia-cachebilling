/**
 * 第三方套餐价目目录（自动填价）。
 *
 * 数据源 = 我们仓库根目录的 `price-catalog.json`（走 raw.githubusercontent，带 CORS，浏览器可直接拉）。
 * 设置页里选完供应商 + 模型后，按（供应商别名, 模型 id / 别名）匹配目录 → 自动填入「缓存命中 / 输入 / 输出」，
 * 峰谷定价的条目连同峰时段与时区一起填（成本目录里的 when 用的就是插件自己的峰谷文法）。
 *
 * 价格会变：所以目录不写死在代码里，靠「刷新价格」按钮（force）重新拉取；改价只需改仓库里的 json 并提交。
 * 拉不到时返回上次成功的结果（没有就 null），绝不因此挡住手填。
 */

export interface CatalogPrices {
  hit: number
  miss: number
  output: number
}

export interface CatalogWhen {
  days: string[]
  ranges: string[]
}

export interface CatalogEntry {
  /** 供应商别名（大小写不敏感）；空/缺省 = 任意供应商 */
  providers?: string[]
  model: string
  /** 同一个模型的其它写法（如 deepseek-v4.1-flash / deepseek-v4-1-flash） */
  modelAliases?: string[]
  /** 人看的模型名，会顺手填进「版本名」 */
  label?: string
  currency?: 'CNY' | 'USD'
  timezone?: string
  peak?: CatalogPrices & { when: CatalogWhen[] }
  valley?: CatalogPrices
  const?: CatalogPrices
  source?: string
}

export interface PriceCatalog {
  version: number
  updatedAt: string
  entries: CatalogEntry[]
}

export const PRICE_CATALOG_URL =
  'https://raw.githubusercontent.com/Animal2404/dsh-meow-cachebilling/main/price-catalog.json'

const CACHE_MS = 10 * 60 * 1000
let cached: PriceCatalog | null = null
let cachedAt = 0

/** 拉价格目录；force=true（「刷新价格」）绕过缓存。失败时退回上次成功结果。 */
export async function loadPriceCatalog(force = false): Promise<PriceCatalog | null> {
  if (!force && cached !== null && Date.now() - cachedAt < CACHE_MS) return cached
  try {
    const res = await fetch(PRICE_CATALOG_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as PriceCatalog
    if (!data || !Array.isArray(data.entries)) throw new Error('目录格式不对')
    cached = data
    cachedAt = Date.now()
    return data
  } catch {
    return cached
  }
}

export interface CatalogMatch {
  entry: CatalogEntry
  /** true = 供应商别名命中；false = 只按模型名命中（提示里要标出来，别让人以为是精确匹配） */
  providerMatched: boolean
}

/** 目录里的峰谷文法 → 编辑器「峰时段」输入框的写法。 */
export function serializeCatalogWhen(when: CatalogWhen[]): string {
  return when.map((g) => `[${g.days.join(',')}][${g.ranges.join(', ')}]`).join(' + ')
}

/** 命中规则：供应商别名命中优先；同一模型只按名字命中且目录里唯一时才用（避免给错价）。 */
export function lookupCatalog(
  catalog: PriceCatalog | null,
  provider: string,
  model: string,
): CatalogMatch | null {
  if (catalog === null) return null
  const p = provider.trim().toLowerCase()
  const m = model.trim().toLowerCase()
  if (m === '') return null
  const exact: CatalogMatch[] = []
  const loose: CatalogMatch[] = []
  for (const entry of catalog.entries) {
    const names = [entry.model, ...(entry.modelAliases ?? [])].map((s) => s.toLowerCase())
    // 只允许「用户的模型名以目录 id 开头」这种后缀写法（deepseek-v4-flash-vision-exp 命中 deepseek-v4-flash），
    // 反向（目录名以用户输入开头）会让打字过程中途就命中，不要。
    const nameHit = names.includes(m)
    const looseHit = names.some((n) => m.startsWith(n))
    if (!nameHit && !looseHit) continue
    const providerMatched = (entry.providers ?? []).map((s) => s.toLowerCase()).includes(p)
    const match: CatalogMatch = { entry, providerMatched }
    if (providerMatched && nameHit) return match
    ;(nameHit ? exact : loose).push(match)
  }
  const pool = exact.length > 0 ? exact : loose
  if (pool.length === 0) return null
  // 供应商命中优先。
  if (pool.some((x) => x.providerMatched)) return pool[0]
  // 供应商没命中时只在「候选其实就是同一条目录」时才敢用（别名写法不同）；多家供应商都有这个模型名就不填，
  // 宁可让用户手填，也不能把别家的价格冒充成本家的（kimi-k3 这种多家都卖的模型最容易踩）。
  const distinct = new Set(pool.map((x) => x.entry))
  return distinct.size === 1 ? pool[0] : null
}
