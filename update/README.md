# 软件更新联调目录

此目录用于验证 Agent 模型目录的数据组件更新流程。修订号为 `2026.10.16.1`，包含 `gpt-6-luna` 和 `gpt-6.1-sol` 两个测试占位条目。能力数值仅为联调样例，不代表真实 API 型号或官方规格，请勿用于实际调用。

## 发布位置

- 在 `ruoguli/deepcurve` 创建 GitHub Release，tag 使用 `model-catalog-2026.10.16.1`。
- 将 `components/agent-model-catalog/2026.10.16.1/agent-model-catalog.json` 作为该 Release 的 `agent-model-catalog.json` 资产上传。签名清单中的下载地址已指向此 Release 资产。
- 将本目录中的 `v1/index.json` 与 `v1/index.json.sig` 发布到 `ruoguli/deepcurve` 仓库 `main` 分支的 `update/v1/` 路径。软件只读签名清单中列出的资产 URL，不会自动扫描 GitHub Releases。

目前 GitHub API 没有列出 `ruoguli/deepcurve` 的现存 Release，因此对应资产 URL 要等 Release 创建并上传资产后才能下载。

## 调试构建

测试公钥：

`QC_UPDATE_PUBLIC_KEY=GNi9t6KEE6VI2WVjzdC2OlCMJ+ldQ9H+EhUMzAAC/x0=`

调试构建的清单默认地址已经是 `https://raw.githubusercontent.com/ruoguli/deepcurve/main/update/v1/index.json`；如需覆盖，可设置 `QC_UPDATE_INDEX_URL`。生产信任配置未修改，正式构建不会读取测试环境变量。

测试私钥保存在仓库外：

`/tmp/qc-model-catalog-update-test-20261016.pem`

## 本地一键发布

在 Windows 安装 GitHub CLI 并登录有 `ruoguli/deepcurve` 写权限的账号后，在仓库根目录运行：

```powershell
gh auth login
node .\scripts\publish-model-catalog-release.mjs
node .\scripts\publish-model-catalog-release.mjs --publish
```

不带 `--publish` 时只验证文件并预览操作；带上后会创建或完成 JSON-only 预发布、校验公开下载地址，并通过 GitHub API 将清单、签名和目录文件更新到 `main`。脚本不执行本地 git add/commit/push，也不上传应用二进制。

