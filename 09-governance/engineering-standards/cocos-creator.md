# Cocos Creator 技术规范

状态: Accepted

适用于 Owner 已指定 Cocos Creator 的产品。当前 P0002 兼容证据仍只覆盖 Manifest 声明的 Creator 3.8.8 与既有 Adapter 能力；本文的 MKFramework Provider 规则是后续接入标准，不扩张既有 `VERIFIED` 语义，接入状态为 `NOT_RUN`。

## 语言与组件

- 使用严格类型的 TypeScript；原则上禁止 `any`。语法满足 ES6，不使用过于新或小众、目标 Creator 工具链无法稳定处理的语法。
- Prefab 脚本类名与 `@ccclass` 一致；编辑器引用使用 `@property`，避免硬编码 `find()`。
- `onLoad` 校验编辑器引用，`start` 执行初始化，`onDestroy` 释放订阅；采用 MK 视图基类时按其 `create/open/close` 生命周期完成等价职责。
- 静态 UI 直接在 Prefab 中编排，仅动态内容由代码驱动。
- UI 不持有 Gameplay 状态，只消费 ReadModel / 快照并下发 Command。
- Gameplay Entity、ECS Entity 与 Cocos Node 分离。

## 能力所有权

P0002 持有引擎无关的 Feature、Registry、Command、Query、Event、Save 与 Gameplay 合同。MKFramework 是 Cocos 表现层和基础设施的默认 Capability Provider；其已有 UI、资源、Bundle、音频、事件、视图生命周期、MVC/MVVM、对象池等能力必须优先使用。P0002 只提供标准、合同、验收门和经证明确实缺失的能力，禁止形成第二套同类 Runtime。

适配层只负责把 P0002 Intent / Command / Query / Event 与 MKFramework 表现能力桥接；不得把 MK 的视图事件反向变成 Gameplay 状态权威。

## 固定 API

- 动态 UI 统一使用 `mk.uiManage.regis`、`mk.uiManage.open`、`mk.uiManage.close`。
- 资源统一使用 `mk.asset`。
- Bundle 加载、场景切换与 Bundle 生命周期统一使用 `mk.bundle`。
- 业务代码不得直接 `instantiate` 绕过 UI 管理，也不得另建资源、Bundle、音频、事件或对象池管理器复制 MK 能力。

## Bundle 与资源

- 业务模块按 Bundle 高内聚组织，主包只保留启动壳与公共资源。
- 禁止跨 Bundle 静态引用；`.meta` 与资源一并提交，不手改 UUID 或 Bundle config ID。
- 资源标识保留在领域数据中，引擎对象只存在于 Adapter / Presentation。

## 官方稳定版安装与证据

固定安装流程（2026-08-27 核对）：

1. 从 [Cocos Store 应用 6426](https://store.cocos.com/app/detail/6426) 获取插件并通过 Cocos Dashboard 安装到目标项目。
2. 在 `extensions/MKFramework` 执行 `npm i`，然后启动或重启 Creator。
3. 在 Creator 顶部菜单选择“扩展 / MKFramework / 安装框架 / 稳定版本”，完成后重启 Creator。

当前官方稳定证据：插件 `v1.0.8`，Store 标注 Creator 最低版本 `v3.8.6`；P0002 产品接入仍必须以目标项目实际 Creator 版本验证。升级前必须重新记录精确版本、Cocos Store 来源、Creator 兼容范围、核对日期及 Runtime/产品证据。

官方依据：[安装](https://mkframework.muzzik.cc/docs/getting-started/install)、[UI 管理](https://mkframework.muzzik.cc/docs/getting-started/quick-start-guide/ui-manage)、[Bundle](https://mkframework.muzzik.cc/docs/module/asset/bundle)。不得复制完整示例仓库。
