# Auth Session（登录端口与会话生命周期）

状态: Accepted（统一端口与默认关闭客户端候选；原生 Runtime 未验）

## 范围与来源

唯一源码位于 `assets/auth/`，公开子路径为 `db://shidai3/auth/index`，不从根导出。P0002 当前已有公开能力以及两产品已安装 MK Provider 均未发现等价登录凭证／后端账号会话控制器；MK 的 Network、Storage 不等于认证实现。本模块不修改 Foundation Core、Entity Identity、Save、Feature Lifecycle、Messaging 或 Registry。

P1060 与 4060 是预计消费者，本批没有产品接线，不称为两个真实复用场景或已完成回流。现有本地安装 ID、角色与玩法会话、存档以及遥测会话 ID 均保留各自含义。本模块不为设备 ID 建立账号含义，不提供存档绑定、合并或云存档。

## 公开合同

`AuthSession` 独占会话状态。调用方提供 `AuthClock` 与正整数 `timeoutMs`；仅配置完整的 `CredentialPort` 和 `SessionExchangePort` 才可开始登录。控制器不创建 SDK、后台服务、网络请求、持久化、全局监听或默认适配器。未配置时返回 `unavailable` 并保留游客状态，不产生假登录成功。

- `login()`：并发调用共享同一个 Promise 和同一凭证／交换操作。已有未过期会话时返回当前会话；没有自动续期、重试或刷新机制。
- `cancel()`：取消当前尝试，立即结束所有等待者并尽力通知适配器；不会退出已完成的会话。
- `logout()`：清除本地内存会话并取消当前尝试，也用于产品析构。它不等于后端撤销或全平台退出。
- `snapshot()`：返回不可变的 `guest/pending/active/expired` 投影。到期检查在读取快照及复用登录时执行，没有后台过期计时器；到期会话不会继续被返回为 active。

平台标签限定为 `wechat/douyin/google/apple`，分别对应 Owner 指定的微信小游戏、抖音、Google、Apple；这只是统一端口的标签，不声明 SDK 接入或签名／服务端验证方式已经确定，真实适配须依据各平台官网最新文档核验。

凭证带 `scope.issuer/applicationId/host` 路由范围；这些客户端字段是不可信元数据，必须由交换适配器依据服务端允许配置和真实凭证独立核验，不因字符串合法就相信发行方或主体。provider subject 必须连同范围映射，不把抖音小游戏／小程序、不同宿主或 Google 平台游戏身份自动合并。Apple 隐藏邮箱及邮箱域名也不是跨平台账号身份键。上述边界采用主线程本轮官方文档研究；本模块不实现平台验证；2026-10-11 新增的微信适配器只调用 wx.login 获取临时材料。

