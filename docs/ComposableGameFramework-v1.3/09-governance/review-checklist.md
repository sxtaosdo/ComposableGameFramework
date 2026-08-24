# Architecture Review Checklist（架构审查清单）

## Core（核心）

- [ ] 是否出现具体玩法业务词汇？
- [ ] 是否依赖 Cocos Node / Scene / Prefab？
- [ ] 是否有稳定 ID 与 Registry？
- [ ] 是否存在结构化 Error Model？
- [ ] 是否存在可注入 Random Source？

## Feature（功能模块）

- [ ] 是否声明 Requires / Optional / Provides / Conflicts？
- [ ] 是否可独立 Activate / Deactivate？
- [ ] 是否有明确 Owner？
- [ ] 是否通过 Command / Query / Event 对外？
- [ ] 是否直接修改其他 Feature 状态？
- [ ] 是否直接写存档文件？

## Entity（实体）

- [ ] Game Entity / ECS Entity / Node 是否混淆？
- [ ] 状态是否存在多个 Authority？
- [ ] 非活跃实体是否能休眠？
- [ ] Cocos UUID 是否错误地成为业务 ID？

## World（世界）

- [ ] Map 是否被绑定成 Scene？
- [ ] Time / Calendar 是否被写死在单一全局 Timer？
- [ ] 日切是否有统一 Workflow？
- [ ] 非活跃地图状态是否可推进？

## Save（存档）

- [ ] 是否统一 Snapshot？
- [ ] 是否有版本号？
- [ ] 是否有 Migration？
- [ ] 是否能恢复失败写入？
- [ ] 跨 Feature 是否一致？

## Runtime（运行时）

- [ ] ECS 是否只用于合适场景？
- [ ] 低频业务是否被强行 Tick？
- [ ] 对象池是否污染业务生命周期？
- [ ] 高频位置是否只有一个权威？

## Ruleset（规则集）

- [ ] Feature 与 Ruleset 是否混在一起？
- [ ] 产品差异是否通过 Ruleset 表达？
- [ ] 是否为了某产品修改了通用 Feature 内核？

## AI Game Studio

- [ ] AI 是否优先改数据而不是 Core？
- [ ] AI 生成内容是否经过 Schema 校验？
- [ ] 是否验证引用完整性？
- [ ] 是否验证 Feature Dependency？
- [ ] 是否阻止 AI 自动修改高风险协议？

## Product Regression（产品回归）

- [ ] Legend 产品仍可装配？
- [ ] Diablo 产品仍可装配？
- [ ] LifeSim 产品仍可装配？
- [ ] Hybrid 产品是否产生循环依赖？


## Framework × AI Game Studio（框架与 AI 游戏工作室）

- [ ] AI 规划前是否读取真实 Framework Manifest？
- [ ] GameSpec 与 FrameworkAssemblySpec 是否分离？
- [ ] Gap 是否按 Config → Ruleset → Product → Feature → Domain → Core 分类？
- [ ] 普通生产 Agent 是否禁止修改 Protected Core？
- [ ] Integration 后是否执行 Framework Contract Verification？
- [ ] Product Feature 回流是否满足至少两个真实复用场景？
