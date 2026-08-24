# Entity Model（实体模型）

## 1. 三类对象必须分离

```text
Game Entity（游戏实体）
ECS Entity（ECS 实体）
Cocos Node（Cocos 节点）
```

三者不是一一等价关系。

## 2. Game Entity（游戏实体）

回答：

> 它在游戏世界里是谁？

拥有稳定 Entity ID（实体标识）。

可跨：

```text
Map
Scene
ECS Runtime
Save / Load
Session
```

存在。

典型：

```text
Player
NPC
Crop
Persistent Chest
Pet
Building
```

## 3. ECS Entity（ECS 实体）

回答：

> 它现在是否在高频运行？

特点：

```text
运行时句柄
可快速创建销毁
不承担长期身份
```

并非所有 Game Entity 都要有 ECS Entity。

## 4. Cocos Node（Cocos 节点）

回答：

> 它在 Cocos 中如何显示、动画、碰撞和挂载引擎组件？

Node 是 Engine / Presentation（引擎 / 表现）对象，不是业务真相。

## 5. 实体分类

### Persistent Entity（持久实体）

```text
Player
NPC
Pet
Crop
Building
Persistent Chest
```

进入存档。

### Runtime Entity（运行时实体）

```text
Monster Instance
Temporary Summon
Dropped Item
```

是否持久化由产品决定。

### Ephemeral Entity（瞬时实体）

```text
Projectile
Hit Area
Temporary Sensor
VFX Trigger
```

通常不进入存档。

## 6. Authority（权威来源）

同一种状态只能有一个权威。

例如：

```text
Entity Identity → Entity Registry
Inventory State → Inventory Feature
Quest State → Quest Feature
High-frequency Position → ECS Runtime
Persistent Static Position → World State
Visual Position → Node Projection
```

禁止双写。

## 7. Data Ownership（数据所有权）

每份状态必须有明确 Owner（拥有者）。

其他模块只能通过：

```text
Command
Query
Event
```

访问。

## 8. Entity Definition 与 Entity Instance

建议区分：

```text
Definition（定义）
Instance（实例）
```

Definition 表达模板：

```text
怪物类型
NPC 类型
作物类型
```

Instance 表达世界中的具体对象。

这样可避免配置与运行态混在一起。

## 9. Hibernate（休眠）

离开活跃地图的持久实体可以：

```text
保留 Game Entity State
移除 ECS Entity
销毁 Node
```

重新激活时恢复运行时表示。

这是 LifeSim（生活模拟）和大世界的重要边界。
