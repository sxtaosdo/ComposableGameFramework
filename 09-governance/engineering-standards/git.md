# Git 技术规范

状态: Accepted

## Commit 类型

| 类型 | 用途 |
|---|---|
| feat | 新功能 |
| fix | Bug 修复 |
| refactor | 重构 |
| docs | 文档 |
| chore | 杂项 |

---

## Commit 规则

- 一个 Commit 只做一件事
- 禁止超大 Commit
- 文档与代码分离提交
- 每次有效改动必须形成一个独立 Commit
- 一个 Commit 只做一个任务或一类紧密相关的变更

---

## submodule 独立交付原则

- submodule 是独立仓库：功能代码先按该子仓库规则交付；主仓库只提交已验证的 gitlink 更新，不把子仓库源码提交到主仓库分支。

---

## 版本与分支边界

每个独立仓库遵守自身声明的版本和默认交付分支合同。P0002 使用三段 SemVer；本规范不迁入 shidai3 父仓专用的 `X.Y.Z.W`、`scripts/git_version.py` 或 `.githooks`。

父仓版本号规则、直提 `main`、审查分支（`codex-review/*`、`smoke/*`）和 Agent 交付流程仍由父仓 `AGENTS.md` 与 P0003 治理。禁止把审查 packet 分支当作正式交付分支。
