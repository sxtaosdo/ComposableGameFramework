import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await visit(path);
    else if (path.endsWith(".js")) {
      const source = await readFile(path, "utf8");
      const normalized = source.replace(/((?:from|import)\s*["'])(\.{1,2}\/[^"']+)(["'])/g, (_match, prefix, specifier, suffix) =>
        `${prefix}${extname(specifier) ? specifier : `${specifier}.js`}${suffix}`,
      );
      if (normalized !== source) await writeFile(path, normalized, "utf8");
    }
  }
}

await visit(fileURLToPath(new URL("../dist/", import.meta.url)));
