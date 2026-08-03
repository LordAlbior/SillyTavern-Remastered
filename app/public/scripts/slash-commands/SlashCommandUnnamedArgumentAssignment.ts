import { SlashCommandClosure } from "./SlashCommandClosure.ts";

export class SlashCommandUnnamedArgumentAssignment {
  /** @type {number} */ start;
  /** @type {number} */ end;
  /** @type {string|SlashCommandClosure} */ value;

  constructor() {}
}
