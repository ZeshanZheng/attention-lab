# Attention 实验室

面向 AI 初学者的可控 Attention 教学实验。计算核心、交互网页和第三阶段的引导学习闭环均已完成。

**在线体验：[打开 Attention 实验室](https://zeshanzheng.github.io/attention-lab/)**。电脑或手机浏览器即可使用，无需安装或注册。

![Attention 实验室桌面界面](docs/images/desktop.png)

## 交互网页

- 顶部提供八个学习页面，依次为使用说明、Attention 引言、小栗子🌰、动手实验、实验总结、理解自测、多头注意力和三种 Attention。两个进阶阅读入口位于自测之后。
- “使用说明”提供 Attention 概览、建议学习路线和七个模块的功能介绍；点击整张模块卡片进入对应页面，导航栏同步选中，也可使用键盘操作。动手实验内部切换“自由探索”和“引导任务”，共用一套向量编辑、计算步骤、结果与热力图；两种方式各自保留本次页面中的参数、基线、计算步骤和任务状态。自由探索的模型介绍与操作说明放在操作区之后，热力图说明可展开，理解自测说明直接显示。
- 顶部品牌、当前页面标识和 GitHub 链接随滚动停留在窗口上方；引导实验目标栏显示在顶部栏下方。
- 每次打开或刷新网页时先显示独立欢迎页，仅展示欢迎语、学习目标和“进入实验室”按钮。点击按钮后进入“使用说明”，再点击“动手实验”导航或模块卡片即可进入向量实验；欢迎页支持键盘操作，进入后的学习记录保存规则不变。
- 每个模块末尾提供写明下一模块名称的按钮，例如“进入动手实验模块”，按顶部导航顺序继续学习；三种 Attention 页末尾返回使用说明。导航与底部入口使用同一份顺序，跳转后定位到新页面顶部；返回动手实验会恢复最近使用的实验方式。切换或返回引导任务时露出上方模块栏，记录预测后再定位到可编辑输入框。
- “通过改变一个向量来理解注意力”显示在动手实验页的导航下方，标题统一使用黑色。
- 各阅读页与自由探索介绍使用相同的正文内边距，正文和讲解段落使用所在内容区域的完整宽度，电脑与手机均保持页面外边缘对齐。
- 引言先解释 Q/K/V 的含义和向量性质，再展示匹配、缩放与 Softmax、汇合 V 和输出的计算流程，随后以原始架构图、红圈和 Q/K/V 标注定位编码器的注意力模块。其他架构说明可折叠展开，结尾引向“书”和“它”的例子；背景与学习收益放在使用说明。
- “小栗子🌰”位于动手实验之前，用“书”和“它”的指代例句连续讲解 Q/K、匹配、V 与上下文聚合，配合词语高亮和向量来源说明。全文使用内容区域全宽，桌面 17px、手机 16px；结尾说明教学模型范围。论文链接之后是返回实验的提示与进入动手实验按钮，按钮和引言的下一模块按钮均放在各自内容框内。例句是教学示意，未运行真实语言模型，实际词元划分取决于分词器。
- 独立选择“观察谁的 Query”和“编辑哪个词元”，修改 B 时仍可观察 A。
- 输入或拖动二维 Q/K/V 向量；聚焦数值输入框时，坐标图同步切到对应类型。
- 向量输入按钮、拖动和方向键默认按整数调整，可切换到 0.1 步长；Shift + 方向键调整 1，直接输入仍可使用小数。切换步长不修改当前向量；坐标范围为 −5 到 5。
- 点积、缩放、Softmax、加权求和四个步骤，说明输入、结果、用途、符号含义，并展示随当前参数变化的计算例子。通过步骤标签、“上一步”和“下一步”手动切换，按自己的节奏阅读。
- “实验总结”位于“动手实验”之后，先展示八词元的单头匹配得分矩阵及讲解，再整理 Q/K/V 定义、完整公式与默认数值例子。矩阵统一为行是 Query、列是 Key；手机表格可横向滑动。最后一个引导任务完成后，也可以直接打开总结。
- 多头注意力页用原有的多张矩阵叠放图片与并行投影、拼接、输出投影的流程解释原始基础模型的 512/8/64 配置。图片按内容宽度的 90% 居中显示；图中列 Query、行 Key，图下注释说明其与实验总结表格的转置关系。三种 Attention 页在架构图上同时标出三处注意力，红圈粗细一致，圈旁注明类型；完整讲解放在图旁，下方保留 Q/K/V 来源与可见位置对照表。它们介绍原理，不运行完整模型。
- 浏览阅读页面后返回原操作页面，本页中的自由探索向量、基线、计算步骤、引导阶段与提示、自测题目及未提交答案保持；刷新仍遵循原有学习记录保存规则。
- 权重柱状图、输出向量图及修改前后差值，使用同一份计算结果。
- 3 × 3 Attention 权重热力图展示所有 Query 与 Key 的关注关系，使用固定 0%–100% 色阶和百分比，高亮当前观察行；悬停、聚焦或点选单元格查看点积、缩放得分、基线权重和差值。自由探索中点击或按 Enter 同步切换观察 Query，引导实验保持观察 A。
- 保存当前参数作为比较基线、恢复基线、一键重置。基线保留在当前页面中；刷新页面会回到默认实验。
- 手机布局、键盘操作、使用说明及非法输入反馈。
- 正文常用字号为 14–15px，公式为 16–17px（手机窄屏为 14px），权重数值为 16px，输入数字为 14px；辅助说明颜色加深，兼顾桌面和手机阅读。

![Attention 权重热力图](docs/images/heatmap.png)

热力图的每一行分别归一化，真实权重之和为 1；显示百分比已经四舍五入，合计可能略偏离 100%。颜色越深代表权重越大，色阶随编辑保持一致。只修改 V 时，九格权重和颜色保持不变，输出向量可能改变。参见[手机热力图](docs/images/heatmap-mobile.png)。

## 引导学习与理解自测

在动手实验中切换到“引导任务”，通过三个紧凑的任务按钮选择实验。每次按“先预测 → 动手修改 → 解释结果 → 完成实验”推进，只开放目标向量，固定观察 A 并保留初始基线，避免同时修改多个变量。预测、解释和完成记录按阶段呈现，已记录的预测与完成时的观察可展开查看。

| 实验 | 操作 | 学习目标 |
|---|---|---|
| 改变关注对象 | 只改 B 的 K，让 B 权重超过 60% | Q/K 匹配决定关注谁；Q 的零分量不参与点积 |
| 改变传递内容 | 把 B 的 V 从 `(0, 2)` 改为 `(0, 4)` | 权重不变，输出 y 翻倍；V 决定传递的内容 |
| 观察权重竞争 | 只改 A 的 K，让 A 权重至少为 70% | 权重归一化，A 增大时 B/C 减小；共同平移得分不改变 Softmax |

![引导实验完成界面](docs/images/guided.png)

- 先记录预测再开放编辑，自动滚动并聚焦可编辑输入框，紫色边框标出目标向量；固定目标栏持续显示任务，并支持就地检查。达到目标后冻结参数，回到解释区；理解题支持提示与重试。
- 理解自测题库共 20 道，每轮抽取 5 道，分别覆盖匹配得分、信息聚合、权重分配、变化规律和概念边界。题目顺序随机，最近三轮不重复；可在提交前或提交后换题，换题清空本轮答案并回到题目顶部。
- 提交后逐题解释概念、计算步骤和错误选项，首次和最近成绩分别保留。每次保存实际题目、选项、正确答案与解释的快照；旧记录沿用原解释，以后扩充题库不会按新题重算旧成绩。旧版四题记录自动迁移，仍显示原来的四题分母。
- 已完成实验和已提交自测保存到当前浏览器的 `localStorage`，刷新后仍可查看进度。未完成的实验和自由探索参数刷新后重新开始；不同设备或网址的记录不会自动同步。
- “导出记录”下载匿名 JSON，包含首次预测、理解题回答序列、完成时的输入/权重/输出快照，以及自测回答和成绩。不收集姓名，不向服务器发送记录。
- 实验与自测历史分别最多保留 30 条；各实验首次完成和首次自测会保留。重复练习不覆盖首次错误，不能把重试后的分数当作首次掌握情况。
- 两种实验方式来回切换时，自由探索的向量、基线和计算步骤以及引导任务的预测、修改、提示、理解题选项和冻结状态分别恢复。重置引导任务保留已经完成的学习记录。浏览器无法保存时仍可学习并导出，但刷新后新增记录不会保留。

参见[理解自测截图](docs/images/assessment.png)、[手机引导截图](docs/images/guided-mobile.png)和[真人试用流程](docs/user-testing.md)。已收到两位同学的初步试用反馈，并据此改进教学说明与操作引导；此次小样本试用不构成严格的学习效果评估。

## 当前能力

- 标准计算：`softmax(Q Kᵀ / √d_k) V`。
- 返回逐坐标乘积、原始匹配得分、缩放得分、遮罩后得分、权重、各 V 的加权贡献以及输出向量。
- 稳定 Softmax：先减最大得分，避免指数溢出。
- 可选布尔 Mask：`true` 为可见，`false` 为屏蔽；至少保留一个可见 Key。
- 支持多个 Query、任意正向量维度，以及与 Q/K 维度不同的 V。
- 验证空矩阵、维度不一致、非有限数字、全部屏蔽及计算溢出。
- 纯函数，不修改输入、不使用随机数、不依赖网络或 API Key。

教学边界：默认向量为人工设定，直接提供 Q/K/V，没有从真实模型提取语义向量。点积是匹配得分，不是余弦相似度；Attention 输出是聚合向量，不是下一词预测。引言和进阶阅读介绍完整架构、投影与多头等原理，交互实验仍是单头二维计算，不运行完整 Transformer。

## 10 分钟复现

在线发布由 GitHub Actions 自动执行；查看[部署和更新说明](docs/deployment.md)或[部署进度](https://github.com/ZeshanZheng/attention-lab/actions/workflows/deploy-pages.yml)。本地开发与在线发布互不影响。

### Windows：使用本项目运行环境

在项目根目录的 PowerShell 中执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 -Task install
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 -Task dev
```

打开 **http://127.0.0.1:5173**。保持运行命令所在的终端开启；按 Ctrl+C 停止开发服务器。

`setup.ps1` 从 Node.js 官网下载 Node.js **24.12.0** Windows x64 压缩包，核对官方 SHA256 后解压到 `.tools/`，不修改系统 PATH。依赖与 npm 缓存均保留在项目内。首次下载需要网络；后续计算、测试和演示均在本地执行。

`install` 在存在锁文件时使用 `npm ci`。使用以下命令执行检查：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 -Task verify
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 -Task test:browser
```

`verify` 依次运行计算核心与前端的严格类型检查、36 项数学/边界/实验状态/学习流程/题库测试、核心与网页编译以及默认实验演示；任何一步失败都会返回失败。

`test:browser` 对构建后的网页执行 40 项真实浏览器验收，默认使用已安装的 Microsoft Edge 无头模式，并自动启动、关闭预览服务器。覆盖独立欢迎页、键盘进入与刷新返回、八页导航与阅读后的操作状态保留、自由探索与引导任务之间的状态隔离及恢复、单一操作面板复用、单头矩阵顺序与坐标、架构图片加载、三处注意力标注及图旁讲解、小栗子的连贯讲解、整数/小数调整、实际数值教学例子、手动步骤切换、手机实验定位与固定目标、基线管理、热力图九格数值与 Query 联动、三个实验全流程、错误预测与重试、自测详细解析、换题与首次成绩、旧版记录迁移、进度刷新、题目快照 JSON 导出、存储异常及手机布局。截图保存在 `.tools/`，失败时保留测试追踪。

### 已有 Node.js 的环境

使用 Node.js 24.12.0 或更高的 24.x 版本（复现实测版本为 24.12.0）：

```sh
npm ci
npm run dev
```

检查与构建：

```sh
npm run verify
npm run test:browser
```

如果没有安装 Edge，可以先执行 `npx playwright install chromium`，再通过 `PLAYWRIGHT_CHANNEL=chromium` 环境变量运行浏览器测试。PowerShell 中设置方式为 `$env:PLAYWRIGHT_CHANNEL = 'chromium'`；在 Linux/macOS 中可以执行 `PLAYWRIGHT_CHANNEL=chromium npm run test:browser`。

没有环境变量要求，没有服务器或数据库要求。安装版本由 `package-lock.json` 固定。原生 TypeScript 执行负责运行示例和测试，TypeScript 编译器单独执行类型检查。

## 默认实验与预期结果

关注词元 A 的 Query：`[1, 0]`。

| 词元 | Q | K | V |
|---|---|---|---|
| A | `[1, 0]` | `[1, 0]` | `[2, 0]` |
| B | `[0, 1]` | `[0, 1]` | `[0, 2]` |
| C | `[-1, 0]` | `[-1, 0]` | `[-2, 0]` |

| 步骤 | 词元 A 的计算结果，显示值已四舍五入 |
|---|---|
| 点积 | `[1, 0, -1]` |
| 缩放 | `[0.707107, 0, -0.707107]` |
| 权重 | `[0.575975, 0.283995, 0.140029]` |
| 输出 | `[0.871892, 0.567991]` |
| 只把 B 的 V 改为 `[0, 4]` | 权重不变；输出为 `[0.871892, 1.135982]` |

运行 `npm run demo` 或下面的 PowerShell 命令，查看未经舍入的完整中间结果和修改前后对比：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 -Task demo
```

## 后续界面如何调用

```typescript
import { computeAttention, createDefaultExperiment } from './src/index.ts';

const experiment = createDefaultExperiment();
const result = computeAttention(experiment.input);
const queryIndex = experiment.selectedQueryIndex;

// 柱状图、公式和输出使用同一次计算的结果。
console.log(result.scaledScores[queryIndex]);
console.log(result.weights[queryIndex]);
console.log(result.contributions[queryIndex]);
console.log(result.outputs[queryIndex]);

// 参数变化后，用新输入重新计算，不修改旧基线。
const changed = computeAttention({
  ...experiment.input,
  values: experiment.input.values.map((value, index) =>
    index === 1 ? [0, 4] : [...value]),
});
console.log(changed.outputs[queryIndex]);
```

`queries` 形状为 `[queryCount, d_k]`；`keys` 为 `[keyCount, d_k]`；`values` 为 `[keyCount, d_v]`。得分和权重形状为 `[queryCount, keyCount]`，输出为 `[queryCount, d_v]`。

`dotProducts` 的索引为 `[query][key][Q/K 坐标]`；`contributions` 为 `[query][key][V 坐标]`。计算保留完整精度，界面自行控制显示小数位。

Mask 中屏蔽位置的 `maskedScores` 为 `-Infinity`。JSON 序列化会将这个值变成 `null`；保存实验时应保存有限的输入向量和布尔 Mask，再重新计算结果。

编译后计算核心入口位于 `dist/index.js`。网页构建产物单独位于 `site-dist/`，不会覆盖计算核心；可通过 `npm run preview` 或 `scripts/run.ps1 -Task preview` 在 **http://127.0.0.1:4173** 查看。源码不依赖 Node API；测试和命令行示例使用 Node。

## 项目结构

```text
src/
  core/attention.ts                  计算核心与数值验证
  presets/default-experiment.ts      三词元默认教学实验
  index.ts                          公共入口
tests/attention.test.ts              数学与边界测试
tests/lab-state.test.ts              基线、重置与输入验证测试
tests/learning.test.ts               实验目标、流程门禁、记录与自测测试
tests/assessment.test.ts             题库抽取、数学核对、快照与旧记录迁移
tests/browser/lab.spec.ts            真实浏览器交互验收
tests/browser/heatmap.spec.ts        热力图数值、基线、键盘与手机验收
tests/browser/learning.spec.ts       引导学习与记录持久化验收
tests/browser/navigation.spec.ts     九页导航与阅读后操作状态保留验收
tests/browser/sentence-example.spec.ts  指代例子、连贯讲解与手机阅读验收
tests/browser/advanced-reading.spec.ts  单头矩阵、架构图片、进阶阅读与手机验收
web/                                React 界面、实验状态与 SVG 图表
  learning/                         课程、会话、学习记录与本地保存
examples/default-experiment.ts       可运行的修改前后演示
scripts/                            Windows 本地环境与运行脚本
docs/development/                    本次需求、开发与验证记录
docs/user-testing.md                真人试用流程与评价边界
docs/user-testing-template.csv      空白试用记录模板
docs/user-testing-template.xlsx     带样式和填写说明的 Excel 空白模板
```

## 开发记录与比赛材料

参见 [第一次迭代记录](docs/development/01-calculation-core.md)、[第二次迭代记录](docs/development/02-interactive-interface.md) 和 [第三次迭代记录](docs/development/03-guided-learning.md)。Git 历史将工程初始化、计算模块、交互界面与引导学习分开记录。GitHub 仓库：[ZeshanZheng/attention-lab](https://github.com/ZeshanZheng/attention-lab)。

在线发布的配置与实际验收见[第四次迭代记录](docs/development/04-online-deployment.md)。

题库扩充、换题与历史兼容见[第五次迭代记录](docs/development/05-assessment-bank.md)。

热力图的设计与验证见[第六次迭代记录](docs/development/06-attention-heatmap.md)。

字号与文字对比度调整见[第七次迭代记录](docs/development/07-readable-typography.md)。

两位同学的试用反馈、新手教学说明与操作引导改进见[第八次迭代记录](docs/development/08-beginner-feedback.md)。

Attention 背景导读、Transformer 中的位置及学习路线见[第九次迭代记录](docs/development/09-attention-introduction.md)。

引言和总结改为独立导航页面，见[第十次迭代记录](docs/development/10-reading-navigation.md)。

“书”和“它”的分步讲解与完整讲稿见[第十一次迭代记录](docs/development/11-sentence-example.md)。

单头矩阵、引言架构图与两个进阶页面见[第十二次迭代记录](docs/development/12-attention-reading-expansion.md)。

默认打开 Attention 引言见[第十三次迭代记录](docs/development/13-default-introduction.md)。

自由探索介绍的位置和标题调整见[第十四次迭代记录](docs/development/14-free-exploration-heading.md)。

顶部栏吸顶与滚动定位见[第十五次迭代记录](docs/development/15-sticky-header.md)。

引言说明段落宽度与底部栏调整见[第十六次迭代记录](docs/development/16-introduction-width-and-footer.md)。

移除自动演示并保留手动步骤切换见[第十七次迭代记录](docs/development/17-remove-automatic-playback.md)。

导航顺序调整的发布检查修正见[第十八次迭代记录](docs/development/18-flexible-navigation-order.md)。

小栗子开头说明与提问的位置调整见[第十九次迭代记录](docs/development/19-sentence-example-layout.md)。

实验说明移到自由探索与引言标签修复见[第二十次迭代记录](docs/development/20-free-experiment-scope.md)。

引言说明移到架构图右侧、删除折叠入口与指定图注见[第二十一次迭代记录](docs/development/21-introduction-note-layout.md)。

小栗子底部提示与重复讲稿区域精简见[第二十二次迭代记录](docs/development/22-sentence-example-cleanup.md)。

独立使用说明页面与原图链接移除见[第二十三次迭代记录](docs/development/23-help-page.md)。

默认打开使用说明与顶部重复入口移除见[第二十四次迭代记录](docs/development/24-default-help-page.md)。

模块用途介绍与详细操作说明归位见[第二十五次迭代记录](docs/development/25-module-overview-and-instructions.md)。

统一正文宽度、页面对齐与小栗子卡片及末步入口调整见[第二十六次迭代记录](docs/development/26-sentence-example-width.md)。

小栗子改为同页连续讲解见[第二十七次迭代记录](docs/development/27-continuous-sentence-example.md)。

使用说明内容调整后的发布检查修正见[第二十八次迭代记录](docs/development/28-help-content-publishing.md)。

模块介绍恢复、卡片跳转与清晰矩阵示意见[第二十九次迭代记录](docs/development/29-linked-modules-and-readable-matrix.md)。

恢复多头矩阵原图并缩小居中显示见[第三十次迭代记录](docs/development/30-restore-multi-head-image.md)。

删除使用说明底部按钮与多头大图链接见[第三十一次迭代记录](docs/development/31-remove-extra-entry-links.md)。

模块底部顺序跳转与小栗子末尾顺序调整见[第三十二次迭代记录](docs/development/32-module-next-navigation.md)。

认识 Attention 移到默认首页及欢迎文案发布检查修复见[第三十三次迭代记录](docs/development/33-home-attention-overview.md)。

使用说明学习目标、建议路线与各模块小字标签精简见[第三十四次迭代记录](docs/development/34-help-goal-route-and-heading-cleanup.md)。

独立欢迎页与进入实验室流程见[第三十五次迭代记录](docs/development/35-standalone-welcome-page.md)。

蓝白渐变欢迎背景与桌面单行文案见[第三十六次迭代记录](docs/development/36-blue-white-welcome-layout.md)。

引言的 Q/K/V、计算流程、架构阅读顺序与小栗子衔接见[第三十七次迭代记录](docs/development/37-introduction-learning-order.md)。

小栗子开头说明精简与主线块移除见[第三十八次迭代记录](docs/development/38-example-copy-cleanup.md)。

引言和小栗子的页内跳转按钮及自由探索文案精简见[第三十九次迭代记录](docs/development/39-reading-actions-and-free-copy.md)。

自测说明直接显示与实验总结文案精简见[第四十次迭代记录](docs/development/40-assessment-instructions-and-summary-copy.md)。

单头矩阵缩小与引导实验提示精简见[第四十一次迭代记录](docs/development/41-compact-matrix-and-guided-cleanup.md)。

自由探索与引导任务合并为动手实验见[第四十二次迭代记录](docs/development/42-unified-experiment-workspace.md)。

三种 Attention 图旁讲解与统一标注见[第四十三次迭代记录](docs/development/43-attention-types-explanation-layout.md)。

进入引导任务时保留模块栏可见见[第四十四次迭代记录](docs/development/44-guided-entry-navigation.md)。

开发记录只是摘要，不等同于完整 AI 对话。应保留三个阶段的原始对话或截图/录屏，按比赛要求展示真实 Prompt、修改建议、约束与修复过程；三个功能阶段本身不能替代完整 Prompt 链。

数学依据：[Attention Is All You Need](https://papers.neurips.cc/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf)。运行方式依据：[Node.js TypeScript 文档](https://nodejs.org/docs/latest-v24.x/api/typescript.html)。
