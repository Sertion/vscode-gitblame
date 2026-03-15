import { type FSWatcher, promises, watch } from "node:fs";
import { type Disposable, workspace } from "vscode";
import { type Blame, BlamedFile } from "./blamed-file.js";
import { git } from "./git/command/CachedGit.js";
import type { LineAttachedCommit } from "./git/LineAttachedCommit.js";
import { Queue } from "./git/queue.js";
import { Logger } from "./logger.js";
import { PropertyStore } from "./PropertyStore.js";

export class Blamer {
	private readonly metadata = new Map<
		Promise<Blame | undefined>,
		| {
				file: BlamedFile;
				gitRoot: string;
		  }
		| undefined
	>();
	private readonly files = new Map<string, Promise<Blame | undefined>>();
	private readonly fsWatchers = new Map<string, FSWatcher>();
	private readonly blameQueue = new Queue<Blame | undefined>(
		PropertyStore.get("parallelBlames"),
	);
	private readonly configChange: Disposable;

	public constructor() {
		this.configChange = workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("gitblame.parallelBlames")) {
				this.blameQueue.updateParallel(PropertyStore.get("parallelBlames"));
			}
		});
	}

	public async getLine(
		fileName: string,
		lineNumber: number,
	): Promise<LineAttachedCommit | undefined> {
		await this.prepareFile(fileName);

		const commitLineNumber = lineNumber + 1;
		const blameInfo = await this.files.get(fileName);

		return blameInfo?.get(commitLineNumber);
	}

	public removeFromRepository(gitRepositoryPath: string): void {
		for (const [fileName, file] of this.files) {
			const metadata = this.metadata.get(file);
			if (metadata?.gitRoot === gitRepositoryPath) {
				this.remove(fileName);
			}
		}
	}

	public remove(fileName: string): void {
		const blame = this.files.get(fileName);
		if (!blame) {
			return;
		}

		this.metadata.get(blame)?.file?.dispose();
		this.metadata.delete(blame);

		this.files.delete(fileName);
		this.fsWatchers.get(fileName)?.close();
		this.fsWatchers.delete(fileName);
		Logger.info(`Cache for "${fileName}" cleared. File watcher closed.`);
	}

	public dispose(): void {
		for (const fileName of this.files.keys()) {
			this.remove(fileName);
		}
		this.configChange.dispose();
	}

	private async prepareFile(fileName: string): Promise<void> {
		if (this.files.has(fileName)) {
			await this.files.get(fileName);
			return;
		}

		const { promise, resolve } = Promise.withResolvers<Blame | undefined>();
		Logger.debug(`Setting up blame cache for "${fileName}"`);
		this.files.set(fileName, promise);

		const { file, gitRoot } = await this.create(fileName);

		if (file === undefined) {
			resolve(undefined);
			return;
		}

		Logger.debug(`Setting up file watcher for "${file.filePath}"`);

		this.fsWatchers.set(
			file.filePath,
			watch(file.filePath, { persistent: false }, () => {
				Logger.trace(`File watcher callback for "${file.filePath}" executed`);
				this.remove(file.filePath);
			}),
		);

		const blame = this.blameQueue.add(() => file.getBlame());
		this.metadata.set(blame, { file, gitRoot });
		resolve(blame);
	}

	private async create(
		fileName: string,
	): Promise<
		| { gitRoot: string; file: BlamedFile }
		| { gitRoot: undefined; file: undefined }
	> {
		try {
			await promises.access(fileName);

			const gitRoot = await git.getRepositoryFolder(fileName);
			if (gitRoot) {
				return { gitRoot, file: new BlamedFile(fileName) };
			}
		} catch (err) {
			if (err instanceof Error) {
				Logger.debug(err.message);
			}
		}

		Logger.info(`Will not blame '${fileName}'. Not in a git repository.`);

		return { gitRoot: undefined, file: undefined };
	}
}
