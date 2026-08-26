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

P10-Cook 已使 Framework 与 Public API 达到 `IMPLEMENTED`，Cocos Creator 3.8.8 compatibility 以及 `core.foundation-primitives`、`core.feature-runtime`、`engine.cocos-adapter-boundary`、`infrastructure.command-query-event`、`infrastructure.data-config`、`infrastructure.save` 达到 `VERIFIED`。该证据只覆盖 P10-Cook DEVELOPMENT 装配；Framework 顶层不晋级 `VERIFIED`，Tile-Match、ARPG、LifeSim 等未覆盖能力不随之晋级，D4/D5 与 Release Gate 仍保持阻断。装配请求超出 Manifest 已声明成熟度和证据层级时，验证器的正确结果仍是明确缺口或 `BLOCKED`。

Reverse-Spec receipt 证明产品需求依据；Framework Gap receipt 证明 P0002 能否满足已批准需求。二者必须独立保存，任一失败都不能由另一类证据补齐。

机器收据入口为 [`../specs/framework-integration-verification-receipt-v1.schema.json`](../specs/framework-integration-verification-receipt-v1.schema.json)。收据必须绑定 GameSpec、FrameworkAssemblySpec、Framework Gap receipt、Manifest SHA-256、P0002 Git revision 与产品候选 revision，并逐项记录 Public API、Engine Compatibility、Forbidden Imports、Protected Paths 和 Authority 检查。

`PASSED` 必须同时满足：所有适用检查非失败、无 Protected Path Mutation、无 failure reason 且 `productionEligible=true`。否则只能输出 `BLOCKED`；缺失收据或绑定漂移同样 fail-closed。
