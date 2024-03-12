import { type FSWatcher, promises, watch } from "node:fs";

import type { LineAttatchedCommit } from "./util/stream-parsing.js";

import { type Disposable, workspace } from "vscode";
import { Logger } from "../util/logger.js";
import { getProperty } from "../util/property.js";
import { type Blame, File } from "./file.js";
import { Queue } from "./queue.js";
import { getGitFolder } from "./util/gitcommand.js";

type Files =
	| undefined
	| {
			file: File | undefined;
			store: Promise<Blame | undefined>;
			gitRoot: string;
	  };

export class Blamer {
	private readonly files = new Map<string, Promise<Files>>();
	private readonly fsWatchers = new Map<string, FSWatcher>();
	private readonly blameQueue = new Queue<Blame | undefined>(
		getProperty("parallelBlames"),
	);
	private readonly configChange: Disposable;

	public constructor() {
		this.configChange = workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("gitblame")) {
				this.blameQueue.updateParalell(getProperty("parallelBlames"));
			}
		});
	}

	public async file(fileName: string): Promise<Blame | undefined> {
		return this.get(fileName);
	}

	public async getLine(
		fileName: string,
		lineNumber: number,
	): Promise<LineAttatchedCommit | undefined> {
		const commitLineNumber = lineNumber + 1;
		const blameInfo = await this.get(fileName);

		return blameInfo?.get(commitLineNumber);
	}

	public async removeFromRepository(gitRepositoryPath: string): Promise<void> {
		for (const [fileName, file] of this.files) {
			const gitRoot = (await file)?.gitRoot;
			if (gitRoot === gitRepositoryPath) {
				this.remove(fileName);
			}
		}
	}

	public async remove(fileName: string): Promise<void> {
		(await (await this.files.get(fileName))?.file)?.dispose();
		this.fsWatchers.get(fileName)?.close();
		this.files.delete(fileName);
		const fsWatcher = this.fsWatchers.get(fileName);
		if (fsWatcher) {
			this.fsWatchers.delete(fileName);
			fsWatcher.close();
		}
	}

	public dispose(): void {
		for (const fileName of this.files.keys()) {
			this.remove(fileName);
		}
		this.configChange.dispose();
	}

	private async get(fileName: string): Promise<Blame | undefined> {
		if (this.files.has(fileName)) {
			return (await this.files.get(fileName))?.store;
		}

		const setup = this.create(fileName).then(({ file, gitRoot }): Files => {
			if (file) {
				this.fsWatchers.set(
					fileName,
					watch(fileName, () => {
						this.remove(fileName);
					}),
				);
				return {
					file,
					store: this.blameQueue.add(() => file.getBlame()),
					gitRoot,
				};
			}

			return {
				file,
				store: Promise.resolve(undefined),
				gitRoot,
			};
		});

		this.files.set(fileName, setup);

		return (await setup)?.store;
	}

	private async create(
		fileName: string,
	): Promise<{ gitRoot: string; file: File | undefined }> {
		try {
			await promises.access(fileName);

			const gitRoot = getGitFolder(fileName);
			if (await gitRoot) {
				return {
					gitRoot: await gitRoot,
					file: new File(fileName),
				};
			}
		} catch {
			// NOOP
		}

		Logger.info(`Will not blame '${fileName}'. Outside the current workspace.`);

		return {
			gitRoot: "",
			file: undefined,
		};
	}
}
