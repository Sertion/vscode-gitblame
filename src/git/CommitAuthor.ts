export type CommitAuthorLike = {
	name: string;
	mail: string;
	isCurrentUser: boolean;
	timestamp: string;
	date: Date;
	tz: string;
};

export class CommitAuthor {
	public name = "";
	public mail = "";
	public isCurrentUser = false;
	public timestamp = "";
	public date = new Date();
	public tz = "";

	public setByKey(
		key: string,
		value: string,
		currentUserEmail: string | undefined,
	): void {
		if (key.endsWith("time")) {
			this.timestamp = value;
			this.date.setTime(Number.parseInt(value, 10) * 1000);
		} else if (key.endsWith("tz")) {
			this.tz = value;
		} else if (key.endsWith("mail")) {
			this.mail = value;
			this.isCurrentUser = currentUserEmail === value;
		} else if (key === "author" || key === "committer") {
			this.name = value;
		}
	}
}
