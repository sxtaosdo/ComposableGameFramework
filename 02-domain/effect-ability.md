# Effect & Ability（效果与能力）

## 1. Effect（效果）

Effect 表达：

> 某个动作最终造成什么状态变化。

基础类型包括：

```text
Damage
Heal
ModifyAttribute
AddModifier
RemoveModifier
AddState
RemoveState
SpawnEntity
DespawnEntity
Teleport
Knockback
GrantItem
ConsumeItem
ModifyResource
TriggerAbility
EmitEvent
Interact
```

## 2. Ability（能力）

Ability 不局限于战斗技能。

统一结构：

```text
Trigger
Condition
Targeting
Cost
Cast
Effect[]
Cooldown
Tags
```

可用于：

```text
火球术
采矿
浇水
传送
采集
交互
宠物能力
```

## 3. Effect Graph（效果图）

复杂能力可以组合为 Effect Graph。

但禁止发展成万能脚本语言。

只有稳定且高复用的 Effect 才进入共享层。

## 4. Condition（条件）

条件必须：

```text
只读
无副作用
可组合
可追踪失败原因
```

例如：

```text
HasTag
AttributeCompare
HasItem
WorldFlag
TimeRange
RelationshipLevel
```

## 5. Trigger（触发器）

例如：

```text
Active
OnHit
OnKill
OnInteract
OnDayStart
OnHarvest
OnDamageTaken
```

Trigger 只负责触发，不应偷偷修改状态。

## 6. Targeting（目标选择）

与 Engine Physics（引擎物理）解耦。

表达：

```text
Self
Single Target
Area
Cone
Line
World Position
Filtered Set
```

具体空间查询由 Adapter / Runtime 完成。

## 7. 失败模型

Ability 执行失败必须返回结构化原因：

```text
Cooldown
InvalidTarget
InsufficientResource
OutOfRange
ConditionFailed
```

## 8. 可追踪性

重要 Ability 要能追踪：

```text
Trigger
Condition
Target
Cost
Effects
Result
Events
```
