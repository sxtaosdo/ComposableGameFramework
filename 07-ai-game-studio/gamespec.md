# GameSpec（游戏规格）

## 1. 定位

GameSpec 是 AI Game Studio 与框架之间的产品装配合同。

它不应描述引擎内部实现细节。

## 2. 建议顶层结构

```text
Product Identity
Target Platform
Presentation Profile
Feature Packs
Features
Rulesets
Content Packages
World Profile
Progression Profile
Save Profile
Performance Profile
Acceptance
Custom Extensions
```

## 3. Feature 声明

GameSpec 明确：

```text
启用哪些 Feature
禁用哪些 Feature
Ruleset 绑定
依赖版本
可选能力
```

## 4. World Profile

包含：

```text
World Type
Regions
Maps
Clock
Calendar
Persistence
Streaming Level
```

## 5. Acceptance（验收）

每个 Product 至少有：

```text
Functional Acceptance
Ruleset Acceptance
Save Acceptance
Performance Acceptance
Presentation Smoke
Regression Reference
```

## 6. Custom Extension

明确允许有限扩展：

```text
Product Rule
Product Feature
Custom Effect
Custom Workflow
```

但必须声明边界和依赖。
