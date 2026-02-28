import { type FSWatcher, promises, watch } from "node:fs";
import { type Disposable, workspace } from "vscode";
import { type Blame, BlamedFile } from "./blamed-file.js";
import { git } from "./git/command/CachedGit.js";
import { Queue } from "./git/queue.js";
import type { LineAttachedCommit } from "./git/stream-parsing.js";
import { Logger } from "./logger.js";
import { getProperty } from "./property.js";

export class Blamer {
	private readonly metadata = new WeakMap<
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
		getProperty("parallelBlames"),
	);
	private readonly configChange: Disposable;

	public constructor() {
		this.configChange = workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("gitblame")) {
				this.blameQueue.updateParallel(getProperty("parallelBlames"));
			}
		});
	}

	public async prepareFile(fileName: string): Promise<void> {
		if (this.files.has(fileName)) {
			return;
		}

		let resolve: (blame: Promise<Blame | undefined> | undefined) => void =
			() => {};
		this.files.set(
			fileName,
			new Promise<Blame | undefined>((res) => {
				resolve = res;
			}),
		);

		const { file, gitRoot } = await this.create(fileName);

		if (file === undefined) {
			resolve(undefined);
			return;
		}

		Logger.debug("Setting up file watcher for '%s'", file.fileName);

		this.fsWatchers.set(
			file.fileName,
			watch(
				file.fileName,
				{
					persistent: false,
				},
				() => {
					Logger.debug(
						"File watcher callback for '%s' executed",
						file.fileName,
					);
					this.remove(file.fileName);
				},
			),
		);

		const blame = this.blameQueue.add(() => file.getBlame());
		this.metadata.set(blame, { file, gitRoot });
		resolve(blame);
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
		if (blame) {
			this.metadata.get(blame)?.file?.dispose();
		}

		this.files.delete(fileName);
		this.fsWatchers.get(fileName)?.close();
		this.fsWatchers.delete(fileName);
		Logger.debug("Cache for '%s' cleared. File watcher closed.", fileName);
	}

	public dispose(): void {
		for (const fileName of this.files.keys()) {
			this.remove(fileName);
		}
		this.configChange.dispose();
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
		} catch {
			// NOOP
		}

		Logger.info(`Will not blame '${fileName}'. Not in a git repository.`);

		return { gitRoot: undefined, file: undefined };
	}
}
