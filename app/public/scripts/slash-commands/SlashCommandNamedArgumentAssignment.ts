import { SlashCommandClosure } from "./SlashCommandClosure.ts";

export class SlashCommandNamedArgumentAssignment {
  /** @type {number} */ start;
  /** @type {number} */ end;
  /** @type {string} */ name;
  /** @type {string|SlashCommandClosure} */ value;

  constructor() {}
}
