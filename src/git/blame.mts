import { FSWatcher, promises, watch } from "node:fs";

import type { LineAttatchedCommit } from "./util/stream-parsing.mjs";

import { Blame, File } from "./file.mjs";
import { Logger } from "../util/logger.mjs";
import { isGitTracked } from "./util/gitcommand.mjs";

export class Blamer {
	private readonly files = new Map<string, Promise<File | undefined>>();
	private readonly fsWatchers = new Map<string, FSWatcher>();

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
		(await this.files.get(fileName))?.dispose();
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
		if (!this.files.has(fileName)) {
			const file = this.create(fileName);
			file.then((createdFile) => {
				if (createdFile) {
					this.fsWatchers.set(
						fileName,
						watch(fileName, () => {
							this.remove(fileName);
						}),
					);
				}
			});
			this.files.set(fileName, file);
		}

		return (await this.files.get(fileName))?.store;
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
