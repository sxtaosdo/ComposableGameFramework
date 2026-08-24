# Loot / Equipment / Affix（掉落 / 装备 / 词缀）

## 1. Loot（掉落）

Loot 提供：

```text
Loot Table
Drop Context
Selection
Quantity
Quality
Drop Result
Ground Spawn Request
```

## 2. Ruleset 差异

传奇：

```text
Boss 地面爆装
公共争夺
稀有装备广播
```

暗黑：

```text
大量个体掉落
品质
随机词缀
Item Power
```

生活模拟：

```text
资源节点
季节
天气
地图
技能等级
```

## 3. Equipment（装备）

Equipment 是 Feature。

装备槽完全数据化。

装备效果通过：

```text
Modifier
Effect
Tag
Ability Grant
```

实现。

## 4. Affix（词缀）

暗黑类可启用：

```text
Prefix
Suffix
Rarity
Roll Range
Unique Effect
Set Effect
Socket
```

## 5. Item Generation（物品生成）

生成流程应可确定性复现：

```text
Base Item
Rarity
Affix Pool
Roll
Validation
Result
```

全部使用统一 Random Source。

## 6. Build（构筑）

Build 不单独做成 Core。

它是：

```text
Equipment
Skill
Talent
Modifier
Ruleset
```

共同作用的结果。

## 7. 强化

Enhancement（强化）是独立 Feature，可服务：

```text
传奇强化
装备升星
宝石
锻造
```

不要硬塞进 Equipment Core。
