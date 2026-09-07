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

上述限制针对领域数据；Presentation 的场景/Prefab 可以保存所属资源边界内的真实 SpriteFrame 等引擎引用。静态 UI 的组装、动态加载例外与验收见 [Cocos 工程规范](../09-governance/engineering-standards/cocos-creator.md#静态-ui-优先组装)，不得因此引入跨 Bundle 静态引用。

## 4. Bundle（资源包）

由 Product / Presentation Pack 组织：

```text
Common
Region
Character
UI
Feature-specific
```

后续 MKFramework 产品统一通过 `mk.asset` 与 `mk.bundle` 实现资源、Bundle 和场景生命周期；P0002 只保留逻辑资源 ID 与装配合同，不复制同类 Runtime。

## 5. 对象池

后续 MKFramework 产品优先使用其对象池能力，不在 P0002 新建第二套对象池。

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
