# Acceptance Plan（验收规划）

## 1. 总体目标

框架验收不是看类数量，而是看：

> 多个差异明显产品能否稳定装配，并保持 Core 不被产品逻辑污染。

## 2. Core Acceptance（核心验收）

必须满足：

```text
不依赖 Cocos Node
不出现 Legend / Diablo / Farming 等具体业务词
Command / Query / Event 协议稳定
Entity Identity 稳定
Feature Lifecycle 稳定
Save Contract 稳定
```

## 3. Feature Acceptance（功能模块验收）

每个 Feature 验证：

```text
依赖声明
生命周期
Command
Query
Event
Save Boundary
Deactivate / Reactivate
Failure Model
```

## 4. Legend Acceptance

至少验证：

```text
实时战斗
技能
Boss
装备掉落
强化
地图切换
存档
```

## 5. Diablo Acceptance

至少验证：

```text
随机词缀
Build
复杂 Modifier
Dungeon
高密度怪群
高频 Loot
确定性随机
```

## 6. LifeSim Acceptance

至少验证：

```text
日历
日切
种植
钓鱼
采矿
NPC 日程
关系
对话
持久世界
非活跃实体休眠
```

## 7. Hybrid Acceptance

组合 ARPG + LifeSim 时：

```text
不修改 Core
不产生循环 Feature 依赖
不让 Farming 依赖 Combat
不让 Relationship 依赖 Node
```

## 8. Save Acceptance

验证：

```text
完整快照
跨版本迁移
失败恢复
多 Feature 一致性
```

## 9. Debug Acceptance

必须能解释：

```text
伤害来源
属性来源
技能失败原因
作物未成长原因
NPC 日程异常原因
任务未推进原因
```

## 10. AI Game Studio Acceptance

AI 生成产品时：

```text
Feature 组合合法
Schema 合法
引用完整
规则测试通过
运行冒烟通过
核心协议未被修改
```


## Minigame Acceptance（小游戏验收）

```text
Board / Tile 状态正确
Ruleset 可替换
关卡数据化
Headless 可完整运行
Save / Retry / Restore 可恢复
不依赖 RPG Feature
不修改 Foundation Core
```

## Framework × AI Game Studio Acceptance（框架与 AI 游戏工作室融合验收）

```text
AI 规划前读取真实 Framework Manifest
GameSpec 与 FrameworkAssemblySpec 分离
Gap Analysis 结果结构化
普通生产 Agent 不得修改 Protected Core
Integration 后执行 Framework Contract Verification
```
