import type { ChildProcess } from "node:child_process";
import { realpath } from "node:fs/promises";
import { relative } from "node:path";
import { blameProcess } from "./git/command/blameProcess.js";
import { getGitEmail } from "./git/command/getGitEmail.js";
import { getRevsFile } from "./git/command/getRevsFile.js";
import {
	type CommitRegistry,
	type LineAttachedCommit,
	processChunk,
} from "./git/stream-parsing.js";
import { Logger } from "./logger.js";

export type Blame = Map<number, LineAttachedCommit | undefined>;

export class BlamedFile {
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

	private async *run(file: string): AsyncGenerator<LineAttachedCommit> {
		const [refs, email] = await Promise.all([
			getRevsFile(file),
			getGitEmail(file),
		]);
		this.process = blameProcess(file, refs);

		Logger.debug(
			"Email address for currentUser for file '%s' is '%s'",
			file,
			email ?? "VALUE_NOT_SET_IN_GIT_CONFIG",
		);

		const commitRegistry: CommitRegistry = new Map();
		for await (const chunk of this.process?.stdout ?? []) {
			Logger.debug(
				"Got chunk from '%s' git blame process. Size: %d",
				file,
				chunk.length,
			);
			yield* processChunk(chunk, email, commitRegistry);
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
				Logger.trace(
					"Found blame information for %s:%d: hash:%s",
					realpathFileName,
					lineAttachedCommit.line.result,
					lineAttachedCommit.commit.hash,
				);
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
