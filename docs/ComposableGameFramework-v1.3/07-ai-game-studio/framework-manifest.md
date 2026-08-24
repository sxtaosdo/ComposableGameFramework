# Framework Manifest（框架清单）

## 1. 目的

让 AI Game Studio 在规划前读取真实、机器可读的 Framework 能力，而不是依赖模型记忆或 Markdown 猜测。

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
