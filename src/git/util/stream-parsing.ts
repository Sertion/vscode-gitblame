import { split } from "../../util/split.js";
import { isHash } from "./is-hash.js";

export type CommitAuthor = {
	name: string;
	mail: string;
	timestamp: string;
	date: Date;
	tz: string;
};

export type Commit = {
	hash: string;
	author: CommitAuthor;
	committer: CommitAuthor;
	summary: string;
};

export type FileAttatchedCommit<T = Commit> = {
	commit: T;
	filename: string;
};

export type Line = {
	source: number;
	result: number;
};

export type LineAttatchedCommit<T = Commit> = FileAttatchedCommit<T> & {
	line: Line;
};

export type CommitRegistry = Map<string, Commit>;

const newCommitInfo = (hash: string): Commit => ({
	author: {
		mail: "",
		name: "",
		timestamp: "",
		date: new Date(),
		tz: "",
	},
	committer: {
		mail: "",
		name: "",
		timestamp: "",
		date: new Date(),
		tz: "",
	},
	hash: hash,
	summary: "",
});

const newLocationAttatchedCommit = (
	commitInfo: Commit,
): FileAttatchedCommit => ({
	commit: commitInfo,
	filename: "",
});

function untilNextEventLoop(): Promise<void> {
	return new Promise(setImmediate);
}

const takeABreakEveryNthChunk = 25;

async function* splitChunk(chunk: Buffer): AsyncGenerator<[string, string]> {
	let lastIndex = 0;
	while (lastIndex < chunk.length) {
		const nextIndex = chunk.indexOf("\n", lastIndex);

		yield split(chunk.toString("utf8", lastIndex, nextIndex));

		// This is an attempt to mitigate main thread hogging.
		if (nextIndex % takeABreakEveryNthChunk === 0) {
			await untilNextEventLoop();
		}

		lastIndex = nextIndex + 1;
	}
}

const fillOwner = (
	owner: CommitAuthor,
	dataPoint: string,
	value: string,
): void => {
	if (dataPoint === "time") {
		owner.timestamp = value;
		owner.date = new Date(Number.parseInt(value, 10) * 1000);
	} else if (dataPoint === "tz" || dataPoint === "mail") {
		owner[dataPoint] = value;
	} else if (dataPoint === "") {
		owner.name = value;
	}
};

const processAuthorLine = (
	key: string,
	value: string,
	commitInfo: Commit,
): void => {
	const [author, dataPoint] = split(key, "-");

	if (author === "author" || author === "committer") {
		fillOwner(commitInfo[author], dataPoint, value);
	}
};

const isCoverageLine = (hash: string, coverage: string): boolean =>
	isHash(hash) && /^\d+ \d+ \d+$/.test(coverage);

const processLine = (key: string, value: string, commitInfo: Commit): void => {
	if (key === "summary") {
		commitInfo.summary = value;
	} else if (isHash(key)) {
		commitInfo.hash = key;
	} else {
		processAuthorLine(key, value, commitInfo);
	}
};

function* processCoverage(coverage: string): Generator<Line> {
	const [source, result, lines] = coverage.split(" ").map(Number);

	for (let i = 0; i < lines; i++) {
		yield {
			source: source + i,
			result: result + i,
		};
	}
}

function* commitFilter(
	fileAttatched: FileAttatchedCommit | undefined,
	lines: Generator<Line> | undefined,
	registry: CommitRegistry,
): Generator<LineAttatchedCommit> {
	if (fileAttatched === undefined || lines === undefined) {
		return;
	}

	registry.set(fileAttatched.commit.hash, fileAttatched.commit);

	for (const line of lines) {
		yield {
			...fileAttatched,
			line,
		};
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
	commitRegistry: CommitRegistry,
): AsyncGenerator<LineAttatchedCommit, void> {
	let commitLocation: FileAttatchedCommit | undefined;
	let coverageGenerator: Generator<Line> | undefined;

	for await (const [key, value] of splitChunk(dataChunk)) {
		if (isCoverageLine(key, value)) {
			commitLocation = newLocationAttatchedCommit(
				commitRegistry.get(key) ?? newCommitInfo(key),
			);
			coverageGenerator = processCoverage(value);
		}

		if (commitLocation) {
			if (key === "filename") {
				commitLocation.filename = value;
				yield* commitFilter(commitLocation, coverageGenerator, commitRegistry);
			} else {
				processLine(key, value, commitLocation.commit);
			}
		}
	}

	yield* commitFilter(commitLocation, coverageGenerator, commitRegistry);
}

export async function* processStdout(
	data: AsyncIterable<Buffer> | null,
): AsyncGenerator<LineAttatchedCommit, void> {
	const commitRegistry: CommitRegistry = new Map();
	for await (const chunk of data ?? []) {
		yield* processChunk(chunk, commitRegistry);
	}
}

export async function processStderr(
	data: AsyncIterable<string> | null,
): Promise<void> {
	for await (const error of data ?? []) {
		if (typeof error === "string") {
			throw new Error(error);
		}
	}
}
