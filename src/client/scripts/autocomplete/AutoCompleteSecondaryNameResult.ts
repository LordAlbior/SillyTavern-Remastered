import { AutoCompleteNameResultBase } from "./AutoCompleteNameResultBase";

export class AutoCompleteSecondaryNameResult extends AutoCompleteNameResultBase {
  /**@type {boolean}*/ isRequired = false;
  /**@type {boolean}*/ forceMatch = true;
}
