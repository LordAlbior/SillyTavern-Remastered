import type { Codemod } from "codemod:ast-grep";
import type JS from "codemod:ast-grep/langs/javascript";
import type TS from "codemod:ast-grep/langs/typescript";

type JSOrTS = JS | TS;

/**
 * Converts JSDoc type annotations to TypeScript type annotations
 * 
 * This codemod is conservative and only converts simple, well-defined types.
 * Complex types are left as-is for manual review.
 * 
 * Handles:
 * - @param {Type} name -> name: Type (simple types only)
 * - @returns {Type} -> : Type (simple types only)
 * 
 * Skips:
 * - Complex union types
 * - Generic types with multiple parameters
 * - Callback function types
 * - Types that reference undefined types
 */
const codemod: Codemod<JSOrTS> = async (root) => {
  const rootNode = root.root();
  const edits: any[] = [];

  // Find all function declarations
  const functions = rootNode.findAll({
    rule: {
      kind: "function_declaration",
    },
  });

  for (const func of functions) {
    // Check if there's a JSDoc comment before this function
    const prevSibling = func.prev();
    if (!prevSibling || prevSibling.kind() !== "comment") continue;

    const commentText = prevSibling.text();
    if (!commentText.startsWith("/**")) continue;

    // Extract @param annotations
    const paramMatches = [...commentText.matchAll(/@param\s+\{([^}]+)\}\s+(\w+)/g)];
    
    if (paramMatches.length === 0) continue;

    // Get function parameters
    const params = func.field("parameters");
    if (!params) continue;

    // Find required_parameter nodes
    const paramNodes = params.findAll({
      rule: {
        kind: "required_parameter",
      },
    });

    for (const paramNode of paramNodes) {
      const identifier = paramNode.field("pattern") || paramNode.find({
        rule: {
          kind: "identifier",
        },
      });
      
      if (!identifier) continue;
      
      const paramName = identifier.text();
      const jsdocMatch = paramMatches.find(m => m[2] === paramName);
      
      if (jsdocMatch) {
        const jsdocType = jsdocMatch[1];
        
        // Only convert simple types
        if (!isSimpleType(jsdocType)) continue;
        
        const tsType = convertJSDocTypeToTS(jsdocType);
        
        // Insert type annotation after the identifier
        const identEnd = identifier.range().end.index;
        edits.push({
          startPos: identEnd,
          endPos: identEnd,
          insertedText: `: ${tsType}`,
        });
      }
    }

    // Extract @returns annotation
    const returnsMatch = commentText.match(/@returns?\s+\{([^}]+)\}/);
    if (returnsMatch) {
      const returnType = returnsMatch[1];
      
      // Only convert simple types
      if (isSimpleType(returnType)) {
        const tsReturnType = convertJSDocTypeToTS(returnType);
        
        // Insert return type after the closing parenthesis of parameters
        const paramsEnd = params.range().end.index;
        edits.push({
          startPos: paramsEnd,
          endPos: paramsEnd,
          insertedText: `: ${tsReturnType}`,
        });
      }
    }
  }

  // Handle arrow functions in variable declarations
  const arrowFunctions = rootNode.findAll({
    rule: {
      kind: "arrow_function",
    },
  });

  for (const arrowFunc of arrowFunctions) {
    // Check if there's a JSDoc comment before the variable declaration
    const parent = arrowFunc.parent();
    if (!parent || parent.kind() !== "variable_declarator") continue;

    const declarator = parent;
    const declaration = declarator.parent();
    if (!declaration || declaration.kind() !== "lexical_declaration") continue;

    const prevSibling = declaration.prev();
    if (!prevSibling || prevSibling.kind() !== "comment") continue;

    const commentText = prevSibling.text();
    if (!commentText.startsWith("/**")) continue;

    // Extract @param annotations
    const paramMatches = [...commentText.matchAll(/@param\s+\{([^}]+)\}\s+(\w+)/g)];
    
    if (paramMatches.length === 0) continue;

    // Get arrow function parameters
    const params = arrowFunc.field("parameters");
    if (!params) continue;

    // Find required_parameter nodes
    const paramNodes = params.findAll({
      rule: {
        kind: "required_parameter",
      },
    });

    for (const paramNode of paramNodes) {
      const identifier = paramNode.field("pattern") || paramNode.find({
        rule: {
          kind: "identifier",
        },
      });
      
      if (!identifier) continue;
      
      const paramName = identifier.text();
      const jsdocMatch = paramMatches.find(m => m[2] === paramName);
      
      if (jsdocMatch) {
        const jsdocType = jsdocMatch[1];
        
        // Only convert simple types
        if (!isSimpleType(jsdocType)) continue;
        
        const tsType = convertJSDocTypeToTS(jsdocType);
        
        // Insert type annotation after the identifier
        const identEnd = identifier.range().end.index;
        edits.push({
          startPos: identEnd,
          endPos: identEnd,
          insertedText: `: ${tsType}`,
        });
      }
    }

    // Extract @returns annotation
    const returnsMatch = commentText.match(/@returns?\s+\{([^}]+)\}/);
    if (returnsMatch) {
      const returnType = returnsMatch[1];
      
      // Only convert simple types
      if (isSimpleType(returnType)) {
        const tsReturnType = convertJSDocTypeToTS(returnType);
        
        // Insert return type after the closing parenthesis of parameters
        const paramsEnd = params.range().end.index;
        edits.push({
          startPos: paramsEnd,
          endPos: paramsEnd,
          insertedText: `: ${tsReturnType}`,
        });
      }
    }
  }

  if (edits.length === 0) {
    return null;
  }

  return rootNode.commitEdits(edits);
};

