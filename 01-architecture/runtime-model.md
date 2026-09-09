# Runtime Model（运行模型）

## 1. 总体原则

框架内部采用三类互补的组织模型：

```text
ECS Runtime（ECS 运行时）
Stateful Domain Model（有状态领域模型）
Workflow / State Machine（工作流 / 状态机）
```

它们不是竞争关系。

## 2. ECS Runtime（ECS 运行时）

适合：

```text
Movement（移动）
Projectile（投射物）
Combat Runtime（战斗运行时）
Buff Tick（状态周期更新）
AI Sensor（AI 感知）
大量短生命周期实体
空间查询
```

特点：

```text
高频
大量对象
同构数据
批处理友好
```

框架采用 Hybrid ECS（混合 ECS），不采用 Full ECS（全 ECS）。

## 3. Stateful Domain Model（有状态领域模型）

适合：

```text
Inventory（背包）
Quest（任务）
Relationship（关系）
Crafting（制作）
Economy（经济）
Progression（成长）
```

特点：

```text
状态长期存在
业务规则复杂
更新频率低
需要事务与高可读性
```

## 4. Workflow / State Machine（工作流 / 状态机）

适合：

```text
Boss 阶段
副本流程
每日结算
节日活动
剧情事件
新手引导
```

用于表达：

> 一件事按什么阶段推进。

### 通用状态机 Runtime

包根公开 `IState<T>` 和 `StateMachine<T>`。状态类由 `changeState(StateClass, enterParams)` 创建；状态机在离开当前状态后清除其 Context，再将同一 Context 注入新实例并等待其进入完成。

`addGlobalState`、`removeGlobalState`、`update` 与 `releaseAllStates` 管理跨状态生命周期。该 Runtime 没有状态栈和 `rollback`：需要历史导航的产品应以自身的只读模型和导航规则表达，不能把产品流程回写为 Framework 机制。

`T` 是产品拥有的 Context。Framework 不读取或修改 Gameplay 状态；Cocos 页面状态可通过产品 Presenter 的公开投影属性控制视图，但 Cocos `Node`、Prefab、UI 和业务规则不进入该 Runtime。

## 5. 同一对象可同时使用三种模型

例如生活模拟 NPC：

```text
Game Entity（持久身份）
+
Relationship Domain（关系领域）
+
Schedule Workflow（日程工作流）
+
ECS Runtime（当前地图移动）
+
Cocos Node（当前表现）
```

这不是重复，而是不同职责。

## 6. Application Layer（应用编排层）

用于跨 Feature 用例：

```text
购买
交易
副本结算
婚礼流程
每日结束
跨模块奖励
```

职责：

```text
调用多个 Feature 的 Command / Query
协调事务
控制执行顺序
转换错误
```

不承担核心业务公式。

## 7. Tick（周期更新）治理

不是所有系统都允许 Tick。

只允许真正需要高频更新的 Runtime 使用 Tick。

低频业务优先：

```text
事件驱动
命令驱动
时间事件驱动
状态机驱动
```

## 8. Determinism（确定性）

战斗、掉落、生成等关键逻辑应支持注入 Random Source（随机源）。

用途：

```text
固定种子
问题复现
自动测试
模拟
AI 验证
```

禁止随机调用散落在业务代码中。
