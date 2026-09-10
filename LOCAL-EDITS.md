# LOCAL-EDITS — 我们自己的版本（虾算账；构建在云端，本地不构建）

**当前：0.6.2** = 上游 `v0.6.1`（`2da2b28`）+ 「供应商/模型下拉 + 获取模型」，产物由 GitHub Actions 构建。

- **我们自己的仓库（origin）**：`https://github.com/Animal2404/dsh-dsh-axia-cachebilling` —— 源码、CI 构建、产物回写都在这里。
- **原作者的仓库（upstream）**：`https://github.com/Phant0Meow/dsh-dsh-axia-cachebilling` —— 只作只读参考，**不再往来**（之前开的 PR #3 已关闭）。
- 本地目录 `E:\DeepSeek\dsh-cache-billing` 跟踪 `origin/main`；挂载方式没变：
  `C:\Users\axia\.dsh\profiles\web\package.json` → `"dsh-axia-cachebilling": "link:E:/DeepSeek/dsh-cache-billing"`（junction 指本目录）。

## 硬规矩：不在本地构建

- 不在本目录跑 `npm install` / `npm run build`（会留下 `node_modules/`、`package-lock.json`，并覆盖 `lib/`）。
- **`lib/` 一律由 GitHub Actions 产出**：`.github/workflows/build.yml` 在 `origin/main` 的 push 上
  ① `npm install && npm run build` → ② `Commit built artifacts back` 把 `lib/` 提交回仓库（提交信息带 `[skip ci]`，防自触发）。
- 本地只 `git pull` 把云端构建出来的 `lib/` 拿下来。

## 日常改这个插件（三步）

```powershell
# 1) 改 src/（本地不要构建）
# 2) 提交并推到我们自己的仓库
git -C E:\DeepSeek\dsh-cache-billing add -A src README.md package.json .github
git -C E:\DeepSeek\dsh-cache-billing commit -m "feat: ..."
git -C E:\DeepSeek\dsh-cache-billing push origin main        # 触发云端构建 + 回写 lib/
# 3) 等 Actions 跑完（约 1 分钟），把云端产物拉下来
git -C E:\DeepSeek\dsh-cache-billing pull --ff-only          # lib/ 即云端构建产物
```

生效方式（**不需要重启 dsh web**）：
- 客户端半边：`dsh-client-hmr` 监视产物文件、按内容 sha1 重算 rev → 浏览器热替换（没热替换就 F5）
- 宿主半边：`dev_reload_package dsh-axia-cachebilling` 热重载（失败会回滚旧代）

查看/触发云端构建：
```powershell
gh run list  --repo Animal2404/dsh-dsh-axia-cachebilling --limit 3
gh workflow run build.yml --repo Animal2404/dsh-dsh-axia-cachebilling --ref main
```

（可选）想彻底脱离 fork 关系：把仓库改成独立仓库（另建 repo 推过去，或让 GitHub 解除 fork），也能设私有——
需要的话再做，当前 fork 形态不影响使用。

## 本版改了什么（相对上游 0.6.1）

- 设置页「虾算账」编条目：**供应商下拉**（`remote.llm.listProviders()` 活跃路由 ● 在前 + `listConfigurableProviders()` 可配置目录 ○ 在后；保留「手填」与「留空 = 通配」）
- **模型下拉 + 「获取模型」**：`remote.llm.discoverModels(settingsNs, { provider, baseURL, api })`；`baseURL`/`api` 从 DSH 设置镜像
  `ctx.settingsScope.describe() → ensure() → getSnapshot().view` 的 `providers.<id>` 读（密钥客户端脱敏，主机侧 pi-ai 自解）
- 取不到时给人话原因，并保留「价目表已有模型 + 手填」兜底；价格编辑不动
- `client inject` 增加 `remote.llm`；版本 0.6.2；README 功能条同步

## 自测工具（不依赖 node_modules）

`.meow-update/dev-browser-check.mjs`：无头 Chrome + 用本机凭据里的会话密钥签一个只给 127.0.0.1 用的临时 cookie，
自动走到「设置 → 虾算账 → 添加条目」，选供应商、点「获取模型」，逐步截图到 `.meow-update/shots/`。

```powershell
node .meow-update/dev-browser-check.mjs                 # 默认 deepseek-official
$env:PROVIDER='jyld'; node .meow-update/dev-browser-check.mjs
```

## 历史踩坑

- 本机只有 Windows PowerShell 5.1（无 pwsh 7）：脚本存 UTF-8 **with BOM**，`Get-Content -Raw` 带 `-Encoding UTF8`。
- 上游提交的 `lib/` 与干净构建产物不同（原作者机器上构建，注释里带 `../meow-smooth/...` 路径）→ 这正是走云端构建的原因。
- 措辞定制（「当前每次API请求」→「当前步」）上游 0.6.1 已采纳；「会话累计 · N 次」那条随改版退休。
- 改成源码工作树之前的打包形态备份在 `E:\DeepSeek\.meow-backups\dsh-cache-billing-packed-20260910-153206\`。
