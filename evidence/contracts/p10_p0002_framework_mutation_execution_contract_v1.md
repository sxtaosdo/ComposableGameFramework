# P10-Cook × P0002 Framework Mutation Execution Contract v1

状态: Accepted

## 授权

- 产品：`p4000-p10-cook`
- Owner 授权：2026-08-26 的 P10-Cook × P0002 实施请求
- 独立输入：`P4000/docs/runtime/p10_p0002_refactor_contract_v1.json`
- 本合同独立授权下面列出的 Framework 状态与证据回写；Framework Change Proposal 的 `executionAuthorized` 必须继续为 `false`。

## 允许路径

只有 D3 证据实际成立后，才允许修改：

- `manifest.json`
- `README.md`
- `AGENTS.md`
- `07-ai-game-studio/framework-contract-verification.md`
- `evidence/**`
- `proposals/**`
- `contracts/**`

禁止修改 `src/**`、`tests/**`、schema、工具脚本以及全部 Protected Core。本产品只消费既有 P0002 1.5.0 Public API。

## 状态迁移

- Framework 与 Public API：`IMPLEMENTED`，不得升为 `VERIFIED`。
- `protectedPathRules`：改为 `DECLARED_PROTECTED_PATHS`，覆盖 manifest 中每个现有 protected area。
- `evidence.implementation`：写入 schema 合法的 `IMPLEMENTED` 对象，并绑定 source revision 与 receipt。
- Cocos compatibility 与 P10 实际使用且被 D3 覆盖的能力：`VERIFIED`。
- 未被 P10 覆盖的 Tile-Match、ARPG、LifeSim 等能力不晋级。
- D4、D5 为 `NOT_RUN`，Release 保持 `BLOCKED`。
- `README.md`、`AGENTS.md`、Framework Contract Verification 与 manifest 必须原子保持一致。

## 验证

在 Node.js 22.23.2 / pnpm 10.33.2 下执行：

- `pnpm contracts`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm sample:headless`

并验证 P10 clean-clone package-root 消费、行为测试、Creator 3.8.8 D3 Preview、生命周期、存档恢复及多尺寸证据。任何失败均停止状态晋级。

## 回退与交付

- 保留 P0002 变更前 commit 和所有审查/运行收据；若验证失败，不提交状态晋级，已形成的独立提交使用普通 `git revert` 回退。
- 先在 P0002 独立验证、提交并推送默认 `main`，确认远端 SHA；父仓随后只把 gitlink 固定到该 SHA 并重跑 DEVELOPMENT gate。
- 不使用 reset、force、源码复制或第二套框架绕过失败。
