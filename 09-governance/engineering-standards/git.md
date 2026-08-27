# Git 技术规范

状态: Accepted

## 提交

- Commit type 使用 `feat`（功能）、`fix`（修复）、`refactor`（重构）、`docs`（文档）或 `chore`（杂项）。
- 一个提交只处理一个任务或一类紧密相关的变更。
- 文档与代码默认分离提交，避免超大提交。
- submodule 先在独立仓库完成验证与交付，父仓只更新已验证的 gitlink。
- 禁止把审查 packet 分支当作正式交付分支。

## 版本与分支边界

每个独立仓库遵守自身声明的版本和默认交付分支合同。P0002 使用三段 SemVer；本规范不迁入 shidai3 父仓专用的 `X.Y.Z.W`、`scripts/git_version.py` 或 `.githooks`。父仓的直提 `main`、审查分支和 Agent 交付流程仍由父仓与 P0003 治理。
