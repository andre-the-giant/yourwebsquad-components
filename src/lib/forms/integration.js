import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeFormsCollection } from "./schema.js";
import { generatePhpEndpoint } from "./generator.js";

export default function yourwebsquadForms() {
  let forms = [];

  return {
    name: "yourwebsquad-forms",
    hooks: {
      "astro:build:start": async ({ logger }) => {
        const root = process.cwd();
        const formsDir = path.join(root, "src", "content", "forms");
        let entries = [];
        try {
          const files = await fs.readdir(formsDir);
          for (const file of files) {
            if (!file.endsWith(".json")) continue;
            const filepath = path.join(formsDir, file);
            const raw = await fs.readFile(filepath, "utf-8");
            const data = JSON.parse(raw);
            const id = path.basename(file, ".json");
            entries.push({ id, data });
          }
        } catch (err) {
          logger.warn(`[forms] No forms directory found at ${formsDir}. Skipping PHP generation.`);
          entries = [];
        }

        if (!entries.length) {
          logger.warn('[forms] No entries found in "src/content/forms". Skipping PHP generation.');
          forms = [];
          return;
        }

        forms = normalizeFormsCollection(entries);
        logger.info(
          `[forms] Loaded ${forms.length} form${forms.length === 1 ? "" : "s"} from content files.`
        );
      },

      "astro:build:done": async ({ dir, logger }) => {
        if (!forms || forms.length === 0) return;
        const outDir = fileURLToPath(dir);

        for (const form of forms) {
          const apiDir = path.join(outDir, "api", form.id);
          const phpPath = path.join(apiDir, "index.php");
          await fs.mkdir(apiDir, { recursive: true });
          const contents = generatePhpEndpoint(form);
          await fs.writeFile(phpPath, contents, "utf-8");
          logger.info(`[forms] Generated ${path.relative(outDir, phpPath)}`);
        }
      }
    }
  };
}
