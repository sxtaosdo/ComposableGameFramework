# Architecture Decision Rules（架构决策规则）

## 1. 放哪一层

### Foundation Core（基础核心）

只有满足：

```text
几乎所有产品需要
语义极稳定
没有玩法词汇
长期不应频繁变化
```

才进入 Core。

### Shared Domain（共享领域）

满足：

```text
多个品类复用
属于游戏领域基础能力
不绑定具体玩法规则
```

### Feature（功能模块）

满足：

```text
完整玩法能力
可启停
有明确状态与协议
```

### Ruleset（规则集）

表达：

```text
公式
限制
选择
策略
数值政策
玩法差异
```

### Product Logic（产品逻辑）

只属于当前产品。

## 2. 抽象下沉门槛

至少两个独立 Feature / Product 真实复用后再下沉。

## 3. 直接拒绝的模式

```text
God Manager
全局单例互调
Node 持有业务真相
Feature 私自写磁盘
万能 Action Graph
所有逻辑强行 ECS
事件监听顺序作为业务规则
```

## 4. 新需求评估顺序

出现新需求时按：

```text
现有配置能否表达？
↓
现有 Ruleset 能否表达？
↓
现有 Feature 是否有扩展点？
↓
是否需要 Product Feature？
↓
是否有两个以上场景值得下沉？
↓
最后才考虑 Core 改动
```

## 5. 兼容性原则

核心协议升级必须考虑：

```text
存档
配置
AI GameSpec
测试
Product
```

不能只考虑当前工程编译通过。
