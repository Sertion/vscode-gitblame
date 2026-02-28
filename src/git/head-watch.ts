import { GitRepositoryWatcher } from "./GitRepositoryWatcher.js";

export type HeadChangeEvent = {
	gitRoot: string;
	repositoryRoot: string;
};

export class HeadWatch extends GitRepositoryWatcher {
	private readonly filesWithFoundHeads: Set<string> = new Set();

	public constructor() {
		super("HEAD");
	}

	public async addFile(
		filePath: string,
		gitRepositoryPath: string,
	): Promise<void> {
		if (this.filesWithFoundHeads.has(filePath)) {
			return;
		}

		this.filesWithFoundHeads.add(filePath);
		this.addRepository(gitRepositoryPath);
	}

	public dispose(): void {
		super.dispose();
		this.filesWithFoundHeads.clear();
	}
}
