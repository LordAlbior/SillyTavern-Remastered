# JS to TypeScript Migration Codemod

This codemod package automates the migration of JavaScript files to TypeScript with proper type annotations and strict mode compliance.

## What it does

The migration is performed in three stages:

### 1. JSDoc to TypeScript Conversion
Converts JSDoc type annotations to TypeScript type annotations:
- `@param {Type} name` → `name: Type`
- `@returns {Type}` → `: Type`
- Handles both regular functions and arrow functions
- Supports complex types: unions, arrays, nullable types, etc.

### 2. Catch Variable Type Guards
Adds type guards for catch variables to handle `useUnknownInCatchVariables`:
```typescript
// Before
catch (error) {
  console.error(error.message);
}

// After
catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
}
```

### 3. Var to Const Conversion
Converts `var` declarations to `const`:
```typescript
// Before
var x = 5;

// After
const x = 5;
```

## Usage

### Dry Run (Preview Changes)
```bash
npx codemod workflow run -w . --target ../app --dry-run
```

### Apply Changes
```bash
npx codemod workflow run -w . --target ../app
```

### Test Individual Codemods
```bash
# Test JSDoc conversion
npx codemod jssg test scripts/convert-jsdoc-to-types.ts --language typescript

# Test catch variable fixes
npx codemod jssg test scripts/fix-catch-variables.ts --language typescript

# Test var to const
npx codemod jssg test scripts/var-to-const.ts --language typescript
```

## Workflow Configuration

The workflow is defined in `workflow.yaml` and runs the codemods in sequence:
1. `convert-jsdoc` - Converts JSDoc annotations
2. `fix-catch-variables` - Adds type guards for catch variables
3. `var-to-const` - Converts var to const

Each step depends on the previous one, ensuring transformations are applied in the correct order.

## File Filtering

The codemods target all `.ts` files in the project, excluding:
- `node_modules/`
- `dist/`
- `build/`
- `.d.ts` declaration files (for JSDoc conversion)

## Next Steps

After running this codemod, you should:
1. Review the changes and commit them
2. Enable strict mode flags incrementally in `tsconfig.json`:
   - `alwaysStrict`
   - `noImplicitThis`
   - `useUnknownInCatchVariables`
   - `strictBindCallApply`
   - `strictFunctionTypes`
   - `noImplicitAny`
   - `strictPropertyInitialization`
   - `strictNullChecks`
3. Fix any remaining type errors manually
4. Add runtime validation (Zod/Yup) for API inputs
5. Set up CI gate to prevent regressions

## Limitations

- Complex JSDoc types (e.g., callback functions with multiple signatures) may require manual review
- The catch variable wrapper adds a fallback `console.error(String(error))` which may need customization
- Variables that are reassigned should use `let` instead of `const` (manual review needed)
- Some edge cases may require manual intervention

## Development

To add new codemods:
1. Create a new `.ts` file in `scripts/`
2. Add test cases in `tests/<codemod-name>/`
3. Test with `npx codemod jssg test scripts/<codemod-name>.ts --language typescript`
4. Add to `workflow.yaml` if it should run automatically
