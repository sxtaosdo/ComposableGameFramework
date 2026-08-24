# Legend Reference（传奇参考装配）

## 1. 目标

验证框架对：

```text
大地图战斗
Boss
装备爆落
强化
PK
长期成长
```

的支撑。

## 2. Feature 组合

```text
Combat
Skill
Buff
Equipment
Loot
Enhancement
PvP
WorldBoss
Quest
Shop
Progression
```

## 3. Ruleset

```text
Legend Combat Rules
Legend Loot Rules
Legend Death Rules
Legend PvP Rules
Legend Economy Rules
Legend Progression Rules
```

## 4. 关键循环

```text
打怪
→ Boss
→ 爆装
→ 强化
→ PK / 抢资源
→ 更高强度地图
```

## 5. 架构验证点

```text
Combat 不污染 Core
PvP 可关闭
Enhancement 独立于 Equipment
Loot 规则可替换
地图 / Scene 解耦
```
