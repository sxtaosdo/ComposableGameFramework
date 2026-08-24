# Framework Resolver（框架解析器）

## 1. 职责

```text
GameSpec
↓
提取 Gameplay Capability（玩法能力）
↓
查询 Framework Manifest / Catalog
↓
匹配 Feature
↓
匹配 Ruleset
↓
识别缺口
↓
生成 FrameworkAssemblySpec
```

## 2. Framework Architect Agent（框架架构 Agent）

建议在 Producer / Planner 与 Code / QA 之间增加该角色。

它负责：

```text
Capability Mapping
Feature Selection
Ruleset Selection
Dependency Validation
Gap Classification
Assembly Planning
```

不负责直接写产品代码。
