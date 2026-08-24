# FrameworkAssemblySpec（框架装配规格）

## 1. 与 GameSpec 的区别

GameSpec 回答：

> 做什么游戏。

FrameworkAssemblySpec 回答：

> 这个游戏如何使用 Framework 实现。

## 2. 机器合同

机器入口为 [`../specs/framework-assembly-spec-v1.schema.json`](../specs/framework-assembly-spec-v1.schema.json)。

FrameworkAssemblySpec 只能从已批准 GameSpec 的显式 Framework 请求生成，不得从玩法描述、模型记忆或 Engine Compatibility 条目猜测能力或引擎。它必须绑定：

```text
GameSpec SHA-256 / Revision
GameSpec Approval Receipt SHA-256
Framework ID / Version Constraint
Manifest Schema / SHA-256
P0002 Git Revision
Required Maturity
Required Capability / Feature / Ruleset
```

Resolver 判断结果不写回 FrameworkAssemblySpec，而进入独立的 Framework Gap receipt。

## 3. 设计扩展字段

```text
Framework Version Constraint
Product Archetype
Required Feature Packs
Required Features
Optional Features
Disabled Features
Ruleset Bindings
Capability Requirements
Feature Configuration
Content Packages
Presentation Profile
Custom Extensions
Compatibility Constraints
Acceptance Contracts
```

上述机器合同是 v1 最小闭环；以下字段待有真实消费者后再扩展：Optional / Disabled Features、Feature Configuration、Content Packages、Presentation Profile、Custom Extensions、Compatibility Constraints、Acceptance Contracts。

## 4. 使用者

```text
Supervisor
Code Agent
QA Agent
Evaluator
Integration
```

均应读取同一份 FrameworkAssemblySpec。
