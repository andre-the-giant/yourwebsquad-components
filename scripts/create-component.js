import fs from "fs/promises";
import path from "path";
import inquirer from "inquirer";
import { execa } from "execa";
import chalk from "chalk";

const line = chalk.gray("=".repeat(50));
const logInfo = (msg) => console.log(`${line}\n${chalk.cyan(msg)}\n${line}`);
const logSuccess = (msg) => console.log(`${line}\n${chalk.green(msg)}\n${line}`);
const logError = (msg) => console.error(`${line}\n${chalk.red(msg)}\n${line}`);

function pascalCase(name) {
  return name.replace(/(^.|-.)/g, (s) => s.replace(/-/g, "").toUpperCase()).replace(/\s+/g, "");
}

function slug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeIfNotExists(filePath, content) {
  try {
    await fs.access(filePath);
    logInfo(`Skipped (exists): ${filePath}`);
    return false;
  } catch {
    await fs.writeFile(filePath, content, "utf8");
    logSuccess(`Created: ${filePath}`);
    return true;
  }
}

async function run() {
  const nameArg = process.argv[2];
  const groupArg = process.argv[3];
  const descArg = process.argv[4];

  const trimmedNameArg = nameArg?.trim() || "";
  const trimmedGroupArg = groupArg?.trim() || "";
  const trimmedDescArg = descArg?.trim() || "";

  const prompts = [];

  if (!trimmedNameArg) {
    prompts.push({
      type: "input",
      name: "name",
      message: "Component name (e.g. Button):",
      validate: (input) => {
        const val = input.trim();
        if (!val) return "Name is required.";
        if (val.length < 2) return "Name must be at least 2 characters.";
        return true;
      }
    });
  }

  const groups = ["atoms", "molecules", "components"];
  if (!trimmedGroupArg) {
    prompts.push({
      type: "list",
      name: "group",
      message: "Choose component group:",
      choices: groups.map((g) => ({ name: g, value: g })),
      default: "atoms"
    });
  }

  if (!trimmedDescArg) {
    prompts.push({
      type: "input",
      name: "description",
      message: "Short description:",
      default: ""
    });
  }

  const answers = prompts.length ? await inquirer.prompt(prompts) : {};

  const name = trimmedNameArg || answers.name;
  const groupInput = trimmedGroupArg || answers.group || "atoms";
  const description = trimmedDescArg || answers.description || "";

  const group = groups.includes(groupInput) ? groupInput : "atoms";
  const Folder = pascalCase(name);
  const slugName = slug(name);

  const libDir = path.join(process.cwd(), "src/lib/components", Folder);
  const docsDir = path.join(process.cwd(), "src/docs/pages/components", group);

  await ensureDir(libDir);
  await ensureDir(docsDir);
  logInfo(`Creating component scaffold for ${Folder} in group "${group}"...`);

  const formatTargets = [];

  // Component .astro
  const compFile = path.join(libDir, `${Folder}.astro`);
  const compIndex = path.join(libDir, `index.astro`);

  const compTemplate = `---
/*
Props:
- title?: string // TODO: document props
- content?: { shape }
Notes:
- Update schema + props to match your component API.
*/
import { validateProps } from "../../utils/props.js";

const schema = {
  id: { type: "string" },
  class: { type: "string" },
  style: { type: "string" }
};

const {
  id,
  class: className,
  style,
  ...rest
} = validateProps(schema, Astro.props, { component: "${Folder}" });

const resolvedId = id ?? "${slugName}-" + Math.random().toString(36).slice(2, 9);
const styleVars = {
  // "--${slugName}-bg": "var(--color-bg)"
};

const inlineStyle = Object.entries(styleVars)
  .filter(([, value]) => value !== undefined)
  .map(([key, value]) => key + ": " + value)
  .join("; ");

const resolvedStyle = [inlineStyle, style].filter(Boolean).join("; ");
const resolvedClass = \`${slugName} \${className ?? ""}\`.trim();
---

<section id={resolvedId} class={resolvedClass} style={resolvedStyle || undefined} {...rest}>
  <slot>
    <!-- TODO: replace with component structure -->
    <p>${Folder} content goes here.</p>
  </slot>
</section>

<style>
  .${slugName} {
    display: block;
    width: 100%;
  }
</style>
`;

  const indexTemplate = `---\nimport ${Folder} from "./${Folder}.astro";\nconst props = Astro.props;\n---\n\n<${Folder} {...props}>\n  <slot />\n</${Folder}>\n`;

  if (await writeIfNotExists(compFile, compTemplate)) {
    formatTargets.push(compFile);
  }
  if (await writeIfNotExists(compIndex, indexTemplate)) {
    formatTargets.push(compIndex);
  }

  // Docs page in group
  const docFile = path.join(docsDir, `${slugName}.astro`);
  const descriptionLiteral = JSON.stringify(description);
  const docTemplate = `---
import DocLayout from "@docs/layouts/DocLayout.astro";
import Preview from "@docs/components/Preview.astro";
import PropsTable from "@docs/components/PropsTable.astro";
import { components } from "@docs/data/components.js";
import ${Folder} from "@lib/components/${Folder}/${Folder}.astro";

const propsTable = [
  { name: "id", type: "string", description: "Optional id for the root element." },
  { name: "class", type: "string", description: "Additional class names." }
];

const defaultCode = '<${Folder} />';
const customCode = '<${Folder} id="${slugName}-sample" />';
---

<DocLayout title="${Folder}" description=${descriptionLiteral} items={components}>
  <PropsTable props={propsTable} />

  <div class="preview-grid">
    <Preview title="Default" code={defaultCode}>
      <${Folder} />
    </Preview>

    <Preview title="Custom" code={customCode}>
      <${Folder} id="${slugName}-sample" />
    </Preview>
  </div>
</DocLayout>

<style>
  .preview-grid {
    display: grid;
    gap: var(--space-4);
  }
</style>
`;

  if (await writeIfNotExists(docFile, docTemplate)) {
    formatTargets.push(docFile);
  }

  // Update src/lib/index.js export
  const libIndex = path.join(process.cwd(), "src/lib/index.js");
  try {
    const exportLine = `export { default as ${Folder} } from "./components/${Folder}/${Folder}.astro";`;
    const indexContent = await fs.readFile(libIndex, "utf8");
    if (!indexContent.includes(exportLine)) {
      const updatedIndex = `${indexContent.trim()}\n${exportLine}\n`;
      await fs.writeFile(libIndex, `${updatedIndex}\n`, "utf8");
      formatTargets.push(libIndex);
      logSuccess(`Updated: ${libIndex}`);
    } else {
      logInfo(`Export already present in ${libIndex}`);
    }
  } catch (err) {
    logError(`Failed to update ${libIndex}: ${err.message}`);
  }

  // Update src/docs/data/components.js by inserting a new entry before the closing ]
  const dataFile = path.join(process.cwd(), "src/docs/data/components.js");
  try {
    const content = await fs.readFile(dataFile, "utf8");
    const insert = `  {\n    name: "${Folder}",\n    href: "/components/${group}/${slugName}",\n    description: ${descriptionLiteral},\n    group: "${group}"\n  }\n`;
    const updated = content.replace(/,?\n\];\s*$/m, `,\n${insert}];\n`);
    if (updated === content) {
      logError(`Could not update ${dataFile} — pattern not found.`);
    } else {
      await fs.writeFile(dataFile, updated, "utf8");
      formatTargets.push(dataFile);
      logSuccess(`Updated: ${dataFile}`);
    }
  } catch (err) {
    logError(`Failed to update components.js: ${err.message}`);
  }

  const uniqueTargets = Array.from(new Set(formatTargets));
  if (uniqueTargets.length) {
    try {
      logInfo("Formatting generated files...");
      await execa("npx", ["prettier", "--write", ...uniqueTargets], { stdio: "inherit" });
    } catch (err) {
      logError(`Formatting failed: ${err.shortMessage || err.message}`);
    }
  }

  logSuccess(`Component scaffold created: ${Folder} -> /components/${group}/${slugName}`);
}

run().catch((err) => {
  logError(err.message || String(err));
  process.exit(1);
});
