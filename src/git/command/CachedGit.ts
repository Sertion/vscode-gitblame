import { dirname } from "node:path";
import { Logger } from "../../logger.js";
import { GitRepositoryWatcher } from "../GitRepositoryWatcher.js";
import { execute } from "./execute.js";
import { getGitCommand } from "./git-command.js";

class CachedGitCommand {
	private gitConfigWatch = new GitRepositoryWatcher("config");
	private commands = new Map<string, Promise<string>>();
	private folderToGitRepository = new Map<string, Promise<string>>();

	constructor() {
		this.gitConfigWatch.onChange(() => {
			this.commands.clear();
			this.folderToGitRepository.clear();
		});
	}

	public async getRepositoryFolder(fileName: string): Promise<string> {
		const directory = dirname(fileName);
		const previousGitRepositoryFolder =
			this.folderToGitRepository.get(directory);
		if (previousGitRepositoryFolder !== undefined) {
			return previousGitRepositoryFolder;
		}

		const gitFolder = execute(
			getGitCommand(),
			["rev-parse", "--absolute-git-dir"],
			{ cwd: directory },
		);
		this.folderToGitRepository.set(directory, gitFolder);
		this.gitConfigWatch.addRepository(await gitFolder);
		return gitFolder;
	}

	public async run(cwd: string, ...args: string[]): Promise<string> {
		const command = getGitCommand();
		const key = `${command}@${args.join("@")}`;
		const cached = this.commands.get(key);
		if (cached !== undefined) {
			Logger.debug(
				`Using cached result for command "${command} ${args.join(" ")}"`,
			);
			return cached;
		}
		const dir = dirname(cwd);
		const result = execute(command, args, {
			cwd: dir,
			env: { ...process.env, LC_ALL: "C" },
		});

		this.commands.set(key, result);
		await this.getRepositoryFolder(cwd);

		return result;
	}

	public clear(): void {
		this.commands.clear();
		this.folderToGitRepository.clear();
	}
}

export const git = new CachedGitCommand();
