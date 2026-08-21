import { SlashCommandClosure } from "./SlashCommandClosure";
import { SlashCommandExecutor } from "./SlashCommandExecutor";

export class SlashCommandDebugController {
  /** @type {SlashCommandClosure[]} */ stack: any[] = [];
  /** @type {SlashCommandExecutor[]} */ cmdStack: any[] = [];
  /** @type {boolean[]} */ stepStack: any[] = [];
  /** @type {boolean} */ isStepping = false;
  /** @type {boolean} */ isSteppingInto = false;
  /** @type {boolean} */ isSteppingOut = false;

  /** @type {object} */ namedArguments: any;
  /** @type {string|SlashCommandClosure|(string|SlashCommandClosure)[]} */ unnamedArguments: any;

  /** @type {Promise<boolean>} */ continuePromise: any;
  /** @type {(boolean)=>void} */ continueResolver: any;

  /** @type {(closure:SlashCommandClosure, executor:SlashCommandExecutor)=>Promise<boolean>} */ onBreakPoint: any;

  testStepping(closure: any) {
    return this.stepStack[this.stack.indexOf(closure)];
  }

  down(closure: any) {
    this.stack.push(closure);
    if (this.stepStack.length < this.stack.length) {
      this.stepStack.push(this.isSteppingInto);
    }
  }
  up() {
    this.stack.pop();
    while (this.cmdStack.length > this.stack.length) this.cmdStack.pop();
    this.stepStack.pop();
  }

  setExecutor(executor: any) {
    this.cmdStack[this.stack.length - 1] = executor;
  }

  resume() {
    this.continueResolver?.(false);
    this.continuePromise = null;
    this.stepStack.forEach((_, idx) => (this.stepStack[idx] = false));
  }
  step() {
    this.stepStack.forEach((_, idx) => (this.stepStack[idx] = true));
    this.continueResolver?.(true);
    this.continuePromise = null;
  }
  stepInto() {
    this.isSteppingInto = true;
    this.stepStack.forEach((_, idx) => (this.stepStack[idx] = true));
    this.continueResolver?.(true);
    this.continuePromise = null;
  }
  stepOut() {
    this.isSteppingOut = true;
    this.stepStack[this.stepStack.length - 1] = false;
    this.continueResolver?.(false);
    this.continuePromise = null;
  }

  async awaitContinue() {
    this.continuePromise ??= new Promise((resolve) => {
      this.continueResolver = resolve;
    });
    this.isStepping = await this.continuePromise;
    return this.isStepping;
  }

  async awaitBreakPoint(closure: any, executor: any) {
    this.isStepping = await this.onBreakPoint(closure, executor);
    return this.isStepping;
  }
}
