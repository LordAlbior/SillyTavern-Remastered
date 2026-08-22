import { uuidv4 } from "/app/systems/shared/utils";
import { SlashCommand } from "/app/systems/slash-commands/slash-commands/SlashCommand";
import { SlashCommandClosure } from "/app/systems/slash-commands/slash-commands/SlashCommandClosure";
import { SlashCommandNamedArgumentAssignment } from "/app/systems/slash-commands/slash-commands/SlashCommandNamedArgumentAssignment";
import { SlashCommandUnnamedArgumentAssignment } from "/app/systems/slash-commands/slash-commands/SlashCommandUnnamedArgumentAssignment";

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
  /** @type {import('/app/systems/slash-commands/slash-commands/SlashCommandParser').ParserFlags} */ parserFlags: any;

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
