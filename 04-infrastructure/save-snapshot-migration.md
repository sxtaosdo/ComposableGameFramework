# Save / Snapshot / Migration（存档 / 快照 / 迁移）

## 1. 原则

Feature 不允许直接写磁盘。

统一：

```text
Feature Serializable State
↓
Save Coordinator（存档协调器）
↓
Snapshot（快照）
↓
Storage Adapter（存储适配器）
```

## 2. Feature Save Boundary（存档边界）

例如：

```text
Inventory
Quest
World
Farming
Relationship
Progression
```

各自拥有状态定义，但不拥有文件系统。

## 3. Snapshot（快照）

快照应包含：

```text
Framework Version
Product Version
Save Schema Version
Feature Versions
Timestamp
Entity Registry State
World State
Feature States
Checksum / Integrity
```

## 4. Consistency（一致性）

保存必须形成逻辑一致的世界视图。

不能出现：

```text
背包已保存
任务未保存
世界时间保存失败
```

## 5. Migration（迁移）

从第一版支持：

```text
版本检测
逐版本迁移
兼容检查
拒绝加载
备份
```

## 6. Recovery（恢复）

建议支持：

```text
主快照
上一份安全快照
临时写入
原子替换
```

## 7. Autosave（自动保存）

由 Product / Ruleset 决定触发策略：

```text
地图切换
日切
关键任务
定时
手动
```

Feature 只能请求保存，不决定写盘时机。

## 8. 调试快照

开发期支持导出可读 Snapshot Summary，用于问题复现。
