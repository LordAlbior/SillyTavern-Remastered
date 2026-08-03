import fs from "node:fs";

import { sync as commandExistsSync } from "command-exists";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import simpleGit from "simple-git";

export const GIT_BACKENDS = {
  AUTO: "auto",
  SYSTEM: "system",
  BUILTIN: "builtin",
} as const;

/**
 * @param {string | undefined | null} preferredBackend
 * @returns {'system' | 'builtin'}
 */
function resolveBackend(preferredBackend: string | undefined | null): "system" | "builtin" {
  const normalized = typeof preferredBackend === "string" ? preferredBackend.trim().toLowerCase() : GIT_BACKENDS.AUTO;
  const backend =
    normalized === GIT_BACKENDS.SYSTEM
      ? GIT_BACKENDS.SYSTEM
      : normalized === GIT_BACKENDS.BUILTIN
        ? GIT_BACKENDS.BUILTIN
        : GIT_BACKENDS.AUTO;
  const systemGitAvailable = commandExistsSync("git");

  if (backend === GIT_BACKENDS.SYSTEM && !systemGitAvailable) {
    throw new Error("System git backend is configured, but no git binary was found in PATH.");
  }

  if (backend === GIT_BACKENDS.SYSTEM || (backend === GIT_BACKENDS.AUTO && systemGitAvailable)) {
    return GIT_BACKENDS.SYSTEM;
  }

  return GIT_BACKENDS.BUILTIN;
}

interface GitCloneOptions {
  depth?: number;
  branch?: string;
}

const SUPPORTED_CLONE_OPTIONS = new Set(["depth", "branch"]);

function normalizeCloneOptions(options: GitCloneOptions = {}): { depth?: number; branch?: string } {
  for (const key of Object.keys(options)) {
    if (!SUPPORTED_CLONE_OPTIONS.has(key)) {
      throw new Error(`Unsupported clone option: ${key}`);
    }
  }
  return { depth: options.depth, branch: options.branch };
}

interface GitClient {
  backend: "system" | "builtin";
  clone(url: string, localPath: string, options?: GitCloneOptions): Promise<void>;
}

export function createGitClient(options: { backend?: string } = {}): GitClient {
  const backend = resolveBackend(options.backend);
  if (backend === GIT_BACKENDS.SYSTEM) {
    return new SimpleGitClient();
  }

  return new IsomorphicGitClient();
}

class SimpleGitClient implements GitClient {
  backend = GIT_BACKENDS.SYSTEM;
  git = simpleGit();

  constructor() {}

  /**
   * @param {string} url
   * @param {string} localPath
   * @param {GitCloneOptions} [options]
   * @returns {Promise<void>}
   */
  async clone(url, localPath, options = {}) {
    const { depth, branch } = normalizeCloneOptions(options);
    /** @type {Record<string, any>} */
    const cloneOptions = {};

    if (depth !== undefined) {
      cloneOptions["--depth"] = depth;
    }

    if (branch) {
      cloneOptions["--branch"] = branch;
    }

    await this.git.clone(url, localPath, cloneOptions);
  }
}

class IsomorphicGitClient implements GitClient {
  backend = GIT_BACKENDS.BUILTIN;

  constructor() {}

  /**
   * @param {string} url
   * @param {string} localPath
   * @param {GitCloneOptions} [options]
   * @returns {Promise<void>}
   */
  async clone(url, localPath, options = {}) {
    const { depth, branch } = normalizeCloneOptions(options);

    await git.clone({
      fs,
      http,
      dir: localPath,
      url,
      depth,
      ref: branch,
      singleBranch: depth !== undefined || Boolean(branch),
    });
  }
}
