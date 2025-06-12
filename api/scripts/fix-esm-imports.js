#!/usr/bin/env node
/* eslint-env node */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

async function fixImportsInFile(
  filePath,
) /* eslint-disable-line @typescript-eslint/explicit-function-return-type */ {
  const content = await readFile(filePath, 'utf-8');

  // Fix relative imports to add .js extension
  let fixed = content.replace(
    /from\s+['"](\.\/[^'"]+)(?<!\.js)(?<!\.json)['"]/g,
    (match, importPath) => `from '${importPath}.js'`,
  );

  // Fix parent imports
  fixed = fixed.replace(
    /from\s+['"](\.\.\/[^'"]+)(?<!\.js)(?<!\.json)['"]/g,
    (match, importPath) => `from '${importPath}.js'`,
  );

  if (fixed !== content) {
    await writeFile(filePath, fixed);
    console.warn(`Fixed imports in ${filePath}`); // eslint-disable-line no-console
  }
}

async function processDirectory(
  dir,
) /* eslint-disable-line @typescript-eslint/explicit-function-return-type */ {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('__')) {
      await processDirectory(fullPath);
    } else if (entry.isFile() && extname(entry.name) === '.js') {
      await fixImportsInFile(fullPath);
    }
  }
}

// Run the fix
const distPath = process.argv[2] || './dist';
processDirectory(distPath).catch(console.error); // eslint-disable-line no-console
