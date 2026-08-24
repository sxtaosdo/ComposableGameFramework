# FrameworkAssemblySpec（框架装配规格）

## 1. 与 GameSpec 的区别

GameSpec 回答：

> 做什么游戏。

FrameworkAssemblySpec 回答：

> 这个游戏如何使用 Framework 实现。

## 2. 建议结构

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

## 3. 使用者

```text
Supervisor
Code Agent
QA Agent
Evaluator
Integration
```

均应读取同一份 FrameworkAssemblySpec。
