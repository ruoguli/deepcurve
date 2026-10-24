#!/usr/bin/env node
// 软件更新清单工具：生成签名密钥、维护 update/v1/index.json、签名与校验。
// 清单格式与校验规则、客户端实现见应用源码仓库（docs/software-update.md、src-tauri/src/app_update.rs）。
//
//   node scripts/update-manifest.mjs keygen    --out <私钥.pem>
//   node scripts/update-manifest.mjs init      --index <index.json>
//   node scripts/update-manifest.mjs component --index <index.json> --id agent-model-catalog --file <文件> --url <https 地址> [--url ...]
//   node scripts/update-manifest.mjs app       --index <index.json> --version 0.3.0 --platform windows-x86_64 --kind nsis --file <安装包> --url <https 地址>
//   node scripts/update-manifest.mjs sign      --index <index.json> --key <私钥.pem>
//   node scripts/update-manifest.mjs verify    --index <index.json>

import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// 发布仓库里的公钥列表，须与应用内置的 src-tauri/src/data/update-trust.json 一致。
const DEFAULT_TRUST = resolve(REPO_ROOT, "update/trust.json");
const INDEX_SCHEMA = 1;
// DER 前缀 + 32 字节原始公钥 = Ed25519 SubjectPublicKeyInfo。
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function fail(message) {
  console.error(`[update-manifest] ${message}`);
  process.exit(1);
}

function writeText(path, text) {
  writeFileSync(path, text.replace(/\r\n/g, "\n"), { encoding: "utf8" });
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`无法读取 ${path}: ${error.message}`);
  }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function rawPublicKey(key) {
  return createPublicKey(key).export({ type: "spki", format: "der" }).subarray(-32);
}

function publicKeyFromRaw(base64) {
  const raw = Buffer.from(base64, "base64");
  if (raw.length !== 32) fail(`公钥长度应为 32 字节，实际 ${raw.length}`);
  return createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: "der", type: "spki" });
}

function isInside(parent, child) {
  const path = relative(parent, child);
  return !path.startsWith("..") && !isAbsolute(path);
}

function requireOptions(values, names) {
  for (const name of names) {
    const value = values[name];
    if (value === undefined || (Array.isArray(value) && value.length === 0)) fail(`缺少参数 --${name}`);
  }
}

function requireHttpsUrls(urls) {
  for (const url of urls) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      fail(`不是合法的地址: ${url}`);
    }
    if (parsed.protocol !== "https:") fail(`下载地址必须是 https: ${url}`);
  }
}

function isComponentVersion(value) {
  return typeof value === "string" && value.length <= 32 && /^\d{1,9}(\.\d{1,9})*$/.test(value);
}

function loadIndex(path) {
  const index = readJson(path);
  if (index.schema !== INDEX_SCHEMA) fail(`${path} 的 schema 不是 ${INDEX_SCHEMA}`);
  index.components ??= [];
  if (index.app) validateLocalizedNotes(index.app.notes, `app ${index.app.version}`);
  for (const component of index.components) {
    validateLocalizedNotes(component.notes, `component ${component.id} ${component.version}`);
  }
  return index;
}

function saveIndex(path, index) {
  index.generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  writeJson(path, index);
  console.log(`已写入 ${path}（内容已变，需要重新 sign）`);
}

function notesFrom(values) {
  const notes = {};
  if (values["note-zh"]?.length) notes.zh = values["note-zh"];
  if (values["note-en"]?.length) notes.en = values["note-en"];
  validateLocalizedNotes(notes, "新更新内容");
  return notes;
}

function validateLocalizedNotes(notes, label) {
  if (notes == null || (typeof notes === "object" && !Array.isArray(notes) && Object.keys(notes).length === 0)) {
    return;
  }
  if (typeof notes !== "object" || Array.isArray(notes)) {
    fail(`${label}的 notes 必须是语言到条目列表的映射`);
  }
  for (const language of ["zh", "en"]) {
    const entries = notes[language];
    if (!Array.isArray(entries) || entries.length === 0 || entries.some((entry) => typeof entry !== "string" || !entry.trim())) {
      fail(`${label}需要同时提供非空的中文和英文 notes（zh、en）`);
    }
  }
}

