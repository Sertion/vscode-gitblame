import { CommitAuthor, type CommitAuthorLike } from "./CommitAuthor.js";

export type RawCoverage = `${number} ${number} ${number}`;

const COVERAGE_REGEX = /^\d+ \d+ \d+$/;

export type CommitLike = {
	hash: string;
	author: CommitAuthorLike;
	committer: CommitAuthorLike;
	summary: string;
};

export class Commit {
	public static IsHash(hash: string): boolean {
		const length = hash.length;
		return (length === 40 || length === 64) && /^[a-z0-9]+$/.test(hash);
	}

	public static IsCoverage(coverage: string): coverage is RawCoverage {
		return COVERAGE_REGEX.test(coverage);
	}

	public author = new CommitAuthor();
	public committer = new CommitAuthor();
	public summary = "";
	#isUncommitted = true;

	constructor(public hash: string) {
		this.hash = hash;
		this.updateHashStatus(hash);
	}
	public setByKey(
		key: string,
		value: string,
		currentUserEmail: string | undefined,
	): boolean {
		if (key === "summary") {
			this.summary = value;
			return true;
		}
		if (Commit.IsHash(key)) {
			this.hash = key;
			this.updateHashStatus(key);
			return true;
		}
		if (key.startsWith("author")) {
			this.author.setByKey(key, value, currentUserEmail);
			return true;
		}
		if (key.startsWith("committer")) {
			this.committer.setByKey(key, value, currentUserEmail);
			return true;
		}

		return false;
	}

	public isCommitted(): boolean {
		return !this.#isUncommitted;
	}

	private updateHashStatus(hash: string): void {
		const length = hash.length;
		this.#isUncommitted = (length === 40 || length === 64) && /^0+$/.test(hash);
	}
}
