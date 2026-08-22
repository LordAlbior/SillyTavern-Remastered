import { SlashCommandExecutor } from "/app/systems/slash-commands/slash-commands/SlashCommandExecutor";

export class SlashCommandBreak extends SlashCommandExecutor {
  get value() {
    return this.unnamedArgumentList[0]?.value;
  }
}
