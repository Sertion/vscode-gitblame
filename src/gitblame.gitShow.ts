import { dirname } from "node:path";
import { ThemeIcon, window } from "vscode";
import type { Extension } from "./extension.js";
import { getActiveTextEditor } from "./get-active.js";
import { Commit } from "./git/Commit.js";
import { errorMessage } from "./message.js";
import { PropertyStore } from "./PropertyStore.js";
import { validEditor } from "./valid-editor.js";

export async function gitShow(extension: Pick<Extension, "commit"> | undefined): Promise<void> {
	const editor = getActiveTextEditor();

	if (!validEditor(editor)) {
		return;
	}

	const currentLine = await extension?.commit(false);
	if (currentLine === undefined) {
		void errorMessage("Unable to get commit for current file/line.");
		return;
	}
	const { hash } = currentLine.commit;

	// Only ever allow things we know git could give as output
	if (hash !== "HEAD" && !Commit.IsHash(hash)) {
		return;
	}

	const ignoreWhitespace = PropertyStore.get("ignoreWhitespace") ? "-w " : "";
	const terminal = window.createTerminal({
		name: `Git Blame: git show ${hash}`,
		iconPath: new ThemeIcon("git-commit"),
		isTransient: true,
		cwd: dirname(editor.document.fileName),
	});
	terminal.sendText(`git show ${ignoreWhitespace}${hash}; exit 0`, true);
	terminal.show();
}
