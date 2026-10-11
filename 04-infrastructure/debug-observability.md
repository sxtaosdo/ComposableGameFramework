# Debug & Observability（调试与可观测性）

状态: Accepted（遥测合同；实现与验证状态以 Manifest 和实施证据为准）

## 独立遥测子能力

`infrastructure.telemetry` 的唯一框架源码为 `assets/observability/`，公开消费路径为 `db://shidai3/observability/index`。它复用 P1060 与 ant-cook 已有的三文件实现及16项独立离线边界测试，仅增加共享入口、抖音合同和 ES2015／严格索引兼容处理；不扩展 UI、资源、事件、对象池或游戏 Runtime。

- `TelemetryClient` 默认关闭，必须显式 `enabled: true` 和有效构建上下文才记录。客户端只在调用时处理内存队列，不注册计时器、全局异常监听、平台探测、存储或网络；事实由 Gameplay 所属事务提供稳定 `factId`，奖励持久化后才能报告 `ad_reward_committed`，重试沿用原事实身份。
- 上下文保留已有两个真实复用场景：`p1060/endless` 与 `ant-cook/ant|cook|shell`；`platform` 为 `web|wechat|douyin|native`，由宿主明确传入，不自动猜测。Google／Apple 原生端继续对应 `native` 适配边界，不把认证 provider 与遥测平台标签混为同一身份。
- 公开 `LocalRecordingAdapter`、`WechatTelemetryAdapter`、`DouyinTelemetryAdapter` 与 `NativeFirebaseTelemetryAdapter`。本地适配器只返回 `recorded_locally`；微信和原生 Firebase 候选 v2.3.0 新增显式 SDK 调用，成功返回 `submitted_to_sdk`，它只表示本地提交。默认或缺配置仍为 `not_configured`；rawErrorCapture/nativeCrashCapture 保持 false。抖音仍是无 tt 调用的合同桩。所有路径均无远端 ACK 或原始崩溃捕获实现。
- 只复制白名单标量，拒绝已知字段的 getter、错误产品／玩法组合、未知平台、非法构建身份、未持久化奖励与不一致的货币事实。原始异常的 message／stack／cause、账号或平台凭证、URL 和存档正文不进入记录；不读取未知字段。
- 内存队列最多200条／512 KiB，每批20条，事实去重账本最多2000条，TTL 为24小时；退避最多5分钟且不自动重试。面包屑最多30条，错误每会话最多5条、同指纹间隔至少60秒。适配器异常及重入不改变 Gameplay 或保存结果，内存状态不写入 Save Protocol。

定向验收使用 Node.js 22 显式执行 `node --test tests/observability/telemetry.node-test.cjs`，并完成现有 strict 类型检查和构建。测试使用 `.node-test.cjs` 避免被 Vitest 默认用例发现器重复接管。构建和离线测试不代表 Creator 导入／Meta、产品 Runtime、平台 SDK 或远端接收已验证。

产品已单源消费检查点 v2.2.0：P1060 `4f5955988f35f3aa36ce9e72365fcdb4a8d7fa52` 和 ant-cook `287fe6b101a6e37cb2a335da2d415c17cd941b68` 均 pin `895f28728ef2624e56faa3520d11b02310b20f18`，原三文件为纯公开入口 re-export，实际启动使用共享类。本轮候选 v2.3.0 不改产品 pin／启动入口；新平台 SDK 尚未接线进游戏。云存档与未选后端继续 Deferred。

## 微信／Firebase 调用层与启用门（2026-10-11）

Owner 本轮要求尝试真实平台 SDK 并同步文档。本切片实现实际官方 API 调用源码，以合成数据验证，不创建账号、云资源、密钥、应用配置，不读取秘密或发送玩家数据。

