# RELEASING.md — 本 fork 的分支、同步与发布说明

> 本文件只存在于本 fork 的 **`release` 分支**上，不会进入给上游（`laofahai/obsidian-tablite`）的 PR。
> 上游仓库本身有它自己的发布流程，这里写的是"我这条线"怎么运作。

## 1. 分支分工

| 分支 | 角色 | 说明 |
| --- | --- | --- |
| `main` | **上游镜像** | 与 `laofahai/obsidian-tablite` 的 `main` 保持一致，只用于同步上游，不放任何本地改动。保持它是仓库**默认分支**。 |
| `release` | **发布链** | 本 fork 唯一"真实存在"的开发/发布线：包含编码修复 + 发布工具链（`.npmrc`、`version-bump.mjs`、tag 触发的 workflow、`CHANGELOG.md`）。所有版本 tag 都打在这条线上。 |
| `fix/*`、`feat/*` | 上游贡献分支 | 从**上游 main** 切出（不是从 `release` 切），用于向 `laofahai` 提 PR。 |

约定：

- 只从**上游 main** 切功能分支再提 PR，这样 PR 里不会夹带发布工具链。
- `release` 因为天然领先于 `main`（多了工具链提交），同步上游时**不能**用 `--ff-only`，见 §2。
- 上游合并了某个修复后，`release` 上那份等价提交会以"内容相同"的方式被合并吸收，不会冲突（内容一致，git 会用同一结果解决）。

## 2. 同步上游

首次需要添加上游 remote（只需一次）：

```bash
git remote add upstream https://github.com/laofahai/obsidian-tablite.git
```

同步 `main`（可以 fast-forward，最干净）：

```bash
git fetch upstream
git checkout main
git merge --ff-only upstream/main
git push origin main
```

把上游更新吸收进发布链：

```bash
git checkout release
git merge upstream/main          # 用 merge，不要用 --ff-only（release 一定领先）
# 如果出现冲突：正常解冲突后 commit，再跑一遍 npm test
git push origin release
```

> 想保持发布链是线性的，可以改用 `git rebase upstream/main`，但那之后推送 `release` 需要 `git push --force-with-lease origin release`。日常用 merge 更省事。

## 3. 发布一个新版本

```bash
git checkout release
git fetch upstream && git merge upstream/main     # 先同步（可选，但推荐）

# 1) 代码与测试：本地先跑一遍
npm test                # node --test tests/*.test.mjs
npm run build           # tsc -noEmit -skipLibCheck && esbuild production → main.js + styles.css

# 2) 四处版本号 + CHANGELOG
#    manifest.json / package.json / package-lock.json（两处）/ versions.json（下一步自动）
#    CHANGELOG.md：把 "## 未发布" 改成 "## x.y.z"
#    注意：manifest.json 的 version 必须与 tag 完全一致，CI 会校验

# 3) 同步 versions.json（读 manifest.json，写入版本→minAppVersion 映射）
npm run version         # = node version-bump.mjs && git add manifest.json versions.json

# 4) 提交 + 打 tag + 推送（tag 推送即触发 CI 发版）
git add -A
git commit -m "chore(release): x.y.z"
git tag x.y.z
git push origin release
git push origin x.y.z
```

CI（`.github/workflows/release.yml`）在 tag 推送时执行：

1. `npm ci` → `npm run test` → `npm run build`；
2. 校验 tag 形如 `x.y.z` **且等于** `manifest.json` 的 version（不一致直接失败）；
3. 取 `CHANGELOG.md` 中 `## x.y.z` 段落作为 release 正文；
4. 建 GitHub Release 并上传 **`main.js`、`manifest.json`、`styles.css`** 三个附件。

发布后核对：

```bash
gh release list                                             # 新版本应为 Latest
gh release view x.y.z --json tagName,isDraft,isPrerelease,assets \
  --jq '{tag:.tagName,draft:.isDraft,pre:.isPrerelease,assets:[.assets[].name]}'
```

## 4. 补发 / 重跑

不用移动 tag，手动触发即可（正文与附件会重新生成）：

```bash
gh workflow run Release --ref release -f version=x.y.z
gh run list --limit 3
gh run watch <run-id> --exit-status
```

## 5. 本地测试安装

- **BRAT**：`Add a beta plugin for testing` → `luna-jmy/obsidian-tablite` → 安装的是 **Latest release** 的附件（与分支无关，所以 main 回退不影响它）。
- **手动**：`npm run build` 后把 `main.js`、`manifest.json`、`styles.css` 拷到 `<vault>/.obsidian/plugins/tablite/`，重启 Obsidian。

## 6. 规则与坑（踩过的）

- **tag 必须裸 `x.y.z`，不带 `v`**：`.npmrc` 里 `tag-version-prefix=""` 保证 `npm version` 生成的 tag 不带前缀。
- **workflow 的 `tags` 过滤是 glob 不是正则**：`tags: ["[0-9]+.[0-9]+.[0-9]+"]` 永远匹配不上 `0.4.2`（`+` 是字面量），整条流水线会静默不触发。本仓库用 `tags: ["*"]` + job 内校验版本号。
- **不要在没有发布的情况下改 `manifest.json` 的 version**：`versions.json` 由钩子从 manifest 读取。
- **`main.js` 不入库**（`.gitignore`），由 CI/本地构建生成；`styles.css` 是入库文件。
- **PR 上没有 CI**：上游 workflow 只在 tag 推送时运行，所以任何改动都必须本地跑 `npm test` + `npm run build` 后才能提。
- **不要 force-push 上游的 `main` 或 tag**。
- **不要把 `release` 设为默认分支**：GitHub 的 *Sync fork → Discard commits* 作用于默认分支，误点会把发布链冲掉。

## 7. 当前状态（2026-09-30）

- 上游 `main`：`7f4080e`（本 fork 的 `main` 在回退对齐后应等于它）。
- 发布链 `release`：`de72736`（`chore(release): 0.4.3`）。
- 已发布版本：`0.4.2`、`0.4.3`；两个 tag 都在 `release` 的祖先链上，回退 `main` 不会让它们失效。
- 上游贡献：PR #7（`fix/csv-encoding`，`7614e74`，基于上游 `7f4080e`）。
- BRAT 安装标识：`luna-jmy/obsidian-tablite`。
