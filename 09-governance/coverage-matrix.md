# Architecture Coverage Matrix（架构覆盖矩阵）

> 用于防止文档遗漏。每个主题只有一个主权威文档，其余文档只引用，不重复定义。

| 主题 | 权威文档 |
|---|---|
| 总体架构与导航 | `README.md` |
| Feature 边界、依赖、生命周期 | `01-architecture/feature-system.md` |
| ECS / Domain / Workflow | `01-architecture/runtime-model.md` |
| Game Entity / ECS Entity / Node | `01-architecture/entity-model.md` |
| World / Time / Region / Map / Scene | `01-architecture/world-time.md` |
| 引擎解耦 | `01-architecture/engine-boundary.md` |
| Attribute / Modifier | `02-domain/attribute-modifier.md` |
| Effect / Ability / Condition / Trigger | `02-domain/effect-ability.md` |
| Item / Inventory | `02-domain/item-inventory.md` |
| Interaction | `02-domain/interaction.md` |
| Progression | `02-domain/progression.md` |
| Combat / Death / PvP 边界 | `03-gameplay/combat.md` |
| AI | `03-gameplay/ai.md` |
| Quest / Dialogue | `03-gameplay/quest-dialogue.md` |
| Loot / Equipment / Affix | `03-gameplay/loot-equipment-affix.md` |
| Farming / Fishing / Mining / Crafting | `03-gameplay/farming-fishing-crafting.md` |
| Relationship / Schedule | `03-gameplay/relationship-schedule.md` |
| Save / Snapshot / Migration | `04-infrastructure/save-snapshot-migration.md` |
| Schema / Registry / DSL | `04-infrastructure/data-config-dsl.md` |
| Command / Query / Event / Error | `04-infrastructure/event-command-query.md` |
| Debug / Trace / Inspector | `04-infrastructure/debug-observability.md` |
| Test / Performance / Determinism | `04-infrastructure/testing-performance.md` |
| Cocos Adapter | `05-cocos/cocos-adapter.md` |
| ECS / Node Binding | `05-cocos/ecs-binding.md` |
| Scene / Resource | `05-cocos/scene-resource.md` |
| Input / UI / Presentation | `05-cocos/input-ui-presentation.md` |
| 传奇装配 | `06-products/legend-reference.md` |
| 暗黑装配 | `06-products/diablo-reference.md` |
| 生活模拟装配 | `06-products/lifesim-reference.md` |
| 混合型装配 | `06-products/hybrid-reference.md` |
| AI Game Studio 集成 | `07-ai-game-studio/integration.md` |
| GameSpec | `07-ai-game-studio/gamespec.md` |
| AI 生成安全边界 | `07-ai-game-studio/ai-generation-boundary.md` |
| 工程实施顺序 | `08-roadmap/implementation-plan.md` |
| 架构验收 | `08-roadmap/acceptance-plan.md` |
| 架构决策与下沉规则 | `09-governance/decision-rules.md` |
| 审查清单 | `09-governance/review-checklist.md` |

## 覆盖结论

当前文档集覆盖：

```text
架构分层
运行模型
实体
世界
时间
Feature
Ruleset
属性
效果
物品
战斗
AI
任务
对话
装备
词缀
生活模拟
存档
配置
协议
调试
测试
性能
Cocos 集成
产品装配
AI Game Studio
实施规划
验收
架构治理
```

当前阶段有意不展开：

```text
MMO 网络同步
服务器架构
完整 Mod 系统
完整 DSL 语言设计
完整编辑器 UX
商业化 / 支付 / 广告
具体数值平衡
具体代码实现
```

这些属于后续独立专题，不应混入 v1.0 核心架构。


## v1.3 新增覆盖

| 主题 | 权威文档 |
|---|---|
| Application Layer | `01-architecture/application-layer.md` |
| Puzzle / Minigame | `03-gameplay/puzzle-minigame.md` |
| Minigame Product | `06-products/minigame-reference.md` |
| Framework Manifest | `07-ai-game-studio/framework-manifest.md` |
| Framework Resolver | `07-ai-game-studio/framework-resolver.md` |
| FrameworkAssemblySpec | `07-ai-game-studio/framework-assembly-spec.md` |
| Framework Gap Analysis | `07-ai-game-studio/framework-gap-analysis.md` |
| Framework Contract Verification | `07-ai-game-studio/framework-contract-verification.md` |
| Framework Upstream | `07-ai-game-studio/framework-upstream.md` |
| Changelog | `CHANGELOG.md` |
