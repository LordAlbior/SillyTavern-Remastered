import { AutoCompleteOption } from "../autocomplete/AutoCompleteOption.ts";
import { SlashCommand } from "./SlashCommand.ts";
import { SlashCommandNamedArgument } from "./SlashCommandArgument.ts";

export class SlashCommandNamedArgumentAutoCompleteOption extends AutoCompleteOption {
  /** @type {SlashCommandNamedArgument} */ arg;
  /** @type {SlashCommand} */ cmd;

  /**
   * @param {SlashCommandNamedArgument} arg
   */
  constructor(arg, cmd) {
    super(`${arg.name}=`);
    this.arg = arg;
    this.cmd = cmd;
  }

  renderItem() {
    let li;
    li = this.makeItem(
      this.name,
      "⌗",
      true,
      [],
      [],
      null,
      `${this.arg.isRequired ? "" : "(optional) "}${this.arg.description ?? ""}`,
    );
    li.setAttribute("data-name", this.name);
    li.setAttribute("data-option-type", "namedArgument");
    return li;
  }

  renderDetails() {
    return this.cmd.renderHelpDetails();
  }
}
