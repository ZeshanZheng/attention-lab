# 第四次迭代：在线发布

日期：2026-10-07（Asia/Shanghai）。用户授权：

> 帮我部署成在线网页

## 配置

在原公开仓库启用 GitHub Pages，发布来源为 GitHub Actions；不另建源码仓库。新增 `.github/workflows/deploy-pages.yml`，在推送 `main` 或手动触发时执行构建与验收，再上传 `site-dist/` 并部署。

沿用固定 Node.js 24.12.0 和锁文件依赖；构建任务仅有读取源码与 Pages 的权限，发布任务使用 `pages: write` 与 `id-token: write`。没有在仓库或工作流中加入登录令牌，未新增项目依赖。

已有 Vite 相对资源路径适用于项目子目录，无需调整计算或界面代码。

## 发布与验收证据

- 部署提交：`7beb32ae8cbc787c8e4f0250cbf835a6647ca420`。
- [首次部署运行](https://github.com/ZeshanZheng/attention-lab/actions/runs/37598063443) 的构建和发布任务均成功；类型检查、28 项核心与状态测试、网页构建及 14 项 Chromium 浏览器测试通过。
- 正式网址：[https://zeshanzheng.github.io/attention-lab/](https://zeshanzheng.github.io/attention-lab/)。GitHub API 返回此地址并确认强制 HTTPS。
- 使用真实 Edge 浏览器访问该公开地址，HTTP 返回 200，默认输出为 `(0.872, 0.568)`。
- 在线完成第一个引导实验：预测前编辑锁定，提交预测后将 B 的 K x 改为 2，B 权重为 62.0%；理解题通过后进度为 1/3，刷新仍保留。
- 390 × 844 视口下的理解自测无横向溢出；此次访问无页面运行时错误或本站资源 HTTP 错误。

补充 README 在线入口、试用说明及 [部署与更新说明](../deployment.md)。仅补充链接和已验证记录的文档提交使用 `[skip ci]`，复用上述已发布且源码相同的网页；后续正常代码推送会自动执行部署工作流。

上线不改变已有教学边界，实际真人试用仍待开展。本地与线上学习记录属于不同浏览器来源，不会自动共享。
