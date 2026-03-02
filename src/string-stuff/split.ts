import { scheduler } from "node:timers/promises";
import { Logger } from "../logger.js";

export function split(target: string, char = " "): [string, string] {
	const index = target.indexOf(char[0]);

	if (index === -1) {
		return [target, ""];
	}

	return [target.slice(0, index), target.slice(index + 1).trim()];
}

function splitBuffer(
	target: Buffer,
	fromIndex: number,
	toIndex: number,
): [string, string] {
	// 32 is space
	const index = target.indexOf(32, fromIndex, "utf8");

	if (index === -1) {
		return [target.toString("utf8", fromIndex, toIndex), ""];
	}

	return [
		target.toString("utf8", fromIndex, index),
		target.toString("utf8", index + 1, toIndex),
	];
}

const MAX_CHUNK_TIME = 5;
let lastChunkTime = 0;

export async function* splitChunk(
	chunk: Buffer,
): AsyncGenerator<[string, string]> {
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

		// 10 is \n
		const nextIndex = chunk.indexOf(10, lastIndex);

		yield splitBuffer(chunk, lastIndex, nextIndex);

		lastIndex = nextIndex + 1;
	}
}
