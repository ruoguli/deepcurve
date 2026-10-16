#!/usr/bin/env node
// 发布 ruoguli/deepcurve 的签名模型目录测试更新。
// 默认只校验并预览；传入 --publish 后创建仅含 JSON 的预发布，并通过 API 更新 main。

import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OWNER = 'ruoguli';
const REPO = 'deepcurve';
const REPO_SLUG = `${OWNER}/${REPO}`;
const BRANCH = 'main';
const COMPONENT_ID = 'agent-model-catalog';
const ASSET_NAME = 'agent-model-catalog.json';
const TEST_PUBLIC_KEY = 'GNi9t6KEE6VI2WVjzdC2OlCMJ+ldQ9H+EhUMzAAC/x0=';
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const API_ROOT = 'https://api.github.com';
const args = new Set(process.argv.slice(2));

if ([...args].some((arg) => !['--publish', '--help'].includes(arg)) || (args.has('--help') && args.size > 1)) {
  throw new Error('用法: node scripts/publish-model-catalog-release.mjs [--publish]');
}
if (args.has('--help')) {
  console.log('默认只验证并预览；传入 --publish 后创建预发布并更新 main。需要 GitHub CLI（gh）已登录且有 ruoguli/deepcurve 写权限。');
  process.exit(0);
}

