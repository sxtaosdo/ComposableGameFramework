# Framework Contract Verification（框架合同验证）

## 1. 位置

分为两道只读门禁：

```text
已批准 GameSpec
↓
FrameworkAssemblySpec / Resolver / Gap Receipt
↓
项目创建与 CODE 调度前门禁

Integration
↓
最终 Game Acceptance 前合同复验
```

前置门禁阻止未满足的框架需求产生 Runtime 副作用；后置门禁验证实际集成结果没有偏离同一合同快照。

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

当前只有 `core.entity-identity-registry` 达到 `IMPLEMENTED`，Framework 顶层和其余能力仍为 `DESIGN_ONLY`。装配请求超出该 Core 能力时，验证器的正确结果仍是明确缺口或 `BLOCKED`，不是装配通过。

Reverse-Spec receipt 证明产品需求依据；Framework Gap receipt 证明 P0002 能否满足已批准需求。二者必须独立保存，任一失败都不能由另一类证据补齐。
