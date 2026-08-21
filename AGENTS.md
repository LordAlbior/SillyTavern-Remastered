# SillyTavern - Remastered

This project is an opinionated fork of SillyTavern.

SillyTavern is a locally installed user interface that allows you to interact with text generation LLMs, image generation engines, and TTS voice models. The goal of the original project is to empower users with as much utility and control over their LLM prompts as possible.

## 0. Project

### 0.1 Basics

* Application Type: Full-stack web application.
* Language: Mostly strict Typescript, HTML5, CSS
* Stack: The goal is to migrate everything to Typescript 7, Bun, Elysia, Svelte 5 and Tailwind. Other dependencies may be used as well.
  
### 0.2 User guidelines

These are some guidelines the project author expects you to follow normally.

* When unsure, you should research further.
* When research is not enough, ask for guidance and help from the user.
* We use a research-based approach here. Research often and back your decisions with facts.
* We used TDD in this project. Every code touched should begin with test. *If you implemented something and no test was written, you did something wrong*.
* When the rules of this document are not sufficient, as the user for clarification. The user and you are cooperating partners in this project.
* Maintain the project wiki as a durable knowledge base. At the start of a task, call `wiki_recall` to find relevant prior research, decisions, and patterns. After meaningful work, call `wiki_retro` to save an atomic insight. For deeper dives, use `wiki_search`. When you encounter useful external or internal sources, ingest them with `wiki_capture_source` and write the corresponding knowledge page in `.llm-wiki/wiki/`. Cross-reference pages so related knowledge stays linked.

### 0.3 Agent local workspace

* `.agents/` at the project root is the agent's local scratch space. Use it for any file an agent creates that should not be committed or bundled with the project — notes, drafts, downloaded assets, temporary scripts or tools, and intermediate analysis or build output.
* Create `.agents/` when it is missing; never drop such files elsewhere in the tree. This keeps agent clutter out of version control and the project layout.
* `.agents/` is git-ignored. Do not commit its contents.

## 1. Behavioral guidelines for Agents

### 1.1 Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing or calling tools:

* State your assumptions explicitly. If uncertain, ask using the question tool or directly in chat.
* If multiple interpretations exist, present them - don't pick silently.
* If a simpler approach exists, say so. Push back when warranted.
* If something is unclear, stop. Name what's confusing. Ask.

### 1.2 Simplicity First

Minimum code that solves the problem. Nothing speculative.

* No features beyond what was asked.
* No abstractions for single-use code.
* No "flexibility" or "configurability" that wasn't requested.
* No error handling for impossible scenarios.
* If you write 200 lines and it could be 50, rewrite it.

*Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.*

### 1.3 Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code (using edit or write):

* Don't "improve" adjacent code, comments, or formatting.
* Don't refactor things that aren't broken.
* Match existing style, even if you'd do it differently.
* If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

* Remove imports/variables/functions that YOUR changes made unused.
* Don't remove pre-existing dead code unless asked.

*The test: Every changed line should trace directly to the user's request.*

### 1.4 Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals using bash:

* "Add validation" -> "Write tests for invalid inputs, run them to see them fail, implement, then run them to see them pass"
* "Fix the bug" -> "Write a test/script that reproduces it, then make it pass"
* "Refactor X" -> "Run existing tests before and after"
  
For multi-step tasks, use todowrite or state a brief plan:

[Step] -> verify: [check command]
[Step] -> verify: [check command]
[Step] -> verify: [check command]

*Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.*

## 2. General Software Engineering Rules

### 2.1 Simplicity First

* Prefer the simplest design that satisfies the current requirements. Minimize conceptual, implementation, operational, and resource complexity.
* Apply **KISS**, **YAGNI**, and **Worse Is Better**: do not implement speculative features, abstractions, flexibility, or optimizations without a demonstrated need.
* Prefer removing complexity over adding mechanisms to manage it.

### 2.2 Correctness and Safety

* Code must be correct for all specified and reasonably expected cases. Never trade correctness, safety, or data integrity for superficial simplicity or performance.
* Fail fast when an invariant, precondition, postcondition, or internal assumption is violated. Do not silently ignore errors or invalid states unless explicitly required.
* Make important assumptions executable through assertions, validation, tests, or other appropriate mechanisms.

### 2.3 Be Explicit and Predictable

* Prefer explicit behavior over implicit behavior, hidden control flow, magic, and surprising side effects.
* Make resource usage, ownership, lifetime, concurrency, failure modes, and important state transitions explicit.
* Bound resources and execution where practical: memory, queues, concurrency, retries, recursion, loops, and external work should have deliberate limits.

### 2.4 Keep Code Small and Focused

* Each module, component, function, or type should have a clear and limited responsibility.
* Keep functions and modules small enough to understand without excessive context. Minimize nesting, branching, state, parameters, and variables in scope.
* Use **SRP** and **GRASP** to assign responsibilities clearly.

## 2.5 Design for Composition

* Prefer small, cohesive components that can be composed rather than large components with many unrelated responsibilities.
* Separate mechanism from policy. Separate control flow from low-level operations where doing so improves clarity.
* Design interfaces around what consumers actually need. Keep interfaces small and minimize exposed surface area.

### 2.6 Manage Dependencies

