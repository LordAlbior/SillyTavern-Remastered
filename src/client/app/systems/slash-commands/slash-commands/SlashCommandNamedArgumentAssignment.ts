import { SlashCommandClosure } from "/app/systems/slash-commands/slash-commands/SlashCommandClosure";

export class SlashCommandNamedArgumentAssignment {
  /** @type {number} */ start: any;
  /** @type {number} */ end: any;
  /** @type {string} */ name: any;
  /** @type {string|SlashCommandClosure} */ value: any;

  constructor() {}
}
