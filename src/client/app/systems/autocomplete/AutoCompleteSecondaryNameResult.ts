import { AutoCompleteNameResultBase } from "/app/systems/autocomplete/AutoCompleteNameResultBase";

export class AutoCompleteSecondaryNameResult extends AutoCompleteNameResultBase {
  /**@type {boolean}*/ isRequired = false;
  /**@type {boolean}*/ forceMatch = true;
}
