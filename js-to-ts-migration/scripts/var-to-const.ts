import type { Codemod } from "codemod:ast-grep";
import type JS from "codemod:ast-grep/langs/javascript";
import type TS from "codemod:ast-grep/langs/typescript";

type JSOrTS = JS | TS;

/**
 * Converts var declarations to const
 * 
 * Transforms:
 * var x = 5;
 * 
 * Into:
 * const x = 5;
 */
const codemod: Codemod<JSOrTS> = async (root) => {
  const rootNode = root.root();
  const edits: any[] = [];

  // Find all var declarations
  const varDeclarations = rootNode.findAll({
    rule: {
      pattern: "var $NAME = $VALUE",
    },
  });

  for (const varDecl of varDeclarations) {
    // Replace the entire declaration with const
    const varText = varDecl.text();
    const constText = varText.replace(/^var\s+/, "const ");
    edits.push(varDecl.replace(constText));
  }

  if (edits.length === 0) {
    return null;
  }

  return rootNode.commitEdits(edits);
};

export default codemod;
