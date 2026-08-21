import { SlashCommandExecutor } from "./SlashCommandExecutor";

export class SlashCommandBreak extends SlashCommandExecutor {
  get value() {
    return this.unnamedArgumentList[0]?.value;
  }
}
