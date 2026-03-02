import type { Commit } from "./Commit.js";
import type { FileAttachedCommit } from "./FileAttachedCommit.js";
import type { Line } from "./Line.js";

export class LineAttachedCommit {
	public commit: Commit;
	public filename: string;
	constructor(
		fileAttachedcommit: FileAttachedCommit,
		public line: Line,
	) {
		this.commit = fileAttachedcommit.commit;
		this.filename = fileAttachedcommit.filename;
	}
}
