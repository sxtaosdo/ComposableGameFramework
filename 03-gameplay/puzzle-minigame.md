# Puzzle / Minigame（益智 / 小游戏）Feature Pack 详细设计

## 1. 定位

小游戏不强行复用 RPG Feature（功能模块），而是复用：

```text
Foundation Core（基础核心）
Feature Runtime（功能运行时）
Ruleset Runtime（规则集运行时）
Save / Config / Debug / Testing
Input / Presentation
AI Game Studio 集成能力
```

并增加专门的：

```text
Puzzle / Minigame Feature Pack（益智 / 小游戏功能包）
```

## 2. 典型能力

```text
Session（局内会话）
Level（关卡）
Board（棋盘 / 牌面）
Piece / Tile（棋子 / 牌块）
Selection（选择）
Tray / Slot（槽位）
Rule Evaluation（规则判断）
Booster（道具）
Retry（重试）
Score / Progress（分数 / 进度）
Result（结算）
```

## 3. 《羊了个羊》式装配

```text
Foundation Core
+
Feature Runtime
+
Puzzle / Minigame Feature Pack
+
Tile-Match Ruleset（牌块匹配规则集）
+
Level Content（关卡内容）
+
Presentation Pack（表现包）
```

不需要：

```text
Combat
Equipment
Affix
Relationship
Farming
```

## 4. Feature 与 Ruleset 边界

Feature 提供：

```text
Board
Tile
Selection
Tray
Booster
Result
```

Ruleset 决定：

```text
遮挡规则
可点击规则
匹配数量
槽位容量
消除规则
洗牌规则
撤回规则
胜利条件
失败条件
```

## 5. 运行模型

默认采用：

```text
Stateful Domain Model（有状态领域模型）
+
Workflow / State Machine（工作流 / 状态机）
```

不强制 ECS。

只有出现大量高频实体、物理、弹幕等场景时才启用 ECS Runtime（ECS 运行时）。

### 关卡会话公共接口（`CasualLevelSession`）

关卡型 Puzzle / Minigame 产品可从子路径导入主玩法会话接口：

```ts
import type { CasualLevelSession } from "db://shidai3/minigame/index";
```

该接口覆盖一级流程：

```text
Loading → Home → Play → Retry / Next Level / Home
```

方法：`bootReady`、`startLevel`、`reset`、`retry`、`nextLevel`、`showHome`。

实现类由产品拥有（例如 Presenter / Session Context）；Framework 只提供接口合同，不持有玩法状态。

**适用：** 关卡型休闲 / Puzzle / Minigame（无持久世界、可按关重置）。

**不适用：** MMO、MUD、ARPG、开放世界、持久角色会话或跨 Feature 副本事务。那些继续使用 Application Layer / Feature Runtime，不得把本接口当成全局会话合同。

该接口**不**从 `db://shidai3/index` 导出，也**不**进入 `assets/runtime/`；全局 Runtime 仍只有 `IState` / `StateMachine` 等通用机制。对使用该会话的关卡型小游戏，页面身份以 `StateMachine.current` 为唯一权威；不得维护 `screen`、`playState` 或 `catalogReady` 等平行镜像，资源就绪以实际已加载且校验通过的对象为准。

## 6. 关卡数据

建议数据化：

```text
Board Layout
Tile Type Distribution
Layer / Overlap
Spawn Order
Booster Config
Difficulty Metadata
Seed
```

## 7. 自动化与 AI 验证

优先支持：

```text
Schema Validation
Reference Validation
可解性验证
失败路径模拟
难度估算
随机种子回放
Booster 影响模拟
```

小游戏是 AI Game Studio（AI 游戏工作室）低风险、高收益的优先接入场景。

## 8. 架构验收

小游戏接入不得要求修改 Foundation Core。

若必须修改 Core，需单独做 Framework Gap Analysis（框架缺口分析）和架构审查。
