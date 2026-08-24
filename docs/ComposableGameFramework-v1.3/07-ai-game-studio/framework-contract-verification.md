# Framework Contract Verification（框架合同验证）

## 1. 位置

AI Game Studio 的 Integration（集成）之后、最终 Game Acceptance（游戏验收）之前。

## 2. 确定性门禁

```text
Framework Version Match
Feature Version Match
Dependency Graph Valid
Ruleset Binding Valid
Capability Requirements Satisfied
Save Schema Compatible
No Forbidden Imports
No Protected Core Mutation
No Authority Violation
```

## 3. 原则

这些检查尽量由确定性程序完成，而不是交给 LLM 主观判断。
