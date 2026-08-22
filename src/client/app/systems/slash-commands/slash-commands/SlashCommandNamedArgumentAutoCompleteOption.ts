import { AutoCompleteOption } from "/app/systems/autocomplete/AutoCompleteOption";
import { SlashCommand } from "/app/systems/slash-commands/slash-commands/SlashCommand";
import { SlashCommandNamedArgument } from "/app/systems/slash-commands/slash-commands/SlashCommandArgument";

export class SlashCommandNamedArgumentAutoCompleteOption extends AutoCompleteOption {
  /** @type {SlashCommandNamedArgument} */ arg;
  /** @type {SlashCommand} */ cmd;

  /**
   * @param {SlashCommandNamedArgument} arg
   */
  constructor(arg: any, cmd: any) {
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
