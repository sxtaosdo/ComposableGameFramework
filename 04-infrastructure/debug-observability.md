# Debug & Observability（调试与可观测性）

状态: Accepted（遥测合同；实现与验证状态以 Manifest 和实施证据为准）

## 独立遥测子能力

`infrastructure.telemetry` 的唯一框架源码为 `assets/observability/`，公开消费路径为 `db://shidai3/observability/index`。它复用 P1060 与 ant-cook 已有的三文件实现及16项独立离线边界测试，仅增加共享入口、抖音合同和 ES2015／严格索引兼容处理；不扩展 UI、资源、事件、对象池或游戏 Runtime。

- `TelemetryClient` 默认关闭，必须显式 `enabled: true` 和有效构建上下文才记录。客户端只在调用时处理内存队列，不注册计时器、全局异常监听、平台探测、存储或网络；事实由 Gameplay 所属事务提供稳定 `factId`，奖励持久化后才能报告 `ad_reward_committed`，重试沿用原事实身份。
- 上下文保留已有两个真实复用场景：`p1060/endless` 与 `ant-cook/ant|cook|shell`；`platform` 为 `web|wechat|douyin|native`，由宿主明确传入，不自动猜测。Google／Apple 原生端继续对应 `native` 适配边界，不把认证 provider 与遥测平台标签混为同一身份。
- 公开 `LocalRecordingAdapter`、`WechatTelemetryAdapter`、`DouyinTelemetryAdapter` 与 `NativeFirebaseTelemetryAdapter`。本地适配器只返回 `recorded_locally`；三个平台适配器均为未配置合同桩，`configured/externalDelivery/rawErrorCapture/nativeCrashCapture` 为 false，`accept()` 返回 `not_configured`。抖音桩不访问 `tt`；所有桩均无 SDK、凭据、远端 ACK 或崩溃捕获实现。
- 只复制白名单标量，拒绝已知字段的 getter、错误产品／玩法组合、未知平台、非法构建身份、未持久化奖励与不一致的货币事实。原始异常的 message／stack／cause、账号或平台凭证、URL 和存档正文不进入记录；不读取未知字段。
- 内存队列最多200条／512 KiB，每批20条，事实去重账本最多2000条，TTL 为24小时；退避最多5分钟且不自动重试。面包屑最多30条，错误每会话最多5条、同指纹间隔至少60秒。适配器异常及重入不改变 Gameplay 或保存结果，内存状态不写入 Save Protocol。

定向验收使用 Node.js 22 显式执行 `node --test tests/observability/telemetry.node-test.cjs`，并完成现有 strict 类型检查和构建。测试使用 `.node-test.cjs` 避免被 Vitest 默认用例发现器重复接管。构建和离线测试不代表 Creator 导入／Meta、产品 Runtime、平台 SDK 或远端接收已验证。

产品消费依赖单列：本片不修改 P1060 pin `3a4c6b9c44bdaba55c06588191f10c99e351d8e6` 或 ant-cook pin `2384980aab0c2bb60559b22cbef88d2c1391d784`；两产品仍使用自己的旧副本。后续在批准的升级窗口消费已核验的框架提交、删除产品副本并验证真实接线，届时才能声明两仓单源共享。微信／抖音／Google／Apple 四端方向已由 Owner 确定，云档非首发必须，免费后端方案保持 Deferred；这些不阻塞本地遥测子能力。

## 保留设计范围（DESIGN_ONLY）

以下 Trace、Modifier／Entity／World Inspector 与广泛 Event History 仍属于 `infrastructure.observability` 设计范围。独立遥测实现不使这些能力或整体可观测性自动晋级。

## 1. 目标

框架必须能回答：

```text
为什么伤害是这个数？
为什么技能不能释放？
为什么作物没成长？
为什么 NPC 没按日程移动？
为什么任务没推进？
为什么存档恢复后状态不同？
```

## 2. 可观测对象

```text
Entity State
Feature State
Ruleset
Modifier Stack
Event History
Command Result
World State
Save Snapshot
ECS Components
Binding Relation
```

## 3. Trace（追踪）

关键链路：

```text
Command
→ Rule
→ Effect
→ State Change
→ Event
```

需要可追踪。

## 4. Modifier Inspector（修改器检查）

能够展开某属性最终值来源：

```text
Base
Equipment
Buff
Talent
Environment
Ruleset
```

## 5. Entity Inspector（实体检查）

查看：

```text
Game Entity ID
Definition
Persistent State
ECS Entity
Node Binding
Tags
Capabilities
```

## 6. World Inspector（世界检查）

查看：

```text
Clock
Calendar
World Flags
Map State
Region State
Inactive Entity State
```

## 7. Event History（事件历史）

保留开发期 Ring Buffer（环形缓冲）即可，不要求无限保存。

## 8. Production（生产环境）

生产版可降低详细追踪，但保留关键错误码和最小诊断信息。