| 能力 | 本片实现与开关 | 实际验证／未验证 |
|---|---|---|
| 微信事件 | `WechatTelemetryAdapter({ enabled: true, api, configuredEvents })` 调 `wx.reportEvent`；需要显式列出后台已配置事件 | SDK callback／提交替身与脱敏边界已测；真实 wx／后台接收未执行 |
| 微信异常 | `WechatErrorListener.start(true)/stop()` 自持 onError/offError handler，只记录固定 js_uncaught，忽略原始字符串 | 生命周期合成测试；不 auto-flush，真实宿主未执行 |
| Android Analytics | Java `Shidai3FirebaseAnalytics` → 官方 getInstance/logEvent；固定 reflection 类和 boolean 回值；显式 configure 默认关 | TS reflection 合同已测；缺 JDK/android.jar，官方 Android AAR 公共方法签名已静态核实；真实 SDK 编译与设备运行未执行 |
| iOS Analytics | ObjC++ `Shidai3FirebaseAnalytics` → FIRAnalytics；固定 selector，显式 configure 默认关 | TS reflection 合同已测；macOS/Xcode 构建、设备、Apple 发布路径未执行 |
| Crashlytics | 默认不包含 SDK、不初始化，不以 collection=false 冒充无采集 | 原始捕获、nonfatal/native crash、符号上传、后台收件均未执行 |
| Firebase Auth | 保留独立可信交换边界，不把 Firebase UID 当游戏账号 | 原生 SDK 与后端认证链未实现／未实测，见 [认证合同](auth-session.md) |

调用映射重验 TelemetrySchema：只接受已定义 event/error 与产品／玩法／平台上下文、事实身份、时间和字段；拒绝伪 eventId、getter、未知事件和 breadcrumb 发送。参数为最多25个白名单标量，boolean 映射为0/1，普通字符串限制在100字以内。长 JSON `eventId` 只在本地使用，平台 payload 传 `environment/product/gameplay/sessionId/kind/name(事件名)/factId` 等已允许字段，报告端可按相同元组重建身份，不能用账户身份替换。

Adapter 逐条调用并维护最多2000项／24小时的已提交账本。批次中途失败返回 retry，后续显式 flush 跳过已提交前缀；SDK 已接收后再抛错属于未知结果，不能保证 exactly-once。完整批次本地 SDK 接受后客户端移除队列；这既不是存档提交条件，也不代表运营报告已有数据。

```ts
import { TelemetryClient, WechatTelemetryAdapter } from 'db://shidai3/observability/index';
const adapter = new WechatTelemetryAdapter({ enabled: true, api: hostWechatApi,
    configuredEvents: ['session_started', 'session_ready'] }); // 仅声明已在后台配置的事件
const client = new TelemetryClient({ enabled: true, context, adapter });
// Gameplay 提供合成／事务 factId；由宿主决定是否显式 flush，不自动后台发送。
```

