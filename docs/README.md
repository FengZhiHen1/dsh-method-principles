# dsh-method-principles 设计

## 权威范围

本文是本设计目录的入口，唯一拥有本主题的目录组织、当前状态、阅读顺序、文档地图与已知偏差。需求事实归 `需求.md`，技术选型与版本基线归 `技术栈设计.md`，模块与目录事实归 `项目结构设计.md`，机制事实归 `technical-details/`，选型理由归 `decisions/`，未完成事项归 `TODO.md`。本文不重复定义任何需求或技术事实。

## 当前状态

- 主题：`dsh-method-principles`（向 DSH 系统提示词追加一段方法论原则的薄壳插件，Host bundle 形态）。
- 设计基线：2026-09-08 经用户逐项确认，见 `decisions/`。
- 实现状态：**已实现**（2026-09-08）——包骨架、插件面、按 agent 路由（`Config.routes` + 默认工程块）、五个测试文件（53 例全绿）、分层门禁（core 1 文件）通过。
- 部署状态：**已挂载稳定环境**（2026-09-08）——子仓库已推送 GitHub，`dsh plugin --profile web add github:FengZhiHen1/dsh-method-principles` 成功，lockfile 解析到 commit `a41667e`，`--dump-config` 恰一行。**待用户在 GUI 重启实例后生效**。试验环境实测记录见 `technical-details/部署.md`。

## 阅读顺序

1. `需求.md`：先确认目标、范围、约束与验收条件。
2. `技术栈设计.md`、`项目结构设计.md`：项目级定调，先于机制细节。
3. `technical-details/README.md`：按机制阅读顺序展开。
4. `decisions/`：需要了解决策理由与重访条件时阅读。
5. `TODO.md`：未决与延期事项。

## 文档地图

| 文档 | 唯一权威范围 |
|---|---|
| `需求.md` | 目标、用户与场景、功能需求、约束、非目标与验收条件 |
| `技术栈设计.md` | 语言与运行时、框架与关键库、版本基线、部署目标、兼容与安全约束及选型理由 |
| `项目结构设计.md` | 模块边界、目录组织、依赖方向、命名与全局约定 |
| `technical-details/README.md` | 技术细节目录的阅读顺序与文档地图 |
| `technical-details/提示词段机制.md` | 段注册契约、默认文案、配置解析、装配位置与可见范围、生命周期、失败语义 |
| `technical-details/部署.md` | 包形态、部署通道、实测门禁、验证方法、失败排查、已知限制 |
| `decisions/DSR-001-交付形态与生效范围.md` | 交付形态（全局段）的备选、评价与重访条件 |
| `decisions/DSR-002-文案配置粒度.md` | 文案配置粒度与消融单位的备选、评价与重访条件 |
| `decisions/DSR-003-提示词段落点.md` | 落点选择（注册段 vs 装配事件 vs persona）的备选、评价与重访条件 |
| `decisions/DSR-004-按agent路由.md` | 按 agent 路由的实现形态（单插件装配时求值 vs preset 本地文件）的备选、评价与重访条件 |
| `TODO.md` | 未决与延期事项（仅未完成） |

## 已知偏差与 `missing evidence`

- `missing evidence`：该段落对模型行为的实际影响强度（无量化证据，需消融实验）；不同模型对该文案的响应差异。
- 已知偏差：无（设计与运行时事实在 2026-09-08 对齐）。
