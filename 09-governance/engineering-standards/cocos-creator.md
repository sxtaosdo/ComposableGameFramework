# Cocos Creator 技术规范

状态: Accepted

引擎: Cocos Creator 3.8.8 + TypeScript

继承: [general-code.md](general-code.md)（通用编码规范、简洁优先、精准修改）

适用于 Owner 已指定 Cocos Creator 的产品。当前 P0002 兼容证据仍只覆盖 Manifest 声明的 Creator 3.8.8 与既有 Adapter 能力；本文的 MKFramework Provider 规则是后续接入标准，不扩张既有 `VERIFIED` 语义，接入状态为 `NOT_RUN`。

## 适用范围

使用 Cocos Creator 开发的项目，覆盖代码开发、UI 场景/Prefab 组装与相关验收。

## 语言

- 使用严格类型的 TypeScript 编写代码。
- `tsconfig.json` 必须启用 `compilerOptions.strict: true`；不得通过关闭 `strictNullChecks`、`strictFunctionTypes`、`strictPropertyInitialization`、`noImplicitAny` 等 strict 子规则规避严格模式。
- 新增或修改代码必须在严格模式下通过项目约定的 typecheck；不得通过降低 TypeScript 严格度解决类型错误。
- 变量、方法参数、返回值和公共 API 须具备可推导或显式的可靠类型；原则上禁止 `any`。确需使用 `any` 时必须限制在最小边界，并说明无法使用 `unknown`、泛型或具体类型的原因。
- 对外部不可信数据优先使用 `unknown`，完成运行时校验和类型收窄后再进入业务层。
- 不使用 `@ts-ignore`、双重类型断言等方式常态化绕过类型系统；确有不可避免的兼容边界时必须局部化并留下原因。
- 语法满足 ES6；不使用过于新或过于小众、目标 Creator 工具链无法稳定处理的语法。

## TypeScript 代码组织

- 默认采用**类优先，而不是类强制**的组织方式：行为跟随状态，辅助方法跟随所属类，只有真正跨领域复用且无状态的能力才独立导出。
- 相关的状态、配置、辅助方法和业务行为应优先封装到职责明确的 `class` 中，避免把一个完整职责拆成大量模块级 `export function`、`export const` 和可变变量。
- 如果一个函数只被一个类使用，默认应成为该类的 `private` 方法，而不是文件顶部的独立函数。
- 如果一组函数共享同一组状态、生命周期或共同完成一个业务职责，应优先建模为一个 `class`，而不是包含大量 exported functions 的 module。
- 与对象生命周期或状态强相关的数据应作为实例字段存在；不要使用模块级可变变量保存对象状态。
- 无状态但只服务于该类的工具逻辑可使用 `private static`；不要仅因为方法较短就拆成模块级函数。
- Controller、Manager、Service、System、Repository、Adapter、Runtime、Session 等具有明确状态或生命周期的模块，默认使用 `class` 组织。
- 模块对外只暴露完成职责所需的最小稳定 API。除明确需要跨模块访问外，字段、方法和常量优先使用 `private` / `protected`，避免为了“以后可能复用”增加 export。
- `interface`、`type`、协议 DTO、枚举/字面量类型等纯类型合同可以独立导出，不要求包装进类。
- 真正通用、无状态、与具体类和领域对象无关的纯函数，可以进入独立 utility 模块；不得为了形式上的“函数式”拆散本应内聚的类。
- 新增模块级 export 前必须能够说明跨模块消费者或公共合同需求；没有明确需求时不增加新的模块级 export。

推荐：

```ts
export class PlayerController {
  private speed = 10;

  public update(dt: number): void {
    this.updateMovement(dt);
  }

  private updateMovement(dt: number): void {
    // ...
  }
}
```

避免无明确跨模块需求时写成：

```ts
export const DEFAULT_SPEED = 10;

export function updatePlayer(): void {}
export function updateMovement(): void {}
export function calculateDirection(): void {}
```

## 代码风格

- 遵循 [general-code.md](general-code.md)：小函数、低耦合、组合优于继承、禁止单例泛滥。
- 类名大写驼峰；变量名、文件名小写驼峰。
- 类文件原则上不超过 200 行，最多不超过 500 行；完整实现二三百行时不强行拆分。
- 主要方法、非显而易见的变量添加注释。
- 逻辑复杂时再抽函数或小型模式；不为短代码强行套设计模式。



## Runtime 规则

