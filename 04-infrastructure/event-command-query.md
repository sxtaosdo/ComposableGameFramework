# Command / Query / Event（命令 / 查询 / 事件）

## 1. Command（命令）

表示：

> 请求做某件事。

命令不代表成功。

必须有：

```text
明确输入
执行目标
结构化结果
结构化失败原因
```

## 2. Query（查询）

表示：

> 读取当前状态。

要求：

```text
只读
无副作用
确定性
返回明确结构
```

## 3. Event（事件）

表示：

> 某件事情已经发生。

Event 是事实，不是请求。

## 4. 标准链路

```text
Intent
↓
Command
↓
Validation / Rule
↓
Effect
↓
State Change
↓
Event
```

## 5. Event Bus（事件总线）

允许解耦，但禁止滥用。

不能依赖：

```text
监听顺序
隐式事务
Event 触发 Event 的无限链
```

## 6. Error Model（错误模型）

失败原因结构化，例如：

```text
InvalidTarget
Cooldown
InventoryFull
NotEnoughResource
NotInSeason
LockedByWorldState
AlreadyGiftedToday
```

UI / AI / Test 共用。

## 7. Idempotency（幂等）

对高风险或未来联网相关 Command，建议允许携带 Operation ID（操作标识）支持幂等。

第一阶段可只对关键事务使用。

## 8. Trace（追踪）

重要 Command 记录：

```text
Input
Rule Result
Effects
State Change
Events
Error
```

便于问题定位。
