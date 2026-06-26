import { realpath } from "node:fs/promises";
import { getActiveTextEditor } from "../../get-active.js";
import { validEditor } from "../../valid-editor.js";
import { git } from "./CachedGit.js";

export async function getGeneralGitInfo(fallbackRemote: string): Promise<
	| {
			remoteUrl: string;
			currentBranch: string;
			defaultBranch: string;
			currentHash: string;
			relativePathOfActiveFile: string;
			fileOrigin: string;
	  }
	| undefined
> {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return undefined;
	}

	const { fileName } = activeEditor.document;
	// Resolve symlinks before handing the path to git. Opening a workspace through
	// a symlink makes git reject the symlink path as "outside repository" (exit 128),
	// which silently breaks URL generation. Blame already does this (see blamed-file.ts).
	const realFileName = await realpath(fileName).catch(() => fileName);
	const relativePathOfActiveFile = git.run(
		realFileName,
		"ls-files",
		"--full-name",
		"--",
		realFileName,
	);
	const currentHash = git.run(realFileName, "rev-parse", "HEAD");
	const currentBranch = git.run(
		realFileName,
		"symbolic-ref",
		"-q",
		"--short",
		"HEAD",
	);
	const currentRemote = currentBranch
		.then((c) => git.run(realFileName, "config", `branch.${c}.remote`))
		.then(
			(c) => c || fallbackRemote,
			() => fallbackRemote,
		);

	return {
		remoteUrl: await currentRemote
			.then((c) => git.run(realFileName, "config", `remote.${c}.url`))
			.catch(() => ""),
		defaultBranch: await currentBranch.then((c) =>
			git
				.run(realFileName, "rev-parse", "--abbrev-ref", `${c}/HEAD`)
				.catch(() => "UNABLE-TO-FIND-DEFAULT-BRANCH"),
		),
		currentBranch: await currentBranch,
		currentHash: await currentHash,
		relativePathOfActiveFile: await relativePathOfActiveFile,
		fileOrigin: await currentRemote.then((c) =>
			git.run(realFileName, "ls-remote", "--get-url", c),
		),
	};
}
