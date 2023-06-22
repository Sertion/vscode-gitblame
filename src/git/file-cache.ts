import { Commit } from "./util/stream-parsing.js";

export class FileCache {
	private readonly holder: Map<number, Promise<Commit | undefined>> = new Map();
	private readonly resolvers: Map<
		number,
		(commit: Commit | undefined) => void
	> = new Map();
	private readonly rejecters: Map<number, () => void> = new Map();

	private done = false;

	public getLine(line: number): Promise<Commit | undefined> {
		const possibleCommit = this.holder.get(line);
		if (possibleCommit) {
			return possibleCommit;
		} else if (this.done) {
			return Promise.resolve(undefined);
		}

		const futureCommit = new Promise<Commit | undefined>((resolve, reject) => {
			this.resolvers.set(line, resolve);
			this.rejecters.set(line, reject);
		});

		this.holder.set(line, futureCommit);
		return futureCommit;
	}

	public set(line: number, commit: Commit | undefined): void {
		this.rejecters.delete(line);
		const resolve = this.resolvers.get(line);
		if (resolve) {
			resolve(commit);
			this.resolvers.delete(line);
		} else {
			this.holder.set(line, Promise.resolve(commit));
		}
	}

	public setDone(): void {
		this.done = true;
	}

	public dispose(): void {
		for (const reject of this.rejecters.values()) {
			reject();
		}

		this.holder.clear();
		this.resolvers.clear();
		this.rejecters.clear();
	}
}
