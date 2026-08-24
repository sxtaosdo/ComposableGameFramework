# Engine Boundary（引擎边界）

## 1. 原则

Cocos Creator 是第一套 Engine Adapter（引擎适配器），不是 Core（核心）。

业务层不得依赖：

```text
Node
Component
Prefab
Scene
PhysicsSystem
AssetManager
```

作为核心状态类型。

## 2. Engine Adapter 提供

```text
Rendering（渲染）
Input（输入）
Physics（物理）
Navigation（导航）
Audio（音频）
Asset Loading（资源加载）
Scene Loading（场景加载）
Animation（动画）
Platform Service（平台能力）
```

## 3. 输入边界

```text
Touch / Keyboard / Gamepad
↓
Engine Adapter
↓
Intent / Command
↓
Game Logic
```

禁止业务直接轮询输入设备。

## 4. 物理边界

业务只认识：

```text
Raycast Query
Overlap Query
Collision Result
Movement Constraint
```

不直接认识具体 Cocos 物理 API。

## 5. 资源边界

业务只保存 Asset Reference（资源引用），不保存引擎资源对象。

Engine Adapter 负责：

```text
加载
卸载
缓存
Bundle
对象池
生命周期
```

## 6. Headless（无渲染）目标

Domain Rule（领域规则）与大部分 Feature 应可以在没有 Cocos Scene 的环境中进行测试和模拟。

## 7. 未来多人边界

第一阶段不实现网络，但：

```text
Command
Entity ID
Snapshot
World State
Ruleset
```

不得和本地进程强绑定。

未来可加入：

```text
Authority
Replication
Prediction
Reconciliation
```
