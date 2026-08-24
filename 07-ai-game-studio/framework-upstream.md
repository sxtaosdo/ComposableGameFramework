# Framework Upstream（框架回流）

## 1. 目的

避免把单个 Product（产品）的业务需求过早塞进 Framework。

## 2. 推荐流程

```text
Product Feature
↓
真实产品验证
↓
第二个独立复用场景
↓
Framework Candidate
↓
Architecture Review
↓
抽象
↓
进入 Framework
↓
原 Product 改为引用标准 Feature
```

## 3. 门槛

回流能力必须满足：

```text
至少两个独立真实场景
语义稳定
生命周期稳定
Owner / Authority 清晰
无产品专属命名
可独立测试
```

## 4. Proposal 合同

机器入口为 [`../specs/framework-change-proposal-v1.schema.json`](../specs/framework-change-proposal-v1.schema.json)。Framework Gap 只能先生成 Review Proposal，不得直接生成 Framework 修改任务；Protected Core、Save Protocol、Entity Identity、Feature Lifecycle、Command Contract 与 Registry Protocol 始终需要独立架构 Review 和 Owner 授权。

Proposal 的 `executionAuthorized` 永远为 `false`。即使 Proposal 状态为 `APPROVED`，后续实现仍需独立任务范围、允许路径、验证器和回滚方案。
