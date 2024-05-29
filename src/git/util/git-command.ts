import { type ChildProcess, spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { dirname, join } from "node:path";

import { extensions } from "vscode";

import type { GitExtension } from "../../../types/git.js";
import { execute } from "../../util/execute.js";
import { getActiveTextEditor } from "../../util/get-active.js";
import { Logger } from "../../util/logger.js";
import { getProperty } from "../../util/property.js";
import { split } from "../../util/split.js";
import { validEditor } from "../../util/valid-editor.js";

export const getGitCommand = (): string => {
	const vscodeGit = extensions.getExtension<GitExtension>("vscode.git");

	if (vscodeGit?.exports.enabled) {
		return vscodeGit.exports.getAPI(1).git.path;
	}

	return "git";
};

const runGit = (cwd: string, ...args: string[]): Promise<string> =>
	execute(getGitCommand(), args, {
		cwd: dirname(cwd),
		env: { ...process.env, LC_ALL: "C" },
	});

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
	runGit(fileName, "rev-parse", "--absolute-git-dir");

export const blameProcess = (
	realpathFileName: string,
	revsFile: string | undefined,
): ChildProcess => {
	const args = ["blame", "-C", "--incremental", "--", realpathFileName];

	if (getProperty("ignoreWhitespace")) {
		args.splice(1, 0, "-w");
	}

	if (revsFile) {
		args.splice(1, 0, "-S", revsFile);
	}

	Logger.info(`${getGitCommand()} ${args.join(" ")}`);

	return spawn(getGitCommand(), args, {
		cwd: dirname(realpathFileName),
		stdio: ["ignore", "pipe", "pipe"],
		env: {
			...process.env,
			LC_ALL: "C",
		},
	});
};

export const getRevsFile = async (
	realFileName: string,
): Promise<string | undefined> => {
	const possibleRevsFiles = getProperty("revsFile");
	if (possibleRevsFiles.length === 0) {
		return undefined;
	}

	const gitRoot = await getGitFolder(realFileName);
	const projectRoot = dirname(gitRoot);
	const revsFiles = await Promise.allSettled(
		possibleRevsFiles
			.map((fileName) => join(projectRoot, fileName))
			.map((path) => access(path).then(() => path)),
	);

	return revsFiles.filter(
		(promise): promise is PromiseFulfilledResult<string> =>
			promise.status === "fulfilled",
	)[0]?.value;
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
