import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getCollection } from "astro:content";
import { normalizeFormsCollection } from "./schema.js";
import { generatePhpEndpoint } from "./generator.js";

export default function yourwebsquadForms() {
  let forms = [];

  return {
    name: "yourwebsquad-forms",
    hooks: {
      "astro:build:start": async ({ logger }) => {
        const entries = await getCollection("forms");
        if (!entries || entries.length === 0) {
          logger.warn(
            '[forms] No entries found in content collection "forms". Skipping PHP generation.'
          );
          forms = [];
          return;
        }

        forms = normalizeFormsCollection(entries);
        logger.info(
          `[forms] Loaded ${forms.length} form${forms.length === 1 ? "" : "s"} from content collection.`
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
