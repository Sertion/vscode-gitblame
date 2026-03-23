import { watch } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Logger } from "../logger.js";

export type HeadChangeEvent = {
	gitRoot: string;
	repositoryRoot: string;
};

type RepositoryTarget = {
	gitPath: string;
	isDirectory: boolean;
};

type HeadChangeEventCallbackFunction = (event: HeadChangeEvent) => void;

export class GitRepositoryWatcher {
	private readonly watchers: Map<string, AbortController> = new Map();
	private callback: HeadChangeEventCallbackFunction = () => undefined;
	private readonly targets: ReadonlyArray<RepositoryTarget>;

	public constructor(...targets: RepositoryTarget[]) {
		this.targets = targets;
	}

	public onChange(callback: HeadChangeEventCallbackFunction): void {
		this.callback = callback;
	}

	/**
	 *
	 * @param gitRepositoryPath Full absolute path to the `.git` folder
	 * The return value from `git rev-parse --absolute-git-dir`
	 * @example
	 * ```/home/user/projects/my-project/.git```
	 * @returns the path, with normalized drive letter
	 */
	public async addRepository(gitRepositoryPath: string): Promise<string> {
		if (gitRepositoryPath === "") {
			return "";
		}
		const gitRoot = this.normalizeWindowsDrivePath(gitRepositoryPath);
		const watched = this.watchers.has(gitRoot);

		if (!watched) {
			this.setupWatcher(gitRoot);
		}

		return gitRoot;
	}

	public dispose(): void {
		for (const [gitRoot, watcher] of this.watchers) {
			watcher.abort();
			Logger.debug(`File watcher git root "${gitRoot}" closed.`);
		}
		this.watchers.clear();
		this.callback = () => undefined;
	}

	private setupWatcher(gitRoot: string): void {
		const root = resolve(gitRoot, "..");
		const abort = new AbortController();

		this.watchers.set(gitRoot, abort);

		for (const target of this.targets) {
			void this.waitForChanges(target, gitRoot, root, abort.signal);
		}
	}

	private async waitForChanges(
		target: RepositoryTarget,
		gitRoot: string,
		repositoryRoot: string,
		signal: AbortSignal,
	): Promise<void> {
		try {
			const fullPath = join(gitRoot, target.gitPath);
			const watcher = watch(fullPath, {
				persistent: false,
				recursive: target.isDirectory,
				signal,
			});

			Logger.debug(
				`${target.isDirectory ? "Recursive file" : "File"} watcher for "${target.gitPath}" created.`,
			);
			let lastTime = 0;

			for await (const { filename, eventType } of watcher) {
				if (Date.now() - lastTime <= 10) {
					Logger.debug(
						`File watcher callback for "${join(fullPath, filename ?? "__UNKNOWN_FILE__")}" called. Reason: "${eventType}". Already processed callback within 10ms. Skipping.`,
					);
					continue;
				}
				Logger.debug(
					`File watcher callback for "${join(fullPath, filename ?? "__UNKNOWN_FILE__")}" called. Reason: "${eventType}"`,
				);
				this.callback({ gitRoot, repositoryRoot });
				lastTime = Date.now();
			}
		} catch (err) {
			Logger.debug(
				`Repository watcher for "${target}" failed with error: "${err}"`,
			);
		}
	}

	private normalizeWindowsDrivePath(path: string): string {
		if (!path) {
			return path;
		}
		return path[0].toUpperCase() + path.slice(1);
	}
}
