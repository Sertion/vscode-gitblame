import { scheduler } from "node:timers/promises";

import { Logger } from "../logger.js";
import { split, splitBuffer } from "../string-stuff/split.js";
import { Commit } from "./Commit.js";
import type { CommitAuthor } from "./CommitAuthor.js";
import { FileAttachedCommit } from "./FileAttachedCommit.js";
import { isHash } from "./is-hash.js";
import { Line, LineAttachedCommit } from "./LineAttachedCommit.js";

export type CommitRegistry = Map<string, Commit>;

const MAX_CHUNK_TIME = 5;
let lastChunkTime = 0;

async function* splitChunk(chunk: Buffer): AsyncGenerator<[string, string]> {
	lastChunkTime = performance.now();
	let lastIndex = 0;
	while (lastIndex < chunk.length) {
		const now = performance.now();
		const timeSpent = now - lastChunkTime;
		if (timeSpent > MAX_CHUNK_TIME) {
			Logger.debug(
				`Running blame has taken more than ${MAX_CHUNK_TIME} ms (${
					timeSpent
				} ms). Yielding and continuing later.`,
			);
			await scheduler.yield();
			lastChunkTime = now;
		}

		const nextIndex = chunk.indexOf("\n", lastIndex);

		yield splitBuffer(chunk, lastIndex, nextIndex);

		lastIndex = nextIndex + 1;
	}
}

const fillOwner = (
	owner: CommitAuthor,
	dataPoint: string,
	value: string,
	currentUserEmail: string | undefined,
): void => {
	if (dataPoint === "time") {
		owner.timestamp = value;
		owner.date.setTime(Number.parseInt(value, 10) * 1000);
	} else if (dataPoint === "tz") {
		owner.tz = value;
	} else if (dataPoint === "mail") {
		owner.mail = value;
		owner.isCurrentUser = currentUserEmail === value;
	} else if (dataPoint === "") {
		owner.name = value;
	}
};

const processAuthorLine = (
	key: string,
	value: string,
	commitInfo: Commit,
	currentUserEmail: string | undefined,
): void => {
	const [author, dataPoint] = split(key, "-");

	if (author === "author" || author === "committer") {
		fillOwner(commitInfo[author], dataPoint, value, currentUserEmail);
	}
};

const isCoverageLine = (hash: string, coverage: string): boolean =>
	isHash(hash) && /^\d+ \d+ \d+$/.test(coverage);

const processLine = (
	key: string,
	value: string,
	commitInfo: Commit,
	currentUserEmail: string | undefined,
): void => {
	if (key === "summary") {
		commitInfo.summary = value;
	} else if (isHash(key)) {
		commitInfo.hash = key;
	} else if (key.startsWith("author") || key.startsWith("committer")) {
		processAuthorLine(key, value, commitInfo, currentUserEmail);
	}
};

function* processCoverage(coverage: string): Generator<Line> {
	const [source, result, lines] = coverage.split(" ").map(Number);

	for (let i = 0; i < lines; i++) {
		yield new Line(source + i, result + i);
	}
}

function* commitFilter(
	fileAttached: FileAttachedCommit | undefined,
	lines: Generator<Line> | undefined,
	registry: CommitRegistry,
): Generator<LineAttachedCommit> {
	if (fileAttached === undefined || lines === undefined) {
		return;
	}

	registry.set(fileAttached.commit.hash, fileAttached.commit);

	for (const line of lines) {
		yield new LineAttachedCommit(fileAttached, line);
	}
}

/**
 * Here we process incremental git blame output. Two things are important to understand:
 *   - Commit info blocks always start with hash/line-info and end with filename
 *   - What it contains can change with future git versions
 *
 * @see https://github.com/git/git/blob/9d530dc/Documentation/git-blame.txt#L198
 *
 * @param dataChunk Chunk of `--incremental` git blame output
 * @param commitRegistry Keeping track of previously encountered commit information
 */
export async function* processChunk(
	dataChunk: Buffer,
	currentUserEmail: string | undefined,
	commitRegistry: CommitRegistry,
): AsyncGenerator<LineAttachedCommit, void> {
	let commitLocation: FileAttachedCommit | undefined;
	let coverageGenerator: Generator<Line> | undefined;

	for await (const [key, value] of splitChunk(dataChunk)) {
		if (isCoverageLine(key, value)) {
			commitLocation = new FileAttachedCommit(
				commitRegistry.get(key) ?? new Commit(key),
			);
			coverageGenerator = processCoverage(value);
		}

		if (!commitLocation) {
			continue;
		}

		if (key === "filename") {
			commitLocation.filename = value;
			yield* commitFilter(commitLocation, coverageGenerator, commitRegistry);
		} else {
			processLine(key, value, commitLocation.commit, currentUserEmail);
		}
	}

	yield* commitFilter(commitLocation, coverageGenerator, commitRegistry);
}