function readLocal(relativePath) {
  return readFileSync(join(ROOT, ...relativePath.split('/')));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function validateLocalFiles() {
  const indexBytes = readLocal('update/v1/index.json');
  const signatureText = readLocal('update/v1/index.json.sig').toString('utf8').trim();
  const index = JSON.parse(indexBytes.toString('utf8'));
  const component = index.components?.find((entry) => entry.id === COMPONENT_ID);
  if (!component || index.schema !== 1) throw new Error('更新清单中缺少 agent-model-catalog 组件或 schema 不受支持。');

  const catalogPath = `update/v1/components/agent-model-catalog/${component.version}/agent-model-catalog.json`;
  const catalogBytes = readLocal(catalogPath);
  const catalog = JSON.parse(catalogBytes.toString('utf8'));
  const tag = `model-catalog-${component.version}`;
  const releaseUrl = `https://github.com/${REPO_SLUG}/releases/download/${tag}/${ASSET_NAME}`;
  const catalogHash = sha256(catalogBytes);
  if (catalog.revision !== component.version || catalog.version !== component.dataSchema) {
    throw new Error('清单版本与目录文件的 revision/dataSchema 不一致。');
  }
  if (component.size !== catalogBytes.length || component.sha256 !== catalogHash) {
    throw new Error('模型目录文件的大小或 SHA-256 与清单不一致。');
  }
  if (!component.urls?.includes(releaseUrl)) {
    throw new Error(`清单下载地址必须包含预期的 Release 资产 URL：${releaseUrl}`);
  }
  for (const model of ['gpt-6-luna', 'gpt-6.1-sol']) {
    if (!catalog.models?.some((entry) => entry.model === model)) {
      throw new Error(`测试目录缺少占位模型 ${model}。`);
    }
  }

  const signature = Buffer.from(signatureText, 'base64');
  const rawPublicKey = Buffer.from(TEST_PUBLIC_KEY, 'base64');
  if (rawPublicKey.length !== 32 || signature.length !== 64) throw new Error('测试公钥或清单签名长度无效。');
  const publicKey = createPublicKey({ key: Buffer.concat([SPKI_PREFIX, rawPublicKey]), format: 'der', type: 'spki' });
  if (!verifySignature(null, indexBytes, publicKey, signature)) throw new Error('index.json 的 Ed25519 签名无效。');

  return { indexBytes, catalogBytes, catalogPath, component, tag, releaseUrl, catalogHash };
}

async function publish(validated) {
  let token;
  try {
    token = execFileSync('gh', ['auth', 'token', '--hostname', 'github.com'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    throw new Error('未找到 GitHub CLI 登录凭据。请安装 gh 并运行 gh auth login，然后重试。');
  }
  if (!token) throw new Error('GitHub CLI 没有返回登录凭据；请先运行 gh auth login。');

  async function api(method, path, body, { allow404 = false } = {}) {
    const response = await fetch(`${API_ROOT}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'model-catalog-release-publisher',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const text = await response.text();
    if (allow404 && response.status === 404) return null;
    if (!response.ok) {
      let message = `${response.status} ${response.statusText}`;
      try { message = JSON.parse(text).message ?? message; } catch {}
      throw new Error(`GitHub API ${method} ${path} 失败：${message}`);
    }
    return text ? JSON.parse(text) : null;
  }

  const repository = await api('GET', `/repos/${REPO_SLUG}`);
  if (repository.permissions && repository.permissions.push !== true && repository.permissions.admin !== true) {
    throw new Error(`当前 GitHub 账号 ${repository.owner?.login ?? ''} 对 ${REPO_SLUG} 没有写权限。`);
  }

  let release = await api('GET', `/repos/${REPO_SLUG}/releases/tags/${encodeURIComponent(validated.tag)}`, undefined, { allow404: true });
  if (!release) {
    release = await api('POST', `/repos/${REPO_SLUG}/releases`, {
      tag_name: validated.tag,
      target_commitish: BRANCH,
      name: `模型目录测试更新 ${validated.component.version}`,
      body: '仅包含 Agent 模型目录 JSON，用于验证数据组件热更新；不包含应用二进制。目录中的 GPT 型号为测试占位项。',
      draft: true,
      prerelease: true,
    });
    console.log(`已创建 Release 草稿：${validated.tag}`);
  } else if (!release.draft && !release.prerelease) {
    throw new Error(`Tag ${validated.tag} 已对应正式 Release。为避免修改正式发布，本脚本停止。`);
  }

  let asset = (release.assets ?? []).find((entry) => entry.name === ASSET_NAME);
  if (asset) {
    const remoteDigest = asset.digest?.replace(/^sha256:/, '');
    if (asset.size !== validated.catalogBytes.length || !remoteDigest || remoteDigest !== validated.catalogHash) {
      throw new Error(`Release 已有同名资产 ${ASSET_NAME}，但无法确认其内容与本地测试目录一致；请先在 GitHub 上检查该资产。`);
    }
    console.log(`Release 资产已存在且哈希相同：${ASSET_NAME}`);
  } else {
    const uploadUrl = new URL(release.upload_url.replace(/\{\?.*$/, ''));
    uploadUrl.searchParams.set('name', ASSET_NAME);
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/octet-stream',
        'User-Agent': 'model-catalog-release-publisher',
      },
      body: validated.catalogBytes,
    });
    const text = await response.text();
    if (!response.ok) {
      let message = `${response.status} ${response.statusText}`;
      try { message = JSON.parse(text).message ?? message; } catch {}
      throw new Error(`上传 Release 资产失败：${message}`);
    }
    asset = JSON.parse(text);
    if (asset.size !== validated.catalogBytes.length) throw new Error('GitHub 返回的 Release 资产大小与本地文件不一致。');
    console.log(`已上传 Release 资产：${ASSET_NAME}`);
  }

  if (release.draft) {
    release = await api('PATCH', `/repos/${REPO_SLUG}/releases/${release.id}`, { draft: false, prerelease: true });
    console.log(`已发布预发布版本：${validated.tag}`);
  }

  const publicAssetResponse = await fetch(validated.releaseUrl, { redirect: 'follow' });
  if (!publicAssetResponse.ok) throw new Error(`Release 资产还不能公开下载（HTTP ${publicAssetResponse.status}）：${validated.releaseUrl}`);
  const publicAssetBytes = Buffer.from(await publicAssetResponse.arrayBuffer());
  if (sha256(publicAssetBytes) !== validated.catalogHash) throw new Error('Release 公共下载地址返回的文件哈希与清单不一致。');
  console.log('Release 公共下载地址校验通过。');

  const ref = await api('GET', `/repos/${REPO_SLUG}/git/ref/heads/${BRANCH}`);
  const parentSha = ref.object.sha;
  const parentCommit = await api('GET', `/repos/${REPO_SLUG}/git/commits/${parentSha}`);
  const baseTree = parentCommit.tree.sha;

  async function remoteFile(path) {
    const apiPath = path.split('/').map(encodeURIComponent).join('/');
    const result = await api('GET', `/repos/${REPO_SLUG}/contents/${apiPath}?ref=${parentSha}`, undefined, { allow404: true });
    if (!result) return null;
    if (result.type !== 'file' || result.encoding !== 'base64') throw new Error(`无法读取远端文件 ${path}。`);
    return Buffer.from(result.content.replace(/\s/g, ''), 'base64');
  }

  const attributesPath = '.gitattributes';
  const remoteAttributes = await remoteFile(attributesPath);
  let attributesText = remoteAttributes?.toString('utf8') ?? '';
  if (!/^update\/\*\* -text$/m.test(attributesText)) {
    attributesText = `${attributesText.trimEnd()}${attributesText.trim() ? '\n\n' : ''}update/** -text\n`;
  }

  const files = [
    { path: attributesPath, bytes: Buffer.from(attributesText, 'utf8'), allowReplace: true },
    { path: 'update/README.md', bytes: readLocal('update/README.md') },
    { path: 'update/v1/index.json', bytes: validated.indexBytes },
    { path: 'update/v1/index.json.sig', bytes: readLocal('update/v1/index.json.sig') },
    { path: validated.catalogPath, bytes: validated.catalogBytes },
    { path: 'scripts/publish-model-catalog-release.mjs', bytes: readLocal('scripts/publish-model-catalog-release.mjs'), allowReplace: true },
  ];

  const changes = [];
  for (const file of files) {
    const remote = await remoteFile(file.path);
    if (remote?.equals(file.bytes)) continue;
    if (remote && !file.allowReplace) {
      throw new Error(`远端 ${file.path} 已存在且内容不同；为避免覆盖，停止更新 main。`);
    }
    changes.push(file);
  }
  if (changes.length === 0) {
    console.log('main 分支上的清单、签名和测试文件已是最新，无需创建提交。');
    return;
  }

  const treeEntries = [];
  for (const file of changes) {
    const blob = await api('POST', `/repos/${REPO_SLUG}/git/blobs`, {
      content: file.bytes.toString('base64'),
      encoding: 'base64',
    });
    treeEntries.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const tree = await api('POST', `/repos/${REPO_SLUG}/git/trees`, { base_tree: baseTree, tree: treeEntries });
  const commit = await api('POST', `/repos/${REPO_SLUG}/git/commits`, {
    message: `chore(update): publish model catalog test ${validated.component.version}`,
    tree: tree.sha,
    parents: [parentSha],
  });
  await api('PATCH', `/repos/${REPO_SLUG}/git/refs/heads/${BRANCH}`, { sha: commit.sha, force: false });
  console.log(`已通过 GitHub API 更新 ${BRANCH}：${commit.html_url}`);
}

try {
  const validated = validateLocalFiles();
  console.log(`目录版本：${validated.component.version}`);
  console.log(`Release tag：${validated.tag}`);
  console.log(`Release 资产：${validated.releaseUrl}`);
  console.log(`SHA-256：${validated.catalogHash}`);
  console.log('清单 Ed25519 签名有效。');

  if (!args.has('--publish')) {
    console.log('\n预览模式，没有向 GitHub 写入内容。确认后使用 --publish 创建 JSON-only 预发布并更新 main。');
  } else {
    await publish(validated);
  }
} catch (error) {
  console.error(`[publish-model-catalog-release] ${error.message}`);
  process.exitCode = 1;
}