微信 reportEvent 基础库要求2.14.4，void 不提供接收回执，eventId 是 mp 实验系统设置的事件英文名。官方网页本轮抓取失败，细节由 [腾讯官方类型库](https://github.com/wechat-miniprogram/minigame-api-typings/blob/master/types/wx/lib.wx.api.d.ts) 核验。

原生单源位于 `assets/adapters/cocos/firebase/`，TypeScript reflection 包装从现有公开遥测入口导出。产品未来在 sys.isNative／sys.os 核验后注入 `native.reflection`；不覆盖 `native.bridge.onNative`。Android 固定签名为 `isConfigured()Z`／`submit(String,String)Z`，Apple 固定 selector 为 isConfigured／submit:parameters:。Cocos iOS reflection 源码只作 DEVELOPMENT 候选，生产桥选择及 Apple 审查需另验；不能由旧 Cocos VERIFIED 推出此桥已验证。[Cocos Android 官方桥](https://docs.cocos.com/creator/3.8/manual/en/advanced-topics/java-reflection.html)、[Apple 官方桥](https://docs.cocos.com/creator/3.8/manual/en/advanced-topics/oc-reflection.html)。

依赖选择为直接原生路径，Android `dependencies.gradle` 钉 BoM35.0.0／Analytics24.0.0，最低API24；Apple未来用 SPM13.0.0（ZIP则13.0.1）、iOS15／Xcode26.2。官方 Maven 的 BoM／Analytics POM、Analytics AAR及其 measurement-api24.0.0／firebase-common23.0.0 AAR 已只下载到 Temp。实际 class-file 核实 getInstance、logEvent、setAnalyticsCollectionEnabled、FirebaseApp.getInstance/getApplicationContext 五个公共签名；回执记录URL和SHA256。这不是 javac／原生构建，完整SDK依赖尚未解析、链接或安装进游戏；不混用 C++13.13.0 自带的 BoM34.19.0／Apple12.19.0。官方 2026-10-07 [Android发布记录](https://firebase.google.com/support/release-notes/android)、[Apple发布记录](https://firebase.google.com/support/release-notes/ios) 与 [C++发布记录](https://firebase.google.com/support/release-notes/cpp-relnotes)。

`AndroidManifest.defaults.xml`／`Info.defaults.plist` 是未来集成片段，本片未装入产品。Android移除 FirebaseInitProvider，Analytics collection默认false；Apple不自动配置 FIRApp，collection默认false。宿主先在相同门下配置测试FirebaseApp，再显式 native configure(true)，最后开启 TS adapter/client。重配置先尝试关闭旧实例 collection 再验证新应用，任何本地失败不继续提交；SDK 关闭自身抛错不证明自动采集已停止。运行时 collection 设置可能持久覆盖默认，因此需要在 opt-out 与重启时验证；只关闭 TS Client 不足以证明 SDK 无自动事件／设备信息。详情：[Android collection](https://firebase.google.com/docs/analytics/android/configure-data-collection)、[Apple collection](https://firebase.google.com/docs/analytics/ios/configure-data-collection)、[FirebaseApp 自动初始化](https://firebase.google.com/docs/reference/android/com/google/firebase/FirebaseApp)。

Crashlytics关闭发送仍会本地保存原始崩溃，Android运行时关闭下次启动才生效；因此本片不加入它的运行依赖、注册器或 nonfatal 调用，capability 坚持 false。若后续启用，必须单独明确原始原生采集范围及测试应用、默认关闭的构建配置，验证符号化／删除未发送报告／后台收件，不能把自定义脱敏 Throwable 等同 SDK 不自动采集。[Android 官方说明](https://firebase.google.com/docs/crashlytics/android/customize-crash-reports)、[Apple 官方说明](https://firebase.google.com/docs/crashlytics/ios/customize-crash-reports)。

Node22完整 Vitest84/84（含本片12项）、另有遥测Node19/19、严格类型检查、ES2015构建及实际ESM导入／默认关闭Smoke通过。83份 assets/tests 快照与工作树字节匹配；默认XML／plist语法通过，OCR委派与独立21/21只读审查关闭两项native配置P2。构建与SDK二进制签名核验不等同原生编译。本片仅候选源码／离线调用合同交付；SDK真实编译、Creator导入／Meta、产品升级接线、微信工具／原生真机、真实登录、真实收件与运营报告部署均未执行。Owner 的客户 SDK 推进已替代旧“客户端等待恢复”的流程，后端／云存档／绑定政策不由本片选定。根 README／AI_CONTEXT／治理导航由父会话协调，本片不改共用入口。

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

候选 v2.3.0 源码检查点：`ebba1d7db15d7e4549f7cb5031eba55d7509cab2`；事实与哈希证据见 [platform-sdk-implementation-v1.json](../evidence/platform-sdk-implementation-v1.json)。此检查点未推送、未升级产品，原生／真实平台验收不因 IMPLEMENTED 状态通过。

机器合同校验：仓内原命令仍因既有 Windows `root + /` 路径包含检查报 Schema escapes；本片未改工具脚本。仅 Temp 等价副本将目录分隔符改为 node:path.sep，实际通过4份合同、58份Markdown计数及候选2.3.0／IMPLEMENTED检查。该替代结果不写成原命令通过，也不扩大为新SDK Runtime验证。