/**
 * Check if a JSDoc type is simple enough to convert automatically
 */
function isSimpleType(jsdocType: string): boolean {
  // Skip complex types
  if (jsdocType.includes("|") && jsdocType.split("|").length > 2) return false;
  if (jsdocType.includes("<") && jsdocType.includes(",") && jsdocType.split(",").length > 2) return false;
  if (jsdocType.startsWith("function")) return false;
  if (jsdocType.includes("=>")) return false;
  if (jsdocType.includes("{") && jsdocType.includes(":")) return false;
  
  return true;
}

/**
 * Convert JSDoc type syntax to TypeScript type syntax
 */
function convertJSDocTypeToTS(jsdocType: string): string {
  // Handle nullable types: ?Type -> Type | null
  if (jsdocType.startsWith("?")) {
    return `${convertJSDocTypeToTS(jsdocType.slice(1))} | null`;
  }

  // Handle optional types: Type= -> Type | undefined
  if (jsdocType.endsWith("=")) {
    return `${convertJSDocTypeToTS(jsdocType.slice(0, -1))} | undefined`;
  }

  // Handle union types: Type1|Type2 -> Type1 | Type2
  if (jsdocType.includes("|")) {
    return jsdocType.split("|").map(t => convertJSDocTypeToTS(t.trim())).join(" | ");
  }

  // Handle array types: Type[] or Array<Type>
  if (jsdocType.endsWith("[]")) {
    return `${convertJSDocTypeToTS(jsdocType.slice(0, -2))}[]`;
  }
  if (jsdocType.startsWith("Array<") && jsdocType.endsWith(">")) {
    const innerType = jsdocType.slice(6, -1);
    return `${convertJSDocTypeToTS(innerType)}[]`;
  }

  // Handle object types: Object or {key: value}
  if (jsdocType === "Object" || jsdocType === "object") {
    return "Record<string, any>";
  }

  // Handle Promise types
  if (jsdocType.startsWith("Promise<")) {
    return jsdocType;
  }

  // Handle import types: import('path').Type
  if (jsdocType.startsWith("import(")) {
    return jsdocType;
  }

  // Handle common type mappings
  const typeMap: Record<string, string> = {
    "string": "string",
    "number": "number",
    "boolean": "boolean",
    "any": "any",
    "void": "void",
    "null": "null",
    "undefined": "undefined",
    "never": "never",
    "unknown": "unknown",
    "*": "any",
  };

  if (typeMap[jsdocType]) {
    return typeMap[jsdocType];
  }

  // Return as-is for complex types
  return jsdocType;
}

export default codemod;
