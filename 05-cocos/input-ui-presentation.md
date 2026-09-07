# Input / UI / Presentation（输入 / UI / 表现）

## 1. Input（输入）

```text
Raw Input
↓
Input Mapping
↓
Intent / Command
↓
Game Logic
```

玩家、AI、自动测试可以共用业务入口。

## 2. UI（界面）

UI 不直接修改 Domain State。

UI 制作遵循 [Cocos 工程规范：静态 UI 优先组装](../09-governance/engineering-standards/cocos-creator.md#静态-ui-优先组装)：固定结构、布局和图片引用优先保存在场景/Prefab，动态数据和换图复用已有节点；重复条目按项目框架实例化预制结构，保留有实际理由的运行时例外。

后续 MKFramework 动态 UI 统一使用 `mk.uiManage.regis/open/close`；不得直接实例化 Prefab 绕过管理层。此规则不代表当前已完成 MKFramework Runtime 接入。

推荐：

```text
UI Command
↓
Domain
↓
Event / Query
↓
UI Refresh
```

## 3. Presentation Pack（表现包）

分为：

```text
UI Theme
VFX Theme
Audio Theme
Character Theme
Environment Theme
Camera Theme
```

## 4. 表现与规则分离

同一 Ability 可以换：

```text
传奇风格
暗黑风格
仙侠风格
像素风格
```

而不修改 Ability Rule。

## 5. Feedback（反馈）

统一表现事件可驱动：

```text
Hit Feedback
Damage Number
Screen Shake
VFX
SFX
UI Notification
```

## 6. Localization（本地化）

领域数据尽量保存 Localization Key（本地化键），不直接保存最终显示文本。
