import path from 'node:path';
import { CommandLineParser } from './src/command-line.ts';
import { serverDirectory } from './src/server-directory.ts';

const runtimeLabel = process.versions.bun
  ? `Bun version: ${process.versions.bun}`
  : `Node version: ${process.version}`;
const envLabel = process.env.NODE_ENV || 'development';
console.log(`${runtimeLabel}. Running in ${envLabel} environment. Server directory: ${serverDirectory}`);

// config.yaml will be set when parsing command line arguments
const cliArgs = new CommandLineParser().parse(process.argv);
globalThis.DATA_ROOT = cliArgs.dataRoot;
globalThis.COMMAND_LINE_ARGS = cliArgs;
// chdir to the repo root (parent of app/) so user data/config/plugins resolve
// at the repo root, not inside app/. serverDirectory (app/) still locates source.
process.chdir(path.dirname(serverDirectory));

try {
    await import('./src/server-main.ts');
} catch (error) {
    console.error('A critical error has occurred while starting the server:', error);
}
