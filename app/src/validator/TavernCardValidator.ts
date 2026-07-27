/**
 * Validates the data structure of character cards.
 * Supported specs: V1, V2
 * Up to: 8083fb3
 *
 * @link https://github.com/malfoyslastname/character-card-spec-v2
 */

/** A character card's `.data` block (V2 shape, also used loosely for V3). */
export interface TavernCardData {
    name?: string;
    description?: string;
    personality?: string;
    scenario?: string;
    first_mes?: string;
    mes_example?: string;
    creator_notes?: string;
    system_prompt?: string;
    post_history_instructions?: string;
    alternate_greetings?: unknown[];
    tags?: unknown[];
    creator?: string;
    character_version?: string;
    extensions?: Record<string, unknown>;
    character_book?: TavernCharacterBook;
    [key: string]: unknown;
}

export interface TavernCharacterBook {
    extensions?: Record<string, unknown>;
    entries?: unknown[];
    [key: string]: unknown;
}

/** A character card - V1 has the spec fields at the top level; V2/V3 nest them under `data`. */
export interface TavernCard {
    spec?: string;
    spec_version?: string | number;
    data?: TavernCardData;
    [key: string]: unknown;
}

export class TavernCardValidator {
    #lastValidationError: string | null = null;

    readonly card: TavernCard;

    constructor(card: TavernCard) {
        this.card = card;
    }

    /**
     * Field that caused the validation to fail.
     */
    get lastValidationError(): string | null {
        return this.#lastValidationError;
    }

    /**
     * Validate against V1, V2 or V3 spec.
     *
     * @returns Specification version number (1, 2, 3) when a spec matched, `false` otherwise.
     */
    validate(): number | false {
        this.#lastValidationError = null;

        if (this.validateV1()) {
            return 1;
        }

        if (this.validateV2()) {
            return 2;
        }

        if (this.validateV3()) {
            return 3;
        }

        return false;
    }

    /**
     * Validate against V1 specification
     */
    validateV1(): boolean {
        const requiredFields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'];
        return requiredFields.every(field => {
            if (!Object.hasOwn(this.card, field)) {
                this.#lastValidationError = field;
                return false;
            }
            return true;
        });
    }

    /**
     * Validate against V2 specification
     */
    validateV2(): boolean {
        return this.#validateSpecV2()
            && this.#validateSpecVersionV2()
            && this.#validateDataV2()
            && this.#validateCharacterBookV2();
    }

    /**
     * Validate against V3 specification
     */
    validateV3(): boolean {
        return this.#validateSpecV3()
            && this.#validateSpecVersionV3()
            && this.#validateDataV3();
    }

    #validateSpecV2(): boolean {
        if (this.card.spec !== 'chara_card_v2') {
            this.#lastValidationError = 'spec';
            return false;
        }
        return true;
    }

    #validateSpecVersionV2(): boolean {
        if (this.card.spec_version !== '2.0') {
            this.#lastValidationError = 'spec_version';
            return false;
        }
        return true;
    }

    #validateDataV2(): boolean {
        const data = this.card.data;

        if (!data) {
            this.#lastValidationError = 'No tavern card data found';
            return false;
        }

        const requiredFields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'creator_notes', 'system_prompt', 'post_history_instructions', 'alternate_greetings', 'tags', 'creator', 'character_version', 'extensions'];
        const isAllRequiredFieldsPresent = requiredFields.every(field => {
            if (!Object.hasOwn(data, field)) {
                this.#lastValidationError = `data.${field}`;
                return false;
            }
            return true;
        });

        return isAllRequiredFieldsPresent && Array.isArray(data.alternate_greetings) && Array.isArray(data.tags) && typeof data.extensions === 'object';
    }

    #validateCharacterBookV2(): boolean {
        const characterBook = this.card.data?.character_book;

        if (!characterBook) {
            return true;
        }

        const requiredFields = ['extensions', 'entries'];
        const isAllRequiredFieldsPresent = requiredFields.every(field => {
            if (!Object.hasOwn(characterBook, field)) {
                this.#lastValidationError = `data.character_book.${field}`;
                return false;
            }
            return true;
        });

        return isAllRequiredFieldsPresent && Array.isArray(characterBook.entries) && typeof characterBook.extensions === 'object';
    }

    #validateSpecV3(): boolean {
        if (this.card.spec !== 'chara_card_v3') {
            this.#lastValidationError = 'spec';
            return false;
        }
        return true;
    }

    #validateSpecVersionV3(): boolean {
        if (Number(this.card.spec_version) < 3.0 || Number(this.card.spec_version) >= 4.0) {
            this.#lastValidationError = 'spec_version';
            return false;
        }
        return true;
    }

    #validateDataV3(): boolean {
        const data = this.card.data;

        if (!data || typeof data !== 'object') {
            this.#lastValidationError = 'No tavern card data found';
            return false;
        }

        return true;
    }
}
