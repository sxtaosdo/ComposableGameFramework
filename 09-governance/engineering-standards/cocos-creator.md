# Cocos Creator 技术规范

状态: Accepted

引擎: Cocos Creator 3.8.8 + TypeScript

继承: [general-code.md](general-code.md)（通用编码规范、简洁优先、精准修改）

适用于 Owner 已指定 Cocos Creator 的产品。当前 P0002 兼容证据仍只覆盖 Manifest 声明的 Creator 3.8.8 与既有 Adapter 能力；本文的 MKFramework Provider 规则是后续接入标准，不扩张既有 `VERIFIED` 语义，接入状态为 `NOT_RUN`。

## 适用范围

使用 Cocos Creator 开发的项目。本文档仅适用于项目编码开发工作。

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



## 框架（按项目选用，不混用）

启动、读取配置、打开弹窗须遵循**当前项目**冻结的框架版本与 API，禁止混用第二套同类 Runtime。


| 项目               | 框架                | 说明                                                                                                          |
| ---------------- | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| P4000            | P0002（正式 runtime） | 见 `P4000/docs/runtime/p10_p0002_refactor_contract_v1.json`；`P4000/p10-cook/XFORGE_FREEZE.md` 仅作历史 Review 记录 |
| P1060            | Oops Framework    | 历史资产，extensions 内已集成                                                                                        |
| 其他 / 后续 Cocos 产品 | MKFramework       | [官方文档](https://mkframework.muzzik.cc/docs/introduce) · [GitHub](https://github.com/1226085293/MKFramework)  |


P0002 持有引擎无关的 Feature、Registry、Command、Query、Event、Save 与 Gameplay 合同。对后续 Cocos 产品，MKFramework 是表现层和基础设施的默认 Capability Provider；其已有 UI、资源、Bundle、音频、事件、视图生命周期、MVC/MVVM、对象池等能力必须优先使用。P0002 只提供标准、合同、验收门和经证明确实缺失的能力，禁止形成第二套同类 Runtime。

适配层只负责把 P0002 Intent / Command / Query / Event 与 MKFramework 表现能力桥接；不得把 MK 的视图事件反向变成 Gameplay 状态权威。

## 组件与 Prefab

- 每个 Prefab 对应一个独立脚本；类名与 `@ccclass` 一致。
- 编辑器绑定用 `@property`；避免 `find()` 硬编码查找节点。
- 生命周期：`onLoad` 校验编辑器引用，`start` 执行初始化，`onDestroy` 释放事件订阅；采用 MK 视图基类时按其 `create/open/close` 生命周期完成等价职责。
- 静态 UI 元素直接在 Prefab 上摆放；仅动态内容由代码驱动。



## UI 与场景

- 静态资源直接摆放到场景或预制体中，不要用代码创建

### 设计分辨率

- 移动端：750*1334



### 弹窗

- 每个弹窗为独立 Prefab。
- 通过框架提供的 API 打开 / 关闭，不在业务代码中直接 `instantiate` 绕过管理层。
- 动态 UI 统一使用 `mk.uiManage.regis`、`mk.uiManage.open`、`mk.uiManage.close`。



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
- 各产品的 typecheck / smoke 命令以产品 README 为准；修改后先运行任务约定的命令行验证，再执行 Preview。



## 禁止事项

- 不为一次性需求创建抽象层或可配置性（与 [general-code.md](general-code.md) 一致）。



## 官方稳定版安装与证据

固定安装流程（2026-08-27 核对）：

1. 从 [Cocos Store 应用 6426](https://store.cocos.com/app/detail/6426) 获取插件并通过 Cocos Dashboard 安装到目标项目。
2. 在 `extensions/MKFramework` 执行 `npm i`，然后启动或重启 Creator。
3. 在 Creator 顶部菜单选择“扩展 / MKFramework / 安装框架 / 稳定版本”，完成后重启 Creator。

当前官方稳定证据：插件 `v1.0.8`，Store 标注 Creator 最低版本 `v3.8.6`；P0002 产品接入仍必须以目标项目实际 Creator 版本验证。升级前必须重新记录精确版本、Cocos Store 来源、Creator 兼容范围、核对日期及 Runtime/产品证据。

官方依据：[安装](https://mkframework.muzzik.cc/docs/getting-started/install)、[UI 管理](https://mkframework.muzzik.cc/docs/getting-started/quick-start-guide/ui-manage)、[Bundle](https://mkframework.muzzik.cc/docs/module/asset/bundle)。不得复制完整示例仓库。
