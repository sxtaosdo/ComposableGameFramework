# Implementation Plan（实施规划）

> 本文只定义工程顺序，不包含具体代码。

## Phase 0：协议冻结

目标：

```text
确认 Core / Domain / Feature / Ruleset / Product 边界
确认命名
确认文档基线
```

产出：

```text
架构文档冻结版
核心术语表
目录约定
```

### 首次源码基线（Owner 已确认）

```text
Language: TypeScript 5.x
Headless Runtime: Node.js 22
Package Manager: pnpm
Test Runner: Vitest
First Engine Adapter Target: Cocos Creator 3.8+
```

首个源码目录：

```text
src/foundation-core/
tests/foundation-core/
```

`adapters/`、`examples/`、`specs/` 与 `validation/` 在出现真实产物前不创建。

## Phase 1：Foundation Core（基础核心）

优先：

```text
Entity Identity
Tag
Command
Query
Event
Lifecycle
Registry
Dependency
Clock 基础
Error Model
Random Source
```

首个纵向切片：

```text
Entity Identity
→ Entity Registry
→ Structured Error
→ Headless Unit Test
```

该切片不同时引入 Command / Query / Event Bus、Save、ECS 或 Engine Adapter。

实现证据：

```text
Status: IMPLEMENTED
Source: src/foundation-core/entityId.ts
        src/foundation-core/entityRegistry.ts
Test:   tests/foundation-core/entityRegistry.test.ts
Verify: pnpm typecheck
        pnpm test
        pnpm build
```

验收：

```text
无 Cocos 依赖
基础协议单测
```

## Phase 2：Shared Domain（共享领域）

实现：

```text
Attribute
Modifier
Effect
Ability
Item
Inventory
Interaction
Time
World State
Progression
```

验收：

```text
规则可 Headless Test
结构化错误
配置校验
```

## Phase 3：Feature Runtime（功能运行时）

实现：

```text
Feature Registry
Dependency Graph
Lifecycle
Capability
Application Layer
Save Boundary
```

## Phase 4：Cocos + Hybrid ECS

实现：

```text
Cocos Adapter
Binding Layer
ECS Runtime
Input Bridge
Physics Adapter
Resource Adapter
Scene / Map Bridge
```

## Phase 5：Legend Vertical Slice（传奇纵向切片）

最小验证：

```text
角色
怪物
战斗
技能
装备
掉落
Boss
强化
地图
存档
```

目的：验证战斗型产品。

## Phase 6：Diablo Vertical Slice（暗黑纵向切片）

增加：

```text
Affix
Build
Dungeon
Talent
大量 Loot
复杂 Modifier
```

目的：验证规则复杂度和高频 Runtime。

## Phase 7：LifeSim Vertical Slice（生活模拟纵向切片）

增加：

```text
Calendar
Farming
Fishing
Mining
Relationship
Dialogue
Schedule
Weather
Day Transition
```

目的：验证框架不是“伪通用 ARPG”。

## Phase 8：Cross-product Refactor（跨产品收敛）

只下沉经过三个产品验证的稳定共性。

目标：

```text
消除重复
拒绝过度抽象
冻结 v1 Core
```

## Phase 9：AI Game Studio 接入

实现：

```text
GameSpec
Feature Assembler
Schema Generator
Content Generator
Validation Pipeline
AI Repair Boundary
```

## Phase 10：工具化

按真实需求补：

```text
Item Editor
Quest Editor
Dialogue Editor
Skill Editor
Feature Assembler
Debug Inspector
```

原则：

> 先 Runtime 协议，后编辑器。


## 补充：Minigame Vertical Slice（小游戏纵向切片）

在 Legend / Diablo / LifeSim 大型验证之前，优先增加一个低成本非 RPG 验证：

```text
Tile-Match Minigame
```

用于验证：

```text
Core 是否真正通用
Feature 是否可裁剪
Ruleset 是否可替换
Save / Config / Presentation 是否独立
AI 是否可生成并验证结构化关卡
```


## 补充：AI Game Studio × Framework Integration

正式接入按以下子阶段：

```text
Framework Manifest
↓
Framework Resolver
↓
FrameworkAssemblySpec
↓
Framework Gap Analysis
↓
Framework Contract Verification
↓
Protected Core Agent Policy
↓
Framework Upstream Workflow
```

当前合同层已具备 Manifest v1、FrameworkAssemblySpec v1 机器 Schema、Resolver / Gap / Verification 底座，Foundation Core 已实现首个 Entity Identity / Registry 切片。v1.4.1 补齐生产 v2 的不可变装配请求、前置与后置只读门禁合同；Engine Runtime 与其余能力实现仍未开始。

v1.4.1 合同切片补齐：

```text
Framework Manifest v1 Schema
FrameworkAssemblySpec v1 Explicit Engine Selection / Exact Version Semantics
Framework Integration Verification Receipt v1
Framework Change Proposal v1
```

这些 Schema 只建立合同，不晋级 Framework 顶层、Public API 或 Engine Adapter。`core.entity-identity-registry` 保持远端既有 `IMPLEMENTED` 证据；其余能力继续 `DESIGN_ONLY`。Runtime 实现、项目创建、CODE 调度与 Protected Core 修改均不属于本切片。
