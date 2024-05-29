import type { ChildProcess } from "node:child_process";
import { realpath } from "node:fs/promises";
import { relative } from "node:path";

import { Logger } from "../util/logger.js";
import { blameProcess, getRevsFile } from "./util/git-command.js";
import {
	type CommitRegistry,
	type LineAttachedCommit,
	processChunk,
} from "./util/stream-parsing.js";

export type Blame = Map<number, LineAttachedCommit | undefined>;

export class File {
	private store?: Promise<Blame | undefined>;
	private process?: ChildProcess;
	private killed = false;

	public constructor(public readonly fileName: string) {}

	public getBlame(): Promise<Blame | undefined> {
		this.store ??= this.blame();

		return this.store;
	}

	public dispose(): void {
		this.process?.kill();
		this.killed = true;
	}

	private async *run(realFileName: string): AsyncGenerator<LineAttachedCommit> {
		this.process = blameProcess(realFileName, await getRevsFile(realFileName));

		const commitRegistry: CommitRegistry = new Map();
		for await (const chunk of this.process?.stdout ?? []) {
			yield* processChunk(chunk, commitRegistry);
		}
		for await (const error of this.process?.stderr ?? []) {
			if (typeof error === "string") {
				throw new Error(error);
			}
		}
	}

	private async blame(): Promise<Blame | undefined> {
		const blameInfo: Blame = new Map();
		const realpathFileName = await realpath(this.fileName);

		try {
			for await (const lineAttachedCommit of this.run(realpathFileName)) {
				blameInfo.set(lineAttachedCommit.line.result, lineAttachedCommit);
			}
		} catch (err) {
			Logger.error(err);
			this.dispose();
		}

		// Don't return partial git blame info when terminating a blame
		if (!this.killed) {
			if (relative(this.fileName, realpathFileName)) {
				Logger.info(
					`Blamed "${realpathFileName}" (resolved via symlink from "${this.fileName}")`,
				);
			} else {
				Logger.info(`Blamed "${realpathFileName}"`);
			}
			return blameInfo;
		}
	}
}