const NOTE_OPTIONS = {
  "note-zh": { type: "string", multiple: true },
  "note-en": { type: "string", multiple: true },
  date: { type: "string" },
};

const commands = {
  keygen(args) {
    const { values } = parseArgs({
      args,
      options: { out: { type: "string" }, trust: { type: "string", default: DEFAULT_TRUST } },
    });
    requireOptions(values, ["out"]);
    const out = resolve(values.out);
    if (existsSync(out)) fail(`${out} 已存在，不会覆盖已有私钥`);
    if (isInside(REPO_ROOT, out)) fail("私钥不能放在代码仓库目录内，请指定仓库以外的路径");
    const { privateKey } = generateKeyPairSync("ed25519");
    writeFileSync(out, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600, flag: "wx" });
    const publicKey = rawPublicKey(privateKey).toString("base64");
    const trust = existsSync(values.trust) ? readJson(values.trust) : { publicKeys: [] };
    trust.publicKeys = [...new Set([...(trust.publicKeys ?? []), publicKey])];
    writeJson(values.trust, trust);
    console.log(`私钥: ${out}（请离线备份，丢失后已发布的客户端将无法再接收更新）`);
    console.log(`公钥: ${publicKey}`);
    console.log(`已加入信任列表: ${values.trust}`);
  },

  init(args) {
    const { values } = parseArgs({ args, options: { index: { type: "string" } } });
    requireOptions(values, ["index"]);
    if (existsSync(values.index)) fail(`${values.index} 已存在`);
    saveIndex(values.index, { schema: INDEX_SCHEMA, generatedAt: "", app: null, components: [] });
  },

  component(args) {
    const { values } = parseArgs({
      args,
      options: {
        index: { type: "string" },
        id: { type: "string" },
        file: { type: "string" },
        url: { type: "string", multiple: true },
        app: { type: "string" },
        "name-zh": { type: "string" },
        "name-en": { type: "string" },
        ...NOTE_OPTIONS,
      },
    });
    requireOptions(values, ["index", "id", "file", "url"]);
    requireHttpsUrls(values.url);
    const bytes = readFileSync(values.file);
    // 数据组件自带版本与格式号：`revision` 是内容版本，`version` 是数据格式版本。
    const content = readJson(values.file);
    if (!isComponentVersion(content.revision)) fail(`${values.file} 缺少点分数字形式的 revision（如 2026.10.03）`);
    if (!Number.isInteger(content.version)) fail(`${values.file} 缺少整数 version（数据格式版本）`);
    const index = loadIndex(values.index);
    const entry = {
      id: values.id,
      name: {
        ...(values["name-zh"] ? { zh: values["name-zh"] } : {}),
        ...(values["name-en"] ? { en: values["name-en"] } : {}),
      },
      version: content.revision,
      ...(values.app ? { app: values.app } : {}),
      dataSchema: content.version,
      urls: values.url,
      sha256: sha256(bytes),
      size: bytes.length,
      date: values.date ?? new Date().toISOString().slice(0, 10),
      notes: notesFrom(values),
    };
    // 同一组件、同一应用版本范围只保留一条；不同范围可并存，供不同版本的客户端选择。
    index.components = index.components.filter(
      (existing) => !(existing.id === entry.id && (existing.app ?? "") === (entry.app ?? "")),
    );
    index.components.push(entry);
    saveIndex(values.index, index);
    console.log(`${entry.id} ${entry.version}  ${entry.size} 字节  sha256 ${entry.sha256}`);
  },

  app(args) {
    const { values } = parseArgs({
      args,
      options: {
        index: { type: "string" },
        version: { type: "string" },
        platform: { type: "string" },
        kind: { type: "string" },
        file: { type: "string" },
        name: { type: "string" },
        url: { type: "string", multiple: true },
        ...NOTE_OPTIONS,
      },
    });
    requireOptions(values, ["index", "version", "platform", "kind", "file", "url"]);
    requireHttpsUrls(values.url);
    const version = values.version.replace(/^v/i, "");
    if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) fail(`应用版本应为 semver：${values.version}`);
    if (!/^(windows|linux|darwin)-(x86_64|aarch64)$/.test(values.platform)) {
      fail(`平台应为 {windows|linux|darwin}-{x86_64|aarch64}：${values.platform}`);
    }
    const name = values.name ?? basename(values.file);
    if (!/^[A-Za-z0-9_-][A-Za-z0-9._-]{0,127}$/.test(name)) {
      fail(`安装包文件名只能包含字母、数字、点、横线、下划线：${name}（可用 --name 指定）`);
    }
    // 安装包可能有几百 MB：分块计算哈希，不整个读入内存。
    const size = statSync(values.file).size;
    const index = loadIndex(values.index);
    if (!index.app || index.app.version !== version) {
      index.app = { version, date: "", notes: {}, platforms: {} };
    }
    index.app.date = values.date ?? new Date().toISOString().slice(0, 10);
    const notes = notesFrom(values);
    if (Object.keys(notes).length) index.app.notes = notes;
    const packages = (index.app.platforms[values.platform] ?? []).filter((existing) => existing.kind !== values.kind);
    packages.push({ kind: values.kind, name, urls: values.url, sha256: sha256(readFileSync(values.file)), size });
    index.app.platforms[values.platform] = packages;
    saveIndex(values.index, index);
    console.log(`${values.platform} ${values.kind} ${name}  ${size} 字节`);
  },

  sign(args) {
    const { values } = parseArgs({ args, options: { index: { type: "string" }, key: { type: "string" } } });
    requireOptions(values, ["index", "key"]);
    loadIndex(values.index);
    // 签名覆盖文件的原始字节。先统一成 LF，避免编辑器或 Git 换行转换后签名失效。
    const original = readFileSync(values.index, "utf8");
    if (original.includes("\r\n")) writeText(values.index, original);
    const bytes = readFileSync(values.index);
    const privateKey = createPrivateKey(readFileSync(values.key));
    writeText(`${values.index}.sig`, `${sign(null, bytes, privateKey).toString("base64")}\n`);
    console.log(`已签名 ${values.index}.sig（公钥 ${rawPublicKey(privateKey).toString("base64")}）`);
  },

  verify(args) {
    const { values } = parseArgs({
      args,
      options: { index: { type: "string" }, trust: { type: "string", default: DEFAULT_TRUST } },
    });
    requireOptions(values, ["index"]);
    const index = loadIndex(values.index);
    if (!existsSync(`${values.index}.sig`)) fail(`${values.index}.sig 不存在，请先执行 sign`);
    const bytes = readFileSync(values.index);
    const signature = Buffer.from(readFileSync(`${values.index}.sig`, "utf8").trim(), "base64");
    const keys = readJson(values.trust).publicKeys ?? [];
    if (keys.length === 0) fail(`${values.trust} 中没有公钥`);
    const trusted = keys.find((key) => verify(null, bytes, publicKeyFromRaw(key), signature));
    if (!trusted) fail("签名与信任列表中的任何公钥都不匹配");
    console.log(`签名有效（公钥 ${trusted}）`);
    console.log(`应用: ${index.app ? `${index.app.version}，平台 ${Object.keys(index.app.platforms ?? {}).join(", ") || "无"}` : "无"}`);
    for (const component of index.components) {
      console.log(`组件: ${component.id} ${component.version}${component.app ? `（应用 ${component.app}）` : ""}`);
    }
  },
};

const [command, ...rest] = process.argv.slice(2);
if (!command || !(command in commands)) {
  fail(`用法: node scripts/update-manifest.mjs <${Object.keys(commands).join("|")}> [参数]`);
}
commands[command](rest);
