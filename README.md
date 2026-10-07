# Attention 实验室

面向 AI 初学者的可控 Attention 教学实验。第一阶段已实现单头 Attention 计算核心、默认实验和数学测试；交互页面属于下一阶段。

## 当前能力

- 标准计算：`softmax(Q Kᵀ / √d_k) V`。
- 返回逐坐标乘积、原始匹配得分、缩放得分、遮罩后得分、权重、各 V 的加权贡献以及输出向量。
- 稳定 Softmax：先减最大得分，避免指数溢出。
- 可选布尔 Mask：`true` 为可见，`false` 为屏蔽；至少保留一个可见 Key。
- 支持多个 Query、任意正向量维度，以及与 Q/K 维度不同的 V。
- 验证空矩阵、维度不一致、非有限数字、全部屏蔽及计算溢出。
- 纯函数，不修改输入、不使用随机数、不依赖网络或 API Key。

教学边界：默认向量为人工设定，直接提供 Q/K/V，没有从真实模型提取语义向量。点积是匹配得分，不是余弦相似度；Attention 输出是聚合向量，不是下一词预测。位置编码、投影矩阵、多头、残差和完整 Transformer 不在本阶段范围内。

## 10 分钟复现

### Windows：使用本项目运行环境

在项目根目录的 PowerShell 中执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 -Task install
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/run.ps1 -Task verify
```

`setup.ps1` 从 Node.js 官网下载 Node.js **24.12.0** Windows x64 压缩包，核对官方 SHA256 后解压到 `.tools/`，不修改系统 PATH。依赖与 npm 缓存均保留在项目内。首次下载需要网络；后续计算、测试和演示均在本地执行。

`install` 在存在锁文件时使用 `npm ci`。`verify` 依次运行严格类型检查、16 项数学与边界测试、编译以及默认实验演示；任何一步失败都会返回失败。

### 已有 Node.js 的环境

使用 Node.js 24.12.0 或更高的 24.x 版本（复现实测版本为 24.12.0）：

```sh
npm ci
npm run verify
```

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

编译后入口位于 `dist/index.js`，可以接入前端项目。源码不依赖 Node API；测试和命令行示例使用 Node。

## 项目结构

```text
src/
  core/attention.ts                  计算核心与数值验证
  presets/default-experiment.ts      三词元默认教学实验
  index.ts                          公共入口
tests/attention.test.ts              数学与边界测试
examples/default-experiment.ts       可运行的修改前后演示
scripts/                            Windows 本地环境与运行脚本
docs/development/                    本次需求、开发与验证记录
```

## 开发记录与比赛材料

参见 [第一次迭代记录](docs/development/01-calculation-core.md)。Git 历史将工程初始化与计算模块分开记录。尚未发布 GitHub/Gitee 仓库。

开发记录只是摘要，不等同于完整 AI 对话。应保留当前会话原始对话或截图/录屏，后续阶段继续积累真实 Prompt 链；本次迭代不冒充三次核心功能迭代。

数学依据：[Attention Is All You Need](https://papers.neurips.cc/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf)。运行方式依据：[Node.js TypeScript 文档](https://nodejs.org/docs/latest-v24.x/api/typescript.html)。
