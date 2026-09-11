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

/** 账单区块样式：排版语言复刻官方弹层，顶部细分隔线与官方 rows 区隔。层级：标题（色块+默认大字）> 子项（11px 小字）；账表/右列数据全小字，SVG 内 9px。 */
const CSS = `
/* 所有尺寸乘 --axia-fs（字号档位，见 settings.ts 的 applyFontScale）：大屏远距离直接调档，不用动浏览器缩放 */
.axia_bill{margin-top:calc(8px * var(--axia-fs,1));padding-top:calc(8px * var(--axia-fs,1));border-top:1px solid var(--dsw-alias-border-l3)}
.axia_grid{display:grid;grid-template-columns:max-content repeat(4,minmax(0,1fr));column-gap:calc(10px * var(--axia-fs,1));row-gap:calc(2px * var(--axia-fs,1));margin-top:calc(4px * var(--axia-fs,1));align-items:baseline;font-size:calc(10px * var(--axia-fs,1));line-height:calc(14px * var(--axia-fs,1));text-align:center}
.axia_lab{color:var(--dsw-alias-label-secondary);font-weight:400;white-space:nowrap}
.axia_t{color:var(--dsw-alias-label-primary);font-weight:500;font-variant-numeric:tabular-nums}
.axia_h{color:var(--dsw-alias-label-secondary);font-weight:400;text-align:center;white-space:nowrap}
.axia_v{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-weight:500;text-align:center}
.axia_sechead{display:flex;align-items:center;gap:calc(6px * var(--axia-fs,1));color:var(--dsw-alias-label-secondary);margin:calc(2px * var(--axia-fs,1)) 0;font-size:calc(12px * var(--axia-fs,1));line-height:calc(20px * var(--axia-fs,1))}
.axia_secheadsw{width:calc(8px * var(--axia-fs,1));height:calc(8px * var(--axia-fs,1));border-radius:2px;flex:none}
.axia_subhead{color:var(--dsw-alias-label-secondary);font-size:calc(10px * var(--axia-fs,1));line-height:calc(14px * var(--axia-fs,1));font-weight:700}
.axia_modeline{color:var(--dsw-alias-label-secondary);font-size:calc(10px * var(--axia-fs,1));line-height:calc(14px * var(--axia-fs,1))}
.axia_foot{margin-top:calc(6px * var(--axia-fs,1));color:var(--dsw-alias-label-caption);font-size:calc(10px * var(--axia-fs,1));line-height:calc(14px * var(--axia-fs,1))}
.axia_notice{color:#f59e0b;font-size:calc(10px * var(--axia-fs,1));line-height:calc(14px * var(--axia-fs,1))}
.axia_chartwrap{display:flex;gap:calc(12px * var(--axia-fs,1));align-items:center;margin-top:calc(4px * var(--axia-fs,1))}
.axia_chartcol{flex:none;width:calc(124px * var(--axia-fs,1))}
.axia_chartside{flex:1;min-width:0;display:flex;flex-direction:column;gap:calc(2px * var(--axia-fs,1))}
.axia_svg{display:block;width:100%;height:auto}
.axia_axis{stroke:var(--dsw-alias-border-l3);stroke-width:1}
.axia_avgarea{fill:#60a5fa;fill-opacity:.2;stroke:none}
.axia_avghitarea{fill:#bef264;fill-opacity:.1;stroke:none}
.axia_avgblock{fill:#60a5fa;fill-opacity:.2}
.axia_avghitblock{fill:#bef264;fill-opacity:.1}
.axia_cur{stroke:#f59e0b;stroke-width:1.5;fill:none}
.axia_dotcur{fill:#f59e0b}
.axia_axlabel{fill:var(--dsw-alias-label-caption);font-size:calc(9px * var(--axia-fs,1))}
.axia_cmplab{color:var(--dsw-alias-label-secondary);white-space:nowrap;display:flex;justify-content:space-between;gap:calc(8px * var(--axia-fs,1));align-items:baseline;font-size:calc(10px * var(--axia-fs,1));line-height:calc(14px * var(--axia-fs,1))}
.axia_cmpv{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-weight:500}
/* 明细行（重做版）：标签左、数值右，行间一条极淡分隔线；比原来的小节堆叠清爽 */
.axia_drow{display:flex;align-items:baseline;justify-content:space-between;gap:calc(10px * var(--axia-fs,1));padding:calc(3px * var(--axia-fs,1)) 0;border-top:1px solid var(--dsw-alias-border-l4)}
.axia_dlab{color:var(--dsw-alias-label-secondary);font-size:calc(10px * var(--axia-fs,1));line-height:calc(14px * var(--axia-fs,1))}
.axia_dval{color:var(--dsw-alias-label-primary);font-size:calc(10px * var(--axia-fs,1));line-height:calc(14px * var(--axia-fs,1));font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap}
/* 模型行做成小胶囊：与卡片同一套圆角语言，不再是一行裸文字 */
.axia_modelpill{align-self:flex-start;background:color-mix(in srgb,currentColor 5%,transparent);border:1px solid var(--dsw-alias-border-l4);border-radius:999px;color:var(--dsw-alias-label-secondary);font-size:calc(9px * var(--axia-fs,1));line-height:calc(13px * var(--axia-fs,1));margin-top:calc(6px * var(--axia-fs,1));padding:calc(2px * var(--axia-fs,1)) calc(9px * var(--axia-fs,1))}
/* 账单卡片（重做版）：圆角 + 浅底 + 卡片内「行名 / 大字总额 / 标签芯片」 */
.axia_card{background:color-mix(in srgb,currentColor 4%,transparent);border:1px solid var(--dsw-alias-border-l4);border-radius:calc(10px * var(--axia-fs,1));display:flex;flex-direction:column;gap:calc(5px * var(--axia-fs,1));margin-top:calc(6px * var(--axia-fs,1));padding:calc(8px * var(--axia-fs,1)) calc(10px * var(--axia-fs,1))}
.axia_cardhead{align-items:baseline;display:flex;gap:calc(8px * var(--axia-fs,1));justify-content:space-between}
.axia_cardname{color:var(--dsw-alias-label-secondary);font-size:calc(10px * var(--axia-fs,1));line-height:calc(14px * var(--axia-fs,1))}
.axia_cardsum{color:var(--dsw-alias-label-primary);font-size:calc(14px * var(--axia-fs,1));font-variant-numeric:tabular-nums;font-weight:650;line-height:calc(18px * var(--axia-fs,1));white-space:nowrap}
.axia_chips{display:flex;flex-wrap:wrap;gap:calc(3px * var(--axia-fs,1)) calc(12px * var(--axia-fs,1))}
.axia_chip{align-items:baseline;display:inline-flex;gap:calc(4px * var(--axia-fs,1));white-space:nowrap}
.axia_chiplab{color:var(--dsw-alias-label-caption);font-size:calc(9px * var(--axia-fs,1));line-height:calc(13px * var(--axia-fs,1))}
.axia_chipval{color:var(--dsw-alias-label-primary);font-size:calc(10px * var(--axia-fs,1));font-variant-numeric:tabular-nums;line-height:calc(13px * var(--axia-fs,1))}

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
  min-width: min(calc(264px * var(--axia-fs,1)), calc(100vw - 20px));
  min-width: min(calc(264px * var(--axia-fs,1)), calc(100dvw - 20px));
  max-width: calc(100vw - 20px);
  max-width: calc(100dvw - 20px);
  overflow-y: auto;
  /* 内容永不横向溢出：宁可让数字列变窄，也不出那条横向滚动条（用户明确不喜欢） */
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
  if (amount >= 0.01) return amount.toFixed(2)
  // 一位有效数字：数量级 exp + 首位 sig，四舍五入进位到 10 时升一级数量级（0.0096 → 0.01）
  let exp = Math.floor(Math.log10(amount))
  let sig = Math.round(amount / Math.pow(10, exp))
  if (sig >= 10) {
    exp += 1
    sig = 1
  }
  const value = sig * Math.pow(10, exp)
  return value >= 0.01 ? value.toFixed(2) : value.toFixed(-exp)
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
}

/** 小节标题：色块 + 默认大字（标题层级，子项一律小字），renderBill 与 renderChart 共用。 */
function secHead(doc: Document, color: string, text: string): HTMLElement {
  const head = doc.createElement('div')
  head.className = 'axia_sechead'
  const sw = doc.createElement('span')
  sw.className = 'axia_secheadsw'
  sw.style.background = color
  head.appendChild(sw)
  head.appendChild(doc.createTextNode(text))
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
 * 上下文弹层里的账单明细（重做版）：模型行 +「消耗比较」+「缓存」两节，全部是「标签—数值」行。
 *
 * 按用户反馈去掉原先的面积趋势图（突兀、没必要）：一屏之内看账单时，曲线既不参与决策又占掉一半高度。
 * 需要历史对比时直接看上面的三行表（当前步/当前轮/本会话）即可。
 */
function renderDetails(doc: Document, put: (el: HTMLElement) => void, view: CacheBillingView): void {
  const provider = view.provider ?? ''
  const tierMap = isOfficialDeepSeek(provider) ? TIER_LABEL : TIER_LABEL_GENERIC
  const tier = view.tier ? tierMap[view.tier] : ''

  const modelLine = doc.createElement('div')
  modelLine.className = 'axia_modelpill'
  // 单位也写在模型行里：一眼就知道下面的数字是什么钱（双币种会话写成「元 + 美元」）
  const unit = view.mixedCurrency === true ? '元 + 美元' : view.currency === 'USD' ? '美元' : '元'
  modelLine.textContent = `${provider}/${view.model ?? ''}${tier ? ` · ${tier}` : ''} · ${unit}`
  put(modelLine)

  const money = (value: number | undefined): string =>
    `${view.currency === 'USD' ? '$' : '¥'}${formatAmount(Number.isFinite(value) ? (value as number) : 0)}`
  /** 每节一张卡片，与上面三张金额卡同一套圆角/浅底/描边；行仍是「标签—数值」。 */
  let target: HTMLElement | null = null
  const section = (title: string): void => {
    const card = doc.createElement('div')
    card.className = 'axia_card'
    card.appendChild(secHead(doc, '#60a5fa', title))
    put(card)
    target = card
  }
  const row = (label: string, value: string, hint?: string): void => {
    const line = doc.createElement('div')
    line.className = 'axia_drow'
    if (hint) line.title = hint
    const lab = doc.createElement('span')
    lab.className = 'axia_dlab'
    lab.textContent = label
    const val = doc.createElement('span')
    val.className = 'axia_dval'
    val.textContent = value
    line.appendChild(lab)
    line.appendChild(val)
    if (target !== null) target.appendChild(line)
    else put(line)
  }

  // 「消耗比较」「缓存」两节已按用户要求删除（2026-09-11）：弹层只留三张金额卡 + 模型胶囊，越短越好。
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

  // 账表节标题：色块 + 大字（猫猫 08-31 层级定稿：标题大字、子项小字）
  put(secHead(doc, '#f59e0b', '当前会话统计'))

  // 账表：5 列无边框 grid——首列=行标签（列头「消耗(¥)」标货币单位），总价独立一列，右边三列=缓存命中/缓存未命中/输出。金额右对齐，天然对齐不画线。
  const grid = doc.createElement('div')
  grid.className = 'axia_grid'
  const cell = (className: string, text: string): void => {
    const el = doc.createElement('div')
    el.className = className
    el.textContent = text
    grid.appendChild(el)
  }
  cell('axia_lab', '消耗')
  cell('axia_h', '总价')
  const head = (text: string, full: string): void => {
    const el = doc.createElement('div')
    el.className = 'axia_h'
    el.textContent = text
    el.title = full
    grid.appendChild(el)
  }
  head('命中', '缓存命中')
  head('未命中', '缓存未命中')
  head('输出', '输出')
  /** 金额单元格文本：每个数字自带币种符号，不用回头对表头（用户反馈「还要看一下分类」）。
   *  元与美元分开合计、用 + 连接，绝不先把两种钱加在一起。 */
  const money2 = (cny: number, usd: number): string => {
    const parts: string[] = []
    if (cny > 0 || usd <= 0) parts.push(`¥${formatAmount(cny)}`)
    if (usd > 0) parts.push(`$${formatAmount(usd)}`)
    return parts.join(' + ')
  }
  const n = (value: unknown): number => (Number.isFinite(value) ? (value as number) : 0)
  /** 一行账单 = 一张圆角卡片：行名 + 大字总额（右对齐），下面一行「标签 数值」小芯片。
   *  每个数字都自带标签，不用再靠列对齐去猜（用户反馈：数字挤在一起、锁定后还要对比才知道是什么）。 */
  const tableRow = (label: string, total: string, hit: string, miss: string, out: string): void => {
    const box = doc.createElement('div')
    box.className = 'axia_card'
    const head = doc.createElement('div')
    head.className = 'axia_cardhead'
    const name = doc.createElement('span')
    name.className = 'axia_cardname'
    name.textContent = label
    const sum = doc.createElement('span')
    sum.className = 'axia_cardsum'
    sum.textContent = total
    head.appendChild(name)
    head.appendChild(sum)
    box.appendChild(head)
    const chips = doc.createElement('div')
    chips.className = 'axia_chips'
    const chip = (lab: string, val: string, hint: string): void => {
      const item = doc.createElement('span')
      item.className = 'axia_chip'
      item.title = hint
      const l = doc.createElement('span')
      l.className = 'axia_chiplab'
      l.textContent = lab
      const v = doc.createElement('span')
      v.className = 'axia_chipval'
      v.textContent = val
      item.appendChild(l)
      item.appendChild(v)
      chips.appendChild(item)
    }
    chip('命中', hit, '缓存命中部分的费用')
    chip('未命中', miss, '未命中输入（含缓存写入）的费用')
    chip('输出', out, '输出 token 的费用')
    box.appendChild(chips)
    put(box)
  }
  tableRow(
    '当前步',
    money2(cost + missCost + outputCost, n(view.costUsd) + n(view.missCostUsd) + n(view.outputCostUsd)),
    money2(cost, n(view.costUsd)),
    money2(missCost, n(view.missCostUsd)),
    money2(outputCost, n(view.outputCostUsd)),
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
    money2(turnHit + turnMiss + turnOut, turnHitUsd + turnMissUsd + turnOutUsd),
    money2(turnHit, turnHitUsd),
    money2(turnMiss, turnMissUsd),
    money2(turnOut, turnOutUsd),
  )

  // 本会话累计
  const sessionHit = n(view.sessionCacheHitCost)
  const sessionMiss = n(view.sessionMissCost)
  const sessionOut = n(view.sessionOutputCost)
  const sessionHitUsd = n(view.sessionCacheHitCostUsd)
  const sessionMissUsd = n(view.sessionMissCostUsd)
  const sessionOutUsd = n(view.sessionOutputCostUsd)
  tableRow(
    '本会话',
    money2(sessionHit + sessionMiss + sessionOut, sessionHitUsd + sessionMissUsd + sessionOutUsd),
    money2(sessionHit, sessionHitUsd),
    money2(sessionMiss, sessionMissUsd),
    money2(sessionOut, sessionOutUsd),
  )
  // 旧的无边框 5 列表头已不再挂载（数值全部进卡片自带标签），这里不 put(grid)
  if (view.mixedCurrency === true) {
    const mixed = doc.createElement('div')
    mixed.className = 'axia_foot'
    mixed.textContent = '本会话含两种币种，已按币种分开合计（元在前、美元在后）'
    put(mixed)
  }

  // 块 2+3 合并布局：标题横贯顶部（provider/model，峰谷带括号），左=竖长方形曲线（图例画图内），右=「消耗比较」+「缓存」两节——失效统计从表下小字搬入右列，底部灰字删除（猫猫 08-31 定稿）。
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
