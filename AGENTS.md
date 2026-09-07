# P0002 Agent Rules

状态: Accepted

本文件只定义 Agent 在 P0002 中的执行规则。项目定位、架构概览和文档导航见 `README.md`。

## 读取顺序

1. `README.md`：了解框架定位和目录。
2. `VERSION` 与 `manifest.json`：确认机器合同版本、能力成熟度和证据状态。
3. 涉及源码时读取根 `package.json`，再按 Manifest 证据路径进入对应 `src/` 与 `tests/` 文件。
4. 仅按任务读取对应编号目录；不得把未声明状态的设计文档当作已实现能力。
5. 作为 shidai3 的 `P0002/` submodule 使用时，再读取父仓库 `../AI_CONTEXT.md` 和目标产品的适用 `AGENTS.md`。
6. 编码前读取 `09-governance/engineering-standards/` 的通用规范和 Owner 指定的引擎规范。

## 证据边界

- 当前能力、兼容性与证据状态以 [`manifest.json`](manifest.json) 及其引用证据为准，不在本规则文件维护进度快照。
- `DESIGN_ONLY` 能力只能用于规划和缺口分析，不能被 Resolver 判定为可装配。
- 只有具备实现证据的 `IMPLEMENTED` 能力才能进入开发装配；要求运行验收时必须达到 `VERIFIED`。
- Framework 顶层、Public API、各能力与引擎兼容性的成熟度分别核验；局部 Runtime 证据不能替代整体、D4/D5 或 Release 的独立验收。
- 代码阅读、设计声明、测试结果和产品验收必须分别报告，不得混称。

## 修改规则

- Feature、Ruleset、Capability、Command、Query、Event、Effect、Save 或兼容性变化必须同步更新 `manifest.json`。
- `VERSION`、`manifest.json.framework.version` 与 `CHANGELOG.md` 必须保持一致。
- 不为未来实现预建空目录；`framework/`、`examples/`、`specs/`、`validation/` 只在有真实产物时创建。
- 单个产品需求默认不得修改 Foundation Core；回流必须先有至少两个独立真实复用场景并经过架构 Review。
- AI 不得自动修改 Foundation Core、Save Protocol、Entity Identity、Feature Lifecycle、Command Contract 或 Registry Protocol。
- Cocos 产品默认复用 MKFramework 的 UI、资源、Bundle、音频、事件、视图生命周期、MVC/MVVM 与对象池能力；P0002 不建立第二套同类 Runtime。该规范不等于已完成 MKFramework Runtime 接入。

## 边界

- 不维护世界观、Canon、角色或美术资产；这些属于 P0001。
- 不定义 AI Agent / Skill / 生产治理标准；这些属于 P0003。
- 不承载 AI 生产工具实现；这些属于 P9000。
- 不承载具体产品的玩法、内容或产品专属逻辑。
- P0003 定义 AI 生产标准，P9000 实现工具；二者不得反向把工具状态写成 Framework 能力状态。

## 验证

- 校验 `VERSION` 与 Manifest 版本一致。
- 校验 Manifest 中引用的文档存在、依赖 ID 可解析、目录成熟度不会被降级绕过。
- 校验 `README.md` 相对链接、Markdown 数量与 `manifest.json.documentCount`。
- TypeScript Core 修改运行 `pnpm typecheck`、`pnpm test` 与 `pnpm build`，并使用 Node.js 22 验证。
- 提交前运行 `git diff --check`，并明确未执行的源码、Runtime 或产品验收层级。
- 工程规范变更运行 `node scripts/validate-engineering-standards.mjs`。
