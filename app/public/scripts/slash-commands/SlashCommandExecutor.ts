import { uuidv4 } from "../utils.ts";
import { SlashCommand } from "./SlashCommand.ts";
import { SlashCommandClosure } from "./SlashCommandClosure.ts";
import { SlashCommandNamedArgumentAssignment } from "./SlashCommandNamedArgumentAssignment.ts";
import { SlashCommandUnnamedArgumentAssignment } from "./SlashCommandUnnamedArgumentAssignment.ts";

export class SlashCommandExecutor {
  /**@type {Boolean}*/ injectPipe: boolean = true;
  /**@type {Number}*/ start!: number;
  /**@type {Number}*/ end!: number;
  /**@type {Number}*/ startNamedArgs!: number;
  /**@type {Number}*/ endNamedArgs!: number;
  /**@type {Number}*/ startUnnamedArgs!: number;
  /**@type {Number}*/ endUnnamedArgs!: number;
  /**@type {String}*/ name: string = "";
  /**@type {String}*/ #source: string = uuidv4();
  get source() {
    return this.#source;
  }
  set source(value: string) {
    this.#source = value;
    for (const arg of this.namedArgumentList.filter((it: any) => it.value instanceof SlashCommandClosure)) {
      arg.value.source = value;
    }
    for (const arg of this.unnamedArgumentList.filter((it: any) => it.value instanceof SlashCommandClosure)) {
      arg.value.source = value;
    }
  }
  /** @type {SlashCommand} */ command!: SlashCommand;
  /** @type {SlashCommandNamedArgumentAssignment[]} */ namedArgumentList: SlashCommandNamedArgumentAssignment[] = [];
  /** @type {SlashCommandUnnamedArgumentAssignment[]} */ unnamedArgumentList: SlashCommandUnnamedArgumentAssignment[] = [];
  /** @type {import('./SlashCommandParser.js').ParserFlags} */ parserFlags: any;

  get commandCount() {
    return (
      1 +
      this.namedArgumentList
        .filter((it: any) => it.value instanceof SlashCommandClosure)
        .map((it: any) => /**@type {SlashCommandClosure}*/ (it.value).commandCount)
        .reduce((cur: any, sum: any) => cur + sum, 0) +
      this.unnamedArgumentList
        .filter((it: any) => it.value instanceof SlashCommandClosure)
        .map((it: any) => /**@type {SlashCommandClosure}*/ (it.value).commandCount)
        .reduce((cur: any, sum: any) => cur + sum, 0)
    );
  }

  set onProgress(value: any) {
    const closures = /**@type {SlashCommandClosure[]}*/ ([
      ...this.namedArgumentList.filter((it: any) => it.value instanceof SlashCommandClosure).map((it: any) => it.value),
      ...this.unnamedArgumentList.filter((it: any) => it.value instanceof SlashCommandClosure).map((it: any) => it.value),
    ]);
    for (const closure of closures) {
      closure.onProgress = value;
    }
  }

  constructor(start?: number) {
    this.start = start ?? 0;
  }
}
