import type { Commit } from "./Commit.js";
import type { FileAttachedCommit } from "./FileAttachedCommit.js";
import type { Line } from "./Line.js";

export class LineAttachedCommit {
	public readonly commit: Commit;
	public readonly filename: string;
	public readonly line: Line;
	constructor({ commit, filename }: FileAttachedCommit, line: Line) {
		this.commit = commit;
		this.filename = filename;
		this.line = line;
	}
}
