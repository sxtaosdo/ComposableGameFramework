# Interaction（交互）

## 1. 定位

Interaction（交互）是跨品类共享能力。

统一表达：

```text
Actor
↓
Interaction Query
↓
Target
↓
Interaction Options
↓
Intent / Command
```

## 2. 示例

```text
NPC → Talk / Gift / Trade
Crop → Water / Harvest
Chest → Open
Bed → Sleep
Monster → Attack
Door → Enter
Ore → Mine
```

## 3. Interaction Option（交互选项）

每个选项包含：

```text
ID
Display
Condition
Priority
Command Factory
Tags
```

Display 只是表现信息，规则与 UI 解耦。

## 4. Context（上下文）

交互判断可读取：

```text
距离
方向
玩家状态
工具
物品
世界状态
时间
关系
```

## 5. Engine 输入

Collider / Touch 等引擎事件只负责产生 Interaction Intent（交互意图）。

不能直接执行领域修改。

## 6. 多交互目标

应支持：

```text
自动选择最近
按优先级排序
UI 弹出选择
方向筛选
规则筛选
```

## 7. AI 使用

AI Agent 可以和玩家共用同一 Interaction Command，不需要走特殊业务入口。
