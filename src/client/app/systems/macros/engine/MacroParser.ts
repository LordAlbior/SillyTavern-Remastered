import { chevrotain } from "../../../../lib";
const MacroLexer: any = (await import("./MacroLexer" as string)).MacroLexer;

const { CstParser } = chevrotain;

/** @typedef {import('chevrotain').TokenType} TokenType */
/** @typedef {import('chevrotain').CstNode} CstNode */
/** @typedef {import('chevrotain').ILexingError} ILexingError */
/** @typedef {import('chevrotain').IRecognitionException} IRecognitionException */

/**
 * The singleton instance of the MacroParser.
 *
 * @type {MacroParser}
 */
let instance;
export { instance as MacroParser };

class MacroParser extends CstParser {
  /** @type {MacroParser} */ static #instance: any;
  /** @type {MacroParser} */ static get instance() {
    return MacroParser.#instance ?? (MacroParser.#instance = new MacroParser());
  }

  document: any;
  macro: any;
  macroBody: any;
  variableExpr: any;
  variableOperator: any;
  variableValue: any;
  argument: any;
  argumentAllowingColons: any;
  arguments: any;

  /** @private */
  constructor() {
    super(MacroLexer.def, {
      traceInitPerf: false,
      nodeLocationTracking: "full",
      recoveryEnabled: true,
    });
    const Tokens = MacroLexer.tokens;

    // Top-level document rule that can handle both plaintext and macros
    this.document = this.RULE("document", () => {
      this.MANY(() => {
        this.OR([
          { ALT: () => this.CONSUME(Tokens.Plaintext, { LABEL: "plaintext" }) },
          { ALT: () => this.CONSUME(Tokens.PlaintextOpenBrace, { LABEL: "plaintext" }) },
          { ALT: () => this.SUBRULE(this.macro) },
          { ALT: () => this.CONSUME(Tokens.Macro.Start, { LABEL: "plaintext" }) },
        ]);
      });
    });

    // Basic Macro Structure - can be either a regular macro or a variable expression
    this.macro = this.RULE("macro", () => {
      this.CONSUME(Tokens.Macro.Start);

      // Optional flags before the identifier (e.g., {{!user}}, {{?~macro}}, {{>filtered}})
      // Both regular flags and filter flag are captured under the 'flags' label
      this.MANY(() => {
        this.OR1([
          { ALT: () => this.CONSUME(Tokens.Macro.Flags, { LABEL: "flags" }) },
          { ALT: () => this.CONSUME(Tokens.Macro.FilterFlag, { LABEL: "flags" }) },
        ]);
      });

      // Branch: either a variable expression (starts with . or $) or a regular macro
      this.OR([
        // Variable expression branch
        { ALT: () => this.SUBRULE(this.variableExpr) },
        // Regular macro branch
        { ALT: () => this.SUBRULE(this.macroBody) },
      ]);

      this.CONSUME(Tokens.Macro.End);
    });

    // Regular macro body (flags + identifier + optional arguments)
    this.macroBody = this.RULE("macroBody", () => {
      // Macro identifier (name)
      this.OR2([
        { ALT: () => this.CONSUME(Tokens.Macro.DoubleSlash, { LABEL: "Macro.identifier" }) },
        { ALT: () => this.CONSUME(Tokens.Macro.Identifier, { LABEL: "Macro.identifier" }) },
      ]);
      this.OPTION(() => this.SUBRULE(this.arguments));
    });

    // Variable expression: .varName or $varName with optional operator
    this.variableExpr = this.RULE("variableExpr", () => {
      // Variable scope prefix
      this.OR3([
        { ALT: () => this.CONSUME(Tokens.Var.LocalPrefix, { LABEL: "Var.scope" }) },
        { ALT: () => this.CONSUME(Tokens.Var.GlobalPrefix, { LABEL: "Var.scope" }) },
      ]);

      // Variable identifier (name)
      this.CONSUME(Tokens.Var.Identifier, { LABEL: "Var.identifier" });

      // Optional operator (and expression, if operator requires one)
      this.OPTION2(() => this.SUBRULE(this.variableOperator));
    });

    // Variable operator: ++, --, = value, += value, -= value, ||, ??, ||=, ??=, ==, !=, >, >=, <, <=
    this.variableOperator = this.RULE("variableOperator", () => {
      this.OR4([
        { ALT: () => this.CONSUME(Tokens.Var.Operators.Increment, { LABEL: "Var.operator" }) },
        { ALT: () => this.CONSUME(Tokens.Var.Operators.Decrement, { LABEL: "Var.operator" }) },
        {
          ALT: () => {
            this.OR5([
              { ALT: () => this.CONSUME(Tokens.Var.Operators.NullishCoalescingEquals, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.NullishCoalescing, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.LogicalOrEquals, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.LogicalOr, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.MinusEquals, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.DoubleEquals, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.NotEquals, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.GreaterThanOrEqual, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.GreaterThan, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.LessThanOrEqual, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.LessThan, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.PlusEquals, { LABEL: "Var.operator" }) },
              { ALT: () => this.CONSUME(Tokens.Var.Operators.Equals, { LABEL: "Var.operator" }) },
            ]);
            this.SUBRULE(this.variableValue, { LABEL: "Var.value" });
          },
        },
      ]);
    });

    // Variable value: everything after = or += until the end
    // Can contain nested macros and any other tokens
    this.variableValue = this.RULE("variableValue", () => {
      this.MANY2(() => {
        this.OR5([
          { ALT: () => this.SUBRULE(this.macro) }, // Nested macros
          { ALT: () => this.CONSUME(Tokens.Identifier) },
          { ALT: () => this.CONSUME(Tokens.Unknown) },
        ]);
      });
    });

    // Arguments Parsing
    this.arguments = this.RULE("arguments", () => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Tokens.Args.DoubleColon, { LABEL: "separator" });
            this.AT_LEAST_ONE_SEP({
              SEP: Tokens.Args.DoubleColon,
              DEF: () => this.SUBRULE(this.argument, { LABEL: "argument" }),
            });
          },
        },
        {
          ALT: () => {
            this.OPTION(() => {
              this.CONSUME(Tokens.Args.Colon, { LABEL: "separator" });
            });
            this.SUBRULE(this.argumentAllowingColons, { LABEL: "argument" });
          },
          // So, this is a bit hacky. But implemented below, the argument capture does explicitly exclude double colons
          // from being captured as the first token. The potential ambiguity chevrotain claims here is not possible.
          // It says stuff like <Args.DoubleColon, Identifier/Macro/Unknown> is possible in both branches, but it is not.
          IGNORE_AMBIGUITIES: true,
        },
      ]);
    });

    // List the argument tokens here, as we need two rules, one to be able to parse with double colons and one without
    const validArgumentTokens = [
      { ALT: () => this.SUBRULE(this.macro) }, // Nested Macros
      { ALT: () => this.CONSUME(Tokens.Identifier) },
      { ALT: () => this.CONSUME(Tokens.Unknown) },
      { ALT: () => this.CONSUME(Tokens.Args.Colon) },
      { ALT: () => this.CONSUME(Tokens.Args.Equals) },
      { ALT: () => this.CONSUME(Tokens.Args.Quote) },
    ];

    this.argument = this.RULE("argument", () => {
      this.MANY(() => {
        this.OR([...validArgumentTokens]);
      });
    });
    this.argumentAllowingColons = this.RULE("argumentAllowingColons", () => {
      this.AT_LEAST_ONE(() => {
        this.OR([...validArgumentTokens, { ALT: () => this.CONSUME(Tokens.Args.DoubleColon) }]);
      });
    });

    this.performSelfAnalysis();
  }

  /**
   * Parses a document into a CST.
   *
   * @param {string} input
   * @returns {{ cst: CstNode|null, errors: ({ message: string }|ILexingError|IRecognitionException)[] , lexingErrors: ILexingError[], parserErrors: IRecognitionException[] }}
   */
  parseDocument(input: any) {
    if (!input) {
      return { cst: null, errors: [{ message: "Input is empty" }], lexingErrors: [], parserErrors: [] };
    }

    const lexingResult = MacroLexer.tokenize(input);

    this.input = lexingResult.tokens;
    const cst = this.document();

    const errors = [...lexingResult.errors, ...this.errors];

    return { cst, errors, lexingErrors: lexingResult.errors, parserErrors: this.errors };
  }

  test(input: any) {
    const lexingResult = MacroLexer.tokenize(input);
    // "input" is a setter which will reset the parser's state.
    this.input = lexingResult.tokens;
    const cst = this.macro();

    // For testing purposes we need to actually persist the error messages in the object,
    // otherwise the test cases cannot read those, as they don't have access to the exception object type.
    const errors = this.errors.map((x) => ({ ...x, message: x.message, stack: x.stack }));

    return { cst, errors: errors };
  }
}

instance = MacroParser.instance;
