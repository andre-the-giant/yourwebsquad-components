import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeFormsCollection } from "./schema.js";
import { generatePhpEndpoint } from "./generator.js";

export default function yourwebsquadForms(options = {}) {
  const allowedOrigins = Array.isArray(options.allowOrigins)
    ? options.allowOrigins
    : options.allowOrigins
      ? [options.allowOrigins]
      : [];
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

        // Write shared .htaccess with origin restrictions if configured
        if (allowedOrigins.length) {
          const htaccessDir = path.join(outDir, "api");
          await fs.mkdir(htaccessDir, { recursive: true });
          const pattern = allowedOrigins.map((h) => h.replace(/\./g, "\\.")).join("|");
          const htaccess = `# Restrict API access to same-origin requests (deny other Origins)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTP:Origin} !^$ [NC]
  RewriteCond %{HTTP:Origin} !^https?://(${pattern})(:[0-9]+)?$ [NC]
  RewriteRule ^ - [F]
</IfModule>

<IfModule mod_headers.c>
  Header always unset Access-Control-Allow-Origin
  Header always unset Access-Control-Allow-Methods
  Header always unset Access-Control-Allow-Headers
</IfModule>
`;
          await fs.writeFile(path.join(htaccessDir, ".htaccess"), htaccess, "utf-8");
          logger.info(
            `[forms] Generated api/.htaccess with allowed origins: ${allowedOrigins.join(", ")}`
          );
        }

        for (const form of forms) {
          const apiDir = path.join(outDir, "api", form.id);
          const phpPath = path.join(apiDir, "index.php");
          await fs.mkdir(apiDir, { recursive: true });
          const contents = generatePhpEndpoint(form, { allowedOrigins });
          await fs.writeFile(phpPath, contents, "utf-8");
          logger.info(`[forms] Generated ${path.relative(outDir, phpPath)}`);
        }
      }
    }
  };
}
