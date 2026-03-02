import { Commit, type RawCoverage } from "./Commit.js";
import { Line } from "./Line.js";
import { LineAttachedCommit } from "./LineAttachedCommit.js";

export type CommitRegistry = Map<string, Commit>;

export class FileAttachedCommit {
	public static Create(
		registry: Map<string, Commit>,
		hash: string,
		coverage: RawCoverage,
	): FileAttachedCommit {
		let commit = registry.get(hash);
		if (!commit) {
			commit = new Commit(hash);
			registry.set(hash, commit);
		}
		return new FileAttachedCommit(commit, coverage);
	}
	public filename = "";
	#lines: Lines;
	#hasFilename = false;
	private constructor(
		public commit: Commit,
		coverage: RawCoverage,
	) {
		this.#lines = new Lines(coverage);
	}

	public setByKey(
		key: string,
		value: string,
		currentUserEmail: string | undefined,
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
	public source: number;
	public result: number;
	public length: number;
	constructor(coverage: RawCoverage) {
		[this.source, this.result, this.length] = coverage.split(" ").map(Number);
	}
}
