# 在线部署与后续更新

本项目使用 GitHub Pages，构建和部署定义于 `.github/workflows/deploy-pages.yml`。线上发布的是 `site-dist/`，源码和开发记录仍保留在原 GitHub 仓库。

在线地址：[https://zeshanzheng.github.io/attention-lab/](https://zeshanzheng.github.io/attention-lab/)。使用者直接打开浏览器即可使用，无需运行本地命令。

## 自动更新

推送到 `main` 或在 Actions 手动运行 **Deploy Attention Lab** 时，工作流依次安装锁文件依赖、执行严格类型检查与 35 项测试、构建网页、运行 27 项 Chromium 浏览器测试，再发布到 Pages。失败的检查会阻止此次发布。

构建使用 Node.js 24.12.0。GitHub Pages 发布来源为 **GitHub Actions**，无需添加第三方服务的密钥。网页和学习计算不使用服务器 API。

后续继续在本地开发，检查通过后提交并推送即可。进度可在 [Actions](https://github.com/ZeshanZheng/attention-lab/actions/workflows/deploy-pages.yml) 查看。网站更新需要等待工作流完成，访问网址无需更换。

## 路径与学习记录

Vite 使用相对资源路径 `base: './'`，支持 `/attention-lab/` 这样的项目子路径。应用没有需要服务器重写的路由。

学习进度保存到浏览器的 `localStorage`。线上网址与本地 `127.0.0.1` 是不同来源，不会共享已有学习记录；同一线上来源的兼容更新会继续读取原记录。用户可通过“导出记录”保存匿名 JSON，目前没有导入功能。

## 复现和排查

本地启动仍按 README 的复现指南进行。也可先构建，再用 `scripts/run.ps1 -Task preview` 检查发布产物。

如果发布失败，在 Actions 查看具体步骤；修复代码并推送，或修复仓库设置后手动重跑工作流。Pages 设置应保持 GitHub Actions。不要把 API Token 或登录凭据写入源文件、工作流或提交记录。

配置依据：[GitHub Pages 自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
