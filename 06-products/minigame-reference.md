# Minigame Reference（小游戏参考装配）

## 1. 验证目标

验证框架是否真正超越 RPG 专用框架，能够服务关卡型 Puzzle / Minigame（益智 / 小游戏）。

## 2. Feature 组合

```text
Session
Level
Board
Tile
Selection
Tray
Booster
Progress
Result
```

## 3. Ruleset

```text
Tile-Match Ruleset
```

## 4. 核心循环

```text
加载关卡
→ 展示叠层牌块
→ 选择可点击牌块
→ 进入槽位
→ 满足匹配则消除
→ 牌块清空则胜利
→ 槽位占满且无法匹配则失败
```

## 5. 架构验证点

```text
不依赖 Combat / Equipment 等 RPG Feature
不修改 Foundation Core
Ruleset 可替换
关卡完全数据化
Headless Simulation（无渲染模拟）可跑完整局
Save / Retry / Restore 可恢复
```

装配关卡会话时从子路径导入，不从包根导入：

```ts
import type { CasualLevelSession } from "@shidai3/composable-game-framework/minigame";
```

`CasualLevelSession` 是关卡型小游戏的主玩法会话合同，不适用于 MMO / MUD / ARPG。页面状态机仍从包根导入 `IState` / `StateMachine`。

## 6. AI Game Studio 价值

优先自动化：

```text
关卡生成
可解性验证
难度估算
失败率模拟
Booster 配置
Theme（主题）替换
```
