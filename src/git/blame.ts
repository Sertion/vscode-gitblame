import { FSWatcher, promises, watch } from "node:fs";

import type { LineAttatchedCommit } from "./util/stream-parsing.js";

import { Blame, File } from "./file.js";
import { Logger } from "../util/logger.js";
import { isGitTracked } from "./util/gitcommand.js";
import { Queue } from "./queue.js";

type Files =
	| undefined
	| {
			file: Promise<File | undefined>;
			store: Promise<Blame | undefined>;
	  };

export class Blamer {
	private readonly files = new Map<string, Promise<Files>>();
	private readonly fsWatchers = new Map<string, FSWatcher>();
	private readonly blameQueue = new Queue<Blame | undefined>();

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

	public removeFromRepository(gitRepositoryPath: string): void {
		for (const [fileName] of this.files) {
			if (fileName.startsWith(gitRepositoryPath)) {
				this.remove(fileName);
			}
		}
	}

	public async remove(fileName: string): Promise<void> {
		(await (await this.files.get(fileName))?.file)?.dispose();
		this.fsWatchers.get(fileName)?.close();
		this.files.delete(fileName);
		this.fsWatchers.delete(fileName);
	}

	public dispose(): void {
		for (const [fileName] of this.files) {
			this.remove(fileName);
		}
	}

	private async get(fileName: string): Promise<Blame | undefined> {
		if (this.files.has(fileName)) {
			return (await this.files.get(fileName))?.store;
		}

		const setup = new Promise<Files | undefined>((resolve) => {
			const file = this.create(fileName);
			file.then((createdFile) => {
				if (createdFile) {
					this.fsWatchers.set(
						fileName,
						watch(fileName, () => {
							this.remove(fileName);
						}),
					);
					resolve({
						file,
						store: this.blameQueue.add(() => createdFile.getBlame()),
					});
				} else {
					resolve(undefined);
				}
			});
		});

		this.files.set(fileName, setup);

		return (await setup)?.store;
	}

	private async create(fileName: string): Promise<File | undefined> {
		try {
			await promises.access(fileName);

			if (await isGitTracked(fileName)) {
				return new File(fileName);
			}
		} catch {
			// NOOP
		}

		Logger.info(`Will not blame '${fileName}'. Outside the current workspace.`);
	}
}
