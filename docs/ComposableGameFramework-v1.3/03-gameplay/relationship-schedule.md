# Relationship & Schedule（关系与日程）

## 1. Relationship（关系）

统一模型可用于：

```text
NPC 好感
恋爱
婚姻
Faction Reputation（阵营声望）
Guild Relation（公会关系）
Village Reputation（村庄声望）
```

## 2. 核心状态

```text
Source
Target
Value
Level
Tags
History
Daily Constraint
Weekly Constraint
```

## 3. Gift（送礼）

送礼属于跨 Feature 用例：

```text
Inventory
Relationship
Dialogue
Time
Achievement
```

由 Application Layer 协调。

## 4. Schedule（日程）

定义：

```text
Time Range
Location
Activity
Condition
Priority
Fallback
```

Schedule 只产生目标状态，不直接操作 Node。

## 5. Weather / Festival

Schedule 可以根据：

```text
天气
节日
剧情
关系
区域状态
```

选择不同日程。

## 6. Runtime 执行

当前地图 NPC：

```text
Schedule Target
↓
AI / Navigation
↓
ECS Runtime
↓
Cocos Node
```

非当前地图 NPC：

```text
只推进逻辑日程状态
```

## 7. 关系事件

关系变化发布：

```text
RelationshipChanged
RelationshipLevelChanged
GiftGiven
SpecialEventUnlocked
```
