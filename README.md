# dsh-method-principles

向 DSH 系统提示词追加一段方法论原则的薄壳插件。

- 注册**一个全局提示词段**（段名 `deployment:method-principles`，order `200`），对全部 agent（含子代理）生效；
- 默认文案是 8 条英文方法论原则（各 1–2 行），来自 B 站 Build in Public 分享的蒸馏；
- 文案可通过 `Config.text` 整体替换；置为空字符串即关闭该段；
- 插件不提供 Service、不注册工具、不注册动态上下文，唯一副作用是段注册（随 fiber 自动回收）。

设计依据见 `docs/`（需求、技术栈设计、项目结构设计、机制与部署、决策记录）。

## 安装

### 稳定 profile（发布物形态）

```powershell
$env:DSH_HOME='<目标 HOME>'
node '<实例版本 bin>' plugin --profile web add github:FengZhiHen1/dsh-method-principles#<ref>
```

- 首次 `add` 若被 pnpm 拦截 git 依赖的 `prepare`，按提示把包键写入该 profile 的 `pnpm-workspace.yaml` 的 `allowBuilds` 后重试。
- 安装后**需要重启实例**才生效（bundle 成员变化不热重载）。

### 试验 profile（源码直挂）

```powershell
$env:DSH_HOME='<目标 HOME>'
node '<实例版本 bin>' plugin --profile test add link:<本仓库路径>
```

## 配置

默认行不带 config，文案由 schema 默认值提供。要替换文案或按 agent 追加协议，在自己的 profile patch 层按 id 覆盖：

```yaml
# $DSH_HOME/profiles/<profile>/cordis.patch.yml 或 --patch overlay
- id: method-principles
  config:
    text: |                      # 基础文案：所有 agent（含子代理）都拿到
      Working principles:
      - ...
    routes:                      # 可选：按 agent preset 追加的协议
      - id: engineering
        presets: [standard, ptc] # 按 preset id 匹配（首条命中生效）
        mainAgentOnly: true      # 默认值；子代理（委派深度 > 0）不继承
        text: |
          Engineering rigor:
          - ...
```

- 覆盖是**整个 config 值替换**（不是深合并）；只写 `text` 即可保留基础文案语义。
- `text: ''` 且无 `routes` 表示关闭该段。
- 路由规则与降级行为见 `docs/technical-details/提示词段机制.md`。
- 文案是纯静态字符串，**不要写 `{{...}}`**：未注册的变量会让该 scope 的装配失败。

## 验证

1. 新建会话，展开系统提示词折叠行：该段应出现在 persona 之后、plan 指引之前，内容与 `DEFAULT_PRINCIPLES_TEXT` 一致。
2. 子代理会话同样可见（全局段对全部 agent 生效）。
3. 组合树复查：`node '<实例版本 bin>' --profile <name> --dump-config` 应恰有一行 `id: method-principles` / `name: dsh-method-principles`。

## 卸载

```powershell
node '<实例版本 bin>' plugin --profile <name> remove dsh-method-principles
```

重启实例后该段消失。

## 开发

```powershell
pnpm install
pnpm test     # node --test（配置 / 段契约 / 生命周期 / 组合）
pnpm check    # 语法检查 + 测试
node ..\..\tools\plugin-layering-check.mjs .   # 仓库分层门禁（薄壳豁免）
```

结构：`index.js` 只做重导出，全部接线在 `src/adapter/host.js`（本插件无 `src/core/`，无裸 node 可单测的领域逻辑）。

## 许可

MIT
