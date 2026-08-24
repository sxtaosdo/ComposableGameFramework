# Framework Manifest（框架清单）

## 1. 目的

让 AI Game Studio 在规划前读取真实、机器可读的 Framework 能力，而不是依赖模型记忆或 Markdown 猜测。

当前机器入口固定为仓库根 `VERSION` 与 `manifest.json`；Markdown 只解释合同，不替代机器清单。

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

当前 P0002 只有设计文档，Manifest 中能力均为 `DESIGN_ONLY`，实现、Runtime 验证和产品验收均为 `NOT_*` 状态。
