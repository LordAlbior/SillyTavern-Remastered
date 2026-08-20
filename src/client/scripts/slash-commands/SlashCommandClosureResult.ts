export class SlashCommandClosureResult {
  /**@type {boolean}*/ interrupt = false;
  /**@type {string}*/ pipe: any;
  /**@type {boolean}*/ isBreak = false;
  /**@type {boolean}*/ isAborted = false;
  /**@type {boolean}*/ isQuietlyAborted = false;
  /**@type {string}*/ abortReason: any;
  /**@type {boolean}*/ isError = false;
  /**@type {string}*/ errorMessage: any;
}
