import { AutoCompleteFuzzyScore } from "../../../scripts/autocomplete/AutoCompleteFuzzyScore";

export class AutoCompleteOption {
  /** @type {string} */ name;
  /** @type {string} */ typeIcon;
  /** @type {string} */ type;
  /** @type {number} */ nameOffset = 0;
  /** @type {AutoCompleteFuzzyScore} */ score: any;
  /** @type {string} */ replacer: any;
  /** @type {HTMLElement} */ dom: any;
  /** @type {(input:string)=>boolean} */ matchProvider: any;
  /** @type {(input:string)=>string} */ valueProvider: any;
  /** @type {boolean} */ makeSelectable = false;
  /** @type {boolean} */ forceFullNameMatch = false;

  /**
   * Offset to adjust the replacement start position.
   * Negative values start replacement earlier (e.g., -2 to include 2 chars before normal start).
   * Used by closing tag autocomplete to replace leading whitespace.
   * @type {number}
   */
  replacementStartOffset = 0;

  /**
   * Priority for sorting. Lower values = higher priority (sorted first).
   * Default is 100 (normal priority). Use lower values for items that should appear at the top.
   * @type {number}
   */
  sortPriority = 100;

  /**
   * Used as a comparison value when removing duplicates (e.g., when a SlashCommand has aliases).
   * @type {any}
   * */
  get value() {
    return this.name;
  }

  get isSelectable() {
    return this.makeSelectable || !this.valueProvider;
  }

  /**
   * @param {string} name
   */
  constructor(name: any, typeIcon: any = " ", type: any = "", matchProvider: any = null, valueProvider: any = null, makeSelectable: any = false) {
    this.name = name;
    this.typeIcon = typeIcon;
    this.type = type;
    this.matchProvider = matchProvider;
    this.valueProvider = valueProvider;
    this.makeSelectable = makeSelectable;
  }

  makeItem(
    key: any,
    typeIcon: any,
    noSlash: any,
    namedArguments: any[] = [],
    unnamedArguments: any[] = [],
    returnType: any = "void",
    helpString: any = "",
    aliasList: any[] = [],
  ) {
    const li = document.createElement("li");
    {
      li.classList.add("item");
      const type = document.createElement("span");
      type.classList.add("type");
      type.classList.add("monospace");
      type.textContent = typeIcon;
      li.append(type);
      const specs = document.createElement("span");
      {
        specs.classList.add("specs");
        const name = document.createElement("span");
        name.classList.add("name");
        name.classList.add("monospace");
        name.textContent = noSlash ? "" : "/";
        key.split("").forEach((char: any) => {
          const span = document.createElement("span");
          span.textContent = char;
          name.append(span);
        });
        specs.append(name);
        const body = document.createElement("span");
        {
          body.classList.add("body");
          const args = document.createElement("span");
          args.classList.add("arguments");
          for (const arg of namedArguments as any[]) {
            const argItem = document.createElement("span");
            {
              argItem.classList.add("argument");
              argItem.classList.add("namedArgument");
              if (!arg.isRequired || (arg.defaultValue ?? false)) argItem.classList.add("optional");
              if (arg.acceptsMultiple) argItem.classList.add("multiple");
              const name = document.createElement("span");
              name.classList.add("argument-name");
              name.textContent = arg.name;
              argItem.append(name);
              if (arg.enumList.length > 0) {
                const enums = document.createElement("span");
                enums.classList.add("argument-enums");
                for (const e of arg.enumList) {
                  const enumItem = document.createElement("span");
                  enumItem.classList.add("argument-enum");
                  enumItem.textContent = e;
                  enums.append(enumItem);
                }
                argItem.append(enums);
              } else {
                const types = document.createElement("span");
                types.classList.add("argument-types");
                for (const t of arg.typeList) {
                  const type = document.createElement("span");
                  type.classList.add("argument-type");
                  type.textContent = t;
                  types.append(type);
                }
                argItem.append(types);
              }
              args.append(argItem);
            }
          }
          for (const arg of unnamedArguments as any[]) {
            const argItem = document.createElement("span");
            argItem.classList.add("argument");
            argItem.classList.add("unnamedArgument");
            if (!arg.isRequired || (arg.defaultValue ?? false)) argItem.classList.add("optional");
            if (arg.acceptsMultiple) argItem.classList.add("multiple");
            if (arg.enumList.length > 0) {
              const enums = document.createElement("span");
              enums.classList.add("argument-enums");
              for (const e of arg.enumList) {
                const enumItem = document.createElement("span");
                enumItem.classList.add("argument-enum");
                enumItem.textContent = e;
                enums.append(enumItem);
              }
              argItem.append(enums);
            } else {
              const types = document.createElement("span");
              types.classList.add("argument-types");
              for (const t of arg.typeList) {
                const type = document.createElement("span");
                type.classList.add("argument-type");
                type.textContent = t;
                types.append(type);
              }
              argItem.append(types);
            }
            args.append(argItem);
          }
          body.append(args);
          const returns = document.createElement("span");
          returns.classList.add("returns");
          returns.textContent = returnType ?? "void";
          specs.append(body);
        }
        li.append(specs);
      }
      const stopgap = document.createElement("span");
      stopgap.classList.add("stopgap");
      stopgap.textContent = "";
      li.append(stopgap);
      const help = document.createElement("span");
      {
        help.classList.add("help");
        const content = document.createElement("span");
        {
          content.classList.add("helpContent");
          content.innerHTML = helpString;
          const text = content.textContent;
          content.innerHTML = "";
          content.textContent = text;
          help.append(content);
        }
        li.append(help);
      }
      if (aliasList.length > 0) {
        const aliases = document.createElement("span");
        aliases.classList.add("aliases");
        aliases.append(" (alias: ");
        for (const aliasName of aliasList) {
          const alias = document.createElement("span");
          alias.classList.add("monospace");
          alias.textContent = `/${aliasName}`;
          aliases.append(alias);
        }
        aliases.append(")");
      }
    }
    return li;
  }

  /**
   * @returns {HTMLElement}
   */
  renderItem() {
    // throw new Error(`${this.constructor.name}.renderItem() is not implemented`);
    let li;
    li = this.makeItem(this.name, this.typeIcon, true);
    li.setAttribute("data-name", this.name);
    li.setAttribute("data-option-type", this.type);
    return li;
  }

  /**
   * @returns {DocumentFragment}
   */
  renderDetails() {
    // throw new Error(`${this.constructor.name}.renderDetails() is not implemented`);
    const frag = document.createDocumentFragment();
    const specs = document.createElement("div");
    {
      specs.classList.add("specs");
      const name = document.createElement("div");
      name.classList.add("name");
      name.classList.add("monospace");
      name.textContent = this.name;
      specs.append(name);
      frag.append(specs);
    }
    return frag;
  }
}
