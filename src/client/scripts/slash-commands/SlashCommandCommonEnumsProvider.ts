import { onlyUniqueJson, sortIgnoreCaseAndAccents } from "../constants.ts";
import { SlashCommandEnumValue, enumTypes } from "./SlashCommandEnumValue.ts";

/**
 * Runtime data injected by owner modules via registerEnumData().
 * Keeps this module free of imports into the rest of the app (breaks circular dependency chains).
 *
 * @type {Record<string, (...args: any[]) => any>}
 */
const enumData = {
  chatMetadata: () => ({}),
  characters: () => [],
  substituteParams: (content: any, options: any = {}) => content,
  chat: () => [],
  extensionPromptRoles: () => ({}),
  extensionPromptTypes: () => ({}),
  name2: () => null,
  neutralCharacterName: () => null,
  extensionSettings: () => ({}),
  getGroupMembers: (groupId = undefined) => [],
  groups: () => [],
  powerUser: () => ({}),
  searchCharByName: () => null,
  getTagsList: () => [],
  tags: () => [],
  tagMap: () => ({}),
  worldNames: () => [],
} as any;

/**
 * Registers live data getters. Called at module scope by the data-owning modules.
 *
 * @param {Partial<typeof enumData>} data - The getters to register
 */
export function registerEnumData(data: any) {
  Object.assign(enumData, data);
}

/** @typedef {import('./SlashCommandExecutor.js').SlashCommandExecutor} SlashCommandExecutor */
/** @typedef {import('./SlashCommandScope.js').SlashCommandScope} SlashCommandScope */

/**
 * A collection of regularly used enum icons
 */
export const enumIcons = {
  default: "◊",

  // Variables
  variable: "𝑥",
  localVariable: "L",
  globalVariable: "G",
  scopeVariable: "S",

  // Common types
  character: "👤",
  group: "🧑‍🤝‍🧑",
  persona: "🧙‍♂️",
  qr: "QR",
  closure: "𝑓",
  macro: "{{",
  tag: "🏷️",
  world: "🌐",
  preset: "⚙️",
  file: "📄",
  message: "💬",
  reasoning: "💡",
  voice: "🎤",
  server: "🖥️",
  popup: "🗔",
  image: "🖼️",
  video: "🎥",
  key: "🔑",
  spinner: "♻️",
  stop: "🛑",

  true: "✔️",
  false: "❌",
  null: "🚫",
  undefined: "❓",

  // Value types
  boolean: "🔲",
  string: "📝",
  number: "1️⃣",
  array: "[]",
  enum: "📚",
  dictionary: "{}",

  // Roles
  system: "⚙️",
  user: "👤",
  assistant: "🤖",

  // WI Icons
  constant: "🔵",
  normal: "🟢",
  disabled: "❌",
  vectorized: "🔗",

  /**
   * Returns the appropriate state icon based on a boolean
   *
   * @param {boolean} state - The state to determine the icon for
   * @returns {string} The corresponding state icon
   */
  getStateIcon: (state: any) => {
    return state ? enumIcons.true : enumIcons.false;
  },

  /**
   * Returns the appropriate WI icon based on the entry
   *
   * @param {Object} entry - WI entry
   * @returns {string} The corresponding WI icon
   */
  getWiStatusIcon: (entry: any) => {
    if (entry.constant) return enumIcons.constant;
    if (entry.disable) return enumIcons.disabled;
    if (entry.vectorized) return enumIcons.vectorized;
    return enumIcons.normal;
  },

  /**
   * Returns the appropriate icon based on the role
   *
   * @param {object} role - The role to get the icon for
   * @returns {string} The corresponding icon
   */
  getRoleIcon: (role: any) => {
    const roles = enumData.extensionPromptRoles();
    switch (role) {
      case roles.SYSTEM:
        return enumIcons.system;
      case roles.USER:
        return enumIcons.user;
      case roles.ASSISTANT:
        return enumIcons.assistant;
      default:
        return enumIcons.default;
    }
  },

  /**
   * A function to get the data type icon
   *
   * @param {string} type - The type of the data
   * @returns {string} The corresponding data type icon
   */
  getDataTypeIcon: (type: any): any => {
    // Remove possible nullable types definition to match type icon
    type = type.replace(/\?$/, "");
    return (enumIcons as Record<string, any>)[type] ?? enumIcons.default;
  },
};

/**
 * A collection of common enum providers
 *
 * Can be used on `SlashCommandNamedArgument` and `SlashCommandArgument` and their `enumProvider` property.
 */
