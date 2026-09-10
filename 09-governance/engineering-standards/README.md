# Engineering Standards（工程规范）

状态: Accepted

P0002 是 shidai3 各游戏仓库的技术规范权威；具体产品仍须由 Owner 在 Accepted 文档中指定引擎，shidai3 不设全局默认引擎。

- [通用编码规范](general-code.md)
- [Cocos Creator 规范](cocos-creator.md)
- [Godot 规范](godot.md)
- [Git 规范](git.md)
- [迁移映射](source-map.json)

本目录只承载技术规范。Agent、审查、直提分支、单轮闭环等生产治理仍由父仓与 P0003 管理。

Git / 版本技术合同见 [git.md](git.md)：业务仓必须独立 Git 仓库并统一采用 `X.Y.Z.W` 版本门；P0002 Framework 仓例外，继续使用三段 SemVer。
