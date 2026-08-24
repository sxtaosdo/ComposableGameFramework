# AI Game Studio Integration（AI 游戏工作室集成）

## 1. 目标

AI Game Studio 不再“从零写游戏”，而是基于稳定框架进行装配与内容生成。

流程：

```text
Product Archetype（产品原型）
↓
Feature Pack
↓
Ruleset
↓
Content
↓
Schema / DSL
↓
Custom Logic（必要时）
↓
Validation
↓
Runtime Verification
```

## 2. AI 适合做

```text
选择功能组合
生成配置
生成内容
生成任务
生成对话
生成 Item / Skill / NPC
生成 Ruleset Parameter
生成 Level Data
```

## 3. AI 不应直接修改

```text
Foundation Core
Entity Identity
Feature Lifecycle
Save Coordinator
Cross-feature Contract
Registry Core
```

这些属于受保护协议。

## 4. 验证

AI 生成物必须经过：

```text
Schema Validation
Reference Validation
Feature Dependency Validation
Ruleset Compatibility
Content Validation
Runtime Smoke
```

## 5. Repair（修复）

AI 修复优先顺序：

```text
数据
Ruleset Parameter
Product Logic
Feature Extension
```

最后才允许触碰更底层框架。
