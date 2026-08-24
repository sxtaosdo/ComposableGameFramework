# Scene & Resource（场景与资源）

## 1. Scene 不等于 Map

Cocos Scene 是资源载体。

Map 是玩法空间定义。

必须允许二者独立。

## 2. Map Loading（地图加载）

推荐流程：

```text
World Request
↓
Map Resolver
↓
Scene / Chunk Load
↓
Persistent Entity Activate
↓
Runtime Bind
↓
Presentation Ready
```

## 3. Resource Reference（资源引用）

领域数据只保存逻辑资源 ID / Asset Reference。

不能保存引擎对象。

## 4. Bundle（资源包）

由 Product / Presentation Pack 组织：

```text
Common
Region
Character
UI
Feature-specific
```

具体策略后续工程设计。

## 5. 对象池

放在 Runtime / Presentation 侧。

对象池只是优化，不参与业务身份。

## 6. Scene Authoring（场景创作）

编辑器中的 Node / Prefab 可作为：

```text
Static World Authoring
Spawn Marker
Presentation Template
Collider Authoring
```

运行时应转换为框架可识别定义。

## 7. 大地图

第一阶段不做复杂 Streaming，但资源和 Map 概念必须预留分块。
