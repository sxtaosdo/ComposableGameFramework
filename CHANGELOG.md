# CHANGELOG（变更日志）

## v2.0.0（Creator 原生扩展）

### BREAKING CHANGE（破坏性修改）

- P0002 作为 `shidai3` Creator 扩展交付；产品从 `db://shidai3/index` 与 `db://shidai3/minigame/index` 导入，不再通过 npm 包名或 `node_modules` 消费框架。
- 框架源码唯一维护于扩展 `assets/`，Node Headless 构建与测试直接消费同一份源码。

### ADD（新增）

- `StateMachine<T>` 新增只读 `current` 与 `is(StateClass)`；Context 由产品自行定义，不要求 Presenter。
- 明确页面身份唯一来源规则只适用于采用 `CasualLevelSession` 的关卡型小游戏，不扩张为所有产品约束。

## v1.6.7（Cocos 状态、MK 与测试边界）

### CHANGE（修改）

- 明确功能 MVC、玩法 Model、AppModel 的状态边界：AppModel 只会话，PageState/弹窗直接调用玩法 Model 的具名命令，产品专有玩法不提前抽取通用接口。
- 已接入 MKFramework 的项目直接使用 MK UI、资源、Bundle、音频、事件、对象池和 MVC；动态弹窗采用 Control/Model/View 三件套，禁止仅转发 MK 的产品包装类。
- 启动资源加载归 LoadingState；测试目录、文件、类和对外自动化方法采用可识别的 `test` / `Test` 命名。

## v1.6.6（小游戏关卡会话接口）

### ADD（新增）

- 新增 `@shidai3/composable-game-framework/minigame` 子路径与 `CasualLevelSession`：关卡型 Puzzle / Minigame 的主玩法会话（Loading → Home → Play → Retry / Next / Home）。
- 该接口不从包根导出，不进入全局 Runtime；明确不适用于 MMO、MUD、ARPG、开放世界或持久角色会话。

## v1.6.5（Cocos 弹窗编排边界澄清）

### CHANGE（修改）

- 澄清弹窗目录约束不要求从页面 State 抽出打开、关闭或事件后的流程编排；`script/` 要求收纳弹窗专用 MVC，专用 Controller/Host 只在实际存在时归入该目录。

## v1.6.4（Cocos 弹窗功能目录）

### CHANGE（修改）

- 规定每个弹窗以独立功能目录交付：`script/` 汇集专用 MVC 与编排脚本，`prefab/` 汇集预制体，`image/` 汇集专用图片；共享 UI 服务和真正共享图片允许保留在共享目录。

## v1.6.3（Cocos 状态 Owner 与验证链）

### CHANGE（修改）

- 要求会话/页面流程、玩法模拟与表现/UI 状态各有唯一 Owner；Application、Presenter、Controller 只能通过具名入口编排，视图事件不得成为业务状态权威。
- 明确 Cocos 代码验证须区分项目声明工具链内的命令行校验、Creator 编译诊断和 Preview 运行验证；宿主版本不在项目声明范围内时不可替代正式验证。

## v1.6.2（Cocos 弹窗生命周期规范）

### CHANGE（修改）

- 规定弹窗由既有 UI 管理器串行协调异步打开、关闭与销毁：打开成功后才暴露交互，关闭时解除本控制器事件，交错请求不得保留过期视图或触发已关闭弹窗的业务命令。
- 增加最小验收链：覆盖打开、关闭、再次打开，检查运行错误、重复事件和最终视图唯一性；不新增 P0002 UI Runtime。

## v1.6.1（Cocos 配置与主流程规范）

### CHANGE（修改）

- Cocos 可编辑业务配置统一外置为所属 Bundle 的 JSON，并要求加载后的运行时校验与 Loading 阻断。
- 一级页面流程统一采用产品状态机的直接状态类切换；补充非弹窗业务目录拆分和测试桥接隔离规则。

## v1.6.0（通用状态机 Runtime）

### ADD（新增）

- 新增引擎无关的 `IState<T>` / `StateMachine<T>` 公共 API：状态按类构造、注入 Context，并支持异步进入、退出、全局状态、更新与统一释放。
- 状态机不提供状态栈或回滚；页面、玩法与其他产品状态仍由各产品定义，Framework 只维护通用生命周期机制。

## v1.5.2（工程规范细则回填）

### CHANGE（修改）

- 按原文回填通用编码、Cocos、Godot、Git 技术细则与原章节结构；迁移时新增的 MK Provider、分辨率与安装证据保留。
- 单轮闭环、父仓四段版本与直提分支仍排除，权威指向父仓 `AGENTS.md` 与 P0003。

## v1.5.1（工程规范权威迁移）

### ADD（新增）

- 将 shidai3 四份根工程规范的有效技术内容迁入 `09-governance/engineering-standards/`，并以机器映射区分迁移、替换与生产治理排除项。
- 固定 MKFramework 官方稳定安装、版本、来源与 Creator 兼容证据要求。
- 新增工程规范来源覆盖、相对链接与 Protected Core 零变化校验。

### CHANGE（修改）

- MKFramework 成为后续 Cocos 表现层/基础设施的规范性默认 Provider；P0002 禁止复制其已有 Runtime 能力。
- 补齐原根 Cocos 规范中的默认单场景、移动端 `750×1334` 与父仓 Creator MCP 验证工具约束。
- 当前 Cocos `VERIFIED` 证据语义不变；MKFramework Runtime 接入与产品验收仍为 `NOT_RUN`。
- P0002 继续使用三段 SemVer；父仓专用四段版本与生产治理不迁入。

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
