import type { Codemod } from "codemod:ast-grep";
import type JS from "codemod:ast-grep/langs/javascript";
import type TS from "codemod:ast-grep/langs/typescript";

type JSOrTS = JS | TS;

/**
 * Adds type guards for catch variables to handle useUnknownInCatchVariables
 * 
 * This codemod is conservative and only transforms simple cases where:
 * - The catch variable is used with property access (e.g., error.message)
 * - The catch body doesn't already have an instanceof check
 * 
 * For complex cases, manual review is recommended.
 */
const codemod: Codemod<JSOrTS> = async (root) => {
  const rootNode = root.root();
  const edits: any[] = [];

  // Find all catch clauses
  const catchClauses = rootNode.findAll({
    rule: {
      kind: "catch_clause",
    },
  });

  for (const catchClause of catchClauses) {
    // Get the catch parameter
    const catchParam = catchClause.find({
      rule: {
        kind: "identifier",
      },
    });

    if (!catchParam) continue;

    const errorVar = catchParam.text();

    // Get the catch body
    const catchBody = catchClause.field("body");
    if (!catchBody) continue;

    // Check if the catch body already has an instanceof check for this variable
    const hasInstanceCheck = catchBody.find({
      rule: {
        pattern: `${errorVar} instanceof Error`,
      },
    });

    if (hasInstanceCheck) continue; // Already has type guard

    // Find all property accesses on the error variable (e.g., error.message)
    const propertyAccesses = catchBody.findAll({
      rule: {
        pattern: `${errorVar}.$PROPERTY`,
      },
    });

    // If there are no property accesses, skip this catch block
    if (propertyAccesses.length === 0) continue;

    // For each property access, add a type guard
    for (const propAccess of propertyAccesses) {
      const parent = propAccess.parent();
      if (!parent) continue;

      // Check if this is inside a statement (not already in a type guard)
      const statement = parent.find({
        rule: {
          any: [
            { kind: "expression_statement" },
            { kind: "variable_declaration" },
            { kind: "return_statement" },
          ],
        },
      });

      if (!statement) continue;

      // Get the statement text
      const statementText = statement.text();
      const statementStart = statement.range().start.index;
      const statementEnd = statement.range().end.index;

      // Create a type-guarded version
      const guardedStatement = `if (${errorVar} instanceof Error) { ${statementText} }`;

      edits.push({
        startPos: statementStart,
        endPos: statementEnd,
        insertedText: guardedStatement,
      });
    }
  }

  if (edits.length === 0) {
    return null;
  }

  return rootNode.commitEdits(edits);
};

export default codemod;
