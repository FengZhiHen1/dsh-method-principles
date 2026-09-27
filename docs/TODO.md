# dsh-method-principles 待办

> 全库唯一待办清单，只装未完成事项。事项解决后就地写入拥有该事实的文档，并从此处移除。

## 未决事项

- **两层文案定稿**：基础段已收敛为证据诚实底线 4 条（见 DSR-005）；工程块五关已定稿（不含对抗式审查与"按比例"自判）。未决的是它们是否真的有效，见下条。
- **实证效果**：尚无消融数据。需按附图第 3 条做对照实验（`routes: []` 为工程层对照组；基础段可另用 `text: ''` 做对照），比较"未验证宣称完成 / 把假设说成事实 / 未查回归 / 破坏性操作前未建范围"四类失败率；无差异则删除对应层。
- **稳定环境生效确认**：`web` profile 已重新解析至 `b899c42`；**待用户在 GUI 重启**后确认（核对折叠行含 `Evidence discipline:` 5 行 + 空行 + `Working method` 22 行，且工程层第三关为收窄后新句 `Say which part you ran or read …`）。
  - ⚠️ **2026-09-27 补充**：稳定实例仍是 `0.1.2-rc.1` 运行时，persona 段为**单段** `deployment:persona`（升级后拆为 `-prefix`/`-suffix`）。本插件两代等价（已实测），但**折叠行位置核对时锚点不同**——旧代看 `deployment:persona`，新代看 `deployment:persona-prefix`。探针已改为两代自适应。
- **test 实测场收尾**：`test` profile 仍挂着 `link:E:\Project\DSH_Plugins\plugins\dsh-method-principles`，试验实例 `test` 也在运行（2026-09-21 实测遗留）；收尾需 `dsh plugin --profile test remove dsh-method-principles`，并在 GUI 停该实例。
- **npm registry 发布**：当前只走 `github:` git 依赖。重访条件见 `technical-details/部署.md`。

## 0.1.7-rc.2 适配（2026-09-27）

**已结清——运行代码零改动**。逐项证据见 `technical-details/部署.md` 末节「0.1.7-rc.2 适配复核」。本轮只改了文档与验证探针：

- 新增 `test/runtime-assembly.test.mjs`：装载**真实** `@deepseek-ai/dsh-system-prompt` 跑真实 `assemble()`，覆盖 mock 测不到的接缝（上游改名 / order 表重排）。**环境门控**：无 DSH 运行时时 7 例 skip 并给出原因，不伪装通过。已用 ablation 验证检测力（把 persona 锚点回退到旧名 ⇒ 恰好 1 例失败、其余 6 例仍通过）。
- `verify/overlay-verify.mjs`：persona 锚点两代自适应，报告新增 `personaAnchor` / `personaSuffixIndex`（避免在新基线上把"锚点不存在"误读成"位置不对"）。
- 文档同步：persona 拆分与 order 200 的取舍、两代实测对照表、真实运行时门禁说明、删除失效的 `duplicate loader entry id` 表述、版本基线更新到 `dsh-v0.1.7-rc.2`。

**仍待用户执行**：把本轮改动 push → 重新挂载 → GUI 重启实例核对装配（agent 不起实例）；稳定实例是否升级到 `0.1.7-rc.2` 按用户节奏，**本插件不构成升级压力**（两代等价）。

## 延期事项

- **跨平台适配**：目标运行环境限定 Windows；插件本身无平台相关代码，无实际待办，仅在更换运行环境时复核。
