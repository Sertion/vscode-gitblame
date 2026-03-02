import { splitChunk } from "../string-stuff/split.js";
import { Commit } from "./Commit.js";
import {
	type CommitRegistry,
	FileAttachedCommit,
} from "./FileAttachedCommit.js";
import type { LineAttachedCommit } from "./LineAttachedCommit.js";

/**
 * Here we process incremental git blame output. Two things are important to understand:
 *   - Commit info blocks always start with hash/line-info and end with filename
 *   - What it contains can change with future git versions
 *
 * @see https://github.com/git/git/blob/9d530dc/Documentation/git-blame.txt#L198
 *
 * @param dataChunk Chunk of `--incremental` git blame output
 * @param registry Keeping track of previously encountered commit information
 */
export async function* processChunk(
	dataChunk: Buffer,
	currentUserEmail: string | undefined,
	registry: CommitRegistry,
): AsyncGenerator<LineAttachedCommit> {
	let current: FileAttachedCommit | undefined;

	for await (const [key, value] of splitChunk(dataChunk)) {
		if (Commit.IsHash(key) && Commit.IsCoverage(value)) {
			current = FileAttachedCommit.Create(registry, key, value);
		}

		if (!current?.setByKey(key, value, currentUserEmail)) {
			continue;
		}

		yield* current.toLineAttachedCommits();
	}
}
