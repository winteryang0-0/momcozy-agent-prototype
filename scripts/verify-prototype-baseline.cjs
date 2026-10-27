#!/usr/bin/env node
"use strict";

// Read-only verification of the user-selected prototype snapshot.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
function inside(base, relative) {
  assert(typeof relative === "string" && relative && !relative.includes("\\") &&
    !path.isAbsolute(relative) && !relative.includes(":") &&
    relative.split("/").every(x => x && x !== "." && x !== ".."), `Unsafe path: ${relative}`);
  const resolved = path.resolve(base, relative);
  assert(resolved.startsWith(base + path.sep), `Path escapes root: ${relative}`);
  return resolved;
}
function walk(base, relative = "", result = []) {
  for (const item of fs.readdirSync(path.join(base, relative), { withFileTypes: true })) {
    assert(!item.isSymbolicLink(), `Symlink in snapshot: ${item.name}`);
    const next = path.posix.join(relative, item.name);
    if (item.isDirectory()) walk(base, next, result);
    else { assert(item.isFile(), `Unsupported file: ${next}`); result.push(next); }
  }
  return result.sort();
}
function verify(compareSource = false) {
  const lock = JSON.parse(fs.readFileSync(path.join(root, "docs/prototype-baseline.json"), "utf8"));
  assert.equal(lock.schema_version, "1.0");
  assert.equal(lock.baseline_id, "B-MOMCOZY-20261026-NEW5");
  const readArtifact = key => {
    const item = lock.artifacts[key];
    const bytes = fs.readFileSync(inside(root, item.path));
    assert.equal(hash(bytes), item.sha256, `Changed ${key}`);
    return JSON.parse(bytes.toString("utf8"));
  };
  const manifest = readArtifact("manifest");
  const receipt = readArtifact("receipt");
  assert.equal(manifest.baseline_id, lock.baseline_id);
  assert.equal(receipt.baseline_id, lock.baseline_id);
  assert.equal(receipt.status, "user-selected-prototype-baseline");
  assert.equal(receipt.supersedes, "B-MOMCOZY-20261022-R27");
  assert.equal(receipt.confirmed_by, "Wentao");
  assert(receipt.confirmation_excerpt.includes("修正以这一版为我们的原型基线"));
  assert.equal(receipt.manifest_sha256, lock.artifacts.manifest.sha256);
  assert.equal(receipt.source_directory, lock.source_directory);
  assert.equal(manifest.files.length, lock.file_count);
  assert.equal(receipt.file_count, lock.file_count);
  const base = inside(root, lock.snapshot_path);
  const listed = manifest.files.map(x => x.path).sort();
  assert.equal(new Set(listed).size, listed.length, "Duplicate file in manifest");
  assert.deepEqual(walk(base), listed, "Snapshot file set differs from manifest");
  for (const item of manifest.files) {
    const bytes = fs.readFileSync(inside(base, item.path));
    assert.equal(bytes.length, item.bytes, `Size mismatch: ${item.path}`);
    assert.equal(hash(bytes), item.sha256, `Hash mismatch: ${item.path}`);
  }
  for (const relative of [lock.entrypoint, lock.source_entrypoint, ...lock.contract_files]) {
    assert(relative.startsWith(lock.snapshot_path + "/"));
    assert(listed.includes(relative.slice(lock.snapshot_path.length + 1)), `Unlisted entry: ${relative}`);
  }
  if (compareSource) {
    const source = path.resolve(lock.source_directory);
    assert.deepEqual(walk(source), listed, "Source file set differs from snapshot");
    for (const item of manifest.files)
      assert.equal(hash(fs.readFileSync(inside(source, item.path))), item.sha256, `Source changed: ${item.path}`);
  }
  console.log(`PASS ${lock.baseline_id}: ${listed.length} files match SHA-256${compareSource ? "; original source also matches" : ""}.`);
  console.log("Scope: user-selected version identity and file integrity; no new browser, design-guard or production certification.");
}
if (require.main === module) {
  try { verify(process.argv.includes("--source")); }
  catch (error) { console.error(`FAIL prototype baseline: ${error.message}`); process.exitCode = 1; }
}
module.exports = { verify };
