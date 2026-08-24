# Farming / Fishing / Crafting（种植 / 钓鱼 / 制作）

## 1. Farming（种植）

核心能力：

```text
Soil
Plant
Water
Growth
Harvest
Season Rule
Fertilizer（可选）
Quality（可选）
```

依赖：

```text
Time
Interaction
Item
World
```

可选：

```text
Weather
Skill
Economy
```

## 2. Crop Growth（作物生长）

优先事件式：

```text
DayStarted
↓
检查 Water / Season / Environment
↓
推进 Growth Stage
```

不推荐离屏作物持续高频 Tick。

## 3. Fishing（钓鱼）

框架只定义：

```text
Fishing Spot
Fish Table
Cast
Bite
Hook
Catch Resolution
Reward
```

具体钓鱼小游戏属于 Ruleset / Product Feature。

## 4. Mining（采矿）

可复用：

```text
Interaction
Tool
Resource Node
Loot
Progression
World State
```

## 5. Crafting（制作）

核心：

```text
Recipe
Requirement
Input
Output
Condition
Station（可选）
Craft Time（可选）
```

## 6. Ruleset 差异

可支持：

```text
即时制作
读条制作
队列制作
品质制作
失败概率
```

## 7. 跨 Feature 事务

Crafting 需要保证：

```text
材料扣除
产物增加
```

原子完成。
