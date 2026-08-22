import { AutoCompleteOption } from "/app/systems/autocomplete/AutoCompleteOption";

export class AutoCompleteNameResultBase {
  /**@type {string} */ name;
  /**@type {number} */ start;
  /**@type {AutoCompleteOption[]} */ optionList = [];
  /**@type {boolean} */ canBeQuoted = false;
  /**@type {()=>string} */ makeNoMatchText = () => `No matches found for "${this.name}"`;
  /**@type {()=>string} */ makeNoOptionsText = () => "No options";

  /**
   * @param {string} name Name (potentially partial) of the name at the requested index.
   * @param {number} start Index where the name starts.
   * @param {AutoCompleteOption[]} optionList A list of autocomplete options found in the current scope.
   * @param {boolean} canBeQuoted Whether the name can be inside quotes.
   * @param {()=>string} makeNoMatchText Function that returns text to show when no matches where found.
   * @param {()=>string} makeNoOptionsText Function that returns text to show when no options are available to match against.
   */
  constructor(name: any, start: any, optionList: any[] = [], canBeQuoted: any = false, makeNoMatchText: any = null, makeNoOptionsText: any = null) {
    this.name = name;
    this.start = start;
    this.optionList = optionList as any;
    this.canBeQuoted = canBeQuoted;
    if (makeNoMatchText) this.makeNoMatchText = makeNoMatchText;
    if (makeNoOptionsText) this.makeNoOptionsText = makeNoOptionsText;
  }
}
