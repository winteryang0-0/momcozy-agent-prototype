#!/usr/bin/env node
"use strict";

// Checks the uploaded R30 candidate and its final visual evidence. This does
// not grant design approval or replace browser interaction review.
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const prefix = "prototype/onboarding-chat-r30-candidate/";
const candidate = path.join(root, "prototype", "onboarding-chat-r30-candidate");
const visualPrefix = "delivery-review/r30-visual-independent/";
const requiredEvidence = [
  "delivery-review/r30-final-audit.md",
  visualPrefix + "REVIEW-FINAL.md",
  visualPrefix + "r30-final-flow.jpg",
  visualPrefix + "r30-final-picker.jpg",
  "docs/updates/2026-10-22-onboarding-r30.md",
];

function sha(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function digest(value) { return sha(Buffer.from(canonical(value), "utf8")); }
function read(relative) {
  assert.equal(typeof relative, "string");
  assert(relative && !relative.startsWith("/") && !relative.includes("\\") &&
    relative.split("/").every(part => part && part !== "." && part !== ".."), `Unsafe path: ${relative}`);
  const file = path.resolve(candidate, ...relative.split("/"));
  assert(file.startsWith(candidate + path.sep), `Path escapes candidate: ${relative}`);
  const stat = fs.lstatSync(file);
  assert(stat.isFile() && !stat.isSymbolicLink(), `Missing regular file: ${relative}`);
  return fs.readFileSync(file);
}
function walk(dir = "", result = []) {
  for (const entry of fs.readdirSync(path.join(candidate, dir), { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), `Candidate contains symlink: ${entry.name}`);
    const relative = path.posix.join(dir.replaceAll("\\", "/"), entry.name);
    if (entry.isDirectory()) walk(relative, result);
    else {
      assert(entry.isFile(), `Unsupported candidate entry: ${relative}`);
      if (relative !== "candidate-receipt.json") result.push(relative);
    }
  }
  return result.sort();
}
function trackedFiles(paths) {
  const result = spawnSync("git", ["ls-files", "-z", "--", ...paths], { cwd: root, encoding: "buffer" });
  assert.equal(result.status, 0, "Cannot list tracked files");
  return result.stdout.toString("utf8").split("\0").filter(Boolean);
}

function verify() {
  const receipt = JSON.parse(read("candidate-receipt.json").toString("utf8"));
  const design = JSON.parse(read("design-change.json").toString("utf8"));
  const source = JSON.parse(read(design.source.path).toString("utf8"));
  assert.equal(receipt.status, "reviewable-candidate-not-frozen");
  assert.equal(receipt.approval, null);
  assert.equal(receipt.previous_baseline_id, "B-MOMCOZY-20261022-R27");
  assert.equal(receipt.previous_baseline_id, design.extends_baseline.id);
  assert.equal(receipt.source_sha256, sha(read(design.source.path)));
  assert.equal(receipt.scope_sha256, digest([...design.source.requirements].sort()));
  assert.deepEqual(design.source.requirements, source.requirements.map(item => item.id));
  assert.equal(receipt.framework_sha256, digest(design.framework));
  assert.equal(receipt.system_sha256, digest(design.system));

  const listed = Object.keys(receipt.files).sort();
  assert.deepEqual(listed, walk(), "Candidate receipt file set differs from actual package");
  for (const relative of listed) {
    assert.match(receipt.files[relative], /^[a-f0-9]{64}$/);
    assert.equal(receipt.files[relative], sha(read(relative)), `Changed candidate file: ${relative}`);
  }
  assert.equal(receipt.material_sha256, digest(receipt.files), "Candidate material digest mismatch");

  const tracked = trackedFiles([prefix]).map(file => file.slice(prefix.length)).sort();
  assert.deepEqual(tracked, [...listed, "candidate-receipt.json"].sort(), "Candidate files differ from Git index");
  const trackedEvidence = new Set(trackedFiles(requiredEvidence));
  for (const relative of requiredEvidence) assert(trackedEvidence.has(relative), `Evidence not tracked: ${relative}`);

  const visual = fs.readFileSync(path.join(root, visualPrefix, "REVIEW-FINAL.md"), "utf8");
  assert(visual.includes(receipt.material_sha256), "Visual review points to another candidate");
  for (const name of ["r30-final-flow.jpg", "r30-final-picker.jpg"]) {
    const bytes = fs.readFileSync(path.join(root, visualPrefix, name));
    assert.equal(bytes.subarray(0, 3).toString("hex"), "ffd8ff", `Not JPEG: ${name}`);
    assert(visual.includes(sha(bytes)), `Visual review screenshot digest mismatch: ${name}`);
  }
  console.log(`PASS R30 candidate: ${listed.length} tracked package files and final visual evidence match SHA-256.`);
  console.log("Scope: file integrity only; user confirmation and final design/interaction review remain separate.");
}

try { verify(); }
catch (error) {
  console.error(`FAIL R30 candidate: ${error.message}`);
  process.exitCode = 1;
}