参考：[Android 平台身份](https://developer.android.com/games/pgs/platform-authentication)、[Google Credential Manager](https://developer.android.com/identity/sign-in/credential-manager-siwg-implementation)、[抖音小游戏登录](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/open-capacity/log-in/tt-login)、[抖音小游戏 UnionID 范围](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/open-ability/user-info/unionid-intro)、[Apple 隐藏邮箱公告](https://developer.apple.com/news/?id=1ptvdtcm)。正式适配时重新核验适用平台、版本与验证链。

临时材料按 `wechat-code/douyin-code/google-id-token/apple-id-token-code` 区分：Google ID token 不等同 Apple 的 ID token 加 authorization code；Google/Apple 带此次请求的 nonce，由适配器拥有生成和校验关联。交换端口负责服务端签名、issuer、audience/app、exp 与 nonce 验证后才映射内部账号。端口只检验材料形状和对应标签，不能代替这些验证。微信／抖音 code 是一次性短期材料，不持久化、缓存重用或自动重试；`checkSession` 仅检查平台会话，不能证明本地游戏账号会话。不同平台 session_key 不规定统一有效期，`logout()` 是本模块本地失效，不编造 `wx.logout/tt.logout`。

主线程补充来源：[微信官方小游戏类型库](https://github.com/wechat-miniprogram/minigame-api-typings/blob/master/types/wx/lib.wx.api.d.ts)、[腾讯官方微信换票说明](https://docs.cloudbase.net/recipes/add-auth-wechat-miniprogram)、[抖音小游戏服务端换票](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/server/log-in/code-2-session)。v2.3.0检查点未纳入Apple原生适配；v2.5.0的AuthenticationServices候选与剩余JsbBridge／原生验证见下节。

凭证仅在本次获取与交换之间传递，不进入公开快照、结果、日志、事件或存档。交换适配器负责真实远端验证，以及 bearer token 等传输材料的所有权；控制器只复制 `gameAccountId/sessionId/expiresAtMs`。稳定的 `gameAccountId` 必须由可信后端映射各 provider subject；不得将 email、昵称、设备 ID 或平台 subject 直接等同跨平台游戏账号。本批没有映射后端、绑定／合并操作或进度传输。收到 active 结果仅表示配置的交换端口返回了合法且未过期的投影，不能凭本模块离线测试证明远端认证安全。

整个尝试共用一个绝对超时期限，包括两个适配阶段。取消、超时、退出结束原 Promise、清理计时器并使操作身份失效；迟到成功或拒绝不能更改新会话，迟到凭证不能启动交换。适配器可能忽略 AbortSignal，所以本地失效检查是必要边界；远端副作用是否发生及如何清理由未来适配器合同定义。

适配器 DTO 仅接收自有数据字段，不执行访问器或接收继承字段；只复制列出的字段，不枚举或转发未知字段。缺少必需字段时拒绝结果，非数据形式的可选字段不转发。凭证材料与 provider 标签必须对应。字段复制及时间检查后，交换前再次确认尝试仍有效，避免可重入适配器对象在取消后触发新远端交换。时钟回调引发的退出或重试同样不能被旧快照覆盖。

## 验证与消费

离线 fake 仅位于 `tests/auth/`，不提供生产模拟登录。Node 22 执行框架约定的 typecheck、tests、build；实施证据分别记录源码、构建、SDK、Creator 与产品接线状态。没有手写 `.meta`；Creator 导入、meta 保存和产品 Runtime 验收待主线程集成窗口，因此本批不能声明可直接装配到 Creator 的资源已验收。

v2.3.0历史检查点记录两产品当时已通过自己的 `extensions/shidai3` 单源消费公共认证／遥测：P1060 源码检查点 `4f5955988f35f3aa36ce9e72365fcdb4a8d7fa52`、4060 检查点 `287fe6b101a6e37cb2a335da2d415c17cd941b68` 均 pin `895f28728ef2624e56faa3520d11b02310b20f18`（v2.2.0）。该检查点只交付框架候选 v2.3.0，未更新两游戏 pin、入口或父仓 gitlink；新平台适配不因旧共享接线而自动进入产品。 v2.5.0未读取当前产品pin，不将上述历史SHA视为当期现状。

## 微信真实凭证调用层（2026-10-11）

Owner 已恢复微信与 Firebase SDK 推进。`assets/auth/wechatCredential.ts` 的 `WechatCredentialAdapter` 实现既有 `CredentialPort`，由宿主显式注入小游戏 `wx` 的结构化 API、应用范围与超时。导入／构造没有平台调用；只有 `acquire(signal)` 才调用官方 `wx.login({ timeout, success, fail })`。它只返回 `wechat-code`，不生成 openid、内部账号或 active 会话，不缓存或自动重用 code，不调用不存在的 wx.logout。

```ts
import { AuthSession, WechatCredentialAdapter } from 'db://shidai3/auth/index';
// hostWechatApi、clock、scope 由平台宿主注入；trustedExchange 由已配置的可信后端实现。
const credential = new WechatCredentialAdapter(hostWechatApi, scope, 10000);
const auth = new AuthSession({ clock, timeoutMs: 15000,
    ports: { credential, exchange: trustedExchange } });
```

上述用法只在可信交换端口已配置时成立。未配置后端时不要构造完整 ports；现有 `AuthSession.login()` 仍短路返回 `unavailable`，保持 guest，连 wx.login 都不会调用。SDK success 的 code 不能当游戏登录成功；AppSecret、session_key、服务账号密钥留在服务端，客户端配置只包含允许公开的应用路由元数据。交换端必须独立核验这些不可信 scope。

取消会立即拒绝此次凭证 Promise、移除自己的 AbortSignal 监听；不能中止的 wx 请求晚到也不复活会话。SDK fail／throw 统一降级，不读取或转发 errMsg、message、stack。成功只复制自有数据字段 code，不执行 getter 或序列化未知字段。超时由 wx 请求 timeout 和 AuthSession 的绝对期限共同约束。

官方微信网页本轮抓取失败；API 签名、code 需后台换票及五分钟有效期由 [腾讯官方小游戏类型库](https://github.com/wechat-miniprogram/minigame-api-typings/blob/master/types/wx/lib.wx.api.d.ts) 核实（2026-10-11），不把网页抓取失败写成文档验收通过。

Firebase Auth 尚未接入这条游戏登录链。它输出的 Firebase ID token／UID 不等同当前 Google／Apple proof 或 `gameAccountId`。后续可在 `SessionExchangePort` 内部私有执行原平台 proof → Firebase Auth → Firebase token → 可信游戏后端，不预改本次公开 proof；后端必须核验 Firebase issuer、audience、project、过期与主体映射。不得用匿名 Firebase 成功绕过游戏账号后端。官方依据：[Google 原生认证](https://firebase.google.com/docs/auth/android/google-signin)、[Apple 认证](https://firebase.google.com/docs/auth/ios/apple)、[服务端 token 验证](https://firebase.google.com/docs/auth/admin/verify-id-tokens)。Apple SDK 13 当期 GoogleSignIn 配套限制见 [发布记录](https://firebase.google.com/support/release-notes/ios)，不能承诺本片完成跨端登录。

验证分别记录：微信 API 合成 callback 与统一会话边界已定向测试；真实微信 code、后台换票、过期／重放的远端验签、开发者工具／真机、产品新 pin 均未执行。原生 Firebase SDK 状态及启用门见 [遥测合同](debug-observability.md)。Node22完整 Vitest84/84（含本片12项）、另有遥测Node19/19、严格类型／构建及实际ESM默认关闭Smoke通过。候选实施回执补充源码 SHA 与最终验证，不能由测试替身推出真实平台收件。

Owner 已要求推进微信／抖音／Google／Apple统一登录；2026-10-11当前首发不要求云存档或跨平台同账号进度。登录是可选能力，无可信后端时保持guest，单机玩法与本地存档继续；不因登录强制购买托管、创建云账号、暴露本机服务或合并游客进度。

## 历史跨端进度与云服务方案（Deferred；不属首发登录前置）

调研日期：2026-10-09。原 2026-10-09 决定保存方案已由 2026-10-11 的微信／Firebase 客户端推进授权替代；本节绑定、云档及具体云平台的未选业务方案继续为 **Deferred／待后续需求及业务决策**；不是后端选型批准、上线承诺或云资源开通指令。公共接口的 Headless 实现状态与本节方案状态分别记录。

### 四平台凭证与可信验证

| 平台 | 客户端临时材料 | 未来可信后端职责与身份范围 | 官方依据 |
|---|---|---|---|
| 微信小游戏 | `wx.login` 的短期一次性 code；官方类型库注明 5 分钟有效 | 服务端使用受保护的应用凭据换取平台主体，校验应用范围；session_key 只留服务端，不发往公开快照或日志。`wx.checkSession` 不证明游戏账号会话 | [微信官方小游戏类型库](https://github.com/wechat-miniprogram/minigame-api-typings/blob/master/types/wx/lib.wx.api.d.ts)、[腾讯官方换票说明](https://docs.cloudbase.net/recipes/add-auth-wechat-miniprogram) |
| 抖音小游戏 | `tt.login` 的 code／可选 anonymousCode；小游戏文档为 3 分钟有效 | 服务端单次换票并核验 app／宿主；不把小游戏、小程序或不同宿主的主体当作同一账号，小游戏 UnionID 范围须单独核对 | [小游戏登录](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/open-capacity/log-in/tt-login)、[小游戏服务端换票](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/server/log-in/code-2-session)、[小游戏 UnionID](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/open-ability/user-info/unionid-intro) |
| Google | Android 新接入以 Credential Manager 的 Sign in with Google 获取 ID token；带请求 nonce | 验签并校验 issuer、audience、exp、nonce，按受验证 subject 映射账号。Play Games 平台身份与游戏进度账号分开处理 | [Credential Manager](https://developer.android.com/identity/sign-in/credential-manager-siwg-implementation)、[Play Games 平台身份](https://developer.android.com/games/pgs/platform-authentication) |
| Apple | 原生 AuthenticationServices 提供 ID token 与 authorization code；带请求 nonce | 按 Apple 验证链核验签名、issuer、audience、exp、nonce 及 code；私钥留服务端。隐藏邮箱、邮箱域名不作为绑定键；Cocos 原生桥接和上架配置留待验证 | [AuthenticationServices](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovider)、[服务端验证](https://developer.apple.com/documentation/signinwithapple/verifying-a-user)、[隐藏邮箱公告](https://developer.apple.com/news/?id=1ptvdtcm) |

后端核验成功后才签发内部游戏会话。客户端只持有必要的身份投影；本批 DTO 的 `gameAccountId` 对应未来内部 accountId，不承担 SDK token 的保管或平台换票。平台材料不缓存重用、不自动重试，不以昵称、email、设备 ID 或客户端声明的 scope 证明身份。

### 内部账号、绑定与产品存档

候选数据关系是 `(provider, issuer, applicationId, host, verifiedSubject) → accountId`。跨平台复用同一 accountId 必须通过玩家主动绑定，验证当前游戏会话和目标平台凭证的所有权；不按邮箱、安装 ID 或 UnionID 猜测合并。已有两个账号时先提示冲突，由 Owner 定义确认／恢复策略；本方案不自动合并账号或覆盖进度。

账号可以共享，存档按 `accountId + productId + saveSlot + schemaVersion` 隔离。P1060 与 4060 的 ant／cook／shell 进度各有明确命名空间，不能跨产品覆盖；同一产品才讨论跨端继续。游客本地存档先保持现状，主动绑定后再明确选择保留本地、取云端或人工迁移；合并规则、版本冲突、解绑与注销策略均未实现。

2026-10-11首发范围已明确：保留单机玩法与本地存档，登录可选；云存档及跨平台进度不在本轮要求。不再把local/cloud选择、账号绑定和进度合并规则作为当前客户端推进门。真实账号可用仍需可信交换实现与应用配置，服务离线时认证不能放行，玩法继续guest。

### 历史云资源候选与费用边界（首发不需要）

可后续实验的组合为 **免费 `workers.dev` 子域 + 托管 HTTPS／TLS + Workers Free + D1**：Worker 执行可信换票／验签与会话接口，D1 保存平台主体映射和按产品隔离的少量 JSON 存档。它是有限配额实验候选，不是已选定生产后端。本批没有创建账号、配置应用、申请密钥、开通数据库或部署服务。

- [Workers 产品页](https://www.cloudflare.com/products/workers/)说明免费开始无需信用卡；[Workers 价格](https://developers.cloudflare.com/workers/platform/pricing/)2026-10-09调研快照 Free 为每天 100,000 请求、每次 10 ms CPU。真实验签及数据库操作能否满足 CPU／延迟要求需未来实测，不依宣传推断。
- [D1 价格](https://developers.cloudflare.com/d1/platform/pricing/)2026-10-09调研快照 Free 为每天 5,000,000 行读取、100,000 行写入、账户合计 5 GB 存储。行扫描、索引写入也消耗额度；单库及其他限制推进时再次核对。超过读写额度会拒绝查询，存储满会阻止新增写入。
- 策略固定为 Free，**超额停服务或降级本地，不自动升级付费**；不绑定支付方式，不引入需要付费套餐的附加组件。[Workers 限额](https://developers.cloudflare.com/workers/platform/limits/)说明每日请求超限返回 1027；认证接口必须拒绝放行，不能绕过验证。免费配额不是无限容量，也不是永久 SLA。
- [workers.dev 文档](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)说明该子域无需先接入自有域名，但官方推荐生产服务使用 route／custom domain。免费子域不等于 Owner 独立持有、实名或已完成 ICP 备案的域名，也不能证明小游戏平台接受该白名单。

国内发行是尚未通过的条件：[抖音小游戏网络规范](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/basic-function/network)明确要求 HTTPS、域名白名单及 ICP 备案，不能用 localhost／普通 IP 替代。微信白名单、主体与备案要求，以及 `workers.dev` 在中国大陆不同运营商／设备的可达性、证书和平台后台接受情况均未实际验证；不得通过关闭域名校验宣告生产通过。免费 TLS 解决不了域名主体、备案与网络条件。

微信 CloudBase 体验型权益存在期限，小游戏适用范围与实际权益还需核对：[腾讯官方体验说明](https://cloud.tencent.com/document/product/876/127357)。本次该页面抓取失败，期限结论来自本轮主线程调研，不补造天数，推进时必须重查。[抖音云定价](https://developer.open-douyin.com/docs/resource/zh-CN/developer/tools/cloud/charge/price)列出函数调用、内存、公网流量及日志等收费，即使部分组件暂免费也不能宣称整条链路免费。Cloudflare 的公开免费组合不证明微信／抖音国内链路可上线，亦不包含尚未核验的平台主体、签名、上架或域名成本。因此**不承诺四端、全链路永久全免费**。

### 当前登录推进与未来可选验收

当前只需按下节核对应用／平台配置、产品显式登录接缝及可信交换接口；无后端时继续guest，不为单机首发强制在线。Cloudflare、CloudBase、FirebaseAuth或其他托管均未选定，本节免费配额数字仅为2026-10-09历史研究快照，后续考虑时重新核对，不作为当前容量、成本或可上线承诺。

如后续Owner另行要求账号绑定、云存档或跨端进度，再确定来源冲突、注销、额度及域名／地域要求，并另行授权实验／验收。历史方案的绑定、云读写、超额停服务和恢复测试不进入当前首发验收。

候选 v2.3.0 源码检查点：`ebba1d7db15d7e4549f7cb5031eba55d7509cab2`；事实与哈希证据见 [platform-sdk-implementation-v1.json](../evidence/platform-sdk-implementation-v1.json)。此检查点未推送、未升级产品，原生／真实平台验收不因 IMPLEMENTED 状态通过。

## Apple／Google 凭证候选 v2.5.0（2026-10-11）

唯一共享源仍在 `assets/auth/`，新增 `GoogleCredentialAdapter`、`AppleCredentialAdapter` 和 `CocosNativeCredentialBridge`，公开子路径不变；原生单源在 `assets/adapters/cocos/auth/`。默认 enabled=false，缺 bridge／配置、已取消、并发 acquire 都拒绝，不访问SDK；只有完整 credential＋trusted exchange 注入 AuthSession 后才可由宿主显式发起。

```ts
import { AuthSession, GoogleCredentialAdapter, CocosNativeCredentialBridge } from 'db://shidai3/auth/index';
// nativeReflection、clock、scope 由已核验平台宿主注入；trustedExchange 必须另有可信实现。
const bridge = new CocosNativeCredentialBridge(nativeReflection, 'google', 'android');
const credential = new GoogleCredentialAdapter({ enabled: true, scope, clock, bridge, timeoutMs: 15000 });
const auth = new AuthSession({ clock, timeoutMs: 15000,
    ports: { credential, exchange: trustedExchange } });
// 玩家按钮调用 auth.login()；宿主销毁调用 auth.logout()、credential.dispose() 并解除原生配置。
```

固定桥传输为 isConfigured／nonce／begin／poll／cancel，不覆盖 Cocos 的唯一全局 onNative 回调。每次请求用OS CSPRNG生成独立32字节nonce和requestId（64位小写hex），requestId兼Apple state；TS与原生校验关联、边界及一次消费。TS默认15秒、最高60秒绝对期限；原生60秒清除自己拥有的材料引用，JS挂起也不会无限保留终态token。字符串仅释放引用，不能承诺物理清零。所有失败只给固定标签／固定错误，未知DTO、原始error／profile、accessor和继承字段不读取。

| 候选 | 真正实现与接线 | 当前真实验证 | 剩余条件 |
|---|---|---|---|
| Google Android | CredentialManager 显式按钮→GetSignInWithGoogleOption→ID token／nonce；Activity弱引用、CancellationSignal、过期和一次poll；条件Gradle未应用 | 官方稳定1.6.0／googleid1.2.1 API与真实javac类型编译通过；TS合成生命周期通过 | 应用项见下节统一配置表；前台Activity配置／销毁解绑、APK／设备／真登录 |
| Apple iOS | AuthenticationServices，强持有per-request controller/delegate/window，state匹配，nullable UTF8 token＋code，request与proof均为原nonce | 官方iOS13基线、cancel iOS16+与弱delegate合同核实；TS合成测试通过 | 应用项见下节统一配置表；真实window、Xcode／设备及生产桥仍待验证 |
| Google iOS | GoogleSignIn10.0.0 nonce overload；默认宏0，公开iOS/server client ID及宿主controller显式注入 | 官方tag header及iOS15最低条件核实；TS传输合成测试通过 | 应用项见下节统一配置表；Xcode链接、URL callback转交、SDK Keychain缓存政策、真机 |
| 游戏会话 | 所有材料仅交既有SessionExchangePort；无后台时AuthSession保持guest／unavailable | 合成测试证明材料成功不能自行active，取消后不启动exchange | 可信后端／允许audience／issuer／nonce challenge与单次消费／重放防护；Firebase Auth仍未实现 |

取消先失效本地请求再尽力通知平台。Apple iOS16+调用controller.cancel；13–15保留无效helper至原生terminal以阻止重叠，不能宣称关授权UI。GoogleiOS没有公共request-cancel API，同样保留in-flight并丢迟到材料，绝不用signOut／disconnect代替取消；SDK本身会保存Keychain状态，本片未运行SDK，后续必须处理其缓存政策。宿主在UI主线程配置窗口／控制器；原生展示由main queue执行，poll只传固定有界字符串。iOS reflection是DEVELOPMENT候选，官方JsbBridge上架建议与单回调/线程合同仍须通过宿主路由验证。

Apple原生此处直接传nonce；Firebase Apple要求SHA256(rawNonce)再由FirebaseOAuth消费rawNonce，是另一条私有交换合同，不能直接套本片原nonce冒称FirebaseAuth接入。可信后端必须验签、issuer、audience、exp及本次nonce／重放策略，再映射受验证subject为gameAccountId；客户端scope不可信、邮箱不作跨平台绑定键，服务端secret不得放客户端。跨平台同账号、游客进度合并与云存档保持Deferred，Apple web/Services ID不纳入原生切片。

官方来源：[Android稳定记录](https://developer.android.com/jetpack/androidx/releases/credentials)、[googleid发布记录](https://developers.google.com/identity/android-credential-manager/releases)、[显式按钮指南](https://developer.android.com/identity/sign-in/credential-manager-siwg-implementation)、[Google服务端验证](https://developers.google.com/identity/sign-in/android/backend-auth)、[GoogleiOS10 header](https://raw.githubusercontent.com/google/GoogleSignIn-iOS/10.0.0/GoogleSignIn/Sources/Public/GoogleSignIn/GIDSignIn.h)、[AppleController](https://developer.apple.com/documentation/authenticationservices/asauthorizationcontroller)、[Apple cancel](https://developer.apple.com/documentation/authenticationservices/asauthorizationcontroller/cancel())、[Apple nonce](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest/nonce)、[Firebase Apple hash nonce](https://firebase.google.com/docs/auth/ios/apple)、[Cocos reflection](https://docs.cocos.com/creator/3.8/manual/en/advanced-topics/oc-reflection.html)。

实施、源SHA、官方工具包哈希、44项新增测试、136/136 Vitest与19/19 Node、javac及未执行边界见 [native-credential-implementation-v1.json](../evidence/native-credential-implementation-v1.json)。本片不调用真实登录／上传、不创建账号凭据、不变产品pin、Main、父仓或Protected Core；没有Creator导入/meta、APK、iOS编译或设备证据。

## 两产品消费与四平台最小配置（唯一清单；2026-10-11）

这是只读接线方案，尚未修改业务入口、pin、设置UI或原生工程；候选源码／合成测试不代表真实账号可用。应用项和费用统一在本节维护；上文原生候选的“剩余配置”以本节为准。首发保留guest单机玩法，不要求云存档、跨平台同账号进度、账号合并或付费托管。

### 当前快照与更新影响

| 产品 | 只读Git快照 | 当前P0002消费 | 更新至v2.5的最小影响与接缝 |
|---|---|---|---|
| P1060 | 最新观察 `9983103bb10ba618b1f942b66aaa909dab4643a2`／v0.1.0.104；mapper先前观察fdc6e872／v103，接线三文件在两SHA间无差异 | HEAD/index/实际checkout均 `895f28728ef2624e56faa3520d11b02310b20f18`／v2.2 | `assets/script/Main.ts:106`仅run前接管注入session；123–137默认无ports但startup调用login；344–353立即进入Loading；447–451销毁logout。`assets/bundle/endless/settings/view/SettingsModal.ts:142`附近为本地存档／版本反馈，尚无账号登录UI |
| 4060 | `bc4d812990f279fde9b1174d3b89f47ac243884a`／v0.3.0.65 | HEAD/index/实际checkout同上述v2.2 | `assets/shell/productBootstrap.ts:55`创建模块后继续boot；129–138默认无ports且startup调用login；204–208退出session。Ant `assets/Colony/popups/settings/script/settingsView.ts:91–113`显示本地资料，正由业务writer修改；公共账号反馈宜归Shell生命周期 |

上述是移动中的只读快照，未锁定业务writer。两产品submodule各有9个未跟踪auth／observability Creator meta，源码无tracked dirty；主会话不删除、补写或认领这些meta。P0002代码候选 `ac005a28743a6d1c4c5d3c124a157ae0eb41fab2`、v2.5文档基线 `2b2f2b5b0ce65ca3ae1c732450d9755f8e07b0ea`均只在本地，升级消费需业务writer窗口与框架交付授权，不能写成已升级。

旧pin→v2.5的AuthSession、contracts及TelemetrySchema原字节未改；新SDK候选为公开子路径新增导出，import不启动SDK。遥测新增submitted_to_sdk返回，已读两入口没有FlushResult穷举且忽略flush结果，现有兼容重导出继续单源消费。Shell切换的flush是玩法保存Promise，不是遥测。完整产品typecheck／消费测试与Creator导入仍需新pin下独立验证；P0002先前136/136 Vitest、19/19 Node与javac不能替代产品验收。

### 排队的最小纵向接线

1. **只更新默认关闭消费**：由产品writer在窗口内核对并消费批准的唯一P0002提交；继续无ports、guest，不调用wx/tt/native、不等待网络。登记meta归属，再经各自标准Creator入口导入／保存／读回；原生Google／Apple候选不自动加入默认构建。
2. **共享配置就绪投影**：可在P0002 `assets/auth/` 增量实现共同的readiness／session组装辅助及合成测试（当前未实现）。只有显式enabled、平台公开配置和可信exchange齐备才提供完整ports；缺交换时不调用CredentialPort，反馈“登录暂不可用，离线玩法可继续”。UI只显示只读状态，不持有Gameplay或token。
3. **先拆启动，再加显式请求**：两入口现有startup会调用login并忽略结果，不能只向它注入ready ports，否则启动将弹SDK授权。未来Main／ProductBootstrap的startup只创建／读取状态；玩家按钮才requestLogin→credential→trusted exchange→game session。P1060 session须run前安装，run后不替换；Loading和玩法继续不await登录。平台原生取消当前可能映射failed，反馈“本次登录未完成”，不能承诺每种SDK取消都返回cancelled。
4. **反馈与销毁**：guest／unavailable显示本地可玩；pending只影响账号交互；failed／timeout／cancelled保留游客玩法并允许玩家重试；active只显示游戏身份投影，不改本地PlayerProfile ID、昵称、头像、注册时间或Save key。组件退出同时logout、dispose自身credential，并解除原生host；取消／迟到不得进入新exchange或覆盖新session。

P1060最小产品源码范围为 `assets/script/Main.ts`、上述SettingsModal及既有 `tests/telemetry-integration.test.cjs:105,127`；loader `tests/public-module-loader.cjs:6,25`读取真实submodule。4060为 `assets/shell/productBootstrap.ts`、既有 `tests/provider/public-modules.test.mjs:42,67`（loader `tests/ts-loader.mjs:7,8`）；共同账号交互优先Shell `assets/shell/productNavigationView.ts`／`ProductNavigation.prefab`，若选择Ant设置则等settingsView现有writer窗口。新增固定按钮／Label／绑定须产品writer经Creator保存读回；本方案不生成UI资源。两个产品均无已跟踪native宿主工程，AppActivity／AppDelegate／Gradle／plist／entitlement实际路径须首次生成后核实，不虚构目标路径。

消费验收至少覆盖：import／默认启动零SDK调用；缺平台或exchange保持guest／unavailable；完整ports在startup仍不调用acquire；显式一次请求、并发点击、取消／超时／迟到、销毁及重试；proof不进入UI／日志／存档；断网和认证失败不阻塞原Loading、单机玩法及本地保存。Creator／原生设备／可信端验签与错误audience／nonce／重放单列真实验证。

### 最小应用配置与Owner控制台事项

| 平台 | 客户端允许的公开配置与宿主接线 | Owner／授权管理员控制台及服务器配置 | 当前真实能力 |
|---|---|---|---|
| 微信小游戏 | 对应小游戏AppID／应用与宿主范围，注入wx API；自己的HTTPS登录服务地址；wx.login参数仅timeout／callback，不传AppSecret或Google式nonce | 核实际小游戏主体、AppID和测试成员；AppSecret仅服务器用于code换票，session_key仅留服务器。正式域名／证书／准入及费用需Owner在小游戏控制台核实；本轮官方域名／价目正文未取得，不拿抖音规则替代 | 公共WechatCredentialAdapter调用源码及合成callback已验；产品无ports，真实code／换票未验 |
| 抖音小游戏 | 对应小游戏AppID／host，注入tt API和自己的HTTPS地址；tt.login的force默认true；宿主未登录时会调起登录窗口，必须显式玩家请求；本片未实现该CredentialPort | 核小游戏主体、AppID、测试成员；AppSecret及code2Session只服务器。HTTPS／域名白名单／ICP备案／TLS1.2+／有效证书链按官方小游戏规则；secret/session_key不下发，含secret query不记日志 | 只有douyin-code合同。非匿名身份必须有code，anonymousCode不能当真实账号；小程序／小游戏及各宿主UnionID不自动互通 |
| Google Android | Web类型server client ID；Android包名、签名证书SHA-1；Activity＋bridge显式configure、nonce、销毁解绑；自己的可信exchange地址 | Google Auth Platform项目／branding／audience及匹配Android OAuth client；管理员交付公开ID并配置后端允许audience／issuer与nonce／重放策略。客户端不存Google client secret | CredentialManager1.6.0／googleid1.2.1桥已javac；实际OAuth配置／SDK／设备／exchange未验 |
| Google iOS | iOS client ID＋bundle ID；GIDClientID、reversed-client URL scheme；URL callback转GIDSignIn.handleURL；另有Web server client ID／GIDServerClientID；真实宿主controller | 同项目的iOS OAuth client与branding／audience，Apple合法签名及profile；公开两个client IDs不能混用，不加客户端secret；Google SDK Keychain缓存政策须明确 | 默认宏关闭的GoogleSignIn10.0.0源码候选；Xcode／SDK／设备未验 |
| Apple iOS原生 | bundle／显式App ID；Sign in with Apple capability、`com.apple.developer.applesignin: ["Default"]`、匹配签名profile及真实window；原nonce/state桥 | 有效Apple Developer Program team，App ID设primary／启用capability并重生成profile。服务器用匹配App ID换码，Key ID／Team ID安全交接、.p8/private key及生成client_secret只存服务器；原生不要求Services ID／网站returnURL | AuthenticationServices源码候选；须有效ADP team；Xcode／签名／UI／服务器未验 |

Google基础Sign in with Google仅openid／userinfo.email／userinfo.profile时，官方Testing例外不要求列入test-user名单，也不按一般7天授权失效；追加其他scope则回到对应规则。外部Production显示名称／logo涉及独立brand verification，敏感／受限scope另有data-access verification，不能将全部Google登录一律写成100名测试用户／7天。当前不申请额外数据scope。[Google客户端](https://support.google.com/cloud/answer/15549257)、[Audience规则](https://support.google.com/cloud/answer/15549945)、[brand verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification)、[Google iOS准备](https://developers.google.com/identity/sign-in/ios/start-integrating)。

微信材料5分钟、timeout参数基础库1.9.90+由官方小游戏类型库支持；整体wx.login最低版本本轮未证实。抖音tt.login基础库1.0.0+，code／anonymousCode三分钟、单次换票；自己的challenge不等于平台已验证nonce。换票由开发者服务器完成，故“不必指定CloudBase／Firebase或付费托管”是接口合同推断，不是整个系统零费用承诺。[微信类型库](https://github.com/wechat-miniprogram/minigame-api-typings/blob/master/types/wx/lib.wx.api.d.ts)、[抖音登录](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/open-capacity/log-in/tt-login)、[抖音小游戏换票](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/server/log-in/code-2-session)、[网络要求](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/basic-function/network)、[UnionID范围](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/open-ability/user-info/unionid-intro)。

Apple会员／能力及服务器依据：[iOS能力支持](https://developer.apple.com/help/account/reference/supported-capabilities-ios)、[capability](https://developer.apple.com/help/account/capabilities/about-sign-in-with-apple)、[profile更新](https://developer.apple.com/help/account/identifiers/enable-app-capabilities)、[原生与web区分](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/)、[私钥](https://developer.apple.com/help/account/capabilities/create-a-sign-in-with-apple-private-key)、[授权码验证](https://developer.apple.com/documentation/signinwithapplerestapi/generate-and-validate-tokens)。

### 费用边界（2026-10-11核查；不自动购买／绑卡）

| 项目 | 已核事实与当前边界 |
|---|---|
| 微信小游戏准入／认证 | 本轮未取得当前小游戏认证官方价目正文，不能固定写¥300或全部免费；Owner按实际主体／认证路径在控制台核对。类型库只证明API，不证明价格 |
| 抖音主体认证 | 官方开放平台FAQ Q5明确企业认证该项无需认证费用；Q2/Q3支持个人身份创建小游戏。不外推全部小游戏经营／上架成本为零。[官方FAQ](https://developer.open-douyin.com/docs/resource/zh-CN/developer/join/issues) |
| Google登录调用 | 官方实施／准备文档未找到按次登录价目，不将其表述为全系统永久免费；可信后端仍需安全实现。FirebaseAuth不是本SDK路径的必要前置 |
| Google Play分发 | 选择Play且缺既有账号时，Play Console注册为25USD一次；属于分发入驻费用。非Play准入按首发地域另核，不承诺全免费。[官方入驻](https://support.google.com/googleplay/android-developer/answer/6112435) |
| Apple会员 | Apple Developer Program为99USD／会员年，地区本币／税项以Owner购买页为准；不是登录按次费或服务器月费。合格非营利／教育／政府实体可申请审核豁免，个人／单人企业不因此豁免。[费用](https://developer.apple.com/help/account/membership/program-enrollment/)、[豁免](https://developer.apple.com/help/account/membership/fee-waivers/) |
| 可选FirebaseAuth／Identity Platform | 原生平台proof不依赖FirebaseAuth。Firebase非电话认证在价格表为无费用服务；升级Identity Platform后social等Tier1前50K MAU免费但Spark另有3000 DAU限制，超额／其他计划有计费边界，不把50K当唯一限额。本轮不选、不升级、不绑卡。[Firebase价格](https://firebase.google.com/pricing)、[IP价格](https://cloud.google.com/identity-platform/pricing)、[限额](https://firebase.google.com/docs/auth/limits) |
| 自己的服务器／域名／签名／网络 | 是否已有合法资源及实际费用未知；可信登录需要可达、安全的交换服务，但不要求云存档数据库或指定付费托管。若额外成本／准入条件不获授权，登录保持不可用，单机玩法继续 |

无需账号可先落地的排队项：共享readiness／缺配置投影及合成测试；抖音注入式CredentialPort；默认关闭和显式请求／取消的产品源码与消费测试（等writer窗口）；统一公开配置schema／私密项拒绝与纯模拟exchange边界。不能把合成响应当真实后台认证完成。当前剩余Owner事项集中为首发平台／地域顺序、已有应用及team公开配置和签名、合法HTTPS交换服务与必要控制台准入；云档／跨端进度／付费托管均不作为必须回答的门。

本轮code-mapper `/root/auth_startup_mapper`与docs-researcher `/root/platform_docs_researcher`、`/root/google_login_docs`完成真实只读任务；正式preset入口不支持，均为prompt-emulated，硬只读隔离未核验。未修改产品、Creator、daemon、Save或秘密；本轮未运行产品typecheck／tests，产品Runtime／真实账号验证未执行。
