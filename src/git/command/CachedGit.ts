import { dirname } from "node:path";
import { Logger } from "../../logger.js";
import { GitRepositoryWatcher } from "../GitRepositoryWatcher.js";
import { execute } from "./execute.js";
import { getGitCommand } from "./git-command.js";

class CachedGitCommand {
	private gitConfigWatch = new GitRepositoryWatcher("config");
	private commands = new Map<string, Promise<string | undefined>>();
	private folderToGitRepository = new Map<
		string,
		Promise<string | undefined>
	>();

	constructor() {
		this.gitConfigWatch.onChange(() => {
			this.commands.clear();
			this.folderToGitRepository.clear();
		});
	}

	public async getRepositoryFolder(
		fileName: string,
	): Promise<string | undefined> {
		const directory = dirname(fileName);
		const previousGitRepositoryFolder =
			this.folderToGitRepository.get(directory);
		if (previousGitRepositoryFolder !== undefined) {
			return previousGitRepositoryFolder;
		}

		try {
			const gitFolder = execute(
				getGitCommand(),
				["rev-parse", "--absolute-git-dir"],
				{ cwd: directory },
			).catch(() => undefined);
			this.folderToGitRepository.set(directory, gitFolder);
			const folder = await gitFolder;
			if (folder) {
				this.gitConfigWatch.addRepository(folder);
			}
			return gitFolder;
		} catch {
			Logger.info(`Failed to find git folder for "${fileName}". Not blaming.`);
			return undefined;
		}
	}

	public async run(
		path: string,
		...args: string[]
	): Promise<string | undefined> {
		const command = getGitCommand();
		const cwd = dirname(path);
		const key = `${command}@${args.join("@")}@${cwd}`;
		const cached = this.commands.get(key);
		if (cached !== undefined) {
			Logger.debug(
				`Using cached result for command "${command} ${args.join(" ")}"`,
			);
			return cached;
		}

		const result = execute(command, args, {
			cwd,
			env: { ...process.env, LC_ALL: "C" },
		}).catch(() => undefined);

		this.commands.set(key, result);

		return result;
	}

	public clear(): void {
		this.commands.clear();
		this.folderToGitRepository.clear();
	}
}

export const git = new CachedGitCommand();
