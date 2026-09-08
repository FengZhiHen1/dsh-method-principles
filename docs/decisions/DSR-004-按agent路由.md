# DSR-004：按 agent 路由——单插件 + 装配时求值

## 一行式速览

- **决定**：内容全部留在本插件（基础文案 + `Config.routes`），由段的文本函数在装配时按 preset 与委派深度决定给谁看；不使用 preset 本地插件文件。
- **理由**：内容只有一个权威位置（可版本化、可测试、可 diff），无需复制官方 preset，子代理排除由机制保证而非文案自觉。
- **被否决项**：preset 目录内放 `rigor.mjs`（内容散落 HOME、需复制随包 preset、三处权威）；按 preset 复制整份 preset 再改（官方升级不自动跟进）。

## 上下文

需求是"给 `standard` 与 `ptc` 两个编码 preset 的主 Agent 追加工程严谨协议，全局文案不动，子代理不继承"。DSH 的段注册是**按 scope** 的：全局段对所有 agent 可见，scoped 段只对某 scope 链可见，且同名段互相遮蔽而非叠加。因此"只给某类 agent"有两条实现路径：

1. **preset 层注册**（scoped 段）：在 preset 目录放本地插件文件，注册一个异名段；
2. **全局注册 + 装配时求值**：全局注册一个段，其文本函数按 agent 的 preset 与深度返回不同内容。

## 真实方向与评价

| 方向 | 内容权威 | 部署动作 | 子代理排除 | 官方 preset 升级 |
|---|---|---|---|---|
| A. preset 本地文件 | 分散：全局包 + 每个 preset 目录各一份 | 复制随包 preset、往每个目录加文件与行 | 靠文本函数判深度 | 被用户副本遮蔽，不自动跟进 |
| B. 单插件 + 装配时路由 | 单一：插件 config | 只改插件与 profile patch 一行 | 由 `mainAgentOnly` 机制保证 | 按 id 匹配，自动跟进 |

评价维度：内容权威数量、部署与维护成本、正确性保证、对上游变化的适应性。A 在"改动最小"上占优，但它把同一件事拆成三个权威点，且要求复制官方 preset——这是长期维护成本。B 需要先证明两个假设（装配时可读到 agent 的 preset 与深度），验证成本一次性、收益是长期单一权威。

## 最终决定

采用方向 B。`Config` 扩展为 `{ text, routes }`；`routes` 每项 `{ id, presets, text, mainAgentOnly=true }`；段文本函数按 `agentPresets.composedPreset(agent.ctx)` 与 `max(header.delegationDepth, options.subagentDepth)` 求值。

理由：机制成立性已在试验实例实测（两个 preset 的主 Agent 均正确解析出 preset id 与深度 0），验证成本已支付；此后新增 agent 类型只需加一条 route 配置。

## 直接后果

- 插件依赖从 `['systemPrompt']` 变为 `['systemPrompt', 'agentPresets']`。
- 需要 `src/core/`（纯路由逻辑）：插件从"薄壳豁免"变为有 core 的分层结构。
- preset 目录**不需要任何改动**，也不需要复制官方 preset。
- 路由文案的变更走插件 config，不再有 HOME 与仓库两份副本的漂移问题。

波及文档：`../需求.md`（R-10/R-13/R-14/R-15、AC-10/AC-13/AC-14/AC-15）、`../项目结构设计.md`（目录结构、模块职责）、`提示词段机制.md`（按 agent 路由、失败语义）、`部署.md`（实测记录）。

## 重访条件

- DSH 提供"按 preset 声明提示词"的原生通道（届时可去掉路由配置）。
- 需要按会话、按工作区或按用户区分文案（当前路由只按 preset 与深度）。
- 路由数量增长到需要独立配置文件而非 plugin config。
- **"改前先确认"不加条件是否过重**：用户决定宁可每次先确认（防止急冲），若实测发现小改动上的额外停顿代价明显，则改为条件触发（如"当问题可复现时"）。
- **默认工程块是否真的降低失败率**：尚无消融数据；若同批任务带/不带该块的失败率无差异，应删除该路由（见 `../TODO.md`）。
