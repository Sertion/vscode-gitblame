import { getActiveTextEditor } from "../../get-active.js";
import { split } from "../../string-stuff/split.js";
import { validEditor } from "../../valid-editor.js";
import { git } from "./CachedGit.js";

export async function getDefaultBranch(
	remote: string,
): Promise<string | undefined> {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	const rawRemoteDefaultBranch = await git.run(
		activeEditor.document.fileName,
		"rev-parse",
		"--abbrev-ref",
		`${remote}/HEAD`,
	);

	if (!rawRemoteDefaultBranch) {
		return;
	}

	return split(rawRemoteDefaultBranch, "/")[1];
}
