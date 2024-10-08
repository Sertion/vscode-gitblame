import * as assert from "node:assert";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
	type Commit,
	type CommitAuthor,
	type CommitRegistry,
	type LineAttachedCommit,
	processChunk,
} from "../../src/git/util/stream-parsing.js";

type CommitAuthorStringDate = Omit<CommitAuthor, "date"> & {
	date: string;
};
type CommitWithAuthorStringDate = Omit<Commit, "author" | "committer"> & {
	author: CommitAuthorStringDate;
	committer: CommitAuthorStringDate;
};

function load(fileName: string, buffer: true): Buffer;
function load(fileName: string, buffer: false): string;
function load(fileName: string, buffer: boolean): string | Buffer {
	return readFileSync(
		resolve(__dirname, "..", "..", "..", "test", "fixture", fileName),
		{
			encoding: buffer ? null : "utf-8",
		},
	);
}
function datesToString(
	convert: LineAttachedCommit[],
): LineAttachedCommit<CommitWithAuthorStringDate>[] {
	const converted: LineAttachedCommit<CommitWithAuthorStringDate>[] = [];
	for (const element of convert) {
		converted.push({
			...element,
			commit: {
				...element.commit,
				author: {
					...element.commit.author,
					date: element.commit.author.date.toJSON(),
				},
				committer: {
					...element.commit.committer,
					date: element.commit.committer.date.toJSON(),
				},
			},
		});
	}
	return converted;
}

suite("Chunk Processing", (): void => {
	test("Process normal chunk", async (): Promise<void> => {
		const chunk = load("git-stream-blame-incremental.chunks", true);
		const result = JSON.parse(
			load("git-stream-blame-incremental-result.json", false),
		) as string[];

		const registry: CommitRegistry = new Map();
		const foundChunks: LineAttachedCommit[] = [];
		for await (const line of processChunk(
			chunk,
			"not-a-real@email",
			registry,
		)) {
			foundChunks.push(line);
		}

		assert.strictEqual(
			JSON.stringify(datesToString(foundChunks)),
			JSON.stringify(result),
		);
	});
});

suite("Processing Errors", (): void => {
	test("Git chunk not starting with commit information", async (): Promise<void> => {
		const chunks = JSON.parse(
			load("git-stream-blame-incremental-multi-chunk.json", false),
		) as string[];
		const result = JSON.parse(
			load("git-stream-blame-incremental-multi-chunk-result.json", false),
		) as string[];

		const registry: CommitRegistry = new Map();

		const foundChunks: LineAttachedCommit[] = [];
		for (const chunk of chunks) {
			for await (const line of processChunk(
				Buffer.from(chunk, "utf-8"),
				"not-a-real@email",
				registry,
			)) {
				foundChunks.push(line);
			}
		}

		assert.strictEqual(
			JSON.stringify(datesToString(foundChunks)),
			JSON.stringify(result),
		);
	});
});
