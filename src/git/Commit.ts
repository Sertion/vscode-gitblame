import { CommitAuthor } from "./CommitAuthor.js";

export class Commit<T extends Date | string = Date> {
	public author = new CommitAuthor<T>();
	public committer = new CommitAuthor<T>();
	public summary = "";

	constructor(public hash: string) {}
}
