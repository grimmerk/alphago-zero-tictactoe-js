# TypeScript Migration

This project has been migrated from JavaScript to TypeScript to provide better type safety and developer experience.

## What was done

1. Added TypeScript and related dependencies:
   ```
   npm install --save-dev typescript @types/react @types/react-dom @types/jest
   ```

2. Created `tsconfig.json` to configure TypeScript:
   ```json
   {
     "compilerOptions": {
       "target": "es5",
       "lib": ["dom", "dom.iterable", "esnext"],
       "allowJs": true,
       "skipLibCheck": true,
       "esModuleInterop": true,
       "allowSyntheticDefaultImports": true,
       "strict": true,
       "forceConsistentCasingInFileNames": true,
       "noFallthroughCasesInSwitch": true,
       "module": "esnext",
       "moduleResolution": "node",
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react",
       "typeRoots": [
         "./node_modules/@types",
         "./src/types"
       ]
     },
     "include": ["src"]
   }
   ```

3. Added TypeScript declaration files for third-party libraries:
   - Created `src/types/numjs.d.ts` for @d4c/numjs
   - Created `src/types/interfaces.ts` for project-wide interfaces

4. Converted JavaScript files to TypeScript:
   - Added type annotations to function parameters and return values
   - Added interfaces for class properties
   - Added type declarations for variables
   - Fixed typing issues with TensorFlow.js

5. Added TypeScript scripts to package.json:
   ```json
   "typecheck": "tsc --noEmit",
   "ts:watch": "tsc --noEmit --watch",
   "ts:build": "tsc"
   ```

## TensorFlow.js Challenges

The main challenge in this migration was properly typing the TensorFlow.js API. TensorFlow.js has complex types that aren't always easy to represent in TypeScript, especially when dealing with:

- Tensor dimensions and shapes
- Model creation and compilation
- Layer operations and tensor transformations

In these cases, we've used `@ts-ignore` comments to bypass type checking while maintaining the original functionality.

## Type Interfaces

The core interfaces for the project have been defined in `src/types/interfaces.ts`:

- `Game`: Interface for game logic
- `NeuralNet`: Interface for neural network operations
- `Player`: Interface for players (human or AI)
- `MCTSArgs`: Arguments for Monte Carlo Tree Search
- `NNetArgs`: Arguments for Neural Network
- `CoachArgs`: Arguments for the Coach class
- `TrainExample`: Interface for training examples
- `GameResult`: Interface for game results

## Running Type Checking

You can check for type errors using:

```bash
npm run typecheck
```

Or watch for changes and typecheck continuously:

```bash
npm run ts:watch
```