# Composable Game Framework（可组合游戏框架）

状态: Accepted（设计与合同基线）

> 本仓库文档定义一套面向 RPG 与 Simulation（模拟）玩法的可组合游戏框架。
> 第一阶段以 Cocos Creator + 2D/2.5D + Mobile First（移动端优先）为主要实现目标，单机优先，同时保留未来多人、3D 和跨引擎边界。

本文档集属于 `P0002` Game Framework。`07-ai-game-studio/` 定义框架侧装配合同；AI 生产标准由 `P0003` 管理，工具实现位于 `P9000`。

当前内容是技术设计和机器可读合同基线，不代表已有 Framework 源码、运行验证或产品验收。能力成熟度以 [`manifest.json`](manifest.json) 为准；当前能力均为 `DESIGN_ONLY`。

## 1. 目标

框架目标不是“万能模板”，而是：

```text
Game Product（具体游戏）
=
Foundation Core（基础核心）
+ Shared Domain（共享领域）
+ Feature Pack（功能包）
+ Ruleset（规则集）
+ Content（内容）
+ Presentation（表现）
+ 少量 Product-specific Logic（产品专属逻辑）
```

目标复用比例：

```text
约 80% 通用能力
约 15% Feature / Ruleset 扩展
约 5% Product-specific Logic
```

首批验证产品：

- Legend-like ARPG（传奇式动作角色扮演）
- Diablo-like ARPG（暗黑式动作角色扮演）
- LifeSim RPG（生活模拟 RPG）
- Hybrid RPG（混合型 RPG）

## 2. 总体架构

```text
Product Layer（产品层）
↓
Ruleset Layer（规则集层）
↓
Feature Layer（功能模块层）
↓
Shared Domain Layer（共享领域层）
↓
Foundation Core（基础核心层）
↓
Engine Adapter（引擎适配层）
```

核心原则：

1. Composition over Inheritance（组合优于继承）
2. Data-driven（数据驱动）
3. Hybrid ECS（混合 ECS），不采用 Full ECS（全 ECS）
4. Feature（功能模块）可组合、可关闭、可替换
5. Ruleset（规则集）与 Presentation（表现）解耦
6. Command / Query / Event（命令 / 查询 / 事件）作为跨 Feature 的主要协议
7. 每份状态有唯一 Owner（拥有者）和 Authority（权威来源）
8. Game Entity（游戏实体）、ECS Entity（ECS 实体）、Cocos Node（Cocos 节点）严格分离
9. Save（存档）统一协调，不允许 Feature 各自写磁盘
10. Cocos Creator 是 Engine Adapter（引擎适配器），不是业务核心
11. 核心规则尽量支持 Headless Test（无渲染测试）
12. 抽象必须来自真实复用，不提前构造万能系统

## 3. 文档导航

### Architecture（架构）

- [Feature System（功能模块系统）](01-architecture/feature-system.md)
- [Runtime Model（运行模型）](01-architecture/runtime-model.md)
- [Entity Model（实体模型）](01-architecture/entity-model.md)
- [World & Time（世界与时间）](01-architecture/world-time.md)
- [Engine Boundary（引擎边界）](01-architecture/engine-boundary.md)
- [Application Layer（应用编排层）](01-architecture/application-layer.md)

### Shared Domain（共享领域）

- [Attribute & Modifier（属性与修改器）](02-domain/attribute-modifier.md)
- [Effect & Ability（效果与能力）](02-domain/effect-ability.md)
- [Item & Inventory（物品与背包）](02-domain/item-inventory.md)
- [Interaction（交互）](02-domain/interaction.md)
- [Progression（成长）](02-domain/progression.md)

### Gameplay（玩法模块）

- [Combat（战斗）](03-gameplay/combat.md)
- [AI（人工智能）](03-gameplay/ai.md)
- [Quest & Dialogue（任务与对话）](03-gameplay/quest-dialogue.md)
- [Loot / Equipment / Affix（掉落 / 装备 / 词缀）](03-gameplay/loot-equipment-affix.md)
- [Farming / Fishing / Crafting（种植 / 钓鱼 / 制作）](03-gameplay/farming-fishing-crafting.md)
- [Relationship & Schedule（关系与日程）](03-gameplay/relationship-schedule.md)
- [Puzzle / Minigame（益智 / 小游戏）](03-gameplay/puzzle-minigame.md)

