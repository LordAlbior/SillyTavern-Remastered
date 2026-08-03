/**
 * Common debounce timeout values to use with `debounce` calls.
 * @readonly
 * @enum {number}
 */
export const debounce_timeout = {
  /** [100 ms] For ultra-fast responses, typically for keypresses or executions that might happen multiple times in a loop or recursion. */
  quick: 100,
  /** [200 ms] Slightly slower than quick, but still very responsive. */
  short: 200,
  /** [300 ms] Default time for general use, good balance between responsiveness and performance. */
  standard: 300,
  /** [1.000 ms] For situations where the function triggers more intensive tasks. */
  relaxed: 1000,
  /** [5 sec] For delayed tasks, like auto-saving or completing batch operations that need a significant pause. */
  extended: 5000,
};

/**
 * Used as an ephemeral key in message extra metadata.
 * When set, the message will be excluded from generation
 * prompts without affecting the number of chat messages,
 * which is needed to preserve world info timed effects.
 */
export const IGNORE_SYMBOL = Symbol.for("ignore");

/**
 * Common video file extensions. Should be the same as supported by Gemini.
 * https://ai.google.dev/gemini-api/docs/video-understanding#supported-formats
 */
export const VIDEO_EXTENSIONS = ["mp4", "avi", "mov", "wmv", "flv", "webm", "3gp", "mkv", "mpg"];

/**
 * Known generation triggers that can be passed to Generate function.
 */
export const GENERATION_TYPE_TRIGGERS = ["normal", "continue", "impersonate", "swipe", "regenerate", "quiet"];

/**
 * Known injection IDs and helper functions for system extensions handling.
 */
export const inject_ids = {
  STORY_STRING: "__STORY_STRING__",
  QUIET_PROMPT: "QUIET_PROMPT",
  DEPTH_PROMPT: "DEPTH_PROMPT",
  DEPTH_PROMPT_INDEX: (index) => `DEPTH_PROMPT_${index}`,
  CUSTOM_WI_DEPTH: "customDepthWI",
  CUSTOM_WI_DEPTH_ROLE: (depth, role) => `customDepthWI_${depth}_${role}`,
  CUSTOM_WI_OUTLET: (key) => `customWIOutlet_${key}`,
};

export const COMETAPI_IGNORE_PATTERNS = [
  // Image generation models
  "dall-e",
  "dalle",
  "midjourney",
  "mj_",
  "stable-diffusion",
  "sd-",
  "flux-",
  "playground-v",
  "ideogram",
  "recraft-",
  "black-forest-labs",
  "/recraft-v3",
  "recraftv3",
  "stability-ai/",
  "sdxl",
  // Audio generation models
  "suno_",
  "tts",
  "whisper",
  // Video generation models
  "runway",
  "luma_",
  "luma-",
  "veo",
  "kling_",
  "minimax_video",
  "hunyuan-t1",
  // Utility models
  "embedding",
  "search-gpts",
  "files_retrieve",
  "moderation",
];

/**
 * @readonly
 * @enum {string}
 */
export const MEDIA_SOURCE = {
  API: "api",
  UPLOAD: "upload",
  GENERATED: "generated",
  CAPTIONED: "captioned",
};

/**
 * @readonly
 * @enum {string}
 */
export const MEDIA_DISPLAY = {
  LIST: "list",
  GALLERY: "gallery",
};

/**
 * @readonly
 * @enum {string}
 */
export const IMAGE_OVERSWIPE = {
  GENERATE: "generate",
  ROLLOVER: "rollover",
};

/**
 * @readonly
 */
export const MEDIA_TYPE = {
  getFromMime: (/** @type {string} */ mimeType) => {
    if (mimeType.startsWith("image/")) {
      return MEDIA_TYPE.IMAGE;
    }
    if (mimeType.startsWith("video/")) {
      return MEDIA_TYPE.VIDEO;
    }
    if (mimeType.startsWith("audio/")) {
      return MEDIA_TYPE.AUDIO;
    }
    return null;
  },
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
};

/**
 * Bitwise flag-style media request types.
 * @readonly
 * @enum {number}
 */
