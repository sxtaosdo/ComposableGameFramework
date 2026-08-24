# Item & Inventory（物品与背包）

## 1. Item（物品）

共享模型：

```text
Definition
Instance
Tags
Stack
Modifiers
Effects
Custom Data
Ownership
Quality（可选）
Durability（可选）
```

## 2. Definition 与 Instance

Item Definition（物品定义）是静态模板。

Item Instance（物品实例）只在需要随机词缀、耐久、绑定等实例状态时创建。

普通可堆叠材料无需为每个单位创建实例。

## 3. Inventory（背包）

使用 Stateful Domain Model（有状态领域模型）。

负责：

```text
Capacity
Stack
Slot
Move
Split
Merge
Transaction
Validation
Ownership
```

## 4. Storage Capability（存储能力）

Inventory 是一种 ItemStorage Capability（物品存储能力）的实现。

未来可以有：

```text
Warehouse
Guild Storage
Chest
Mail Attachment
```

## 5. 事务

所有多步背包操作必须原子化。

例如：

```text
移除材料
+
增加成品
```

不能出现只完成一半。

## 6. Weight / Slot / Grid

Inventory 模型不绑定一种容量规则。

Ruleset 可以选择：

```text
Slot-based
Weight-based
Grid-based
Unlimited
Hybrid
```

## 7. 掉落物

Dropped Item（地面掉落物）属于 Runtime Entity。

其最终物品状态仍由 Item / Loot 领域定义。
