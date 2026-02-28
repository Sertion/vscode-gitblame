import { split } from "../string-stuff/split.js";
import { isHash } from "./is-hash.js";

export type CommitAuthor = {
	name: string;
	mail: string;
	isCurrentUser: boolean;
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

type FileAttachedCommit<T = Commit> = {
	commit: T;
	filename: string;
};

type Line = {
	source: number;
	result: number;
};

export type LineAttachedCommit<T = Commit> = FileAttachedCommit<T> & {
	line: Line;
};

export type CommitRegistry = Map<string, Commit>;

const newCommitInfo = (hash: string): Commit => ({
	author: {
		mail: "",
		name: "",
		isCurrentUser: false,
		timestamp: "",
		date: new Date(),
		tz: "",
	},
	committer: {
		mail: "",
		name: "",
		isCurrentUser: false,
		timestamp: "",
		date: new Date(),
		tz: "",
	},
	hash: hash,
	summary: "",
});

const newLocationAttachedCommit = (commitInfo: Commit): FileAttachedCommit => ({
	commit: commitInfo,
	filename: "",
});

const WAIT_N_LINES = 10;

async function* splitChunk(chunk: Buffer): AsyncGenerator<[string, string]> {
	let lastIndex = 0;
	let lineCount = 1;
	while (lastIndex < chunk.length) {
		const nextIndex = chunk.indexOf("\n", lastIndex);

		yield split(chunk.toString("utf8", lastIndex, nextIndex));

		// This is an attempt to mitigate main thread hogging.
		if (lineCount % WAIT_N_LINES === 0) {
			await new Promise<void>((resolve) => setImmediate(resolve));
		}

		lineCount += 1;
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
		owner.date = new Date(Number.parseInt(value, 10) * 1000);
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
		yield {
			source: source + i,
			result: result + i,
		};
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
		yield {
			...fileAttached,
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
	currentUserEmail: string | undefined,
	commitRegistry: CommitRegistry,
): AsyncGenerator<LineAttachedCommit, void> {
	let commitLocation: FileAttachedCommit | undefined;
	let coverageGenerator: Generator<Line> | undefined;

	for await (const [key, value] of splitChunk(dataChunk)) {
		if (isCoverageLine(key, value)) {
			commitLocation = newLocationAttachedCommit(
				commitRegistry.get(key) ?? newCommitInfo(key),
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
