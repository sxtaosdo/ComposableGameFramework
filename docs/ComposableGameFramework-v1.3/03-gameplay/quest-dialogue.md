# Quest & Dialogue（任务与对话）

## 1. Quest（任务）

Quest 使用 Stateful Domain Model（有状态领域模型）。

基本组成：

```text
Definition
Objective
Condition
Progress
State
Reward
Event Subscription
```

## 2. Objective（目标）

尽量通过 Event 更新：

```text
Kill
Collect
Harvest
Talk
Explore
Craft
Deliver
```

例如 Combat 发布 EntityKilled，Quest 自己更新进度。

## 3. Quest State（任务状态）

```text
Locked
Available
Active
Completed
Failed
TurnedIn
```

具体产品可扩展。

## 4. Dialogue（对话）

使用数据图 / 状态机：

```text
Node
Text
Choice
Condition
Effect
Next
```

## 5. 条件

可读取：

```text
World Flag
Quest State
Relationship
Time
Item
Progression
```

## 6. 对话副作用

不得直接修改其他 Feature 内部状态。

通过：

```text
Command
Effect
Application Service
```

执行。

## 7. Story Event（剧情事件）

复杂剧情流程使用 Workflow / State Machine，而不是把所有逻辑塞进 Dialogue Graph。
