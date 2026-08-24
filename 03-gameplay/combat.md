# Combat（战斗）

## 1. 定位

Combat 是 Feature（功能模块），不是 Core。

提供：

```text
Attack Request
Target Validation
Hit Resolution
Damage Context
Damage Result
Combat State
Death
Threat
Combat Event
```

## 2. Damage Pipeline（伤害流水线）

框架定义流程接口，Ruleset 决定具体公式。

传奇可采用：

```text
命中
→ 攻防
→ 暴击
→ 特殊伤害
→ 最终伤害
```

暗黑可采用：

```text
Weapon Damage
→ Skill Multiplier
→ Additive Bucket
→ Multiplicative Bucket
→ Crit
→ Vulnerable
→ Resistance
→ Damage Reduction
```

## 3. Combat Runtime

高频部分进入 ECS：

```text
Target
Cooldown
Hit Window
Buff Runtime
Projectile
Threat
Combat State
```

## 4. Death Rule（死亡规则）

Death 是 Combat 提供的机制，具体处理由 Ruleset：

```text
掉经验
掉装备
原地复活
回城
硬核永久死亡
```

## 5. PvP

PvP 不应直接写进基础 Combat。

作为独立 Feature / Ruleset 增加：

```text
阵营判断
PK 开关
红名
伤害修正
安全区
```

## 6. Combat Event

重要事件：

```text
AttackStarted
HitResolved
DamageApplied
EntityKilled
CombatEntered
CombatExited
```

## 7. Determinism

战斗随机全部通过可注入 Random Source。

## 8. 验收

Combat 应可在 Headless（无渲染）环境中执行确定性战斗模拟。
