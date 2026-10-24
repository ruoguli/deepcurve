#!/usr/bin/env node
// Add a GitHub release to update/v1/index.json (signing is a separate step).
//
//   node scripts/publish-update.mjs <tag> <asset-dir> <release.json>
//
// release.json: output of `gh release view <tag> --json body,isPrerelease,publishedAt`.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = join(ROOT, 'update/v1/index.json');
const MANIFEST_TOOL = join(ROOT, 'scripts/update-manifest.mjs');
const DOWNLOAD_ROOT = 'https://github.com/ruoguli/deepcurve/releases/download';

// Clients without a preferred kind take the first package of their platform.
const APP_PACKAGES = [
  { pattern: /_x64-setup\.exe$/, platform: 'windows-x86_64', kind: 'nsis' },
  { pattern: /_amd64\.deb$/, platform: 'linux-x86_64', kind: 'deb' },
  { pattern: /_amd64\.AppImage$/, platform: 'linux-x86_64', kind: 'appimage' },
  { pattern: /_aarch64\.dmg$/, platform: 'darwin-aarch64', kind: 'dmg' },
  { pattern: /_x64\.dmg$/, platform: 'darwin-x86_64', kind: 'dmg' },
];
const NOTE_HEADINGS = { zh: ['主要更新'], en: ['Highlights'] };

function fail(message) {
  console.error(`[publish-update] ${message}`);
  process.exit(1);
}

function runManifest(args) {
  execFileSync(process.execPath, [MANIFEST_TOOL, ...args], { stdio: 'inherit' });
}

function sectionBullets(body, headings) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => headings.includes(/^#{2,3}\s+(.+?)\s*$/.exec(line)?.[1]));
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
    if (bullets.length === 0) fail(`release body has no "## ${headings[0]}" list`);
    for (const bullet of bullets) args.push(`--note-${language}`, bullet);
  }
  return args;
}

const [tag, assetDir, releaseJson] = process.argv.slice(2);
if (!tag || !assetDir || !releaseJson) fail('usage: publish-update.mjs <tag> <asset-dir> <release.json>');
const release = JSON.parse(readFileSync(releaseJson, 'utf8'));
const date = (release.publishedAt ?? new Date().toISOString()).slice(0, 10);
const assets = readdirSync(assetDir);

const appVersion = /^v(\d+\.\d+\.\d+)$/.exec(tag)?.[1];
const catalogRevision = /^model-catalog-(\d+(?:\.\d+)*)$/.exec(tag)?.[1];
if (!appVersion && !catalogRevision) {
  console.log(`${tag}: not an update tag, skipped`);
  process.exit(0);
}
if (appVersion && release.isPrerelease) {
  console.log(`${tag}: prerelease, skipped`);
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
  if (registered === 0) fail(`${tag}: no deepcurve_${appVersion}_* packages`);
} else {
  const file = 'agent-model-catalog.json';
  if (!assets.includes(file)) fail(`${tag}: ${file} not found`);
  const content = JSON.parse(readFileSync(join(assetDir, file), 'utf8'));
  if (content.revision !== catalogRevision) fail(`${tag}: file revision is ${content.revision}`);
  runManifest([
    'component', '--index', INDEX, '--id', 'agent-model-catalog', '--file', join(assetDir, file),
    '--url', `${DOWNLOAD_ROOT}/${tag}/${file}`, '--name-zh', 'Agent 模型目录', '--name-en', 'Agent model catalog',
    '--date', date, ...notes,
  ]);
}
