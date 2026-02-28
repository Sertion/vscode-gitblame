import type { Commit } from "./Commit.js";

export class FileAttachedCommit<T extends Date | string = Date> {
	public filename = "";
	constructor(public commit: Commit<T>) {}
}
