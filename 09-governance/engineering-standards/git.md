# Git 技术规范

状态: Accepted

本文件是 shidai3 各项目 Git / 版本技术合同的权威正文。父仓 `AGENTS.md` 只保留本仓操作入口与对本文的引用，不另立冲突正文。生产治理（直提分支、审查分支、Agent 闭环）仍由父仓与 P0003 管理。

## Commit 类型

| 类型 | 用途 |
|---|---|
| feat | 新功能 |
| fix | Bug 修复 |
| refactor | 重构 |
| docs | 文档 |
| chore | 杂项 |

类型表用于变更分类指引。业务仓与父仓的正式 commit subject 以四段版本前缀为准（见下），不要求把 `feat` / `fix` 等类型前缀写入 subject。

---

## Commit 规则

- 一个 Commit 只做一件事
- 禁止超大 Commit
- 文档与代码分离提交
- 每次有效改动必须形成一个独立 Commit
- 一个 Commit 只做一个任务或一类紧密相关的变更

---

## Commit message 结构

```text
vX.Y.Z.W: <简短概要>

Agent: <执行 agent>
<可选：简要详情>
```

- subject 只写一句话概要，说明这次改了什么；不堆叠实现细节、文件清单或多个子项。
- body 第一行必须是 `Agent: <执行 agent>`，写入本次提交的执行者；多个用英文逗号分隔。已知名称：`codex`、`cursor`、`dsh`；新增执行器直接写其名称。
- body 其余内容可选，用一两句写关键细节；不写细节时只保留 `Agent` 行。
- `commit-msg` Hook 校验 subject 版本前缀与 `Agent` 行，任一不符即拒绝提交。
- P0002 Framework 仓沿用三段 SemVer、不装业务仓 Hook，但 commit message 仍按上述结构书写。

---

## 项目独立仓库要求

凡被编号为独立项目的**代码仓库**（游戏产品、工具产品、可交付代码仓等）必须满足：

- 拥有独立 Git remote，不得长期以父仓普通路径承载其源码。
- 在 shidai3 工作区中仅以 submodule gitlink 挂载；父仓只提交已验证的 gitlink，不把该项目源码提交到父仓分支。
- 功能变更先在该独立仓库按本仓版本门完成验证与交付，再由父仓更新 gitlink。

存量仍嵌在父仓树内的路径（例如部分 `P0001/`、`P1000/`、`P3000/`、`P9000/workflow/`）视为**待合规**；拆仓另排任务，不因本文生效而自动完成迁移。

参考已合规样板：`P4000/cook`、`P4000/colony-flow-food-hunt`（及既有工具/框架 submodule）。

---

## submodule 独立交付原则

- submodule 是独立仓库：功能代码先按该子仓库规则交付；主仓库只提交已验证的 gitlink 更新，不把子仓库源码提交到主仓库分支。
- 交付顺序：子仓先 commit（必要时 push）→ 父仓再更新 gitlink（父仓使用自己的版本计数）。

### 产品消费框架（Cocos → shidai3 / P0002）

- 后续 Cocos 产品必须以 **git submodule** 将本框架仓挂到产品根的 `extensions/shidai3`；业务经 `db://shidai3/*` 消费，不 fork 框架源码进 `assets/`。
- 框架改动只在框架仓交付；产品仓只更新已验证的 submodule gitlink 与版本钉。
- **禁止**复制粘贴、rsync、vendor 或把框架树当普通文件提交进产品分支。细则与 MVP 强制消费见 [cocos-creator.md](cocos-creator.md)「MVP 起强制：消费 shidai3 / P0002」。

---

## 业务仓四段版本合同

除下文 Framework 例外外，业务仓（含挂载在 shidai3 下的产品仓、工具仓，以及父仓自身）统一遵守：

- 版本格式 `X.Y.Z.W`。前三位仅由 Owner 决定；第四段 `W` 跨本仓全历史只增不减、永不重置（各仓计数互不共用）。
- 根 `VERSION` 是机器事实源；README 顶部当前版本与 Commit subject 是同步镜像。
- Commit subject 格式：`vX.Y.Z.W: <简短概要>`；body 结构见「Commit message 结构」。
- 提交前运行 `python3 scripts/git_version.py install`，启用本仓 `.githooks`；Hook 负责 bump / 校验并暂存版本文件。
- 禁止用 `--no-verify` 绕过版本门。
- 实现脚本可各仓自备副本（以 `P4000/cook`、`P4000/colony-flow-food-hunt` 的 `scripts/git_version.py` 为样板）；合同条文以本文为准。

### Framework 例外（P0002）

P0002 Framework 仓继续使用**三段 SemVer**：根 `VERSION`、`manifest.json.framework.version` 与 `CHANGELOG.md` 必须一致。P0002 不改用四段版本，也不强制采用业务仓的 `git_version.py` Hook。

---

## 版本与分支边界

- **技术合同**（独立仓、业务仓四段版本、Framework SemVer、commit 粒度、submodule 交付）：本文。
- **生产治理**（直提 `main`、审查分支如 `codex-review/*` / `smoke/*`、Agent 交付流程）：父仓 `AGENTS.md` 与 P0003。禁止把审查 packet 分支当作正式交付分支。
- 每个独立仓库的默认交付分支由该仓自身合同声明；未声明时以 Owner 指定为准。
