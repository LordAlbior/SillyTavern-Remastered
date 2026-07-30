import { AutoCompleteNameResultBase } from './AutoCompleteNameResultBase.ts';

export class AutoCompleteSecondaryNameResult extends AutoCompleteNameResultBase {
    /**@type {boolean}*/ isRequired = false;
    /**@type {boolean}*/ forceMatch = true;
}
