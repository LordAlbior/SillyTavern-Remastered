/**
 * Central entry point for the new macro system.
 *
 * Exposes the MacroEngine / MacroRegistry singletons and provides a
 * single registerMacros() function that wires up all built-in macro
 * definition sets (core, env, state, chat, time, variables, instruct).
 */

// Engine singletons and enums
import { MacroEngine } from "/app/systems/macros/engine/MacroEngine";
// @ts-expect-error -- circular module, type resolved at runtime
import { MacroRegistry as _MacroRegistry, MacroCategory, MacroValueType } from "/app/systems/macros/engine/MacroRegistry";
// @ts-expect-error -- circular module, type resolved at runtime
import { MacroLexer as _MacroLexer } from "/app/systems/macros/engine/MacroLexer";
// @ts-expect-error -- circular module, type resolved at runtime
import { MacroParser as _MacroParser } from "/app/systems/macros/engine/MacroParser";
// @ts-expect-error -- circular module, type resolved at runtime
import { MacroCstWalker as _MacroCstWalker } from "/app/systems/macros/engine/MacroCstWalker";
import { MacroEnvBuilder } from "/app/systems/macros/engine/MacroEnvBuilder";

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
import { registerCoreMacros } from "/app/systems/macros/definitions/core-macros";
import { registerEnvMacros } from "/app/systems/macros/definitions/env-macros";
import { registerStateMacros } from "/app/systems/macros/definitions/state-macros";
import { registerChatMacros } from "/app/systems/macros/definitions/chat-macros";
import { registerTimeMacros } from "/app/systems/macros/definitions/time-macros";
import { registerVariableMacros } from "/app/systems/macros/definitions/variable-macros";
import { registerInstructMacros } from "/app/systems/macros/definitions/instruct-macros";

// Re-export the category enum for external use
export { MacroCategory, MacroValueType };

// Re-export most-used jsdoc definitions
/** @typedef {import('/app/systems/macros/engine/MacroRegistry').MacroDefinitionOptions} MacroDefinitionOptions */
/** @typedef {import('/app/systems/macros/engine/MacroRegistry').MacroDefinition} MacroDefinition */
/** @typedef {import('/app/systems/macros/engine/MacroRegistry').MacroUnnamedArgDef} MacroUnnamedArgDef */
/** @typedef {import('/app/systems/macros/engine/MacroRegistry').MacroListSpec} MacroListSpec */
/** @typedef {import('/app/systems/macros/engine/MacroRegistry').MacroHandler} MacroHandler */
/** @typedef {import('/app/systems/macros/engine/MacroRegistry').MacroExecutionContext} MacroExecutionContext */

/** @typedef {import('chevrotain').CstNode} CstNode */
/** @typedef {import('/app/systems/macros/engine/MacroEnv.types').MacroEnv} MacroEnv */
/** @typedef {import('/app/systems/macros/engine/MacroEnv.types').MacroEnvNames} MacroEnvNames */
/** @typedef {import('/app/systems/macros/engine/MacroEnv.types').MacroEnvCharacter} MacroEnvCharacter */
/** @typedef {import('/app/systems/macros/engine/MacroEnv.types').MacroEnvSystem} MacroEnvSystem */
/** @typedef {import('/app/systems/macros/engine/MacroEnv.types').MacroEnvFunctions} MacroEnvFunctions */

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