export const MEDIA_REQUEST_TYPE = {
  IMAGE: 0b001,
  VIDEO: 0b010,
  AUDIO: 0b100,
};

/**
 * Scroll behavior options when appending media to messages.
 * @readonly
 * @enum {string}
 */
export const SCROLL_BEHAVIOR = {
  NONE: "none",
  KEEP: "keep",
  ADJUST: "adjust",
};

/**
 * @readonly
 * @enum {string}
 */
export const OVERSWIPE_BEHAVIOR = {
  /** The overswipe right chevron will not be displayed. */
  NONE: "none",
  /** An overswipe will loop to the first swipe. */
  LOOP: "loop",
  /** Pristine greetings will loop, and chevrons will always be shown: https://github.com/SillyTavern/SillyTavern/pull/4712#issuecomment-3557893373 */
  PRISTINE_GREETING: "pristine_greeting",
  /** If chat tree is enabled, then an overswipe will allow the user to edit the message before starting a new generation. */
  EDIT_GENERATE: "edit_generate",
  /** This is the default behavior on character messages. */
  REGENERATE: "regenerate",
};

/**
 * @readonly
 * @enum {string}
 */
export const SWIPE_DIRECTION = {
  LEFT: "left",
  RIGHT: "right",
};

/**
 * @readonly
 * @enum {string}
 */
export const SWIPE_SOURCE = {
  DELETE: "delete",
  KEYBOARD: "keyboard",
  BACK: "back",
  AUTO_SWIPE: "auto_swipe",
  SLASH_COMMAND: "slash_command",
  SWIPE_PICKER: "swipe_picker",
};

/**
 * Marker used by {{else}} to split content in {{if}} blocks.
 * Uses control characters to minimize collision with real content.
 *
 * This marker is used internally by the macro engine to separate if/else branches.
 * It should never appear in user-generated content.
 *
 * @type {string}
 */
export const ELSE_MARKER = "\u0000\u001FELSE\u001F\u0000";

/**
 * @readonly
 * @enum {string}
 */
export const SWIPE_STATE = {
  NONE: "none",
  SWIPING: "swiping",
  EDITING: "editing",
};

/**
 * Returns whether a value is unique in the array by JSON-serialized content.
 *
 * @param {*} value - The value to check
 * @param {number} index - The index of the value
 * @param {*[]} array - The array to check against
 * @returns {boolean} Whether the value is unique
 */
export function onlyUniqueJson(value, index, array) {
  return array.map((v) => JSON.stringify(v)).indexOf(JSON.stringify(value)) === index;
}

/**
 * Compares two values with a comparison function after normalizing them (removing diacritics, lowercasing).
 *
 * @param {string} a - The first value
 * @param {string} b - The second value
 * @param {(a:string, b:string) => number} comparisonFunction - The comparison function
 * @returns {number} The comparison result
 */
export function compareIgnoreCaseAndAccents(a, b, comparisonFunction) {
  if (!a || !b) return comparisonFunction(a, b);

  // Normalize and remove diacritics, then convert to lower case
  const normalizedA = a.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const normalizedB = b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Check if the normalized strings are equal
  return comparisonFunction(normalizedA, normalizedB);
}

/**
 * Sorts strings case-insensitively and accent-insensitively.
 *
 * @param {string} a - The first string
 * @param {string} b - The second string
 * @returns {number} The comparison result
 */
export function sortIgnoreCaseAndAccents(a, b) {
  return compareIgnoreCaseAndAccents(a, b, (a, b) => a?.localeCompare(b));
}

/** @readonly */
/** @enum {Number} */
export const AUTOCOMPLETE_WIDTH = {
  INPUT: 0,
  CHAT: 1,
  FULL: 2,
};

/** @readonly */
/** @enum {Number} */
export const AUTOCOMPLETE_SELECT_KEY = {
  TAB: 1, // 2^0
  ENTER: 2, // 2^1
};

/** @readonly */
/** @enum {Number} */
export const AUTOCOMPLETE_STATE = {
  DISABLED: 0,
  MIN_LENGTH: 1,
  ALWAYS: 2,
};
