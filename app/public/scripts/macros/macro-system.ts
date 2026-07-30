/**
 * Central entry point for the new macro system.
 *
 * Exposes the MacroEngine / MacroRegistry singletons and provides a
 * single registerMacros() function that wires up all built-in macro
 * definition sets (core, env, state, chat, time, variables, instruct).
 */

// Engine singletons and enums
import { MacroEngine } from './engine/MacroEngine.ts';
import { MacroRegistry, MacroCategory, MacroValueType } from './engine/MacroRegistry.ts';
import { MacroLexer } from './engine/MacroLexer.ts';
import { MacroParser } from './engine/MacroParser.ts';
import { MacroCstWalker } from './engine/MacroCstWalker.ts';
import { MacroEnvBuilder } from './engine/MacroEnvBuilder.ts';

// Macro definition groups
import { registerCoreMacros } from './definitions/core-macros.ts';
import { registerEnvMacros } from './definitions/env-macros.ts';
import { registerStateMacros } from './definitions/state-macros.ts';
import { registerChatMacros } from './definitions/chat-macros.ts';
import { registerTimeMacros } from './definitions/time-macros.ts';
import { registerVariableMacros } from './definitions/variable-macros.ts';
import { registerInstructMacros } from './definitions/instruct-macros.ts';

// Re-export the category enum for external use
export { MacroCategory, MacroValueType };

// Re-export most-used jsdoc definitions
/** @typedef {import('./engine/MacroRegistry.js').MacroDefinitionOptions} MacroDefinitionOptions */
/** @typedef {import('./engine/MacroRegistry.js').MacroDefinition} MacroDefinition */
/** @typedef {import('./engine/MacroRegistry.js').MacroUnnamedArgDef} MacroUnnamedArgDef */
/** @typedef {import('./engine/MacroRegistry.js').MacroListSpec} MacroListSpec */
/** @typedef {import('./engine/MacroRegistry.js').MacroHandler} MacroHandler */
/** @typedef {import('./engine/MacroRegistry.js').MacroExecutionContext} MacroExecutionContext */

/** @typedef {import('chevrotain').CstNode} CstNode */
/** @typedef {import('./engine/MacroEnv.types.js').MacroEnv} MacroEnv */
/** @typedef {import('./engine/MacroEnv.types.js').MacroEnvNames} MacroEnvNames */
/** @typedef {import('./engine/MacroEnv.types.js').MacroEnvCharacter} MacroEnvCharacter */
/** @typedef {import('./engine/MacroEnv.types.js').MacroEnvSystem} MacroEnvSystem */
/** @typedef {import('./engine/MacroEnv.types.js').MacroEnvFunctions} MacroEnvFunctions */

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
    register: (...args) => MacroRegistry.registerMacro(...args),
    registerAlias: (...args) => MacroRegistry.registerMacroAlias(...args),
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
