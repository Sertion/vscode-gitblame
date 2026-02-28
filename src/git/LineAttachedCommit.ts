import { FileAttachedCommit } from "./FileAttachedCommit.js";

export class LineAttachedCommit<
	T extends Date | string = Date,
> extends FileAttachedCommit<T> {
	constructor(
		fileAttachedCommit: FileAttachedCommit<T>,
		public line: Line,
	) {
		super(fileAttachedCommit.commit);
		this.filename = fileAttachedCommit.filename;
	}
}

export class Line {
	constructor(
		public source: number,
		public result: number,
	) {}
}
