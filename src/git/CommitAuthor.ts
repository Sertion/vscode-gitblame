export class CommitAuthor<T extends Date | string = Date> {
	public name = "";
	public mail = "";
	public isCurrentUser = false;
	public timestamp = "";
	public date: T | Date = new Date();
	public tz = "";
}
