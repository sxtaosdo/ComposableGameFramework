# Data / Config / DSL（数据 / 配置 / 领域描述）

## 1. Data-driven（数据驱动）

优先数据化：

```text
Attribute
Item
Skill
Effect
NPC
Monster
Crop
Fish
Quest
Dialogue
Loot
Recipe
Schedule
Ruleset Parameter
Level Data
```

## 2. 不追求 100% 配置化

新机制仍允许写扩展逻辑。

规则：

```text
稳定内容 → 数据
稳定机制 → Feature
产品差异 → Ruleset
真正独有 → Product Logic
```

## 3. Schema（结构协议）

第一阶段先做严格 Schema，不做完整脚本语言。

每份配置必须经过：

```text
Schema Validation
Reference Validation
Range Validation
Tag Validation
Dependency Validation
Compatibility Validation
```

## 4. Registry（注册表）

建议建立：

```text
Tag Registry
Attribute Registry
Item Registry
Effect Registry
Feature Registry
Ruleset Registry
Entity Definition Registry
```

用于唯一性与引用解析。

## 5. ID 规范

定义类 ID 必须：

```text
稳定
唯一
可读
与资源路径解耦
```

不能把 Cocos UUID 当领域 ID。

## 6. DSL（领域描述语言）

后期可以在 Schema 基础上形成 DSL，但必须满足：

```text
可验证
可版本化
可追踪
可由 AI 生成
```

避免演化成隐式通用脚本语言。

## 7. AI 生成

AI 优先生成：

```text
Content Data
Ruleset Parameters
Quest
Dialogue
Item
Skill
NPC
Schedule
```

所有生成内容先验证，再进入 Runtime。
