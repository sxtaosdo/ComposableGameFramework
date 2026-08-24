# Diablo Reference（暗黑参考装配）

## 1. 目标

验证框架对：

```text
Build
随机词缀
大量掉落
高密度怪群
Dungeon
Talent
复杂 Modifier
```

的支撑。

## 2. Feature 组合

```text
Combat
Skill
Buff
Equipment
Affix
Loot
Talent
Dungeon
Crafting
Progression
```

## 3. Ruleset

```text
Diablo Damage Rules
Diablo Loot Rules
Diablo Affix Rules
Diablo Difficulty Rules
Diablo Build Rules
```

## 4. 核心循环

```text
杀怪
→ Loot
→ Build 优化
→ 更高难度
→ Better Loot
```

## 5. 架构验证点

```text
Modifier 管线可扩展
Affix 不侵入 Item Core
Build 是组合结果
高频战斗可进入 ECS
掉落可确定性复现
```
