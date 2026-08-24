# Application Layer（应用编排层）

## 1. 定位

Application Layer 用于协调跨 Feature 的完整业务用例。

例如：

```text
购买
制作
赠礼
副本结算
每日结算
奖励发放
```

## 2. 为什么需要

Event Bus（事件总线）不能承担事务。

例如购买必须保证：

```text
检查余额
检查背包容量
扣除货币
增加物品
发布完成事件
```

不能只靠多个 Event 松散拼接。

## 3. 职责

```text
Command orchestration（命令编排）
Query validation（查询校验）
Transaction boundary（事务边界）
Execution ordering（执行顺序）
Error translation（错误转换）
```

## 4. 不负责

```text
伤害公式
掉落公式
关系计算
成长公式
具体 Feature 内部状态
```
