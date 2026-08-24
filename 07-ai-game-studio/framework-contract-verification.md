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

还必须验证 Manifest snapshot SHA-256、P0002 Git revision、能力成熟度和证据层级，防止运行期间读取到漂移的外部合同。

## 3. 原则

这些检查尽量由确定性程序完成，而不是交给 LLM 主观判断。

当前 P0002 能力均为 `DESIGN_ONLY`，因此验证器的正确结果是明确缺口或 `BLOCKED`，不是装配通过。
