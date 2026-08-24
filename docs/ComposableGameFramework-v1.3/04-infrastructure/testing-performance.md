# Testing & Performance（测试与性能）

## 1. 测试分层

```text
Core Unit Test（核心单元测试）
Domain Rule Test（领域规则测试）
Feature Test（功能模块测试）
Ruleset Test（规则集测试）
Integration Test（集成测试）
Presentation Smoke Test（表现冒烟测试）
```

## 2. Headless Test（无渲染测试）

以下优先不依赖 Cocos Scene：

```text
Attribute
Modifier
Effect
Combat Formula
Loot
Inventory
Quest
Relationship
Farming Growth
Save Migration
```

## 3. Deterministic Simulation（确定性模拟）

固定随机种子测试：

```text
战斗
掉落
随机词缀
鱼类生成
作物品质
```

## 4. Feature Contract Test（功能协议测试）

每个 Feature 至少验证：

```text
依赖
生命周期
Command
Query
Event
Save Boundary
Deactivate / Reactivate
```

## 5. Performance（性能）

优先优化热点：

```text
Movement
Projectile
Combat Runtime
Buff Tick
AI Sensor
Spatial Query
Crowd
```

低频领域优先正确性与可读性。

## 6. Budget（预算）

后续工程阶段为：

```text
ECS Update
Rendering
UI
Physics
Memory
Asset Load
Save
```

定义目标预算。

当前设计阶段不写死具体毫秒值。

## 7. Object Pool（对象池）

适用于：

```text
Projectile
VFX
Damage Number
Monster View
Dropped Item View
```

对象池不能改变 Domain 生命周期语义。

## 8. Regression（回归）

每个参考 Product 都要有最小纵向切片作为架构回归样本。
