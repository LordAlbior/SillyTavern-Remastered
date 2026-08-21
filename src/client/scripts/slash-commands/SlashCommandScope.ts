import { SlashCommandClosure } from "./SlashCommandClosure";
import { convertValueType } from "../utils";

export class SlashCommandScope {
  /** @type {string[]} */ variableNames = [];
  get allVariableNames() {
    const names = [...this.variableNames, ...(this.parent?.allVariableNames ?? [])];
    return names.filter((it, idx) => idx == names.indexOf(it));
  }

  /** @type {object.<string, string|SlashCommandClosure>} */ variables = {};

  /** @type {object.<string, string|SlashCommandClosure>} */ macros = {};
  /** @type {{key:string, value:string|SlashCommandClosure}[]} */
  get macroList() {
    return [
      ...Object.keys(this.macros).map((key: any) => ({ key, value: (this.macros as Record<string, any>)[key] })),
      ...(this.parent?.macroList ?? []),
    ];
  }
  /** @type {SlashCommandScope} */ parent;
  /** @type {string} */ #pipe: any;
  get pipe() {
    return this.#pipe ?? this.parent?.pipe;
  }
  set pipe(value) {
    this.#pipe = value;
  }

  constructor(parent: any) {
    this.parent = parent;
  }

  getCopy() {
    const scope = new SlashCommandScope(this.parent);
    scope.variableNames = [...this.variableNames];
    scope.variables = Object.assign({}, this.variables);
    scope.macros = Object.assign({}, this.macros);
    scope.#pipe = this.#pipe;
    return scope;
  }

  setMacro(key: any, value: any, overwrite = true) {
    if (overwrite || !this.macroList.find((it: any) => it.key == key)) {
      (this.macros as Record<string, any>)[key] = value;
    }
  }

  existsVariableInScope(key: any) {
    return Object.keys(this.variables).includes(key);
  }
  existsVariable(key: any) {
    return Object.keys(this.variables).includes(key) || this.parent?.existsVariable(key);
  }
  letVariable(key: any, value: any = undefined) {
    if (this.existsVariableInScope(key))
      throw new SlashCommandScopeVariableExistsError(`Variable named "${key}" already exists.`);
    (this.variables as Record<string, any>)[key] = value;
  }
  setVariable(key: any, value: any, index: any = null, type: any = null) {
    if (this.existsVariableInScope(key)) {
      if (index !== null && index !== undefined) {
        let v: any = (this.variables as Record<string, any>)[key];
        try {
          v = JSON.parse(v);
          const numIndex = Number(index);
          if (Number.isNaN(numIndex)) {
            v[index] = convertValueType(value, type);
          } else {
            v[numIndex] = convertValueType(value, type);
          }
          v = JSON.stringify(v);
        } catch {
          v[index] = convertValueType(value, type);
        }
        (this.variables as Record<string, any>)[key] = v;
      } else {
        (this.variables as Record<string, any>)[key] = value;
      }
      return value;
    }
    if (this.parent) {
      return this.parent.setVariable(key, value, index, type);
    }
    throw new SlashCommandScopeVariableNotFoundError(`No such variable: "${key}"`);
  }
  getVariable(key: any, index: any = null) {
    if (this.existsVariableInScope(key)) {
      if (index !== null && index !== undefined) {
        let v: any = (this.variables as Record<string, any>)[key];
        try {
          v = JSON.parse(v);
        } catch {
          /* empty */
        }
        const numIndex = Number(index);
        if (Number.isNaN(numIndex)) {
          v = v[index];
        } else {
          v = v[numIndex];
        }
        if (typeof v == "object") return JSON.stringify(v);
        return v ?? "";
      } else {
        const value = (this.variables as Record<string, any>)[key];
        return value?.trim?.() === "" || isNaN(Number(value)) ? value || "" : Number(value);
      }
    }
    if (this.parent) {
      return this.parent.getVariable(key, index);
    }
    throw new SlashCommandScopeVariableNotFoundError(`No such variable: "${key}"`);
  }
}

export class SlashCommandScopeVariableExistsError extends Error {}

export class SlashCommandScopeVariableNotFoundError extends Error {}
