# AI（人工智能）

## 1. 分层

```text
Sensor（感知）
Memory（记忆）
Decision（决策）
Action（行为）
Navigation（导航）
```

## 2. Sensor

高频感知适合 ECS Runtime。

例如：

```text
敌人距离
视野
威胁
声音
受击来源
```

## 3. Decision

允许多种决策模型：

```text
State Machine（状态机）
Behavior Tree（行为树）
Utility AI（效用 AI）
规则式 AI
```

第一版不绑定单一模式。

## 4. Action

AI Action 最终应该转化为和玩家相同的：

```text
Intent
Command
Interaction
Ability
```

避免 AI 绕过游戏规则。

## 5. NPC AI

生活模拟 NPC 的：

```text
Schedule
Relationship
Dialogue
```

不应塞进战斗 AI。

Schedule 产生目标，AI Runtime 负责执行移动与局部行为。

## 6. Boss AI

复杂 Boss 使用状态机 / 行为树表达阶段和技能决策。

Boss 阶段本身可由 Workflow 管理。

## 7. 离线 NPC

不在活跃地图的 NPC 不执行完整 AI Tick。

只保留：

```text
Schedule State
World State
Relationship State
```
