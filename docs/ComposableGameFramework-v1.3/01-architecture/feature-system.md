# Feature System（功能模块系统）

## 1. 目标

Feature（功能模块）是框架“可组合”的核心单位。

Feature 不是一个 Manager（管理器），也不是简单文件夹，而是一块边界明确、可装卸、可验证、可独立测试的游戏能力。

## 2. 标准结构

```text
Feature
├── Data（数据）
├── State（状态）
├── Rules（规则）
├── Commands（命令）
├── Queries（查询）
├── Events（事件）
├── Runtime（运行时）
├── Dependencies（依赖）
├── Capabilities（能力）
├── Save Boundary（存档边界）
└── Lifecycle（生命周期）
```

并非每个 Feature 都必须具备全部项，但必须遵循统一协议。

## 3. Feature 分类

### Shared Feature（共享功能）

跨品类高复用：

```text
Inventory
Interaction
World
Time
Progression
```

### Gameplay Feature（玩法功能）

```text
Combat
Farming
Fishing
Relationship
Dungeon
PvP
```

### Product Feature（产品功能）

只属于特定产品：

```text
某游戏独有赛季机制
某游戏独有塔防玩法
某游戏独有轮回系统
```

Product Feature 不应过早下沉。

## 4. Feature Dependency（功能依赖）

每个 Feature 声明：

```text
Requires（强依赖）
Optional（可选依赖）
Provides（提供能力）
Conflicts（冲突能力）
```

启动前构建 Feature Graph（功能依赖图），验证：

```text
缺失依赖
循环依赖
冲突
能力缺失
版本不兼容
初始化顺序
```

强依赖应尽可能少。

优先：

```text
Gameplay Feature
→ Shared Domain / Capability
```

避免：

```text
Feature A
→ Feature B
→ Feature C
→ Feature D
```

形成链式耦合。

## 5. Capability（能力）

Capability 表达：

> “我需要什么能力”，而不是“我必须依赖哪个模块”。

例如 Farming（种植）需要：

```text
ItemStorage Capability（物品存储能力）
WorldTime Capability（世界时间能力）
Interaction Capability（交互能力）
```

谁提供这些能力可以替换。

## 6. 生命周期

完整概念：

```text
Discovered（已发现）
Validated（已验证）
Registered（已注册）
Initialized（已初始化）
Activated（已激活）
Running（运行中）
Suspended（暂停）
Deactivated（停用）
Disposed（释放）
```

第一阶段工程实现可简化为：

```text
Register
Initialize
Activate
Deactivate
Dispose
```

### Register（注册）

声明协议，不产生运行时副作用。

### Initialize（初始化）

加载配置、准备依赖、恢复状态。

### Activate（激活）

订阅事件、启动 Runtime（运行时）、注册交互。

### Deactivate（停用）

停止运行时行为，但保留持久状态。

### Dispose（释放）

释放临时对象和资源。

## 7. Feature 间通信

优先：

```text
Command（命令）
Query（查询）
Event（事件）
```

禁止大面积直接调用其他 Feature 的内部 Manager。

## 8. 跨 Feature 事务

并非所有跨模块流程都用 Event（事件）。

例如购买：

```text
检查余额
检查背包容量
扣钱
加物品
发布购买完成
```

应该由 Application Layer（应用编排层）或 Transaction Coordinator（事务协调器）协调。

## 9. Feature Pack（功能包）

常用组合可以打包：

```text
ARPG Feature Pack
LifeSim Feature Pack
Social Feature Pack
```

Feature Pack 只是装配模板，不拥有运行时状态。

## 10. 下沉规则

只有满足以下条件，能力才可以从 Product → Feature → Shared Domain → Core 下沉：

```text
至少两个独立场景真实复用
语义稳定
生命周期稳定
状态所有权明确
无具体产品词汇
```

## 11. 禁止事项

禁止：

```text
Feature 直接写磁盘
Feature 直接依赖 Cocos Node
Feature 通过全局单例互调
Feature 隐式依赖事件监听顺序
Feature 私自修改其他 Feature 状态
```
