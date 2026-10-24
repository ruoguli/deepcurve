#!/usr/bin/env node
// Maintain and sign update/v1/index.json.
//
//   init      --index <file>
//   app       --index <file> --version <semver> --platform <os-arch> --kind <kind> --file <path> --url <https> [--date] [--note-zh ...] [--note-en ...]
//   component --index <file> --id <id> --file <path> --url <https> [--app <range>] [--name-zh] [--name-en] [--date] [--note-zh ...] [--note-en ...]
//   sign      --index <file> --key <private.pem>
//   verify    --index <file> [--trust <trust.json>]

import { createHash, createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_TRUST = resolve(ROOT, "update/trust.json");
const INDEX_SCHEMA = 1;
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function fail(message) {
  console.error(`[update-manifest] ${message}`);
  process.exit(1);
}

function writeText(path, text) {
  writeFileSync(path, text.replace(/\r\n/g, "\n"), { encoding: "utf8" });
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`cannot read ${path}: ${error.message}`);
  }
}

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

function publicKeyFromRaw(base64) {
  const raw = Buffer.from(base64, "base64");
  if (raw.length !== 32) fail(`public key must be 32 bytes, got ${raw.length}`);
  return createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: "der", type: "spki" });
}

function requireOptions(values, names) {
  for (const name of names) {
    const value = values[name];
    if (value === undefined || (Array.isArray(value) && value.length === 0)) fail(`missing --${name}`);
  }
}

function requireHttpsUrls(urls) {
  for (const url of urls) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      fail(`invalid URL: ${url}`);
    }
    if (parsed.protocol !== "https:") fail(`URL must be https: ${url}`);
  }
}

function validateNotes(notes, label) {
  if (notes == null || (typeof notes === "object" && !Array.isArray(notes) && Object.keys(notes).length === 0)) return;
  for (const language of ["zh", "en"]) {
    const entries = notes[language];
    if (!Array.isArray(entries) || entries.length === 0 || entries.some((entry) => typeof entry !== "string" || !entry.trim())) {
      fail(`${label}: notes need non-empty zh and en entries`);
    }
  }
}

function loadIndex(path) {
  const index = readJson(path);
  if (index.schema !== INDEX_SCHEMA) fail(`${path}: schema is not ${INDEX_SCHEMA}`);
  index.components ??= [];
  if (index.app) validateNotes(index.app.notes, `app ${index.app.version}`);
  for (const component of index.components) validateNotes(component.notes, `component ${component.id}`);
  return index;
}

function saveIndex(path, index) {
  index.generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  writeText(path, `${JSON.stringify(index, null, 2)}\n`);
}

function notesFrom(values) {
  const notes = {};
  if (values["note-zh"]?.length) notes.zh = values["note-zh"];
  if (values["note-en"]?.length) notes.en = values["note-en"];
  validateNotes(notes, "notes");
  return notes;
}

const NOTE_OPTIONS = {
  "note-zh": { type: "string", multiple: true },
  "note-en": { type: "string", multiple: true },
  date: { type: "string" },
};

const commands = {
  init(args) {
    const { values } = parseArgs({ args, options: { index: { type: "string" } } });
    requireOptions(values, ["index"]);
    if (existsSync(values.index)) fail(`${values.index} already exists`);
    saveIndex(values.index, { schema: INDEX_SCHEMA, generatedAt: "", app: null, components: [] });
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
    if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) fail(`version is not semver: ${values.version}`);
    if (!/^(windows|linux|darwin)-(x86_64|aarch64)$/.test(values.platform)) fail(`invalid platform: ${values.platform}`);
    const name = values.name ?? basename(values.file);
    if (!/^[A-Za-z0-9_-][A-Za-z0-9._-]{0,127}$/.test(name)) fail(`invalid package file name: ${name}`);
    const index = loadIndex(values.index);
    if (!index.app || index.app.version !== version) index.app = { version, date: "", notes: {}, platforms: {} };
    index.app.date = values.date ?? new Date().toISOString().slice(0, 10);
    const notes = notesFrom(values);
    if (Object.keys(notes).length) index.app.notes = notes;
    const packages = (index.app.platforms[values.platform] ?? []).filter((existing) => existing.kind !== values.kind);
    packages.push({
      kind: values.kind,
      name,
      urls: values.url,
      sha256: sha256(readFileSync(values.file)),
      size: statSync(values.file).size,
    });
    index.app.platforms[values.platform] = packages;
    saveIndex(values.index, index);
    console.log(`${values.platform} ${values.kind} ${name}`);
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
    const content = readJson(values.file);
    if (typeof content.revision !== "string" || !/^\d{1,9}(\.\d{1,9})*$/.test(content.revision)) {
      fail(`${values.file}: missing dotted numeric revision`);
    }
    if (!Number.isInteger(content.version)) fail(`${values.file}: missing integer version`);
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
    // One entry per component and app range.
    index.components = index.components.filter(
      (existing) => !(existing.id === entry.id && (existing.app ?? "") === (entry.app ?? "")),
    );
    index.components.push(entry);
    saveIndex(values.index, index);
    console.log(`${entry.id} ${entry.version}`);
  },

  sign(args) {
    const { values } = parseArgs({ args, options: { index: { type: "string" }, key: { type: "string" } } });
    requireOptions(values, ["index", "key"]);
    loadIndex(values.index);
    // The signature covers the raw bytes, so normalize line endings first.
    writeText(values.index, readFileSync(values.index, "utf8"));
    const privateKey = createPrivateKey(readFileSync(values.key));
    writeText(`${values.index}.sig`, `${sign(null, readFileSync(values.index), privateKey).toString("base64")}\n`);
    console.log(`signed ${values.index}`);
  },

  verify(args) {
    const { values } = parseArgs({
      args,
      options: { index: { type: "string" }, trust: { type: "string", default: DEFAULT_TRUST } },
    });
    requireOptions(values, ["index"]);
    const index = loadIndex(values.index);
    if (!existsSync(`${values.index}.sig`)) fail(`${values.index}.sig not found`);
    const bytes = readFileSync(values.index);
    const signature = Buffer.from(readFileSync(`${values.index}.sig`, "utf8").trim(), "base64");
    const keys = readJson(values.trust).publicKeys ?? [];
    if (!keys.some((key) => verify(null, bytes, publicKeyFromRaw(key), signature))) {
      fail("signature does not match any trusted key");
    }
    const components = index.components.map((c) => `${c.id} ${c.version}`).join(", ") || "none";
    console.log(`signature ok; app ${index.app?.version ?? "none"}; components ${components}`);
  },
};

const [command, ...rest] = process.argv.slice(2);
if (!(command in commands)) fail(`usage: update-manifest.mjs <${Object.keys(commands).join("|")}> [options]`);
commands[command](rest);
