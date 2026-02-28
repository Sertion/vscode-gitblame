import * as assert from "node:assert";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { LineAttachedCommit } from "../../src/git/LineAttachedCommit.js";
import {
	type CommitRegistry,
	processChunk,
} from "../../src/git/stream-parsing.js";

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
): LineAttachedCommit<string>[] {
	const converted: LineAttachedCommit<string>[] = [];
	for (const element of convert) {
		converted.push({
			...element,
			commit: {
				...element.commit,
				author: {
					...element.commit.author,
					date: JSON.stringify(element.commit.author.date),
				},
				committer: {
					...element.commit.committer,
					date: JSON.stringify(element.commit.committer.date),
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
