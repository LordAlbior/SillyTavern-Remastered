import type { Codemod } from "codemod:ast-grep";
import type JS from "codemod:ast-grep/langs/javascript";

/**
 * Renames JavaScript files to TypeScript
 * This is a file-level operation that changes the file extension from .js to .ts
 */
const codemod: Codemod<JS> = async (root) => {
  const filename = root.filename();
  
  // Only rename .js files (not .d.ts or other extensions)
  if (filename.endsWith('.js') && !filename.endsWith('.d.ts')) {
    // Rename the file by changing extension to .ts
    root.rename(filename.replace(/\.js$/, '.ts'));
  }
  
  // Return null because we're only renaming, not modifying content
  return null;
};

export default codemod;
