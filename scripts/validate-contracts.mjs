import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fail = (message) => { throw new Error(message); };
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const isRelativePath = (value) => typeof value === "string" && value.length > 0 && !value.startsWith("/") && !value.split("/").includes("..");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function verifyReceipt(path, expectedSha256) {
  if (!isRelativePath(path)) fail(`Unsafe evidence receipt path: ${path}`);
  const absolutePath = resolve(root, path);
  if (!absolutePath.startsWith(`${root}/`)) fail(`Evidence receipt escapes P0002: ${path}`);
  const bytes = await readFile(absolutePath);
  if (sha256(bytes) !== expectedSha256) fail(`Evidence receipt hash mismatch: ${path}`);
}

async function walk(directory) {
  const files = [];
  const ignoredDirectories = new Set([".git", "node_modules", "dist", "build", "temp", "library"]);
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function checkLocalRefs(schema, node = schema) {
  if (Array.isArray(node)) return node.forEach((item) => checkLocalRefs(schema, item));
  if (!node || typeof node !== "object") return;
  if (typeof node.$ref === "string" && node.$ref.startsWith("#/$defs/")) {
    const key = node.$ref.slice("#/$defs/".length);
    if (!schema.$defs?.[key]) fail(`${schema.title}: unresolved local ref ${node.$ref}`);
  }
  for (const value of Object.values(node)) checkLocalRefs(schema, value);
}

const version = (await readFile(join(root, "VERSION"), "utf8")).trim();
const manifest = await readJson(join(root, "manifest.json"));
if (version !== manifest.framework?.version) fail(`VERSION ${version} != manifest ${manifest.framework?.version}`);
if (manifest.schemaVersion !== "framework-manifest-v1") fail("Unexpected manifest schemaVersion");

const expectedContracts = new Map([
  ["framework-manifest", "framework-manifest-v1"],
  ["framework-assembly-spec", "framework-assembly-spec-v1"],
  ["framework-integration-verification-receipt", "framework-integration-verification-receipt-v1"],
  ["framework-change-proposal", "framework-change-proposal-v1"],
]);
if (manifest.contracts?.length !== expectedContracts.size) fail("Manifest contract list is incomplete or contains extras");

for (const contract of manifest.contracts) {
  const expectedVersion = expectedContracts.get(contract.id);
  if (expectedVersion !== contract.schemaVersion) fail(`Unexpected contract ${contract.id}@${contract.schemaVersion}`);
  if (!isRelativePath(contract.schemaPath)) fail(`Unsafe schema path: ${contract.schemaPath}`);
  const schemaPath = resolve(root, contract.schemaPath);
  if (!schemaPath.startsWith(`${root}/`)) fail(`Schema escapes P0002: ${contract.schemaPath}`);
  if (!(await stat(schemaPath)).isFile()) fail(`Schema is not a file: ${contract.schemaPath}`);
  const schema = await readJson(schemaPath);
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") fail(`${contract.id}: unexpected JSON Schema draft`);
  if (schema.type !== "object" || schema.additionalProperties !== false) fail(`${contract.id}: root must be a closed object`);
  if (schema.properties?.schemaVersion?.const !== contract.schemaVersion) fail(`${contract.id}: schemaVersion const mismatch`);
  checkLocalRefs(schema);
}

const catalogGroups = Object.entries(manifest.catalogs ?? {});
const catalogs = catalogGroups.flatMap(([, entries]) => entries);
for (const [kind, entries] of catalogGroups) {
  const ids = new Set();
  for (const entry of entries) {
    if (ids.has(entry.id)) fail(`Duplicate ${kind} id: ${entry.id}`);
    ids.add(entry.id);
  }
}
for (const entry of catalogs) {
  if (!isRelativePath(entry.document) || !(await stat(join(root, entry.document))).isFile()) fail(`Missing catalog document: ${entry.document}`);
  for (const dependency of entry.dependencies ?? []) {
    const dependencyId = typeof dependency === "string" ? dependency : dependency.id;
    if (!catalogs.some((candidate) => candidate.id === dependencyId)) fail(`Unknown dependency ${dependencyId} for ${entry.id}`);
  }
}

if (manifest.framework.status === "DESIGN_ONLY") {
  if (catalogs.some((entry) => !["DESIGN_ONLY", "IMPLEMENTED"].includes(entry.status))) fail("DESIGN_ONLY framework contains a VERIFIED or DEPRECATED catalog entry");
  if (manifest.publicApi?.status !== "DESIGN_ONLY") fail("DESIGN_ONLY framework must expose DESIGN_ONLY publicApi status");
  if (manifest.protectedPathRules?.mode !== "DENY_ALL_FRAMEWORK_MUTATION" || manifest.protectedPathRules?.rules?.length !== 0) fail("DESIGN_ONLY framework must deny all framework mutation");
  if (!["NOT_IMPLEMENTED", "PARTIALLY_IMPLEMENTED"].includes(manifest.evidence?.implementation) || manifest.evidence?.runtimeVerification !== "NOT_RUN" || manifest.evidence?.productAcceptance !== "NOT_RUN") fail("DESIGN_ONLY framework evidence is inconsistent");
  if (manifest.compatibility?.engines?.some((engine) => engine.status !== "DESIGN_ONLY")) fail("DESIGN_ONLY framework contains a production-eligible engine entry");
}

for (const entry of catalogs) {
  if (entry.status === "IMPLEMENTED" || entry.status === "VERIFIED") {
    await verifyReceipt(entry.evidence?.implementationReceiptPath, entry.evidence?.implementationReceiptSha256);
  }
  if (entry.status === "VERIFIED") {
    await verifyReceipt(entry.evidence?.runtimeVerificationReceiptPath, entry.evidence?.runtimeVerificationReceiptSha256);
  }
}
for (const engine of manifest.compatibility?.engines ?? []) {
  if (engine.status === "IMPLEMENTED" || engine.status === "VERIFIED") {
    await verifyReceipt(engine.evidence?.implementationReceiptPath, engine.evidence?.implementationReceiptSha256);
  }
  if (engine.status === "VERIFIED") {
    await verifyReceipt(engine.evidence?.runtimeVerificationReceiptPath, engine.evidence?.runtimeVerificationReceiptSha256);
  }
}

const markdownCount = (await walk(root)).filter((path) => path.endsWith(".md")).length;
if (markdownCount !== manifest.documentCount) fail(`documentCount ${manifest.documentCount} != ${markdownCount}`);

console.log(`Validated ${manifest.contracts.length} contracts for ${manifest.framework.id}@${version}; documentCount=${markdownCount}; status=${manifest.framework.status}`);
