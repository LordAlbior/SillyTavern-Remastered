import { SlashCommand } from "./SlashCommand";
import { AutoCompleteOption } from "../../../..//scripts/autocomplete/AutoCompleteOption";

export class SlashCommandCommandAutoCompleteOption extends AutoCompleteOption {
  /**@type {SlashCommand}*/ command;

  get value() {
    return this.command;
  }

  /**
   * @param {SlashCommand} command
   * @param {string} name
   */
  constructor(command: any, name: any) {
    super(name);
    this.command = command;
  }

  renderItem() {
    let li;
    li = this.command.renderHelpItem(this.name);
    li.setAttribute("data-name", this.name);
    li.setAttribute("data-option-type", "command");
    return li;
  }

  renderDetails() {
    return this.command.renderHelpDetails(this.name);
  }
}
