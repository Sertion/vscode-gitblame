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
	const relativePathOfActiveFile = git.run(
		fileName,
		"ls-files",
		"--full-name",
		"--",
		fileName,
	);
	const currentHash = git.run(fileName, "rev-parse", "HEAD");
	const currentBranch = git.run(
		fileName,
		"symbolic-ref",
		"-q",
		"--short",
		"HEAD",
	);
	const currentRemote = currentBranch.then(
		(c) => git.run(fileName, "config", `branch.${c}.remote`) || fallbackRemote,
	);

	return {
		remoteUrl: await currentRemote.then((c) =>
			git.run(fileName, "config", `remote.${c}.url`),
		),
		defaultBranch: await currentBranch.then((c) =>
			git
				.run(fileName, "rev-parse", "--abbrev-ref", `${c}/HEAD`)
				.catch(() => "UNABLE-TO-FIND-DEFAULT-BRANCH"),
		),
		currentBranch: await currentBranch,
		currentHash: await currentHash,
		relativePathOfActiveFile: await relativePathOfActiveFile,
		fileOrigin: await currentRemote.then((c) =>
			git.run(fileName, "ls-remote", "--get-url", c),
		),
	};
}
