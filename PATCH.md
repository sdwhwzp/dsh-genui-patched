# 本地补丁（相对 @changfenhuang/dsh-genui 0.10.0-dsh.20260914.1）

上游为 MIT。此副本只改三处，均围绕同一个问题：模型把 `keyvalue` 的子项字段写成
`items`（整份规格里 9 个组件都用 `items`，只有 `keyvalue`/`table`/`steps` 例外），
节点因此被整个丢弃，用户看到「字段验证失败 …… repair dropped N declared native node(s)」。

1. `lib/index.js` + `src/plugin/index.ts`：常驻系统提示 `GENUI_SECTION_TEXT` 增加一行，
   点明三个例外字段。这是模型每次请求都会看到的文本（`SKILL.md` 只在按需加载技能时才读到）。
2. `lib/index.js`：`normalizeNode` 对 `keyvalue`/`steps` 增加字段别名——canonical 字段缺失且
   `items` 是数组时，采纳为 `pairs`/`steps` 并记一条 `kind: "alias"` 警告。
   写法沿用同一函数里 `tabs.content → items` 的既有先例（含「canonical 已存在则忽略别名」的语义）。
3. `SKILL.md`：同样的例外说明，供按需加载时使用。

未改渲染端 `lib/client.js`（已压缩），其中的 `repairPairs` 仍只认 `pairs`。
插件侧归一化在渲染前完成时即可生效；若日后发现渲染端仍丢节点，需从源码重建该产物。

升级上游时：三处改动彼此独立，按上面的锚点重新应用即可。

4. `package.json`：移除 `prepack` / `prepare` 等发布期钩子——它们要跑上游仓库里的 `scripts/`，
   而发布包不含该目录；本副本是对已构建产物重打包，钩子无意义且会让 pack 失败。
