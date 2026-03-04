import { getActiveTextEditor } from "../../get-active.js";
import { validEditor } from "../../valid-editor.js";
import { git } from "./CachedGit.js";

export async function getActiveFileOrigin(
	remoteName: string,
): Promise<string | undefined> {
	const activeEditor = getActiveTextEditor();

	if (!validEditor(activeEditor)) {
		return "";
	}

	return git.run(
		activeEditor.document.fileName,
		"ls-remote",
		"--get-url",
		remoteName,
	);
}
