# Cocos Adapter（Cocos 适配层）

## 1. 角色

Cocos Creator 是第一套 Engine Adapter（引擎适配器）。

它负责将框架接口映射到：

```text
Node
Component
Scene
Prefab
Animation
Physics
Audio
Asset Manager
Input
Platform API
```

## 2. Cocos Component（Cocos 组件）

主要承担：

```text
View
Adapter
Binding
Input Bridge
Editor Authoring
```

不承担：

```text
伤害公式
背包事务
任务状态
关系规则
世界持久状态
```

## 3. Input Bridge（输入桥）

Cocos 输入转换为：

```text
Intent / Command
```

业务层不直接读取触摸、键鼠或手柄。

## 4. Physics Adapter（物理适配）

将 Cocos 2D / 3D 物理转换为统一查询结果。

## 5. Audio Adapter（音频适配）

根据表现型 Event 播放声音。

业务 Feature 不引用具体 AudioClip。

## 6. Platform Adapter（平台适配）

未来承载：

```text
存储
震动
剪贴板
设备信息
登录
支付
广告
```

第一阶段只实现产品需要部分。
