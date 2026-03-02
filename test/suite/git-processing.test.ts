import * as assert from "node:assert";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { LineAttachedCommit } from "../../src/git/LineAttachedCommit.js";
import { processChunk } from "../../src/git/stream-parsing.js";

function load(fileName: string, buffer: true): Buffer;
function load(fileName: string, buffer: false): string;
function load(fileName: string, buffer: boolean): string | Buffer {
	return readFileSync(resolve(__dirname, "../../../test/fixture", fileName), {
		encoding: buffer ? null : "utf-8",
	});
}
function datesToString(convert: LineAttachedCommit): unknown {
	return {
		...convert,
		commit: {
			...convert.commit,
			author: {
				...convert.commit.author,
				date: convert.commit.author.date.toJSON(),
			},
			committer: {
				...convert.commit.committer,
				date: convert.commit.committer.date.toJSON(),
			},
		},
	};
}

suite("Chunk Processing", (): void => {
	test("Process normal chunk", async (): Promise<void> => {
		const chunk = load("git-stream-blame-incremental.chunks", true);
		const result = JSON.parse(
			load("git-stream-blame-incremental-result.json", false),
		);

		const foundChunks: unknown[] = [];
		for await (const line of processChunk(chunk, "@@", new Map())) {
			foundChunks.push(datesToString(line));
		}

		assert.deepEqual(foundChunks, result);
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

		const foundChunks: unknown[] = [];
		const registry = new Map();
		for (const chunk of chunks) {
			for await (const line of processChunk(
				Buffer.from(chunk),
				"@@",
				registry,
			)) {
				foundChunks.push(datesToString(line));
			}
		}

		for (let index = 0; index < foundChunks.length; index++) {
			assert.deepEqual(
				foundChunks[index],
				result[index],
				`Element at index ${index} do not match`,
			);
		}
	});
});
