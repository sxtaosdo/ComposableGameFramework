# CHANGELOG（变更日志）

## v1.3.1（FrameworkAssemblySpec v1）

### ADD（新增）

- 新增 `FrameworkAssemblySpec v1` JSON Schema，绑定已批准 GameSpec、批准收据、Manifest SHA-256 与 P0002 Git revision。
- 明确 Framework Gap receipt 与 Reverse-Spec receipt 独立，且装配门禁位于项目创建和 CODE 调度之前。

### CHANGE（修改）

- Resolver 改为消费不可变 FrameworkAssemblySpec，不再把其描述为 Resolver 的隐式生成结果。
- 当前 Framework 与能力仍全部为 `DESIGN_ONLY`；机器 Schema 的存在不代表 Runtime 已实现。

## v1.3（仓库结构收口）

### ADD（新增）

- 冻结首个 Foundation Core 源码基线：TypeScript、Node.js 22、pnpm、Vitest。
- 冻结 `Entity Identity → Entity Registry → Structured Error` 最小协议，并以 `DESIGN_ONLY` 登记到 Manifest。

### CHANGE（修改）

- 将版本化双重嵌套目录提升到仓库根，确立稳定入口。
- 新增根 `VERSION`、`AGENTS.md` 与机器可读 Framework Manifest v1。
- Manifest 明确区分设计、实现、运行验证和产品验收状态，防止设计能力被误判为可装配实现。

## v1.3

### ADD（新增）

- Puzzle / Minigame（益智 / 小游戏）Feature Pack 设计
- Minigame Reference（小游戏参考装配）
- Application Layer（应用编排层）
- Framework Manifest（框架清单）
- Framework Resolver（框架解析器）
- FrameworkAssemblySpec（框架装配规格）
- Framework Gap Analysis（框架缺口分析）
- Framework Contract Verification（框架合同验证）
- Framework Upstream（框架回流）
- AI Game Studio 与 Framework 的确定性合同门禁

### CHANGE（修改）

- AI Game Studio 生产流增加 Framework Resolution / Gap Analysis / Assembly 阶段
- 实施路线增加 Minigame 作为首个非 RPG 纵向验证
- AI 修改策略增加 Protected Core（受保护核心）约束
- Governance（治理）增加 AI / Framework 融合门禁

### DEPRECATE（废弃）

- 无

### REMOVE（删除）

- 无

## 版本策略

后续版本遵守：

```text
旧专题文档不因新增需求无理由重写
新增设计优先新增专题 / 章节
确需修改必须记录 CHANGELOG
REMOVE 必须说明理由
```
