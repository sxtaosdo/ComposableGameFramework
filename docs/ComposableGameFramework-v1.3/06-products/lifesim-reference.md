# LifeSim Reference（生活模拟参考装配）

## 1. 目标

验证框架能支持类似《星露谷物语》的：

```text
时间
季节
种植
采矿
钓鱼
制作
社交
NPC 日程
持久世界
```

## 2. Feature 组合

```text
Time
Calendar
World
Inventory
Interaction
Farming
Fishing
Mining
Crafting
Cooking
Relationship
Dialogue
Schedule
Quest
Shop
Home
Weather
Progression
```

## 3. Ruleset

```text
LifeSim Time Rules
Crop Rules
Relationship Rules
Economy Rules
Festival Rules
Fishing Rules
```

## 4. 核心循环

```text
规划一天
→ 种植 / 采集 / 钓鱼 / 采矿
→ 社交
→ 制作 / 经营
→ 成长
→ 世界变化
```

## 5. 架构验证点

```text
非活跃 NPC 不依赖 ECS
作物无需高频 Tick
World 高于 Scene
关系系统独立
日切使用 Workflow
```
