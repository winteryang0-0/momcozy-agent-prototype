#!/usr/bin/env node
"use strict";

// Verifies that the pending Onboarding receipt describes the files and browser
// evidence actually committed on codex/internal-test. This is not design approval.
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const prefix = "prototype/onboarding-rebuild-candidate/";
const candidate = path.join(root, "prototype", "onboarding-rebuild-candidate");

function read(relative) {
  assert.match(relative, /^(?!\/)(?!.*(?:^|\/)\.\.?\/)[A-Za-z0-9_./-]+$/, `Unsafe path: ${relative}`);
  const file = path.resolve(candidate, ...relative.split("/"));
  assert(file.startsWith(candidate + path.sep), `Path escapes candidate: ${relative}`);
  assert(fs.statSync(file).isFile(), `Missing file: ${relative}`);
  return fs.readFileSync(file);
}

function hash(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }
function json(relative) { return JSON.parse(read(relative).toString("utf8")); }
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function digest(value) { return hash(Buffer.from(canonical(value), "utf8")); }

function verify() {
  const receipt = json("CANDIDATE_RECEIPT.json");
  assert.equal(receipt.candidate_id, "MOMCOZY-ONBOARDING-20261022-C01");
  assert.equal(receipt.status, "draft-awaiting-user-confirmation");
  assert.equal(receipt.pending_design_decision, "D-01");
  assert.equal(receipt.structural_pass, true);
  assert.equal(receipt.browser_evidence, "reviews/browser-evidence.json");
  assert.equal(receipt.source_sha256, hash(read("source/requirements.json")));
  const design = json("design.json");
  assert.equal(receipt.framework_sha256, digest(design.framework), "Framework digest mismatch");
  assert.equal(receipt.system_sha256, digest(design.system), "System digest mismatch");
  assert.equal(receipt.scope_sha256, digest([...design.source.requirements].sort()), "Scope digest mismatch");
  assert.deepEqual(receipt.requirement_ids, design.source.requirements, "Requirement IDs mismatch");

  const result = spawnSync("git", ["ls-files", "-z", "--", prefix], { cwd: root, encoding: "buffer" });
  assert.equal(result.status, 0, "Cannot list tracked candidate files");
  const tracked = result.stdout.toString("utf8").split("\0").filter(Boolean).map(file => {
    assert(file.startsWith(prefix));
    return file.slice(prefix.length);
  });
  assert(tracked.includes("CANDIDATE_RECEIPT.json"), "Receipt is not tracked");
  assert.deepEqual(receipt.files.map(file => file.path).sort(), tracked.filter(file => file !== "CANDIDATE_RECEIPT.json").sort(), "Receipt file list differs from tracked candidate files");
  for (const entry of receipt.files) {
    const bytes = read(entry.path);
    assert.equal(bytes.length, entry.bytes, `Size mismatch: ${entry.path}`);
    assert.equal(hash(bytes), entry.sha256, `SHA-256 mismatch: ${entry.path}`);
  }

  const evidence = json(receipt.browser_evidence);
  assert.equal(evidence.status, "pass");
  assert.deepEqual(evidence.errors, []);
  for (const [field, file] of Object.entries({
    designSha256: "design.json",
    htmlSha256: "index.html",
    cssSha256: "assets/styles.css",
    jsSha256: "assets/app.js",
  })) assert.equal(evidence.source[field], hash(read(file)), `Browser evidence source mismatch: ${file}`);
  for (const capture of evidence.captures) {
    assert.equal(capture.sha256, hash(read(capture.path)), `Screenshot mismatch: ${capture.path}`);
    assert.equal(capture.designSha256, evidence.source.designSha256, `Design hash mismatch: ${capture.path}`);
  }

  const bundle = json("bundle-manifest.json");
  assert.equal(bundle.status, "candidate-not-frozen");
  for (const [file, digest] of Object.entries(bundle.files)) {
    assert.equal(digest, hash(read(`bundle/${file}`)), `Bundle mismatch: ${file}`);
  }
  console.log(`PASS pending candidate receipt: ${receipt.files.length} tracked files, ${evidence.captures.length} screenshots, ${Object.keys(bundle.files).length} bundle files.`);
}

try { verify(); }
catch (error) {
  console.error(`FAIL pending candidate receipt: ${error.message}`);
  process.exitCode = 1;
}
