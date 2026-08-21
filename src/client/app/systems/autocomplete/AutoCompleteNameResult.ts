import { AutoCompleteNameResultBase } from "../../../scripts/autocomplete/AutoCompleteNameResultBase";
import { AutoCompleteSecondaryNameResult } from "../../../scripts/autocomplete/AutoCompleteSecondaryNameResult";

export class AutoCompleteNameResult extends AutoCompleteNameResultBase {
  /**
   *
   * @param {string} text The whole text
   * @param {number} index Cursor index within text
   * @param {boolean} isSelect Whether autocomplete was triggered by selecting an autocomplete option
   * @returns {AutoCompleteSecondaryNameResult}
   */
  getSecondaryNameAt(text: any, index: any, isSelect: any): any {
    return null;
  }
}
