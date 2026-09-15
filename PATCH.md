# 本地补丁（相对 @changfenhuang/dsh-genui 0.11.0）

上游为 MIT。补丁分布在**两个产物**里，这一点是关键：

- `lib/index.js` —— 宿主插件。`validate_dsh_ui` 工具的校验结果走这里，报错前缀 `❌`，只有模型看得到。
- `lib/client.js` —— 浏览器渲染端（已压缩）。围栏最终能不能渲染、用户看到的 `⚠️ dsh-ui …`
  诊断，全部出自这里。**两者各带一份 `normalizeNode` / `guard`，只改其中一个等于没改。**

0.10.0 那一轮补丁只打了 `lib/index.js`，于是工具说"通过"、界面照样报错。两边都要打。

## 上游 0.11.0 已覆盖、本副本不再重复的部分

常驻提示词新增了**字段速查**，点明了 `keyvalue {"pairs":[{"key","value"}]}`、
`steps {"steps":[...]}`、`callout {"tone":"info|success|warning|error"}`。
这比 0.10.0 那轮自己加的一行写得好，采用上游版本。本副本只补它没写的一件事：
tone 的合法取值**按组件不同**（上游只列了 callout 一个）。

## 改动

1. **`keyvalue` / `steps` 接受 `items` 别名**（`lib/index.js`、`lib/client.js`、
   `src/client/genui-runtime/normalize.ts`）。整份规格里 9 个组件都用 `items`，只有
   `keyvalue`/`table`/`steps` 例外，模型写错就整个节点被丢弃。canonical 字段缺失且
   `items` 是数组时采纳为 `pairs`/`steps`，并记一条 `kind: "alias"` 警告。
   写法沿用同一函数里 `tabs.content → items` 的既有先例（含「canonical 已存在则忽略别名」语义）。

2. **tone 逐组件归一化**（同上三个文件）。0.11.0 的 tone 词表仍然逐组件不同：
   `callout` info/success/warning/error，`badge` success/warn/danger/accent，
   `card` info/success/warning/danger，`hero` accent/success/warning/danger。
   同一个词在一个组件里合法、在另一个组件里致命，模型没有理由分得清。
   新增 `TONE_SYNONYMS` 近义词表，按**该组件自己的** enum 依次匹配后改写，并记一条 alias 警告。
   0.11.0 已删掉上游原有的 `hero` + `brand` 单例特判，本表的 `brand:['accent']` 覆盖了它。
   查不到近义词的仍然原样保留，让校验照常报错——不猜。

3. **诊断不再指向已被自动修复的括号**（`lib/client.js`、`src/client/fence-render.tsx`）。
   `FenceFallback` 原先在原始文本上取 JSON 解析位置。但渲染端本来就会先跑 tier-2 修复
   （`completeFenceJson`），括号错大多能自愈；真正渲染不出来的原因往往是字段校验。
   结果是报「JSON 解析失败（字符 437 附近）」，而那个位置早已不是问题所在。
   现在：语义诊断为空时先尝试修复，修好了就诊断**修复后**的规格，并注明 JSON 已自动修复几处。
   （0.11.0 已移除 `dom-fence` 那条独立诊断路径，因此本轮只需改 `FenceFallback` 一处。）

4. **常驻系统提示**（`lib/index.js`、`src/plugin/index.ts`）：字段速查行末尾补一句
   tone 按组件不同。

5. **`package.json`**：移除 `prepack` / `prepare` 等发布期钩子——它们要跑上游仓库里的
   `scripts/`，而发布包不含该目录；本副本是对已构建产物重打包，钩子无意义且会让 pack 失败。

## 为什么是改产物而不是重建

`pnpm build` 需要 74 个 devDependency 加 18 个 peerDependency，重建出的 bundle 与线上这份
在补丁之外还会有差异。改动都有唯一锚点，且都带了功能验证（见下）。

升级上游时：各处改动彼此独立，按锚点重新应用，**两个 bundle 都要过一遍**。
0.11.0 重构了 `normalizeAliasFields`（改为 4 参、别名从 schema 里取），锚点与 0.10.0 不同；
压缩产物里的短名也会变（0.11.0 为 `Ou`=COMPONENT_SCHEMAS、`Mu`=normalizeAliasFields、
`Nu`=normalizeNode、`Df`=processSemanticFailure、`wf`=completeFenceJson），每次升级都要重认。

## 验证

`lib/client.js` 的 `normalizeNode` 用 `vm` 单独切出来跑过：
callout warn→warning、callout danger→error、badge error→danger、badge warning→warn、
card error→danger、hero brand→accent、合法值不动、无近义词的错值保留报错、
keyvalue 用 items→pairs、steps 用 items→steps，共 10 例全通过。

从线上会话取了 10 份真实解析失败的围栏：tier-2 能自愈 6 份，其中就包括用户报的
「字符 437」那份——它修好后是 `callout tone="danger"`，正是本轮第 2 条补丁覆盖的情况。
