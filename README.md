# P0002 Game Framework（游戏框架平台）

状态: Accepted

本仓库作为 shidai3 的 P0002 共享游戏能力基础平台，定义“游戏如何运行”，独立于具体 IP、产品和 AI 工具实现。

## 职责

- Foundation Core 与 Shared Domain
- Feature System 与 Ruleset
- World、Hybrid ECS 与 Engine Adapter 边界
- Save、Data Schema、Command / Query / Event
- Debug、Testing、Performance 与 Validation
- 面向产品装配的 Framework Manifest 与合同验证

## 当前目录

| 路径 | 说明 |
|---|---|
| `docs/ComposableGameFramework-v1.3/` | 可组合游戏框架 v1.3 技术文档基线 |

`framework/`、`examples/`、`specs/`、`validation/` 仅在出现对应实现或正式产物时再创建，不提前建立空目录。

当前内容是技术设计文档基线，不代表已有源码实现、运行验证或产品验收。

## 边界

- 不维护世界观、Canon、角色或美术资产；这些属于 P0001。
- 不定义 AI Agent / Skill / 生产治理标准；这些属于 P0003。
- 不承载 AI 生产工具实现；这些属于 P9000。
- 不承载具体产品的玩法、内容或产品专属逻辑；产品只通过稳定合同消费 P0002 能力。

## 对接

- P0003 规定 AI 如何读取、评审和生成 P0002 合同。
- P9000 工具根据 P0003 标准解析和装配 P0002 能力。
- P1000、P3000、P4000 及未来产品按需消费 P0002。

## 关键入口

- 框架文档：`docs/ComposableGameFramework-v1.3/README.md`

作为 shidai3 的 `P0002/` submodule 检出时，父仓库集成入口为：

- AI 读取入口：`../AI_CONTEXT.md`
- 顶层架构：`../P0003/architecture/shidai3-ai-native-architecture.md`
- 编号规范：`../governance/naming_rules.md`
