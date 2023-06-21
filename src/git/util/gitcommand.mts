import { ChildProcess, spawn } from "node:child_process";
import { dirname } from "node:path";

import { extensions } from "vscode";

import { validEditor } from "../../util/editorvalidator.mjs";
import { getProperty } from "../../util/property.mjs";
import { Logger } from "../../util/logger.mjs";
import { execute } from "../../util/execcommand.mjs";
import { GitExtension } from "../../../types/git";
import { getActiveTextEditor } from "../../util/get-active.mjs";
import { split } from "../../util/split.mjs";

export const getGitCommand = (): string => {
	const vscodeGit = extensions.getExtension<GitExtension>("vscode.git");

	if (vscodeGit?.exports.enabled) {
		return vscodeGit.exports.getAPI(1).git.path;
	}

	return "git";
};

const runGit = (cwd: string, ...args: string[]): Promise<string> =>
	execute(getGitCommand(), args, { cwd: dirname(cwd) });

export const getActiveFileOrigin = async (
	remoteName: string,
): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	return runGit(
		activeEditor.document.fileName,
		"ls-remote",
		"--get-url",
		remoteName,
	);
};

export const getRemoteUrl = async (fallbackRemote: string): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	const { fileName } = activeEditor.document;
	const currentBranch = await runGit(
		fileName,
		"symbolic-ref",
		"-q",
		"--short",
		"HEAD",
	);
	const curRemote = await runGit(
		fileName,
		"config",
		`branch.${currentBranch}.remote`,
	);
	return runGit(
		fileName,
		"config",
		`remote.${curRemote || fallbackRemote}.url`,
	);
};

export const getGitFolder = async (fileName: string): Promise<string> =>
	runGit(fileName, "rev-parse", "--git-dir");

export const isGitTracked = async (fileName: string): Promise<boolean> =>
	!!(await getGitFolder(fileName));

export const blameProcess = (realpathFileName: string): ChildProcess => {
	const args = ["blame", "-C", "--incremental", "--", realpathFileName];

	if (getProperty("ignoreWhitespace")) {
		args.splice(1, 0, "-w");
	}

	Logger.info(`${getGitCommand()} ${args.join(" ")}`);

	return spawn(getGitCommand(), args, {
		cwd: dirname(realpathFileName),
	});
};

export const getRelativePathOfActiveFile = async (): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	const { fileName } = activeEditor.document;
	return runGit(fileName, "ls-files", "--full-name", "--", fileName);
};

export const getDefaultBranch = async (remote: string): Promise<string> => {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	const rawRemoteDefaultBranch = await runGit(
		activeEditor.document.fileName,
		"rev-parse",
		"--abbrev-ref",
		`${remote}/HEAD`,
	);

	return split(rawRemoteDefaultBranch, "/")[1];
};
