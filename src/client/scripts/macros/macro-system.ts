/**
 * Central entry point for the new macro system.
 *
 * Exposes the MacroEngine / MacroRegistry singletons and provides a
 * single registerMacros() function that wires up all built-in macro
 * definition sets (core, env, state, chat, time, variables, instruct).
 */

// Engine singletons and enums
import { MacroEngine } from "./engine/MacroEngine";
// @ts-expect-error -- circular module, type resolved at runtime
import { MacroRegistry as _MacroRegistry, MacroCategory, MacroValueType } from "./engine/MacroRegistry";
// @ts-expect-error -- circular module, type resolved at runtime
import { MacroLexer as _MacroLexer } from "./engine/MacroLexer";
// @ts-expect-error -- circular module, type resolved at runtime
import { MacroParser as _MacroParser } from "./engine/MacroParser";
// @ts-expect-error -- circular module, type resolved at runtime
import { MacroCstWalker as _MacroCstWalker } from "./engine/MacroCstWalker";
import { MacroEnvBuilder } from "./engine/MacroEnvBuilder";

// Anchor implicit-any from circular modules
// @ts-expect-error -- implicit any from circular module
const MacroRegistry: any = _MacroRegistry;
// @ts-expect-error -- implicit any from circular module
const MacroLexer: any = _MacroLexer;
// @ts-expect-error -- implicit any from circular module
const MacroParser: any = _MacroParser;
// @ts-expect-error -- implicit any from circular module
const MacroCstWalker: any = _MacroCstWalker;

// Macro definition groups
import { registerCoreMacros } from "./definitions/core-macros";
import { registerEnvMacros } from "./definitions/env-macros";
import { registerStateMacros } from "./definitions/state-macros";
import { registerChatMacros } from "./definitions/chat-macros";
import { registerTimeMacros } from "./definitions/time-macros";
import { registerVariableMacros } from "./definitions/variable-macros";
import { registerInstructMacros } from "./definitions/instruct-macros";

// Re-export the category enum for external use
export { MacroCategory, MacroValueType };

// Re-export most-used jsdoc definitions
/** @typedef {import('./engine/MacroRegistry').MacroDefinitionOptions} MacroDefinitionOptions */
/** @typedef {import('./engine/MacroRegistry').MacroDefinition} MacroDefinition */
/** @typedef {import('./engine/MacroRegistry').MacroUnnamedArgDef} MacroUnnamedArgDef */
/** @typedef {import('./engine/MacroRegistry').MacroListSpec} MacroListSpec */
/** @typedef {import('./engine/MacroRegistry').MacroHandler} MacroHandler */
/** @typedef {import('./engine/MacroRegistry').MacroExecutionContext} MacroExecutionContext */

/** @typedef {import('chevrotain').CstNode} CstNode */
/** @typedef {import('./engine/MacroEnv.types').MacroEnv} MacroEnv */
/** @typedef {import('./engine/MacroEnv.types').MacroEnvNames} MacroEnvNames */
/** @typedef {import('./engine/MacroEnv.types').MacroEnvCharacter} MacroEnvCharacter */
/** @typedef {import('./engine/MacroEnv.types').MacroEnvSystem} MacroEnvSystem */
/** @typedef {import('./engine/MacroEnv.types').MacroEnvFunctions} MacroEnvFunctions */

export const macros = {
  // engine singletons
  engine: MacroEngine,
  registry: MacroRegistry,
  envBuilder: MacroEnvBuilder,
  lexer: MacroLexer,
  parser: MacroParser,
  cstWalker: MacroCstWalker,

  // enums
  category: MacroCategory,

  // shorthand functions (lazy to avoid circular dependency TDZ)
  register: (...args: any[]) => MacroRegistry.registerMacro(...args),
  registerAlias: (...args: any[]) => MacroRegistry.registerMacroAlias(...args),
};

/**
 * Registers all built-in macros in a well-defined order.
 * Intended to be called once during app initialization.
 */
export function initRegisterMacros() {
  // Core utilities and generic helpers
  registerCoreMacros();

  // Env / character / system / extras
  registerEnvMacros();

  // Runtime state tracking (eventSource etc.)
  registerStateMacros();

  // Chat/history inspection macros
  registerChatMacros();

  // Time / date / durations
  registerTimeMacros();

  // Variable and instruct macros
  registerVariableMacros();
  registerInstructMacros();
}
