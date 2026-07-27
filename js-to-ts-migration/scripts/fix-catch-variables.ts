import type { Codemod } from "codemod:ast-grep";
import type JS from "codemod:ast-grep/langs/javascript";
import type TS from "codemod:ast-grep/langs/typescript";

type JSOrTS = JS | TS;

/**
 * Adds type guards for catch variables to handle useUnknownInCatchVariables
 * 
 * Transforms:
 * catch (error) { console.error(error.message); }
 * 
 * Into:
 * catch (error) { if (error instanceof Error) { console.error(error.message); } else { console.error(String(error)); } }
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

    // Find all property accesses on the error variable
    const propertyAccesses = catchBody.findAll({
      rule: {
        pattern: `${errorVar}.$PROPERTY`,
      },
    });

    // Find all method calls on the error variable
    const methodCalls = catchBody.findAll({
      rule: {
        pattern: `${errorVar}.$METHOD($$$ARGS)`,
      },
    });

    // If there are no property accesses or method calls, skip
    if (propertyAccesses.length === 0 && methodCalls.length === 0) continue;

    // Wrap the entire catch body in an instanceof check
    const bodyStart = catchBody.range().start.index;
    const bodyEnd = catchBody.range().end.index;
    const bodyText = catchBody.text();

    // Remove the outer braces from bodyText
    const innerBody = bodyText.slice(1, -1).trim();

    // Create the wrapped version
    const wrappedBody = `{
    if (${errorVar} instanceof Error) {
      ${innerBody}
    } else {
      console.error(String(${errorVar}));
    }
  }`;

    edits.push({
      startPos: bodyStart,
      endPos: bodyEnd,
      insertedText: wrappedBody,
    });
  }

  if (edits.length === 0) {
    return null;
  }

  return rootNode.commitEdits(edits);
};

export default codemod;
