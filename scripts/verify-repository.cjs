#!/usr/bin/env node
"use strict";

// This verifies historical R27 bytes and the current user-selected snapshot.
// It is an integrity check, not a visual, interaction, or design approval.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const current = path.join(root, "prototype", "current");
const baselineId = "B-MOMCOZY-20261022-R27";
const baselineDir = `prototype/current/baselines/${baselineId}`;
const paths = {
  manifest: "prototype/current/file-manifest.json",
  approval: "prototype/current/baseline-approval.json",
  snapshot: `${baselineDir}/design.json`,
  receipt: `${baselineDir}/receipt.json`,
  design: "prototype/current/design.json",
  prototype: "prototype/current/Momcozy-final.html",
};

function absolute(relative) {
  assert.match(relative, /^(?!\/)(?!.*(?:^|\/)\.\.?\/)[A-Za-z0-9_./-]+$/, `Unsafe path: ${relative}`);
  const resolved = path.resolve(root, ...relative.split("/"));
  assert(resolved.startsWith(root + path.sep), `Path escapes repository: ${relative}`);
  return resolved;
}

function bytes(relative) {
  const file = absolute(relative);
  assert(fs.statSync(file).isFile(), `Missing regular file: ${relative}`);
  return fs.readFileSync(file);
}

function hash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function json(relative) {
  return JSON.parse(bytes(relative).toString("utf8"));
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return hash(Buffer.from(canonical(value), "utf8"));
}

function walk(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    assert(!entry.isSymbolicLink(), `Symlink in frozen directory: ${file}`);
    if (entry.isDirectory()) walk(file, output);
    else if (entry.isFile()) output.push(path.relative(current, file).split(path.sep).join("/"));
    else throw new Error(`Unsupported entry in frozen directory: ${file}`);
  }
  return output;
}

function verify() {
  const lock = json("docs/baseline-lock.json");
  assert.equal(lock.schema_version, "1.0");
  assert.equal(lock.baseline_id, baselineId);
  assert.equal(lock.file_count, 270);
  assert.deepEqual(Object.keys(lock.artifacts).sort(), Object.keys(paths).sort());
  for (const [key, relative] of Object.entries(paths)) {
    assert.equal(lock.artifacts[key].path, relative, `Unexpected ${key} path`);
    assert.equal(hash(bytes(relative)), lock.artifacts[key].sha256, `Changed ${key}: ${relative}`);
  }

  const manifest = json(paths.manifest);
  assert.equal(manifest.schema_version, "1.0");
  assert.equal(manifest.revision, "profile-sections-27");
  assert.equal(manifest.files.length, lock.file_count);
  const listed = new Set();
  for (const entry of manifest.files) {
    const relative = entry.path;
    assert.equal(typeof relative, "string");
    assert(!relative.includes("\\") && !relative.startsWith("/") && !relative.split("/").some(part => part === ".." || part === "." || !part), `Unsafe manifest path: ${relative}`);
    assert(!listed.has(relative), `Duplicate manifest entry: ${relative}`);
    listed.add(relative);
    const data = bytes(`prototype/current/${relative}`);
    assert.equal(data.length, entry.size, `Size changed: ${relative}`);
    assert.equal(hash(data), entry.sha256, `SHA-256 changed: ${relative}`);
  }
  const metadata = [
    "file-manifest.json",
    "baseline-approval.json",
    `baselines/${baselineId}/design.json`,
    `baselines/${baselineId}/receipt.json`,
  ];
  const expected = new Set([...listed, ...metadata]);
  const actual = walk(current);
  assert.equal(actual.length, expected.size, `Unexpected number of files in prototype/current: ${actual.length}`);
  for (const file of actual) assert(expected.has(file), `Unlisted frozen file: ${file}`);

  const design = json(paths.design);
  const snapshot = json(paths.snapshot);
  const approval = json(paths.approval);
  const receipt = json(paths.receipt);
  assert.deepEqual(design, snapshot, "Current design ledger differs from frozen snapshot");
  assert.equal(hash(bytes(`prototype/current/${design.source.path}`)), design.source.sha256, "Source requirements changed");
  const fields = {
    framework_sha256: digest(design.framework),
    system_sha256: digest(design.system),
    source_sha256: design.source.sha256,
    scope_sha256: digest([...design.source.requirements].sort()),
  };
  for (const [key, value] of Object.entries(fields)) {
    assert.equal(approval[key], value, `Approval mismatch: ${key}`);
    assert.equal(receipt[key], value, `Receipt mismatch: ${key}`);
  }
  for (const key of ["baseline_id", "mode", "confirmed_by", "confirmation_locator", "confirmation_excerpt", "supersedes"]) {
    assert.equal(receipt[key], approval[key], `Receipt and approval disagree: ${key}`);
  }
  assert.equal(receipt.baseline_id, baselineId);
  assert.equal(receipt.mode, design.project.mode);
  assert.equal(receipt.snapshot_sha256, lock.artifacts.snapshot.sha256);
  console.log(`PASS ${baselineId}: ${manifest.files.length} listed files and ${metadata.length} freeze metadata files match SHA-256.`);
  console.log("Scope: file integrity and frozen design/source ledger only; browser and design review remain separate.");
}

try {
  verify();
  require("./verify-prototype-baseline.cjs").verify();
} catch (error) {
  console.error(`FAIL baseline integrity: ${error.message}`);
  process.exitCode = 1;
}
