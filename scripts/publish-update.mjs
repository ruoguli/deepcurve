#!/usr/bin/env node
// 把一个 GitHub Release 写进更新清单 update/v1/index.json（签名由 sign 子命令另做）。
// 由 .github/workflows/publish-update.yml 在 Release 发布后调用，也可本地运行：
//
//   node scripts/publish-update.mjs <tag> <资产目录> <release.json>
//
// release.json 是 `gh release view <tag> --json body,isPrerelease,publishedAt` 的输出。
//   - tag 为 v<版本>（正式版）：登记 Windows / Linux 安装包为应用更新；
//   - tag 为 model-catalog-<修订号>：登记 agent-model-catalog.json 为数据组件；
//   - 其他 tag 或预发布的应用版本：不改动清单。
// 更新说明取自 Release 正文中的“## 主要更新”和“## Highlights”两个列表，两者都必须有。

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = join(ROOT, 'update/v1/index.json');
const MANIFEST_TOOL = join(ROOT, 'scripts/update-manifest.mjs');
const DOWNLOAD_ROOT = 'https://github.com/ruoguli/deepcurve/releases/download';

// 安装包文件名 -> 平台与形态。Linux 先列 deb，未标注形态的客户端取第一个。
const APP_PACKAGES = [
  { pattern: /_x64-setup\.exe$/, platform: 'windows-x86_64', kind: 'nsis' },
  { pattern: /_amd64\.deb$/, platform: 'linux-x86_64', kind: 'deb' },
  { pattern: /_amd64\.AppImage$/, platform: 'linux-x86_64', kind: 'appimage' },
  { pattern: /_aarch64\.dmg$/, platform: 'darwin-aarch64', kind: 'dmg' },
  { pattern: /_x64\.dmg$/, platform: 'darwin-x86_64', kind: 'dmg' },
];
const NOTE_HEADINGS = {
  zh: ['主要更新', '更新内容'],
  en: ['Highlights', "What's new"],
};

function fail(message) {
  console.error(`[publish-update] ${message}`);
  process.exit(1);
}

function runManifest(args) {
  execFileSync(process.execPath, [MANIFEST_TOOL, ...args], { stdio: 'inherit' });
}

/** “## 标题”下的 "- " 列表项，去掉 Markdown 强调符号。 */
function sectionBullets(body, headings) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => {
    const match = /^#{2,3}\s+(.+?)\s*$/.exec(line);
    return match && headings.includes(match[1]);
  });
  if (start < 0) return [];
  const bullets = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,3}\s/.test(line)) break;
    const match = /^\s*[-*]\s+(.+?)\s*$/.exec(line);
    if (match) bullets.push(match[1].replace(/\*\*|__/g, ''));
  }
  return bullets;
}

function noteArgs(body) {
  const args = [];
  for (const [language, headings] of Object.entries(NOTE_HEADINGS)) {
    const bullets = sectionBullets(body, headings);
    if (bullets.length === 0) fail(`Release 正文缺少“## ${headings[0]}”列表，清单要求中英文更新说明都有`);
    for (const bullet of bullets) args.push(`--note-${language}`, bullet);
  }
  return args;
}

const [tag, assetDir, releaseJson] = process.argv.slice(2);
if (!tag || !assetDir || !releaseJson) fail('用法: node scripts/publish-update.mjs <tag> <资产目录> <release.json>');
const release = JSON.parse(readFileSync(releaseJson, 'utf8'));
const date = (release.publishedAt ?? new Date().toISOString()).slice(0, 10);
const assets = readdirSync(assetDir);

const appVersion = /^v(\d+\.\d+\.\d+)$/.exec(tag)?.[1];
const catalogRevision = /^model-catalog-(\d+(?:\.\d+)*)$/.exec(tag)?.[1];
if (!appVersion && !catalogRevision) {
  console.log(`${tag} 不是应用版本或数据组件的 tag，不更新清单`);
  process.exit(0);
}
if (appVersion && release.isPrerelease) {
  console.log(`${tag} 是预发布版本，不推送给用户`);
  process.exit(0);
}

if (!existsSync(INDEX)) {
  mkdirSync(dirname(INDEX), { recursive: true });
  runManifest(['init', '--index', INDEX]);
}
const notes = noteArgs(release.body ?? '');

if (appVersion) {
  let registered = 0;
  for (const { pattern, platform, kind } of APP_PACKAGES) {
    const file = assets.find((name) => pattern.test(name) && name.includes(`_${appVersion}_`));
    if (!file) continue;
    runManifest([
      'app', '--index', INDEX, '--version', appVersion, '--platform', platform, '--kind', kind,
      '--file', join(assetDir, file), '--url', `${DOWNLOAD_ROOT}/${tag}/${file}`, '--date', date, ...notes,
    ]);
    registered += 1;
  }
  if (registered === 0) fail(`${tag} 中没有找到 deepcurve_${appVersion}_* 安装包`);
} else {
  const file = 'agent-model-catalog.json';
  if (!assets.includes(file)) fail(`${tag} 中没有 ${file}`);
  const content = JSON.parse(readFileSync(join(assetDir, file), 'utf8'));
  if (content.revision !== catalogRevision) fail(`tag 修订号 ${catalogRevision} 与文件内 revision ${content.revision} 不一致`);
  runManifest([
    'component', '--index', INDEX, '--id', 'agent-model-catalog', '--file', join(assetDir, file),
    '--url', `${DOWNLOAD_ROOT}/${tag}/${file}`, '--name-zh', 'Agent 模型目录', '--name-en', 'Agent model catalog',
    '--date', date, ...notes,
  ]);
}
