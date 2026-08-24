# Framework Gap Analysis（框架缺口分析）

## 1. 固定决策顺序

```text
A. Existing Configuration（现有配置）
↓
B. Existing Ruleset（现有规则集）
↓
C. Product Rule（产品规则）
↓
D. Product Feature（产品功能）
↓
E. Framework Feature Extension（框架功能扩展）
↓
F. Shared Domain Extension（共享领域扩展）
↓
G. Foundation Core Change（基础核心修改）
```

越往下风险越高。

## 2. 缺口分类

```text
Config Gap
Ruleset Gap
Product Gap
Framework Gap
Core Gap
```

## 3. 核心原则

单个产品需求默认不得直接修改 Foundation Core。

只有多个独立场景证明底层抽象缺失时，才允许进入 Core 评审。

## 4. 机器回流提案

需要回流 P0002 时使用 [`../specs/framework-change-proposal-v1.schema.json`](../specs/framework-change-proposal-v1.schema.json)。Proposal 只引用 Framework Gap receipt，不合并或改写 Reverse-Spec Gap。

- `Shared Domain / Foundation Core` 提案至少绑定两个独立真实复用场景。
- `Foundation Core` 提案必须显式列出 Protected Area 影响和路径。
- `APPROVED` 需要 Architecture Review 与 Owner Approval receipt。
- `executionAuthorized` 固定为 `false`；Proposal 或批准收据本身不授权 AI 自动修改 Framework。
