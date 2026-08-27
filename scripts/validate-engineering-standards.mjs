import { readFile, stat } from "node:fs/promises";
import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exec = promisify(execFile);
const fail = (message) => { throw new Error(message); };
const map = JSON.parse(await readFile(resolve(root, "09-governance/engineering-standards/source-map.json"), "utf8"));
const expectedSources = ["docs/code/code.md", "docs/code/cocosCode.md", "docs/code/godotCode.md", "docs/git.md"];

if (map.schemaVersion !== "engineering-standards-source-map-v1") fail("Unexpected source-map schema");
if (map.sourceRevision !== "765fbf8a997ed7c8dd61971a4831fb8b01b14331") fail("Unexpected source revision");
if (JSON.stringify(map.sources.map((entry) => entry.path)) !== JSON.stringify(expectedSources)) fail("Source path coverage mismatch");
for (const source of map.sources) {
  if (!source.mappings.length) fail(`Missing mappings: ${source.path}`);
  for (const item of source.mappings) {
    if (!item.source || !["migrated", "replaced", "excluded"].includes(item.status)) fail(`Invalid mapping: ${source.path}`);
    if (item.status === "excluded" ? !item.authority : !item.target) fail(`Incomplete mapping: ${source.path}#${item.source}`);
    if (item.target) {
      const target = item.target.split("#")[0];
      await stat(resolve(root, "09-governance/engineering-standards", target));
    }
  }
}

const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const protectedPatterns = manifest.protectedPathRules.rules.flatMap((rule) => rule.pathPatterns);
const { stdout: protectedDiff } = await exec("git", ["diff", "--name-only", "dade075e3392e88cf3afe6a6598984120e2ba7a0", "--", ...protectedPatterns], { cwd: root });
if (protectedDiff.trim()) fail(`Protected paths changed:\n${protectedDiff}`);

const { stdout: markdownList } = await exec("git", ["ls-files", "-z", "--", "*.md"], { cwd: root, encoding: "utf8" });
for (const path of markdownList.split("\0").filter(Boolean)) {
  const body = await readFile(resolve(root, path), "utf8");
  for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const link = match[1].split("#")[0];
    if (!link || /^(https?:|mailto:)/.test(link)) continue;
    const target = resolve(dirname(resolve(root, path)), decodeURIComponent(link));
    try { await stat(target); } catch { fail(`Broken relative link: ${path} -> ${link}`); }
  }
}

console.log(`Validated ${map.sources.length} engineering-standard sources, relative links, and ${protectedPatterns.length} protected path rules`);
