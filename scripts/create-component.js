import fs from "fs/promises";
import path from "path";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const rl = readline.createInterface({ input, output });

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
    console.log(`Skipped (exists): ${filePath}`);
  } catch {
    await fs.writeFile(filePath, content, "utf8");
    console.log(`Created: ${filePath}`);
  }
}

async function run() {
  const nameArg = process.argv[2];
  const groupArg = process.argv[3];
  const descArg = process.argv[4];

  const name = nameArg ?? (await rl.question("Component name (e.g. Button): "));
  const groupInput =
    (groupArg ?? (await rl.question("Group (atoms|molecules|components) [atoms]: "))) || "atoms";
  const description = (descArg ?? (await rl.question("Short description: "))) || "";

  const group = ["atoms", "molecules", "components"].includes(groupInput) ? groupInput : "atoms";
  const Folder = pascalCase(name);
  const slugName = slug(name);

  const libDir = path.join(process.cwd(), "src/lib/components", Folder);
  const docsDir = path.join(process.cwd(), "src/docs/pages/components", group);
  const docsWrapperDir = path.join(process.cwd(), "src/docs/pages/components");

  await ensureDir(libDir);
  await ensureDir(docsDir);
  await ensureDir(docsWrapperDir);

  // Component .astro
  const compFile = path.join(libDir, `${Folder}.astro`);
  const compIndex = path.join(libDir, `index.astro`);

  const compTemplate = `---\n/*\nProps:\n- content?: { shape }\nNotes:\n- direct props override content.*\n*/\nconst props = Astro.props;\n---\n\n<div>{/* TODO: implement ${Folder} component */}</div>\n`;

  const indexTemplate = `---\nimport ${Folder} from "./${Folder}.astro";\nconst props = Astro.props;\n---\n\n<${Folder} {...props} />\n`;

  await writeIfNotExists(compFile, compTemplate);
  await writeIfNotExists(compIndex, indexTemplate);

  // Docs page in group
  const docFile = path.join(docsDir, `${slugName}.astro`);
  const docTemplate = `---\nimport DocLayout from "../../../layouts/DocLayout.astro";\nimport Preview from "../../../components/Preview.astro";\nimport { components } from "../../../data/components.js";\nimport ${Folder} from "@lib/components/${Folder}/${Folder}.astro";\n\nconst code = '<${Folder} />';\n---\n\n<DocLayout title="${Folder}" description={"${description}"} items={components}>\n  <Preview title="Preview" code={code}>\n    <${Folder} />\n  </Preview>\n</DocLayout>\n`;

  await writeIfNotExists(docFile, docTemplate);

  // Wrapper at original route
  const wrapperFile = path.join(docsWrapperDir, `${slugName}.astro`);
  const wrapperTemplate = `---\nimport Page from "./${group}/${slugName}.astro";\n---\n\n<Page />\n`;
  await writeIfNotExists(wrapperFile, wrapperTemplate);

  // Update src/docs/data/components.js by inserting a new entry before the closing ]
  const dataFile = path.join(process.cwd(), "src/docs/data/components.js");
  try {
    const content = await fs.readFile(dataFile, "utf8");
    const insert = `  {\n    name: "${Folder}",\n    href: "/components/${slugName}",\n    description: "${description}",\n    group: "${group}"\n  }\n`;
    const updated = content.replace(/,?\n\];\s*$/m, `,\n${insert}];\n`);
    if (updated === content) {
      console.warn(`Could not update ${dataFile} — pattern not found.`);
    } else {
      await fs.writeFile(dataFile, updated, "utf8");
      console.log(`Updated: ${dataFile}`);
    }
  } catch (err) {
    console.warn(`Failed to update components.js: ${err.message}`);
  }

  rl.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
