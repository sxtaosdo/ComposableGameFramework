# CHANGELOG（变更日志）

## v1.5.0（Framework MVP 实现切片）

### ADD（新增）

- 实现确定性 Clock / Random、Tag、Command / Query / Event 与结构化失败协议。
- 实现 Feature 依赖解析、生命周期、Capability Registry、Data 校验和统一 Snapshot 协调。
- 新增无 `cc` 依赖的 Cocos Creator Adapter 边界，以及可 Headless 执行的 Tile-Match 纵向切片。
- 新增显式根 Public API、快速接入说明和 Core / Runtime / Save / Adapter / Sample 测试。

### CHANGE（修改）

- MVP 已实现能力以单项 `IMPLEMENTED` 证据登记；Framework 顶层、Cocos Runtime Compatibility 与 Product Acceptance 仍保持 `DESIGN_ONLY` / `NOT_RUN`。
- `core.entity-identity-registry` 保持既有受保护实现，不引入产品逻辑。
- Feature 注册副作用改由 Runtime 作用域统一清理，并补齐注册失败回滚测试。
- Cocos Adapter 增加 Creator Component 生命周期、Node 与 Input event 静态集成边界；Creator Runtime 仍未运行。

## v1.4.1（Framework 生产门禁合同）

### ADD（新增）

- 新增 `Framework Manifest v1`、`Framework Integration Verification Receipt v1` 与 `Framework Change Proposal v1` JSON Schema。
- 补齐已批准 GameSpec 到不可变 FrameworkAssemblySpec、Framework Gap 与集成后只读复验的合同。

### CHANGE（修改）

- `FrameworkAssemblySpec v1` 要求来自 Owner 已批准 GameSpec 的显式 Engine Selection，并采用精确 Framework 版本语义。
- Framework 顶层、Public API 与 Engine Compatibility 继续 `DESIGN_ONLY`；既有 `core.entity-identity-registry` 单项保持 `IMPLEMENTED`，不得据此放行完整 Framework 装配。
- Framework Change Proposal 固定为 Review 输入，不授权 AI 修改 Protected Core。

## v1.4（Foundation Core 首个源码切片）

### ADD（新增）

- 新增 TypeScript + Node.js 22 Headless 工程与 pnpm / Vitest 验证链。
- 实现不透明 `EntityId`、通用 `EntityRegistry` 与结构化 Result / Error。
- 覆盖无效 ID、注册、查询、移除、重复注册、目标不存在与 `undefined` Payload。

### CHANGE（修改）

- `core.entity-identity-registry` 从 `DESIGN_ONLY` 晋级为 `IMPLEMENTED`。
- Framework 整体继续保持 `DESIGN_ONLY`；Engine Runtime 与产品验收继续保持 `NOT_RUN`。

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
