# dsh-method-principles 待办

> 全库唯一待办清单，只装未完成事项。事项解决后就地写入拥有该事实的文档，并从此处移除。

## 未决事项

- **两层文案定稿**：基础段已收敛为证据诚实底线 4 条（见 DSR-005）；工程块五关已定稿（不含对抗式审查与"按比例"自判）。未决的是它们是否真的有效，见下条。
- **实证效果**：尚无消融数据。需按附图第 3 条做对照实验（`routes: []` 为工程层对照组；基础段可另用 `text: ''` 做对照），比较"未验证宣称完成 / 把假设说成事实 / 未查回归 / 破坏性操作前未建范围"四类失败率；无差异则删除对应层。
- **稳定环境生效确认**：`web` profile 已重新解析至 `b899c42`；**待用户在 GUI 重启**后确认（核对折叠行含 `Evidence discipline:` 5 行 + 空行 + `Working method` 22 行，且工程层第三关为收窄后新句 `Say which part you ran or read …`）。
- **test 实测场收尾**：`test` profile 仍挂着 `link:E:\Project\DSH_Plugins\plugins\dsh-method-principles`，试验实例 `test` 也在运行（2026-09-21 实测遗留）；收尾需 `dsh plugin --profile test remove dsh-method-principles`，并在 GUI 停该实例。
- **npm registry 发布**：当前只走 `github:` git 依赖。重访条件见 `technical-details/部署.md`。

## 延期事项

- **跨平台适配**：目标运行环境限定 Windows；插件本身无平台相关代码，无实际待办，仅在更换运行环境时复核。