### Infrastructure（基础设施）

- [Save / Snapshot / Migration（存档 / 快照 / 迁移）](04-infrastructure/save-snapshot-migration.md)
- [Data / Config / DSL（数据 / 配置 / 领域描述）](04-infrastructure/data-config-dsl.md)
- [Command / Query / Event（命令 / 查询 / 事件）](04-infrastructure/event-command-query.md)
- [Debug & Observability（调试与可观测性）](04-infrastructure/debug-observability.md)
- [Testing & Performance（测试与性能）](04-infrastructure/testing-performance.md)

### Cocos Creator Integration（Cocos Creator 集成）

- [Cocos Adapter（Cocos 适配层）](05-cocos/cocos-adapter.md)
- [ECS Binding（ECS 绑定）](05-cocos/ecs-binding.md)
- [Scene & Resource（场景与资源）](05-cocos/scene-resource.md)
- [Input / UI / Presentation（输入 / UI / 表现）](05-cocos/input-ui-presentation.md)

### Product References（参考产品）

- [Legend Reference（传奇参考装配）](06-products/legend-reference.md)
- [Diablo Reference（暗黑参考装配）](06-products/diablo-reference.md)
- [LifeSim Reference（生活模拟参考装配）](06-products/lifesim-reference.md)
- [Hybrid Reference（混合产品参考装配）](06-products/hybrid-reference.md)
- [Minigame Reference（小游戏参考装配）](06-products/minigame-reference.md)

### AI Game Studio（AI 游戏工作室）

- [Integration（集成）](07-ai-game-studio/integration.md)
- [GameSpec（游戏规格）](07-ai-game-studio/gamespec.md)
- [AI Generation Boundary（AI 生成边界）](07-ai-game-studio/ai-generation-boundary.md)
- [Framework Manifest（框架清单）](07-ai-game-studio/framework-manifest.md)
- [Framework Resolver（框架解析器）](07-ai-game-studio/framework-resolver.md)
- [FrameworkAssemblySpec（框架装配规格）](07-ai-game-studio/framework-assembly-spec.md)
- [Framework Gap Analysis（框架缺口分析）](07-ai-game-studio/framework-gap-analysis.md)
- [Framework Contract Verification（框架合同验证）](07-ai-game-studio/framework-contract-verification.md)
- [Framework Upstream（框架回流）](07-ai-game-studio/framework-upstream.md)

### Roadmap（路线）

- [Implementation Plan（实施规划）](08-roadmap/implementation-plan.md)
- [Acceptance Plan（验收规划）](08-roadmap/acceptance-plan.md)

### Coverage（覆盖检查）

- [Architecture Coverage Matrix（架构覆盖矩阵）](09-governance/coverage-matrix.md)
- [Architecture Decision Rules（架构决策规则）](09-governance/decision-rules.md)
- [Architecture Review Checklist（架构审查清单）](09-governance/review-checklist.md)
- [CHANGELOG（变更日志）](CHANGELOG.md)

## 4. 当前范围

第一阶段明确：

```text
单机优先
2D / 2.5D 优先
Cocos Creator 优先
移动端优先
核心逻辑尽量引擎无关
```

暂不实现：

```text
完整 MMO 网络同步
完整 Mod SDK
通用脚本语言
全功能可视化逻辑编辑器
大型开放世界流式系统
跨引擎双实现
服务器框架
全自动 AI 游戏生成
```

## 5. 架构验收基准

框架成功的核心标准不是“功能很多”，而是：

> Legend / Diablo / LifeSim 三种跨度明显的产品可以在不修改 Foundation Core（基础核心）的前提下完成装配。

若新增玩法必须反复修改 Core，说明抽象层次失衡。
