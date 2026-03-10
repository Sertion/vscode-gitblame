import { watch } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Logger } from "../logger.js";

export type HeadChangeEvent = {
	gitRoot: string;
	repositoryRoot: string;
};

type HeadChangeEventCallbackFunction = (event: HeadChangeEvent) => void;

export class GitRepositoryWatcher {
	private readonly watchers: Map<string, AbortController> = new Map();
	private callback: HeadChangeEventCallbackFunction = () => undefined;

	public constructor(private readonly file: string) {}

	public onChange(callback: HeadChangeEventCallbackFunction): void {
		this.callback = callback;
	}

	public async addRepository(gitRepositoryPath: string): Promise<string> {
		const gitRoot = this.normalizeWindowsDrivePath(gitRepositoryPath);
		const watched = this.watchers.has(gitRoot);

		if (watched === true || gitRepositoryPath === "") {
			return gitRoot;
		}

		const root = resolve(gitRoot, "..");
		const filePath = join(gitRoot, this.file);
		const abort = new AbortController();

		this.watchers.set(filePath, abort);

		void this.waitForChanges(filePath, gitRoot, root, abort.signal);

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

	private async waitForChanges(
		filePath: string,
		gitRoot: string,
		repositoryRoot: string,
		signal: AbortSignal,
	): Promise<void> {
		try {
			const watcher = watch(filePath, {
				persistent: false,
				signal,
			});

			Logger.debug(`File watcher for "${filePath}" created.`);

			for await (const { filename, eventType } of watcher) {
				Logger.debug(
					`File watcher callback for "${filename}" called. Reason: "${eventType}"`,
				);
				this.callback({ gitRoot, repositoryRoot });
			}
		} catch (err) {
			Logger.debug(
				`Repository watcher for "${filePath}" failed with error: "${err}"`,
			);
		}
	}

	private normalizeWindowsDrivePath(path: string): string {
		if (path.length < 1) {
			return path.toUpperCase();
		}
		return path[0].toUpperCase() + path.slice(1);
	}
}
