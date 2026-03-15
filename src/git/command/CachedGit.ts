import { dirname } from "node:path";
import { Logger } from "../../logger.js";
import { GitRepositoryWatcher } from "../GitRepositoryWatcher.js";
import type { execute as executeType } from "./execute.js";
import { getGitCommand } from "./git-command.js";

class CachedGitCommand {
	private readonly gitConfigWatch = new GitRepositoryWatcher("config");
	private readonly commands = new Map<string, Promise<string | undefined>>();
	private readonly folderToGitRepository = new Map<
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
			await this.folderToGitRepository.get(directory);
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
			Logger.trace(
				`File "${fileName}" belong in a git repository: "${folder}"`,
			);
			return folder;
		} catch {
			Logger.info(`Failed to find git folder for "${fileName}". Not blaming.`);
			return undefined;
		}
	}

	public async run(
		path: string,
		...args: string[]
	): Promise<string | undefined> {
		const cwd = dirname(path);
		const key = `${args.join("@")}@${cwd}`;
		const cached = await this.commands.get(key);
		if (cached) {
			Logger.debug(`Using cached result for command "<git> ${args.join(" ")}"`);
			return cached;
		}

		const result = Promise.resolve(
			execute(getGitCommand(), args, {
				cwd,
				env: { ...process.env, LC_ALL: "C" },
			}),
		).catch(() => undefined);

		this.commands.set(key, result);

		return result;
	}

	public clear(): void {
		this.commands.clear();
		this.folderToGitRepository.clear();
	}
}

let execute: typeof executeType;
export async function setupCachedGit(): Promise<void> {
	execute = (await import("./execute.js")).execute;
}

export const git = new CachedGitCommand();
