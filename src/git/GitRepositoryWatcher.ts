import { type FSWatcher, watch } from "node:fs";
import { join, resolve } from "node:path";
import { Logger } from "../logger.js";

export type HeadChangeEvent = {
	gitRoot: string;
	repositoryRoot: string;
};

type HeadChangeEventCallbackFunction = (event: HeadChangeEvent) => void;

export class GitRepositoryWatcher {
	private readonly watchers: Map<string, FSWatcher> = new Map();
	private callback: HeadChangeEventCallbackFunction = () => undefined;

	public constructor(private file: string) {}

	public onChange(callback: HeadChangeEventCallbackFunction): void {
		this.callback = callback;
	}

	public async addRepository(gitRepositoryPath: string): Promise<string> {
		const gitRoot = this.normalizeWindowsDrivePath(gitRepositoryPath);
		const watched = this.watchers.has(gitRoot);

		if (watched === true || gitRepositoryPath === "") {
			return gitRoot;
		}

		const repositoryRoot = resolve(gitRoot, "..");
		const filePath = join(gitRoot, this.file);

		this.watchers.set(
			filePath,
			watch(filePath, { persistent: false }, () => {
				Logger.debug(`File watcher callback for "${filePath}" called.`);
				this.callback({ gitRoot, repositoryRoot });
			}),
		);

		Logger.debug(`File watcher for "${filePath}" created.`);

		return gitRoot;
	}

	public dispose(): void {
		for (const [gitRoot, watcher] of this.watchers) {
			watcher.close();
			Logger.debug(`File watcher git root "${gitRoot}" closed.`);
		}
		this.watchers.clear();
		this.callback = () => undefined;
	}

	private normalizeWindowsDrivePath(path: string): string {
		if (path.length < 1) {
			return path.toUpperCase();
		}
		return path[0].toUpperCase() + path.slice(1);
	}
}
