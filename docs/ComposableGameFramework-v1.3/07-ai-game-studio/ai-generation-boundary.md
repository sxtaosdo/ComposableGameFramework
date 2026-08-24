# AI Generation Boundary（AI 生成边界）

## 1. 风险等级

### Low Risk（低风险）

AI 可直接生成并自动验证：

```text
Item
NPC
Monster
Crop
Fish
Quest
Dialogue
Loot Table
Recipe
Schedule
Level Data
```

### Medium Risk（中风险）

AI 可生成，但需要更严格校验：

```text
Skill Graph
Effect Combination
Ruleset Parameter
Economy Table
Progression Curve
Dungeon Flow
```

### High Risk（高风险）

默认禁止 AI 自动修改：

```text
Foundation Core
Save Protocol
Entity Identity
Feature Lifecycle
Command Contract
Registry Protocol
Cross-feature Transaction
```

## 2. 升级原则

如果 AI 发现现有 Feature 无法表达需求：

```text
先尝试 Product Rule
再尝试 Product Feature
再考虑 Feature Extension
最后才讨论 Shared Domain / Core
```

## 3. 防止框架腐化

AI 不得因为单个产品需求就：

```text
往 Core 增加业务字段
创建全局 Manager
直接引用 Cocos Node
绕过 Command / Query / Event
修改其他 Feature 内部状态
```

## 4. Evidence（证据）

AI 自动生成或修复后，应产生：

```text
配置校验结果
依赖校验结果
规则测试结果
运行冒烟结果
差异摘要
```
