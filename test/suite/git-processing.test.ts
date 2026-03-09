import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test, { suite } from "node:test";
import { processChunk } from "../../src/git/stream-parsing.js";
import { Logger } from "../../src/logger.js";

function load(fileName: string, buffer: true): Buffer;
function load(fileName: string, buffer: false): string;
function load(fileName: string, buffer: boolean): string | Buffer {
	return readFileSync(resolve(import.meta.dirname, "../fixture", fileName), {
		encoding: buffer ? null : "utf-8",
	});
}

suite("Chunk Processing", (): void => {
	Logger.createInstance();
	test("Process normal chunk", async (t): Promise<void> => {
		const chunk = load("git-stream-blame-incremental.chunks", true);

		const foundChunks: unknown[] = [];
		for await (const line of processChunk(chunk, "<@@>", {})) {
			foundChunks.push(line);
		}

		t.assert.snapshot(foundChunks);
	});
});

suite("Processing Errors", (): void => {
	Logger.createInstance();
	test("Git chunk not starting with commit information", async (t): Promise<void> => {
		const chunks = JSON.parse(
			load("git-stream-blame-incremental-multi-chunk.json", false),
		) as string[];

		const foundChunks: unknown[] = [];
		const registry = {};
		for (const chunk of chunks) {
			for await (const line of processChunk(
				Buffer.from(chunk),
				"<@@>",
				registry,
			)) {
				foundChunks.push(line);
			}
		}

		t.assert.snapshot(foundChunks);
	});
});
