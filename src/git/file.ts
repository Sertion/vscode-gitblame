import { ChildProcess } from "node:child_process";
import { realpath } from "node:fs/promises";
import { relative } from "node:path";

import {
	LineAttatchedCommit,
	processStderr,
	processStdout,
} from "./util/stream-parsing.js";
import { Logger } from "../util/logger.js";
import { blameProcess } from "./util/gitcommand.js";

export type Blame = Map<number, LineAttatchedCommit | undefined>;

export class File {
	private store?: Promise<Blame | undefined>;
	private process?: ChildProcess;
	private killed = false;

	public constructor(private readonly fileName: string) {}

	public getBlame(): Promise<Blame | undefined> {
		this.store ??= this.blame();

		return this.store;
	}

	public dispose(): void {
		this.process?.kill();
		this.killed = true;
	}

	private async *run(
		realFileName: string,
	): AsyncGenerator<LineAttatchedCommit> {
		this.process = blameProcess(realFileName);

		yield* processStdout(this.process?.stdout);
		await processStderr(this.process?.stderr);
	}

	private async blame(): Promise<Blame | undefined> {
		const blameInfo: Blame = new Map();
		const realpathFileName = await realpath(this.fileName);

		try {
			for await (const lineAttatchedCommit of this.run(realpathFileName)) {
				blameInfo.set(lineAttatchedCommit.line.result, lineAttatchedCommit);
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
