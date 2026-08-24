# World & Time（世界与时间）

## 1. World（世界）高于 Map（地图）

推荐：

```text
World
├── World State（世界状态）
├── Time（时间）
├── Calendar（日历）
├── Environment（环境）
├── Region（区域）
├── Map（地图）
├── Population（实体集合）
├── Global Flags（全局标记）
└── Persistent State（持久状态）
```

Map 只是世界空间的一种表达。

## 2. Region / Map / Scene（区域 / 地图 / 场景）

### Region（区域）

逻辑世界分区：

```text
Town
Farm
Forest
Desert
Dungeon Zone
```

### Map（地图）

玩法空间定义。

### Scene（场景）

Cocos Creator 资源概念。

必须允许：

```text
一个 Map 对应一个 Scene
多个 Map 共用一个 Scene
一个 Map 使用多个 Scene Chunk（场景分块）
```

因此 Map 不能和 Scene 绑定为同一概念。

## 3. World State（世界状态）

保存跨地图信息：

```text
当前时间
季节
天气
节日
Boss 状态
区域解锁
剧情 Flag
全局变量
世界事件
```

## 4. Time（时间）

框架不能只有一个 Timer。

建议支持：

```text
RealTimeClock（现实时间）
GameTimeClock（游戏时间）
WorldClock（世界时间）
CombatClock（战斗时间）
UIClock（界面时间）
```

不同 Clock 支持：

```text
暂停
倍率
独立推进
同步
```

## 5. Calendar（日历）

生活模拟启用：

```text
Minute
Hour
Day
Week
Season
Year
```

典型事件：

```text
MinuteAdvanced
HourChanged
DayStarted
DayEnded
SeasonChanged
YearChanged
```

ARPG 可以不启用完整 Calendar。

## 6. Schedule（日程）

Schedule 使用 Time + World State 计算目标：

```text
目标地点
目标行为
活动窗口
条件
例外
```

不直接操纵 Node。

## 7. Offline / Inactive Simulation（离线 / 非活跃模拟）

非当前地图实体不应持续执行完整 ECS Tick。

根据 Feature 采用：

```text
事件式推进
时间跳跃结算
休眠状态推导
```

例如作物按 DayStarted 结算生长，而不是离屏后每秒 Tick。

## 8. World Streaming（世界流式加载）

第一阶段只保留边界：

```text
Region Activate
Map Load
Map Unload
Entity Activate
Entity Hibernate
```

暂不实现大型开放世界流式系统。

## 9. Day Transition（每日切换）

生活模拟中的每日切换属于 Workflow（工作流），统一协调：

```text
停止玩家输入
当日结算
作物成长
NPC 日程刷新
商店刷新
世界事件推进
生成下一日
保存
```

不能让各 Feature 私自决定日切顺序。