export const commonEnumProviders = {
  /**
   * Enum values for booleans. Either using true/false or on/off
   * Optionally supports "toggle".
   *
   * @param {('onOff'|'onOffToggle'|'trueFalse')?} [mode='trueFalse'] - The mode to use. Default is 'trueFalse'.
   * @returns {() => SlashCommandEnumValue[]}
   */
  boolean:
    (mode = "trueFalse") =>
    () => {
      switch (mode) {
        case "onOff":
          return [
            new SlashCommandEnumValue("on", null, "macro", enumIcons.true),
            new SlashCommandEnumValue("off", null, "macro", enumIcons.false),
          ];
        case "onOffToggle":
          return [
            new SlashCommandEnumValue("on", null, "macro", enumIcons.true),
            new SlashCommandEnumValue("off", null, "macro", enumIcons.false),
            new SlashCommandEnumValue("toggle", null, "macro", enumIcons.boolean),
          ];
        case "trueFalse":
          return [
            new SlashCommandEnumValue("true", null, "macro", enumIcons.true),
            new SlashCommandEnumValue("false", null, "macro", enumIcons.false),
          ];
        default:
          throw new Error(`Invalid boolean enum provider mode: ${mode}`);
      }
    },

  /**
   * All possible variable names
   *
   * Can be filtered by `type` to only show global or local variables
   *
   * @param {...('global'|'local'|'scope'|'all')} type - The type of variables to include in the array. Can be 'all', 'global', or 'local'.
   * @returns {(executor:SlashCommandExecutor, scope:SlashCommandScope) => SlashCommandEnumValue[]}
   */
  variables:
    (...type: any[]) =>
    (_: any, scope: any) => {
      const types = type.flat();
      const isAll = types.includes("all");
      return [
        ...(isAll || types.includes("scope")
          ? scope.allVariableNames.map(
              (name: any) => new SlashCommandEnumValue(name, null, enumTypes.variable, enumIcons.scopeVariable),
            )
          : []),
        ...(isAll || types.includes("local")
          ? Object.keys(enumData.chatMetadata().variables ?? []).map(
              (name) => new SlashCommandEnumValue(name, null, enumTypes.name, enumIcons.localVariable),
            )
          : []),
        ...(isAll || types.includes("global")
          ? Object.keys(enumData.extensionSettings().variables.global ?? []).map(
              (name) => new SlashCommandEnumValue(name, null, enumTypes.macro, enumIcons.globalVariable),
            )
          : []),
      ].filter((item, idx, list) => idx == list.findIndex((it) => it.value == item.value));
    },

  /**
   * Enum values for numbers and variable names
   *
   * Includes all variable names and the ability to specify any number
   *
   * @param {SlashCommandExecutor} executor - The executor of the slash command
   * @param {SlashCommandScope} scope - The scope of the slash command
   * @returns {SlashCommandEnumValue[]} The enum values
   */
  numbersAndVariables: (executor: any, scope: any) => [
    ...commonEnumProviders.variables("all")(executor, scope),
    new SlashCommandEnumValue(
      "any variable name",
      null,
      enumTypes.variable,
      enumIcons.variable,
      ((input: any) => /^\w*$/.test(input)) as any,
      ((input: any) => input) as any,
    ),
    new SlashCommandEnumValue(
      "any number",
      null,
      enumTypes.number,
      enumIcons.number,
      ((input: any) => input == "" || !Number.isNaN(Number(input))) as any,
      ((input: any) => input) as any,
    ),
  ],

  /**
   * All possible char entities, like characters and groups. Can be filtered down to just one type.
   *
   * @param {('all' | 'character' | 'group')?} [mode='all'] - Which type to return
   * @returns {() => SlashCommandEnumValue[]}
   */
  characters:
    (mode = "all") =>
    () => {
      return [
        ...(["all", "character"].includes(mode)
          ? enumData.characters().map((char: any) => new SlashCommandEnumValue(char.name, null, enumTypes.name, enumIcons.character))
          : []),
        ...(["all", "group"].includes(mode)
          ? enumData.groups().map((group: any) => new SlashCommandEnumValue(group.name, null, enumTypes.qr, enumIcons.group))
          : []),
        ...(enumData.name2() === enumData.neutralCharacterName()
          ? [new SlashCommandEnumValue(enumData.neutralCharacterName(), null, enumTypes.name, "🥸")]
          : []),
      ];
    },

  /**
   * All group members of the given group, or default the current active one
   *
   * @param {string?} groupId - The id of the group - pass in `undefined` to use the current active group
   * @returns {() =>SlashCommandEnumValue[]}
   */
  groupMembers:
    (groupId = undefined) =>
    () =>
      enumData.getGroupMembers(groupId).map(
        (character: any, index: any) =>
          new SlashCommandEnumValue(String(index), character.name, enumTypes.enum, enumIcons.character),
      ),

  /**
   * All possible personas
   *
   * @returns {() => SlashCommandEnumValue[]}
   */
  personas:
    ({ allowPersonaKey = false } = {}) =>
    () => {
      const personaMap = enumData.powerUser().personas ?? {};
      return Object.entries(personaMap).map(([personaKey, personaName]: [string, any]) => {
        const existsMultiple = Object.values(personaMap).filter((p: any) => p === personaName).length > 1;
        const returnValue = allowPersonaKey && existsMultiple ? personaKey : personaName;
        return new SlashCommandEnumValue(
          returnValue,
          allowPersonaKey && existsMultiple ? personaName : null,
          enumTypes.name,
          enumIcons.persona,
        );
      });
    },

  /**
   * All possible tags, or only those that have been assigned
   *
   * @param {('all' | 'assigned')} [mode='all'] - Which types of tags to show
   * @returns {() => SlashCommandEnumValue[]}
   */
  tags:
    (mode = "all") =>
    () => {
      const assignedTags = mode === "assigned" ? new Set(Object.values(enumData.tagMap()).flat()) : new Set();
      return enumData
        .tags()
        .filter((tag: any) => mode === "all" || (mode === "assigned" && assignedTags.has(tag.id)))
        .map((tag: any) => new SlashCommandEnumValue(tag.name, null, enumTypes.command, enumIcons.tag));
    },

  /**
   * All possible tags for a given char/group entity
   *
   * @param {('all' | 'existing' | 'not-existing')?} [mode='all'] - Which types of tags to show
   * @returns {(executor:SlashCommandExecutor, scope:SlashCommandScope) => SlashCommandEnumValue[]}
   */
  tagsForChar:
    (mode = "all") =>
    (executor: any, _scope: any) => {
      // Try to see if we can find the char during execution to filter down the tags list some more. Otherwise take all tags.
      const charName = executor.namedArgumentList.find((it: any) => it.name == "name")?.value;
      if (typeof charName === "object" && charName !== null && String(charName).startsWith("[Closure]")) {
        throw new Error("Argument 'name' does not support closures");
      }
      const key = enumData.searchCharByName(enumData.substituteParams(charName), { suppressLogging: true });
      const assigned = key ? enumData.getTagsList(key) : [];
      return enumData
        .tags()
        .filter(
          (it: any) =>
            mode === "all" ||
            (mode === "existing" && assigned.includes(it)) ||
            (mode === "not-existing" && !assigned.includes(it)),
        )
        .map((tag: any) => new SlashCommandEnumValue(tag.name, null, enumTypes.command, enumIcons.tag));
    },

  /**
   * All messages in the current chat, returning the message id
   *
   * Optionally supports variable names, and/or a placeholder for the last/new message id
   *
   * @param {object} [options={}] - Optional arguments
   * @param {boolean} [options.allowIdAfter=false] - Whether to add an enum option for the new message id after the last message
   * @param {boolean} [options.allowVars=false] - Whether to add enum option for variable names
   * @returns {(executor:SlashCommandExecutor, scope:SlashCommandScope) => SlashCommandEnumValue[]}
   */
  messages:
    ({ allowIdAfter = false, allowVars = false } = {}) =>
    (executor: any, scope: any) => {
      const nameFilter = executor.namedArgumentList.find((it: any) => it.name == "name")?.value || "";
      const chat = enumData.chat();
      return [
        ...chat
          .map(
            (message: any, index: any) =>
              new SlashCommandEnumValue(
                String(index),
                `${message.name}: ${message.mes}` as any,
                enumTypes.number,
                message.is_user ? enumIcons.user : message.is_system ? enumIcons.system : enumIcons.assistant,
              ),
          )
          .filter((value: any) => !nameFilter || value.description.startsWith(`${nameFilter}:`)),
        ...(allowIdAfter
          ? [new SlashCommandEnumValue(String(chat.length), ">> After Last Message >>" as any, enumTypes.enum, "➕" as any)]
          : []),
        ...(allowVars ? commonEnumProviders.variables("all")(executor, scope) : []),
      ];
    },

  /**
   * Media items attached to a specific message
   * @returns {(executor:SlashCommandExecutor, scope:SlashCommandScope) => SlashCommandEnumValue[]}
   */
  messageMedia: () => (executor: any, _scope: any) => {
    const chat = enumData.chat();
    const messageId = Number(executor.namedArgumentList.find((it: any) => ["mesId", "id"].includes(it.name))?.value || "");
    if (isNaN(messageId) || messageId === null || messageId < 0 || messageId >= chat.length) {
      return [];
    }
    const message = chat[messageId];
    if (!Array.isArray(message?.extra?.media)) {
      return [];
    }
    return message.extra.media.map(
      (media: any, index: any) =>
        new SlashCommandEnumValue(
          index.toString(),
          media.title || message.extra.title || "[Untitled]",
          enumTypes.enum,
          (enumIcons as Record<string, any>)[media.type] || enumIcons.file,
        ),
    );
  },

  /**
   * All names used in the current chat.
   *
   * @returns {SlashCommandEnumValue[]}
   */
  messageNames: () =>
    enumData
      .chat()
      .map((message: any) => ({
        name: message.name,
        icon: message.is_user ? enumIcons.user : enumIcons.assistant,
      }))
      .filter(onlyUniqueJson)
      .sort((a: any, b: any) => sortIgnoreCaseAndAccents(a.name, b.name))
      .map((name: any) => new SlashCommandEnumValue(name.name, null, null as any, name.icon)),

  /**
   * All existing worlds / lorebooks
   *
   * @returns {SlashCommandEnumValue[]}
   */
  worlds: () =>
    enumData
      .worldNames()
      .map((worldName: any) => new SlashCommandEnumValue(worldName, null, enumTypes.name, enumIcons.world)),

  /**
   * All existing injects for the current chat
   *
   * @returns {SlashCommandEnumValue[]}
   */
  injects: () => {
    const chatMetadata = enumData.chatMetadata();
    if (!chatMetadata.script_injects || !Object.keys(chatMetadata.script_injects).length) return [];
    return Object.entries(chatMetadata.script_injects).map(([id, inject]: [string, any]) => {
      const positionName =
        Object.entries(enumData.extensionPromptTypes()).find(([_, value]) => value === inject.position)?.[0] ?? "unknown";
      return new SlashCommandEnumValue(
        id,
        `${enumIcons.getRoleIcon(inject.role ?? enumData.extensionPromptRoles().SYSTEM)}[Inject](${positionName}, depth: ${inject.depth}, scan: ${inject.scan ?? false}) ${inject.value}` as any,
        enumTypes.enum,
        "💉" as any,
      );
    });
  },

  /**
   * Gets somewhat recognizable STscript types.
   *
   * @returns {SlashCommandEnumValue[]}
   */
  types: () => [
    new SlashCommandEnumValue("string", null, enumTypes.enum, enumIcons.string),
    new SlashCommandEnumValue("number", null, enumTypes.enum, enumIcons.number),
    new SlashCommandEnumValue("boolean", null, enumTypes.enum, enumIcons.boolean),
    new SlashCommandEnumValue("array", null, enumTypes.enum, enumIcons.array),
    new SlashCommandEnumValue("object", null, enumTypes.enum, enumIcons.dictionary),
    new SlashCommandEnumValue("null", null, enumTypes.enum, enumIcons.null),
    new SlashCommandEnumValue("undefined", null, enumTypes.enum, enumIcons.undefined),
  ],

  messageRoles: () => [
    new SlashCommandEnumValue("user", null, enumTypes.enum, enumIcons.user),
    new SlashCommandEnumValue("assistant", null, enumTypes.enum, enumIcons.assistant),
    new SlashCommandEnumValue("system", null, enumTypes.enum, enumIcons.system),
  ],

  backgrounds: () =>
    Array.from(document.querySelectorAll(".bg_example"))
      .map((it) => new SlashCommandEnumValue(it.getAttribute("bgfile")))
      .filter((it) => it.value?.length),

  connectionProfiles:
    ({ includeNone = false } = {}) =>
    () => [
      ...(includeNone ? [new SlashCommandEnumValue("<None>")] : []),
      ...enumData.extensionSettings().connectionManager.profiles.map(
        (p: any) => new SlashCommandEnumValue(p.name, null, enumTypes.name, enumIcons.server),
      ),
    ],
};

/**
 * A collection of common enum match providers
 *
 * Can be used on `SlashCommandEnumValue` and their `matchProvider` property.
 */
export const commonEnumMatchProviders = {
  /**
   * Provides autocomplete matching for folder-like enum values.
   * Matches if the input starts with the check or vice versa (case-insensitive).
   * @param {string} input - The input string to match against
   * @param {string} check - The check string to match with
   * @param {object} [options={}] - Options
   * @param {boolean} [options.trueOnEmpty=true] - Whether to return true when input is empty
   * @returns {boolean} - True if the strings match according to the folder matching rules
   */
  folderEnum: (input: any, check: any, { trueOnEmpty = true } = {}) => {
    if (!check) return false;
    if (!input) return trueOnEmpty;
    const inputLower = input.toLowerCase();
    const checkLower = check.toLowerCase();
    return inputLower.startsWith(checkLower) || checkLower.startsWith(inputLower);
  },
};
