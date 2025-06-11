#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

async function fixImportsInFile(filePath) {
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
    console.log(`Fixed imports in ${filePath}`);
  }
}

async function processDirectory(dir) {
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
processDirectory(distPath).catch(console.error);
