import { GitRepositoryWatcher } from "./GitRepositoryWatcher.js";

export type HeadChangeEvent = {
	gitRoot: string;
	repositoryRoot: string;
};

export class GitWatch extends GitRepositoryWatcher {
	private readonly foundPaths: Set<string> = new Set();

	public constructor() {
		super(
			{
				gitPath: "objects",
				isDirectory: true,
			},
			{
				gitPath: "HEAD",
				isDirectory: false,
			},
		);
	}

	public async addFile(
		filePath: string,
		gitRepositoryPath: string,
	): Promise<void> {
		if (this.foundPaths.has(filePath)) {
			return;
		}

		this.foundPaths.add(filePath);
		this.addRepository(gitRepositoryPath);
	}

	public dispose(): void {
		super.dispose();
		this.foundPaths.clear();
	}
}
