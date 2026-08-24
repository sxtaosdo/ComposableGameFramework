# Framework Manifest（框架清单）

## 1. 目的

让 AI Game Studio 在规划前读取真实、机器可读的 Framework 能力，而不是依赖模型记忆或 Markdown 猜测。

当前机器入口固定为仓库根 `VERSION` 与 `manifest.json`；Manifest 结构 Schema 为 [`../specs/framework-manifest-v1.schema.json`](../specs/framework-manifest-v1.schema.json)。Markdown 只解释合同，不替代机器清单。

## 2. 至少包含

```text
Framework Version
Feature Catalog
Ruleset Catalog
Capability Catalog
Command Catalog
Query Catalog
Event Catalog
Effect Catalog
Save Schema Versions
Compatibility Information
```

## 3. 约束

Framework Manifest 是 AI Game Studio 的规划输入合同。

任何 Feature / Ruleset 变更都必须同步更新 Manifest。

每个能力必须声明 `DESIGN_ONLY / IMPLEMENTED / VERIFIED / DEPRECATED`。`DESIGN_ONLY` 只证明设计存在，不得被解析为可装配实现；需要运行验收的产品只能消费 `VERIFIED` 能力。

`IMPLEMENTED` 条目必须携带可定位的源码、测试与验证命令。单个能力实现时，Framework 整体状态可以继续保持 `DESIGN_ONLY`，全局实现证据使用 `PARTIALLY_IMPLEMENTED`，防止局部源码被误判为完整框架交付。

当前只有 `core.entity-identity-registry` 达到 `IMPLEMENTED`；其余能力仍为 `DESIGN_ONLY`。Engine Runtime 验证和产品验收仍为 `NOT_RUN`。

## 4. 成熟度证据

- `IMPLEMENTED` 必须绑定可定位的源码、测试与验证命令；进入产品装配前还必须具备实现 receipt、源码 revision 与非空 Public API。Engine Adapter 还必须声明 Adapter Public API。
- `VERIFIED` 在 `IMPLEMENTED` 基础上还必须绑定 Runtime Verification receipt。
- Framework 顶层为 `DESIGN_ONLY` 时，即使单项 Capability 已 `IMPLEMENTED`，Resolver 仍必须全局 fail-closed；Protected Path Rules 使用 `DENY_ALL_FRAMEWORK_MUTATION`。
- Framework 进入 `IMPLEMENTED / VERIFIED` 前，必须先声明实际源码布局对应的 Protected Path Rules；不得根据未来目录猜测路径。

Engine Compatibility 只是可验证的兼容目录。它不能替 Owner 选择引擎；`DESIGN_ONLY` Engine 条目也不能用于创建 Runtime 项目。
