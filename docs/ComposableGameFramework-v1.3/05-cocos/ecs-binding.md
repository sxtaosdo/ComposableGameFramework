# ECS Binding（ECS 绑定）

## 1. Binding Layer（绑定层）

连接：

```text
Game Entity
ECS Entity
Cocos Node
```

负责：

```text
创建
回收
映射
位置同步
动画参数同步
表现事件
对象池
```

不拥有业务规则。

## 2. 绑定关系

并非一一对应。

可能：

```text
Game Entity + ECS Entity + Node
Game Entity + 无 ECS + 无 Node
ECS Entity + Node + 无持久 Game Entity
Node-only UI
```

## 3. Position Authority（位置权威）

### 高频移动实体

```text
ECS Transform → Authority
Node Transform → Projection
```

### 持久静态实体

```text
World State / Game Entity → Authority
Node → Projection
```

### UI

```text
Node → Authority
```

## 4. 同步方向

默认：

```text
Runtime
↓
Binding
↓
Node
```

引擎回调反向进入时必须先转换为：

```text
Intent / Command
```

## 5. View Lifecycle（表现生命周期）

Domain Entity 的生死与 View 生命周期分离。

例如怪物死亡：

```text
Domain 判定死亡
↓
发布事件
↓
移除 ECS 战斗状态
↓
播放死亡动画
↓
延迟回收 Node
```

不能由 Node destroy 决定业务死亡。
