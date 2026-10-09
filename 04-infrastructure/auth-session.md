# Auth Session（登录端口与会话生命周期）

状态: Accepted（本轮明确授权的独立基础设施合同；仅 Headless 实现）

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

凭证带 `scope.issuer/applicationId/host` 路由范围；这些客户端字段是不可信元数据，必须由交换适配器依据服务端允许配置和真实凭证独立核验，不因字符串合法就相信发行方或主体。provider subject 必须连同范围映射，不把抖音小游戏／小程序、不同宿主或 Google 平台游戏身份自动合并。Apple 隐藏邮箱及邮箱域名也不是跨平台账号身份键。上述边界采用主线程本轮官方文档研究；本模块不调用其 API，也不声明实现了平台验证。

参考：[Android 平台身份](https://developer.android.com/games/pgs/platform-authentication)、[Google Credential Manager](https://developer.android.com/identity/sign-in/credential-manager-siwg-implementation)、[抖音小游戏登录](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/api/javascript-api/open-capacity/log-in/tt-login)、[抖音小游戏 UnionID 范围](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/open-ability/user-info/unionid-intro)、[Apple 隐藏邮箱公告](https://developer.apple.com/news/?id=1ptvdtcm)。正式适配时重新核验适用平台、版本与验证链。

临时材料按 `wechat-code/douyin-code/google-id-token/apple-id-token-code` 区分：Google ID token 不等同 Apple 的 ID token 加 authorization code；Google/Apple 带此次请求的 nonce，由适配器拥有生成和校验关联。交换端口负责服务端签名、issuer、audience/app、exp 与 nonce 验证后才映射内部账号。端口只检验材料形状和对应标签，不能代替这些验证。微信／抖音 code 是一次性短期材料，不持久化、缓存重用或自动重试；`checkSession` 仅检查平台会话，不能证明本地游戏账号会话。不同平台 session_key 不规定统一有效期，`logout()` 是本模块本地失效，不编造 `wx.logout/tt.logout`。

主线程补充来源：[微信官方小游戏类型库](https://github.com/wechat-miniprogram/minigame-api-typings/blob/master/types/wx/lib.wx.api.d.ts)、[腾讯官方微信换票说明](https://docs.cloudbase.net/recipes/add-auth-wechat-miniprogram)、[抖音小游戏服务端换票](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/server/log-in/code-2-session)。Apple 原生适配待核验 AuthenticationServices 与 Cocos JsbBridge；这些均未进入本批代码。

凭证仅在本次获取与交换之间传递，不进入公开快照、结果、日志、事件或存档。交换适配器负责真实远端验证，以及 bearer token 等传输材料的所有权；控制器只复制 `gameAccountId/sessionId/expiresAtMs`。稳定的 `gameAccountId` 必须由可信后端映射各 provider subject；不得将 email、昵称、设备 ID 或平台 subject 直接等同跨平台游戏账号。本批没有映射后端、绑定／合并操作或进度传输。收到 active 结果仅表示配置的交换端口返回了合法且未过期的投影，不能凭本模块离线测试证明远端认证安全。

整个尝试共用一个绝对超时期限，包括两个适配阶段。取消、超时、退出结束原 Promise、清理计时器并使操作身份失效；迟到成功或拒绝不能更改新会话，迟到凭证不能启动交换。适配器可能忽略 AbortSignal，所以本地失效检查是必要边界；远端副作用是否发生及如何清理由未来适配器合同定义。

适配器 DTO 仅接收自有数据字段，不执行访问器或接收继承字段；只复制列出的字段，不枚举或转发未知字段。缺少必需字段时拒绝结果，非数据形式的可选字段不转发。凭证材料与 provider 标签必须对应。字段复制及时间检查后，交换前再次确认尝试仍有效，避免可重入适配器对象在取消后触发新远端交换。时钟回调引发的退出或重试同样不能被旧快照覆盖。

## 验证与消费

离线 fake 仅位于 `tests/auth/`，不提供生产模拟登录。Node 22 执行框架约定的 typecheck、tests、build；实施证据分别记录源码、构建、SDK、Creator 与产品接线状态。没有手写 `.meta`；Creator 导入、meta 保存和产品 Runtime 验收待主线程集成窗口，因此本批不能声明可直接装配到 Creator 的资源已验收。

本地候选版本为 `2.1.0`。本批保留 P1060 的 `3a4c6b9c44bdaba55c06588191f10c99e351d8e6` 与 4060 的 `2384980aab0c2bb60559b22cbef88d2c1391d784`。后续由主线程选择已验证的框架提交／必要的窄移植，核对原 pin 到候选的完整差异，再分别验证产品 gitlink；不得因新增模块统一升级两个产品或带入无关框架变化，不复制第三份源码。

Owner 已要求上述四个平台以及跨平台进度方案，方案约束为零新增服务费用，云存档不一定首发；这不授权购买服务、创建云账号或暴露本机服务。本模块不选择 CloudBase、Firebase Auth 或其他后台，也不自动合并游客账号／进度。无 SDK、账号、凭据、真实登录或玩家数据发送；正式认证、账号绑定与云存档属于后续切片。

## 四平台登录、跨端进度与免费云服务方案（Deferred）

调研日期：2026-10-09。Owner 本轮决定：方案保存到本地，后面再推进。本节是保存的候选方案，状态为 **Deferred／待 Owner 推进**；不是后端选型批准、上线承诺或云资源开通指令。公共接口的 Headless 实现状态与本节方案状态分别记录。

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

首发候选为 local：无后台也能保持当前玩法与本地存档；cloud 可后置。暂不为“统一账号”承诺已有跨端进度同步，先由 Owner 决定首发是否必须登录、是否必须同步，以及断网时的玩法和登录降级表现。

### 零新增服务费用的候选组合与边界

可后续实验的组合为 **免费 `workers.dev` 子域 + 托管 HTTPS／TLS + Workers Free + D1**：Worker 执行可信换票／验签与会话接口，D1 保存平台主体映射和按产品隔离的少量 JSON 存档。它是有限配额实验候选，不是已选定生产后端。本批没有创建账号、配置应用、申请密钥、开通数据库或部署服务。

- [Workers 产品页](https://www.cloudflare.com/products/workers/)说明免费开始无需信用卡；[Workers 价格](https://developers.cloudflare.com/workers/platform/pricing/)当前 Free 为每天 100,000 请求、每次 10 ms CPU。真实验签及数据库操作能否满足 CPU／延迟要求需未来实测，不依宣传推断。
- [D1 价格](https://developers.cloudflare.com/d1/platform/pricing/)当前 Free 为每天 5,000,000 行读取、100,000 行写入、账户合计 5 GB 存储。行扫描、索引写入也消耗额度；单库及其他限制推进时再次核对。超过读写额度会拒绝查询，存储满会阻止新增写入。
- 策略固定为 Free，**超额停服务或降级本地，不自动升级付费**；不绑定支付方式，不引入需要付费套餐的附加组件。[Workers 限额](https://developers.cloudflare.com/workers/platform/limits/)说明每日请求超限返回 1027；认证接口必须拒绝放行，不能绕过验证。免费配额不是无限容量，也不是永久 SLA。
- [workers.dev 文档](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)说明该子域无需先接入自有域名，但官方推荐生产服务使用 route／custom domain。免费子域不等于 Owner 独立持有、实名或已完成 ICP 备案的域名，也不能证明小游戏平台接受该白名单。

国内发行是尚未通过的条件：[抖音小游戏网络规范](https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/develop/guide/basic-function/network)明确要求 HTTPS、域名白名单及 ICP 备案，不能用 localhost／普通 IP 替代。微信白名单、主体与备案要求，以及 `workers.dev` 在中国大陆不同运营商／设备的可达性、证书和平台后台接受情况均未实际验证；不得通过关闭域名校验宣告生产通过。免费 TLS 解决不了域名主体、备案与网络条件。

微信 CloudBase 体验型权益存在期限，小游戏适用范围与实际权益还需核对：[腾讯官方体验说明](https://cloud.tencent.com/document/product/876/127357)。本次该页面抓取失败，期限结论来自本轮主线程调研，不补造天数，推进时必须重查。[抖音云定价](https://developer.open-douyin.com/docs/resource/zh-CN/developer/tools/cloud/charge/price)列出函数调用、内存、公网流量及日志等收费，即使部分组件暂免费也不能宣称整条链路免费。Cloudflare 的公开免费组合不证明微信／抖音国内链路可上线，亦不包含尚未核验的平台主体、签名、上架或域名成本。因此**不承诺四端、全链路永久全免费**。

### Owner 恢复推进后的验收顺序

1. 确定首发地域／平台顺序、首发 local 或 cloud、登录强制性，确认零新增服务费与接受免费超限停服务的约束；国内域名／备案条件不满足时决定延期 cloud 或另选方案，不自动收费。
2. 核对两个产品原 P0002 pin 到候选共享提交的完整差异，只消费单一共享模块；在批准集成窗口验证 Creator 导入／meta、各宿主 `AbortController`／AbortSignal 支持与生命周期清理，再安排产品接线。
3. 在 Owner 另行授权提供的测试应用／测试账号下接入四个平台；验证 code／token 正常、过期、重放、错误 app／issuer／audience／nonce、取消、超时、退出和迟到结果。服务端密钥不进入客户端、日志或仓库。
4. 如批准免费云实验，仅使用 Free 资源和测试数据，核验无支付方式／无自动付费升级；检查 TLS、微信／抖音正式域名白名单及备案接受情况，在关闭跳过校验后做国内真实设备网络验证。
5. 验证显式绑定、同一产品跨端读写、跨产品访问拒绝、存档版本冲突与回滚；测试额度耗尽、服务离线、注销／解绑和备份恢复，不覆盖游客存档，不自动合并账号。观察配额、CPU 与延迟，仍合格才另行决定生产交付。

当前只保存方案并保留公共接口检查点；以上验收全部待 Owner 恢复推进。待定业务项集中为首发地域及平台、local/cloud 与登录要求、绑定／进度冲突策略，以及域名条件与免费超限停服务的接受范围。