- **UI 不持有 Gameplay 状态**：UI 只读 ReadModel / 快照；命令经 Controller 下发，只消费 ReadModel / 快照并下发 Command。
- Gameplay Entity、ECS Entity 与 Cocos Node 分离。
- 会话/页面流程、玩法模拟与表现/UI 状态分别由唯一的模型或 Runtime Owner 持有。跨层只传递只读投影、快照、Command 或 Event；不得让 UI 缓存或改写可变玩法状态，也不得用平行 Model 复制同一份权威状态。
- Application、Presenter 或 Controller 只按具名入口编排状态 Owner 的操作与顺序，不承载玩法公式，也不直接改写其他 Owner 的内部字段。视图事件是请求来源，不是 Gameplay 或会话状态的权威。

### 配置、主流程与测试边界

- 关卡、数值、掉落、文本等可编辑业务配置必须存放在所属 Bundle 的独立 JSON；TypeScript 只维护类型、读取、运行时校验与消费逻辑，不内联配置数据。
- JSON 由现有资源接口加载后必须先完成结构和领域校验；加载、解析或校验失败时不得进入 Gameplay，产品在 Loading 状态显示可见错误并停止流程。
- 用户可见的一级流程页面（例如 Loading、Home、Play）使用项目已有状态机管理。状态类直接导入目标状态，并以 `this.context.StateMachine.changeState(TargetState)` 切换；不得使用字符串路由、转发聚合文件或页面映射表。弹窗、短暂特效和局部交互不强制成为一级状态。
- 非弹窗业务按功能建立目录；一个功能有两个及以上实现类时，类文件必须集中在该功能目录，不分散在同级脚本目录。
- 单元测试、Mock、Fixture 和运行时自动化桥接放入专用测试目录；桥接以专用类维护，业务启动入口最多调用其安装入口，业务功能目录不包含断言、Mock 或测试流程。



## 框架（按项目选用，不混用）

启动、读取配置、打开弹窗须遵循**当前项目**冻结的框架版本与 API，禁止混用第二套同类 Runtime。


