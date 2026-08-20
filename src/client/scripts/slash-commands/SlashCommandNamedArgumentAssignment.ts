import { SlashCommandClosure } from "./SlashCommandClosure.ts";

export class SlashCommandNamedArgumentAssignment {
  /** @type {number} */ start: any;
  /** @type {number} */ end: any;
  /** @type {string} */ name: any;
  /** @type {string|SlashCommandClosure} */ value: any;

  constructor() {}
}
