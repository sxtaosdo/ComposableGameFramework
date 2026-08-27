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
const expectedSections = {
  "docs/code/code.md": ["适用范围", "编码前思考", "简洁优先", "精准修改", "目标驱动执行", "单轮闭环", "通用编码规范", "类", "禁止事项"],
  "docs/code/cocosCode.md": ["适用范围", "语言", "代码风格", "Runtime 规则", "框架（按项目选用，不混用）", "组件与 Prefab", "UI 与场景", "Bundle 与资源", "验证与工具", "禁止事项"],
  "docs/code/godotCode.md": ["Godot 规则"],
  "docs/git.md": ["Commit 类型", "Commit 规则", "版本号规则（每次提交必遵守）", "分支规则", "submodule 独立交付原则"]
};
const expectedCocosRuleIds = {
  "语言": ["typescript-strict", "no-any", "es6-compatible", "avoid-unstable-syntax"],
  "代码风格": ["small-functions", "low-coupling", "composition", "naming", "class-size", "comments", "complexity-only-abstraction"],
  "组件与 Prefab": ["prefab-script", "ccclass-match", "property-binding", "avoid-find", "onload-validate", "start-init", "ondestroy-cleanup", "static-ui-prefab", "dynamic-content-code"],
  "UI 与场景": ["popup-prefab", "managed-open-close", "main-layout-split", "gameplay-ui-node-separation", "feature-ui-prefab-composition"]
};

if (map.schemaVersion !== "engineering-standards-source-map-v1") fail("Unexpected source-map schema");
if (map.sourceRevision !== "765fbf8a997ed7c8dd61971a4831fb8b01b14331") fail("Unexpected source revision");
if (JSON.stringify(map.sources.map((entry) => entry.path)) !== JSON.stringify(expectedSources)) fail("Source path coverage mismatch");
for (const source of map.sources) {
  if (!source.mappings.length) fail(`Missing mappings: ${source.path}`);
  if (JSON.stringify(source.mappings.map((item) => item.source)) !== JSON.stringify(expectedSections[source.path])) fail(`Section coverage mismatch: ${source.path}`);
  for (const item of source.mappings) {
    if (!item.source || !["migrated", "replaced", "excluded"].includes(item.status)) fail(`Invalid mapping: ${source.path}`);
    if (item.status === "excluded" ? !item.authority : !item.target) fail(`Incomplete mapping: ${source.path}#${item.source}`);
    if (source.path === "docs/code/cocosCode.md" && expectedCocosRuleIds[item.source] && JSON.stringify(item.rules) !== JSON.stringify(expectedCocosRuleIds[item.source])) fail(`Rule coverage mismatch: ${source.path}#${item.source}`);
    if (item.target) {
      const [target, anchor] = item.target.split("#");
      const targetPath = resolve(root, "09-governance/engineering-standards", target);
      await stat(targetPath);
      if (anchor) {
        const body = await readFile(targetPath, "utf8");
        const normalizedHeadings = [...body.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1].trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-"));
        if (!normalizedHeadings.includes(anchor)) fail(`Missing target anchor: ${item.target}`);
      }
    }
  }
}

const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const { stdout: baselineManifestText } = await exec("git", ["show", "dade075e3392e88cf3afe6a6598984120e2ba7a0:manifest.json"], { cwd: root });
const baselineManifest = JSON.parse(baselineManifestText);
if (JSON.stringify(manifest.protectedAreas) !== JSON.stringify(baselineManifest.protectedAreas)) fail("protectedAreas changed from baseline");
if (JSON.stringify(manifest.protectedPathRules) !== JSON.stringify(baselineManifest.protectedPathRules)) fail("protectedPathRules changed from baseline");
const protectedPatterns = manifest.protectedPathRules.rules.flatMap((rule) => rule.pathPatterns);
const { stdout: protectedDiff } = await exec("git", ["diff", "--name-only", "dade075e3392e88cf3afe6a6598984120e2ba7a0", "--", ...protectedPatterns], { cwd: root });
if (protectedDiff.trim()) fail(`Protected paths changed:\n${protectedDiff}`);

const { stdout: markdownList } = await exec("git", ["ls-files", "-z", "--", "*.md"], { cwd: root, encoding: "utf8" });
const markdownPaths = markdownList.split("\0").filter(Boolean);
if (manifest.documentCount !== markdownPaths.length) fail(`documentCount ${manifest.documentCount} != ${markdownPaths.length}`);
for (const path of markdownPaths) {
  const body = await readFile(resolve(root, path), "utf8");
  for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const link = match[1].split("#")[0];
    if (!link || /^(https?:|mailto:)/.test(link)) continue;
    const target = resolve(dirname(resolve(root, path)), decodeURIComponent(link));
    try { await stat(target); } catch { fail(`Broken relative link: ${path} -> ${link}`); }
  }
}

console.log(`Validated ${map.sources.length} engineering-standard sources, relative links, and ${protectedPatterns.length} protected path rules`);
