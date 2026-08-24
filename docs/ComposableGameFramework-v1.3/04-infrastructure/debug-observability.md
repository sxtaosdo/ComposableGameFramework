# Debug & Observability（调试与可观测性）

## 1. 目标

框架必须能回答：

```text
为什么伤害是这个数？
为什么技能不能释放？
为什么作物没成长？
为什么 NPC 没按日程移动？
为什么任务没推进？
为什么存档恢复后状态不同？
```

## 2. 可观测对象

```text
Entity State
Feature State
Ruleset
Modifier Stack
Event History
Command Result
World State
Save Snapshot
ECS Components
Binding Relation
```

## 3. Trace（追踪）

关键链路：

```text
Command
→ Rule
→ Effect
→ State Change
→ Event
```

需要可追踪。

## 4. Modifier Inspector（修改器检查）

能够展开某属性最终值来源：

```text
Base
Equipment
Buff
Talent
Environment
Ruleset
```

## 5. Entity Inspector（实体检查）

查看：

```text
Game Entity ID
Definition
Persistent State
ECS Entity
Node Binding
Tags
Capabilities
```

## 6. World Inspector（世界检查）

查看：

```text
Clock
Calendar
World Flags
Map State
Region State
Inactive Entity State
```

## 7. Event History（事件历史）

保留开发期 Ring Buffer（环形缓冲）即可，不要求无限保存。

## 8. Production（生产环境）

生产版可降低详细追踪，但保留关键错误码和最小诊断信息。