| 项目               | 框架                | 说明                                                                                                          |
| ---------------- | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| P4000            | P0002（正式 runtime） | 见 `P4000/docs/runtime/p10_p0002_refactor_contract_v1.json`；`P4000/cook/XFORGE_FREEZE.md` 仅作历史 Review 记录 |
| P1060            | Oops Framework    | 历史资产，extensions 内已集成                                                                                        |
| 其他 / 后续 Cocos 产品 | MKFramework       | [官方文档](https://mkframework.muzzik.cc/docs/introduce) · [GitHub](https://github.com/1226085293/MKFramework)  |


P0002 持有引擎无关的 Feature、Registry、Command、Query、Event、Save 与 Gameplay 合同。对后续 Cocos 产品，MKFramework 是表现层和基础设施的默认 Capability Provider；其已有 UI、资源、Bundle、音频、事件、视图生命周期、MVC/MVVM、对象池等能力必须优先使用。P0002 只提供标准、合同、验收门和经证明确实缺失的能力，禁止形成第二套同类 Runtime。

适配层只负责把 P0002 Intent / Command / Query / Event 与 MKFramework 表现能力桥接；不得把 MK 的视图事件反向变成 Gameplay 状态权威。

## 组件与 Prefab

- 每个 Prefab 对应一个独立脚本；类名与 `@ccclass` 一致。
- 编辑器绑定用 `@property`；避免 `find()` 硬编码查找节点。
- 生命周期：`onLoad` 校验编辑器引用，`start` 执行初始化，`onDestroy` 释放事件订阅；采用 MK 视图基类时按其 `create/open/close` 生命周期完成等价职责。
- UI 制作遵循下文“静态 UI 优先组装”；场景专用元素可保存在场景中，动态数据不要求动态创建节点。



## UI 与场景

### 静态 UI 优先组装

默认把制作阶段能确定的 UI 节点、层级、布局、组件和图片引用，尽量预先组装并保存到 Prefab 或场景中。代码主要负责交互、数据、显隐、动画及必要的动态实例化。此原则是默认优先级，允许有实际理由的例外，不禁止所有运行时加载或程序化 UI。

#### 判断与归属

分别判断“结构是否固定”和“图片内容是否固定”；固定结构中可以显示动态图片。

| 对象 | 默认制作方式 | 运行时代码职责 |
| --- | --- | --- |
| 背景、Logo、固定按钮、面板、装饰 | 预建节点、布局和图片引用 | 交互、显隐、动画 |
| HUD 数字、进度、按钮状态 | 预建图标、文字、进度及适用的状态引用 | 更新数据和状态 |
| 背包、商店、排行榜条目 | 组装可复用条目 Prefab | 按项目框架实例化/复用并填充数据 |
| 远程头像、皮肤、主题图 | 预建容器，配置适用的占位或隐藏状态 | 加载/替换图片及失败处理 |
| 按需加载面板 | 在所属 Bundle 内组装 Prefab 及静态引用 | 经项目框架加载并打开 |
| 运行时不可预知的结构、程序化图形 | 有实际需求时允许代码生成 | 生成、更新、清理 |

- 单场景专用且不需复用的固定 UI 可直接保存到场景；独立面板和重复条目优先 Prefab。不为每张图拆一个 Prefab，也不为本任务引入新 UI 框架。
- 修改前区分源 Prefab 公共默认值与场景实例局部差异，避免把局部变化应用到所有实例。
- 资源包、内存策略或专用程序化 UI 系统可构成例外；在已有任务记录说明对象、理由和验证方式即可。工具步骤多不是默认改用代码的理由。
- 本原则不放宽下文 Bundle 与框架管理约束：静态引用留在允许的资源边界内，跨 Bundle 内容经现有资源接口加载；“实例化 Prefab”不授权绕过项目 UI 管理层。

#### 资源与组装细节

1. 明确目标工程、场景/Prefab、设计依据、资源来源、设计尺寸、适配与状态需求；优先复用已有资产和 UI 根节点。
2. 查询已有图片，必要时通过 AssetDB 导入，遵守不覆盖与导入限制；等待导入完成。普通 PNG 解析 SpriteFrame 子资源后绑定，不能把 PNG/Texture UUID 当 SpriteFrame UUID；图集使用实际对应的 SpriteFrame。
3. 保存父子关系、坐标、尺寸、锚点、初始显隐、绘制顺序、必要组件及图片引用。检查遮罩和点击区域；纯布局容器不添加无用途的空 Sprite。
4. 按设计选择宽高比、裁剪/拉伸、Sprite 尺寸模式和九宫格切边，检查面板缩放后边框不变形。复用项目 Widget/Layout 等适配方式，避免布局组件与脚本反复覆盖同一属性。
5. 通过编辑器引用连接已有控制逻辑；脚本先完成编译再配置组件引用。预建动态图片容器可以使用占位图，也可以按产品设计在加载前隐藏，不要求所有 Sprite 初始都非空。
6. AI 写入通过项目支持的 MCP/CLI、Bridge 与 Creator 序列化完成，不手写 `.scene`、`.prefab`、`.meta`。读最新文档与 revision 后写入，保存并回读；切换文档后重新取 revision，写入结果未知时先查询，不盲目重放。

#### 代码与迁移边界

- 默认避免在 `onLoad`/`start` 中创建整套固定 UI，或用 `resources.load` 等加载调用补上本应已保存的固定图片引用；Preview 有图不能代替资产组装。
- 保留更新文字、进度、状态、动画、动态换图与框架管理的 Prefab 实例化。异步换图需按项目既有生命周期处理失败、条目复用、旧请求覆盖及销毁后的回调，不随意释放共享图片。
- 修改旧界面时只迁移本次涉及的固定结构，移除被资产替代的创建/补图逻辑，避免重复节点和事件；不开展全项目清理，不仅凭出现 `new Node`、`resources.load` 或 `instantiate` 就判定违规。

#### 执行与验收

执行顺序：确认工程及未保存改动 → 划分固定结构/动态数据 → 准备资源 → 组装目标文档 → 连接行为 → 保存回读并重新打开 → 检查 Preview。

- **持久性**：重新打开目标场景/Prefab，固定节点、基本布局与图片引用仍正确；不运行初始化脚本也能检查主要固定视觉内容。
- **运行行为**：目标界面正常显示，关键交互无重复绑定；适用的加载、失败、动态复用行为正确。
- **适配**：布局改动检查项目基准尺寸和一个差异明显的目标宽高比，确认无遮挡、变形或不可达按钮。
- **最小验证**：代码改动运行项目约定编译/构建；只验证受影响界面，不默认新增大批测试或运行全平台套件。Preview 遵循父仓既有流程。
- **缺项**：记录缺素材、占位项及运行时例外。应显示却缺图的节点不算完成；合法隐藏/延迟显示状态不因空引用一概失败。
- **阻塞**：Creator 不可用、保存失败或回读失败，明确未验证项、原因和恢复步骤，不用截图或源码阅读代替持久性/运行时通过结论；未保存编辑及重叠用户改动不得覆盖。

验收结果写入已有任务记录：目标资产、主要绑定、动态例外、实际检查结果和未完成项；无需另建通用清单或门禁。新增便捷挂图工具不是执行本规范的前置条件。

### 设计分辨率

- 移动端：750*1334



### 弹窗

- 每个弹窗为独立 Prefab。
- 通过框架提供的 API 打开 / 关闭，不在业务代码中直接 `instantiate` 绕过管理层。
- 动态 UI 统一使用 `mk.uiManage.regis`、`mk.uiManage.open`、`mk.uiManage.close`。
- 弹窗的打开、可交互、关闭与销毁是同一条异步生命周期：由项目既有 UI 管理器的单一调用方串行协调。只有打开成功后才可对外暴露控制器或绑定交互；关闭与打开交错时不得保留已过期视图。
- 控制器在关闭时解除自己注册的事件；关闭完成后不得再触发导航、重试或其他业务命令。不得以重复调用框架 `close` 作为常规清理方式，也不得为此另建 UI 管理器。
- 验收至少覆盖一次“打开 → 关闭 → 打开另一种或同一种弹窗”，确认无编译/运行错误、无重复事件响应，且最终只保留预期视图。产品可用既有 Preview 测试桥或实际交互完成该验证。



### 主界面

- 禁止把所有 UI 元素堆入主场景；按布局拆分（如上 / 中 / 下）。
- 玩法层与 UI 层节点分离。
- UI 按业务功能拆成不同 Prefab，再拼接到主界面。



### 场景与设计分辨率

- 游戏默认采用单场景；只有 Owner 主动声明多场景需求时才扩展场景结构。
- 移动端默认设计分辨率为 `750×1334`；具体产品另有 Accepted 规格时以产品规格为准。



## Bundle 与资源

- 每个业务功能模块一个独立 Bundle（对应单独文件夹），包含该模块的代码、图片、音频、Prefab 等；模块内高内聚，对外低耦合。
- 主包只保留启动壳与公共资源；业务资源按 Bundle 分包加载。
- 禁止跨 Bundle 静态引用。
- `.meta` 随资源一并提交；不手改 UUID 或 Bundle config ID。
- 资源统一使用 `mk.asset`。
- Bundle 加载、场景切换与 Bundle 生命周期统一使用 `mk.bundle`。
- 资源标识保留在领域数据中，引擎对象只存在于 Adapter / Presentation。
- 业务代码不得直接 `instantiate` 绕过 UI 管理，也不得另建资源、Bundle、音频、事件或对象池管理器复制 MK 能力。



## 验证与工具

- Preview 运行验证遵守父仓 `governance/cocos_preview_verification.md`。
- AI 辅助编辑使用父仓 `P8000/cocos-mcp/`（Creator 3.8.8 MCP）；不得通过 Dashboard 或其他 Creator 工程绕过项目身份门。
- 各产品的 typecheck / smoke 命令与 Node、Creator 版本以产品 README/配置为准；当前环境不在声明范围时，结果只能作为兼容性提示，不能替代该范围内的验证。
- 修改 TypeScript 后，先运行项目约定的命令行验证，再确认 Creator 编译诊断无错误，最后执行受影响路径的 Preview。三者分别证明静态类型、Creator 导入/组件注册与运行行为，不可相互替代。



## 禁止事项

- 不为一次性需求创建抽象层或可配置性（与 [general-code.md](general-code.md) 一致）。



## 官方稳定版安装与证据

固定安装流程（2026-08-27 核对）：

1. 从 [Cocos Store 应用 6426](https://store.cocos.com/app/detail/6426) 获取插件并通过 Cocos Dashboard 安装到目标项目。
2. 在 `extensions/MKFramework` 执行 `npm i`，然后启动或重启 Creator。
3. 在 Creator 顶部菜单选择“扩展 / MKFramework / 安装框架 / 稳定版本”，完成后重启 Creator。

当前官方稳定证据：插件 `v1.0.8`，Store 标注 Creator 最低版本 `v3.8.6`；P0002 产品接入仍必须以目标项目实际 Creator 版本验证。升级前必须重新记录精确版本、Cocos Store 来源、Creator 兼容范围、核对日期及 Runtime/产品证据。

官方依据：[安装](https://mkframework.muzzik.cc/docs/getting-started/install)、[UI 管理](https://mkframework.muzzik.cc/docs/getting-started/quick-start-guide/ui-manage)、[Bundle](https://mkframework.muzzik.cc/docs/module/asset/bundle)。不得复制完整示例仓库。
