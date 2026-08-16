const MIGRATED_MARKER = "__migrated";
const MIGRATABLE_KEYS = [
  /^AlertRegex_/,
  /^AlertWI_/,
  /^Assets_SkipConfirm_/,
  /^Characters_PerPage$/,
  /^DataBank_sortField$/,
  /^DataBank_sortOrder$/,
  /^extension_update_nag$/,
  /^extensions_sortByName$/,
  /^FeatherlessModels_PerPage$/,
  /^GroupMembers_PerPage$/,
  /^GroupCandidates_PerPage$/,
  /^LNavLockOn$/,
  /^LNavOpened$/,
  /^mediaWarningShown:/,
  /^NavLockOn$/,
  /^NavOpened$/,
  /^Personas_PerPage$/,
  /^Personas_GridView$/,
  /^Proxy_SkipConfirm_/,
  /^qr--executeShortcut$/,
  /^qr--syntax$/,
  /^qr--tabSize$/,
  /^qr--wrap$/,
  /^RegenerateWithCtrlEnter$/,
  /^SelectedNavTab$/,
  /^sendAsNamelessWarningShown$/,
  /^StoryStringValidationCache$/,
  /^WINavOpened$/,
  /^WI_PerPage$/,
  /^world_info_sort_order$/,
];

/**
 * Callback invoked when settings need to be saved after storage mutation.
 * Set during app initialization to break circular dependency with script.ts.
 */
let saveSettingsCallback: (() => void) | null = null;

export function setSaveSettingsCallback(fn: () => void) {
  saveSettingsCallback = fn;
}

/**
 * Provides access to account storage of arbitrary key-value pairs.
 */
class AccountStorage {
  /**
   * @type {Record<string, string>} Storage state
   */
  #state: Record<string, any> = {};

  /**
   * @type {boolean} If the storage was initialized
   */
  #ready = false;

  #migrateLocalStorage(this: any) {
    const localStorageKeys: any[] = [];
    for (let i = 0; i < globalThis.localStorage.length; i++) {
      localStorageKeys.push(globalThis.localStorage.key(i));
    }
    for (const key of localStorageKeys) {
      if (MIGRATABLE_KEYS.some((k: any) => k.test(key))) {
        const value = globalThis.localStorage.getItem(key ?? '');
        (this.#state as Record<string, any>)[key] = value;
        globalThis.localStorage.removeItem(key ?? '');
      }
    }
  }

  /**
   * Initialize the account storage.
   * @param {Object} state Initial state
   */
  init(this: any, state: any) {
    if (state && typeof state === "object") {
      this.#state = Object.assign(this.#state, state);
    }

    if (!Object.hasOwn(this.#state, MIGRATED_MARKER)) {
      this.#migrateLocalStorage();
      (this.#state as Record<string, any>)[MIGRATED_MARKER] = "1";
      saveSettingsCallback?.();
    }

    this.#ready = true;
  }

  /**
   * Get the value of a key in account storage.
   * @param {string} key Key to get
   * @returns {string|null} Value of the key
   */
  getItem(this: any, key: any) {
    if (!this.#ready) {
      console.warn(`AccountStorage not ready (trying to read from ${key})`);
    }

    return Object.hasOwn(this.#state, key) ? String((this.#state as Record<string, any>)[key]) : null;
  }

  /**
   * Set a key in account storage.
   * @param {string} key Key to set
   * @param {string} value Value to set
   */
  setItem(this: any, key: any, value: any) {
    if (!this.#ready) {
      console.warn(`AccountStorage not ready (trying to write to ${key})`);
    }

    const hasPropertySet = Object.hasOwn(this.#state, key) && (this.#state as Record<string, any>)[key] === String(value);

    if (hasPropertySet) {
      return;
    }

    (this.#state as Record<string, any>)[key] = String(value);
    saveSettingsCallback?.();
  }

  /**
   * Remove a key from account storage.
   * @param {string} key Key to remove
   */
  removeItem(this: any, key: any) {
    if (!this.#ready) {
      console.warn(`AccountStorage not ready (trying to remove ${key})`);
    }

    if (!Object.hasOwn(this.#state, key)) {
      return;
    }

    delete (this.#state as Record<string, any>)[key];
    saveSettingsCallback?.();
  }

  /**
   * Gets a snapshot of the storage state.
   * @returns {Record<string, string>} A deep clone of the storage state
   */
  getState() {
    return structuredClone(this.#state);
  }
}

/**
 * Account storage instance.
 */
export const accountStorage = new AccountStorage();