* Depend on abstractions where they provide a real architectural benefit, not merely because a pattern recommends them.
* Apply **SOLID**, especially **DIP** and **ISP**, when they reduce coupling or clarify responsibilities.
* Isolate external systems, libraries, platforms, and unstable dependencies behind narrow interfaces when this makes the core system easier to understand, test, replace, or evolve.
* Avoid dependencies that provide little value relative to their complexity and maintenance cost.

### 2.7 Avoid Duplication Without Over-Abstraction

* Apply **DRY** to knowledge and behavior that must remain consistent, not merely to similar-looking code.
* Do not create abstractions solely to eliminate small amounts of duplication. Prefer duplication over a premature or misleading abstraction when the duplicated code may evolve independently.
* Extract an abstraction when a stable concept, invariant, or repeated change pattern has become evident.

### 2.8 Prefer Readability Over Cleverness

* Optimize for human understanding before optimizing for cleverness.
* Use clear names, straightforward control flow, conventional constructs, and local reasoning.
* Do not rely on obscure language features, implicit behavior, excessive indirection, or clever tricks when a direct implementation is easier to understand.
* Comments should explain **why**, constraints, invariants, or non-obvious decisions—not restate what the code already says.

### 2.9 Make Interfaces Obvious

* An API should have one obvious, predictable way to perform common operations.
* Use explicit inputs and outputs. Minimize surprising defaults, hidden state, implicit conversions, and unnecessary overloads or variants.
* Reject ambiguous input rather than guessing when guessing could produce an incorrect result.

### 2.10 Design for Failure and Diagnosis

* Errors must be visible, actionable, and easy to diagnose.
* Preserve useful context when propagating failures. Distinguish expected operational failures from programmer errors and invariant violations.
* Prefer deterministic and reproducible behavior where practical.
* Do not allow failures to silently corrupt state or produce misleading success.

### 2.11 Prefer Portability and Replaceability

* Prefer portable designs unless platform-specific behavior provides a concrete and justified benefit.
* Isolate platform-specific mechanisms behind narrow boundaries.
* Do not sacrifice portability, replaceability, or architectural clarity for speculative performance.
* When performance matters, measure first and optimize the actual bottleneck.

### 2.12 Optimize Resources Deliberately

* Use as little CPU, memory, storage, bandwidth, and other resources as reasonably possible while preserving correctness and maintainability.
* Prefer predictable resource usage over unnecessary peak performance.
* Batch expensive I/O, memory, network, and external operations when doing so improves efficiency without obscuring the design.
* Do not optimize blindly; use measurements and explicit requirements to justify complexity.

### 2.13 Prefer Incremental Design

* Build the smallest useful system first and evolve it through measured feedback.
* Prototype uncertain designs early. Validate important assumptions before investing heavily in architecture.
* Keep changes small, cohesive, and independently understandable.
* Refactor continuously when the existing design becomes unnecessarily complex. Do not preserve poor structure merely because it already exists.

### 2.14 Use Patterns as Tools, Not Rules

* Use **SOLID**, **GRASP**, and established design patterns as design vocabulary and heuristics, not as mandatory structures.
* A pattern must solve a real problem and improve the resulting design. Do not introduce patterns, layers, interfaces, factories, dependency containers, or frameworks solely to follow a methodology.
* Prefer domain-specific clarity over pattern purity.

### 2.15 Keep Data Simple; Keep Behavior Structured

* Represent data directly and transparently.
* Prefer straightforward data structures and explicit transformations over complicated object hierarchies or behavioral machinery when the problem is fundamentally data-oriented.
* Put complexity into the data model when that makes behavior simpler and easier to reason about.

### 2.16 Make Change Cheap

* Structure code so that likely changes can be made locally without understanding or modifying unrelated parts of the system.
* Minimize coupling and maximize cohesion.
* Prefer reversible decisions when requirements are uncertain.
* Do not build future functionality, but do preserve reasonable ability to change the current functionality.

### 2.17 Test the Boundaries

* Test normal behavior, important edge cases, invalid inputs, failure paths, and state transitions.
* Test invariants and externally observable behavior rather than implementation details whenever practical.
* A design that is difficult to test is often unnecessarily coupled, complex, or opaque.

### 2.18 Verify Before Declaring Success

* Do not assume that code works because it looks correct.
* Compile, execute, test, inspect, or otherwise verify changes using the strongest practical validation available.
* Treat warnings, static-analysis findings, failed tests, and unexpected behavior as problems to investigate rather than noise to suppress.

### 2.19 Preserve Consistency, But Not at Any Cost

* Follow established conventions within the project unless there is a concrete reason to change them.
* When consistency conflicts with simplicity, correctness, or safety, prefer the higher-value property and document the deviation when it is not obvious.
* Do not introduce special cases merely to preserve superficial uniformity.

### 2.20 Leave the System Better

* Every change should maintain or improve the system's readability, correctness, maintainability, and architectural health.
* Do not knowingly introduce unnecessary technical debt, speculative complexity, dead code, duplicated mechanisms, or temporary hacks without an explicit reason.
* If a requested change conflicts with these rules, identify the conflict and choose the smallest safe solution that satisfies the actual requirement.
