# Attribute & Modifier（属性与修改器）

## 1. Attribute（属性）

属性必须完全数据化，不允许在 Core 中写死：

```text
Attack
Defense
Crit
Energy
FishingSkill
Luck
```

不同产品自行定义属性集合。

## 2. 属性类型

建议区分：

```text
Base Value（基础值）
Current Value（当前值）
Derived Value（派生值）
Resource Value（资源值）
```

例如：

```text
Strength → 基础属性
MaxHP → 派生属性
HP → 当前资源
```

## 3. Modifier（修改器）

统一表达：

```text
装备
Buff
Debuff
食物
套装
天赋
环境
季节
关系奖励
```

建议支持：

```text
Add
Multiply
Override
Clamp
Conditional
Stack
Derived
```

## 4. 计算管线

原则：

```text
Definition Base
↓
Permanent Progression
↓
Equipment / Passive
↓
Temporary Modifier
↓
Conditional Modifier
↓
Clamp / Validation
↓
Final Value
```

具体桶与顺序由 Ruleset 定义。

## 5. Source Tracking（来源追踪）

每个 Modifier 应可追踪来源：

```text
装备 ID
技能 ID
Buff ID
环境
规则集
```

用于调试和卸载。

## 6. Stack Policy（叠加策略）

支持：

```text
Additive Stack
Refresh Duration
Replace Stronger
Unique Source
Max Stack
```

## 7. 性能

高频属性可缓存最终值，通过 Dirty Flag（脏标记）重算。

不要每帧全量重算所有属性。

## 8. 调试

必须能回答：

> 为什么当前 Attack = 1350？

并展开来源链。
