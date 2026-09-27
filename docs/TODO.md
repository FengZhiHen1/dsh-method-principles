# dsh-method-principles 待办

> 全库唯一待办清单，只装未完成事项。事项解决后就地写入拥有该事实的文档，并从此处移除。

## 未决事项

- **两层文案定稿**：基础段已收敛为证据诚实底线 4 条（见 DSR-005）；工程块五关已定稿（不含对抗式审查与"按比例"自判）。未决的是它们是否真的有效，见下条。
- **实证效果**：尚无消融数据。需按附图第 3 条做对照实验（`routes: []` 为工程层对照组；基础段可另用 `text: ''` 做对照），比较"未验证宣称完成 / 把假设说成事实 / 未查回归 / 破坏性操作前未建范围"四类失败率；无差异则删除对应层。
- **稳定环境生效确认**：`web` profile 已重新解析至 `b899c42`；**待用户在 GUI 重启**后确认（核对折叠行含 `Evidence discipline:` 5 行 + 空行 + `Working method` 22 行，且工程层第三关为收窄后新句 `Say which part you ran or read …`）。
  - ⚠️ **2026-09-27 补充**：稳定实例仍是 `0.1.2-rc.1` 运行时，persona 段为**单段** `deployment:persona`（升级后拆为 `-prefix`/`-suffix`）。本插件两代等价（已实测），但**折叠行位置核对时锚点不同**——旧代看 `deployment:persona`，新代看 `deployment:persona-prefix`。探针已改为两代自适应。
- **test 实测场状态（2026-09-27 现场更正）**：本条原记"`test` profile 仍挂着 `link:E:\Project\DSH_Plugins\plugins\dsh-method-principles`，试验实例 `test` 也在运行（2026-09-21 实测遗留）"——**2026-09-27 挂载前现场核对为假**：`homes\test\profiles\test` 的 `dependencies` 为空、`dsh.profile.bundles` 仅 `@deepseek-ai/dsh-base` + `@deepseek-ai/dsh-web-app`、`cordis.patch.yml` 仅 4 行（`ui-settings-general` 与 `agent-default-model` 两条既有配置）。即上次收尾**实际做过**，只是未回填本条。本轮为跑 0.1.7-rc.2 门禁**重新挂载**（`link:`，与 `dsh-guardrails` 同批）。
  - **收尾需**：`dsh plugin --profile test remove dsh-method-principles`（`dsh-guardrails` 同，两者都是本轮为门禁挂上的），并在 GUI 停 `test` 实例。
- **npm registry 发布**：当前只走 `github:` git 依赖。重访条件见 `technical-details/部署.md`。

## 0.1.7-rc.2 适配（2026-09-27）

**已结清——运行代码零改动**。逐项证据见 `technical-details/部署.md` 的「0.1.7-rc.2 适配复核」节（末节为「test 实测门禁记录（2026-09-27）」）。本轮只改了文档与验证探针：

- 新增 `test/runtime-assembly.test.mjs`：装载**真实** `@deepseek-ai/dsh-system-prompt` 跑真实 `assemble()`，覆盖 mock 测不到的接缝（上游改名 / order 表重排）。**环境门控**：无 DSH 运行时时 7 例 skip 并给出原因，不伪装通过。已用 ablation 验证检测力（把 persona 锚点回退到旧名 ⇒ 恰好 1 例失败、其余 6 例仍通过）。
- `verify/overlay-verify.mjs`：persona 锚点两代自适应，报告新增 `personaAnchor` / `personaSuffixIndex`（避免在新基线上把"锚点不存在"误读成"位置不对"）。
- 文档同步：persona 拆分与 order 200 的取舍、两代实测对照表、真实运行时门禁说明、删除失效的 `duplicate loader entry id` 表述、版本基线更新到 `dsh-v0.1.7-rc.2`。

**门禁已执行并通过（2026-09-27，`test` 实例，运行时 `0.1.7-rc.2`）**。判据与取证全表见 `technical-details/部署.md`「test 实测门禁记录（2026-09-27）」。摘要：

- ① `--dump-config`：184 行、重复 id 为 0，`method-principles` 行在；
- ②③④ 启动侧：无 `N entries did not activate`、无 `startup failed: … did not activate`、无 `disabling profile plugin …`；
- ⑤ **装配冒烟（本插件宿主唯一可见面）**：实例内真实回合装配出的 system prompt（`system/message` seq 7）**含本插件两个段落、与源码逐字一致**——基础段 `DEFAULT_PRINCIPLES_TEXT` 与路由段 `DEFAULT_ENGINEERING_RIGOR_TEXT` 按 `textFor()` 的方式拼接 ⇒ 段落已在 order 200 注册并参与装配，**且路由生效**（preset `standard` 拿到路由段）。这同时印证了 DSR-003 的既定取舍：段落在 `persona-prefix` 之后、`plan:policy` 之前。
- 本插件无 `dsh.client`，不涉页面项，故门禁**不含 UI 冒烟**（该项对同批挂载的 `dsh-guardrails` 适用，已由用户浏览器确认）。

**门禁外仍未做**：子 agent 的 `mainAgentOnly` 路由排除（base 段应到、路由段应不到）在实例中未实测，仍只有单测覆盖。

**仍未做**：把本轮改动 push 到 `FengZhiHen1/dsh-method-principles`（web 挂载前必须先 push）；稳定实例 `stable-dev` 是否升级到 `0.1.7-rc.2` 按用户节奏，**本插件不构成升级压力**（两代等价）。

## 延期事项

- **跨平台适配**：目标运行环境限定 Windows；插件本身无平台相关代码，无实际待办，仅在更换运行环境时复核。
