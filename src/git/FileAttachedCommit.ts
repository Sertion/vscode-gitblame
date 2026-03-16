import { Commit, type RawCoverage } from "./Commit.js";
import { Line } from "./Line.js";
import { LineAttachedCommit } from "./LineAttachedCommit.js";

export type CommitRegistry = Record<string, Commit>;

export class FileAttachedCommit {
	public static Create(
		registry: CommitRegistry,
		hash: string,
		coverage: RawCoverage,
	): FileAttachedCommit {
		registry[hash] ??= new Commit(hash);
		return new FileAttachedCommit(registry[hash], new Lines(coverage));
	}
	public filename = "";
	public commit: Commit;
	readonly #lines: Lines;
	#hasFilename = false;
	private constructor(commit: Commit, lines: Lines) {
		this.commit = commit;
		this.#lines = lines;
	}

	public setByKey(
		key: string,
		value: string,
		currentUserEmail?: `<${string}>` | undefined,
	): boolean {
		if (key === "filename") {
			this.filename = value;
			this.#hasFilename = true;
			return true;
		}

		return this.commit.setByKey(key, value, currentUserEmail);
	}

	public *toLineAttachedCommits(): Generator<LineAttachedCommit> {
		if (!this.#hasFilename) return;

		for (let i = 0; i < this.#lines.length; i++) {
			yield new LineAttachedCommit(
				this,
				new Line(this.#lines.source + i, this.#lines.result + i),
			);
		}
	}
}

class Lines {
	public readonly source: number;
	public readonly result: number;
	public readonly length: number;
	constructor(coverage: RawCoverage) {
		const parts = coverage.split(" ");
		this.source = Number.parseInt(parts[0], 10);
		this.result = Number.parseInt(parts[1], 10);
		this.length = Number.parseInt(parts[2], 10);
	}
}
