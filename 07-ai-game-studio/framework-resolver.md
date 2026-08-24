# Framework Resolver（框架解析器）

## 1. 职责

```text
Approved GameSpec
↓
显式 Framework Request
↓
FrameworkAssemblySpec v1
↓
查询 Framework Manifest / Catalog
↓
匹配 Feature
↓
匹配 Ruleset
↓
校验能力成熟度与证据层级
↓
识别缺口
↓
生成 Framework Resolution / Framework Gap Receipt
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

## 3. Fail-closed

- 未出现在 Manifest 的能力必须进入 Framework Gap。
- `DESIGN_ONLY` 与 `DEPRECATED` 能力不得计入已满足集合。
- 要求运行验收时，`IMPLEMENTED` 仍不足，必须达到 `VERIFIED`。
- Resolver 输出必须绑定 Framework version、Manifest SHA-256 与 P0002 Git revision。
- 空装配请求、GameSpec 批准绑定漂移、Manifest snapshot 漂移或 Framework 顶层为 `DESIGN_ONLY` 时必须阻断，不能因没有待解析条目而通过。
- Framework Gap 使用独立 receipt 和原因域；不得与 Reverse-Spec Gap 合并，也不得回写逆向证据。
