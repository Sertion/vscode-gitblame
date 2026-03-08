import type { window } from "vscode";
import type { PartialTextEditor } from "./valid-editor.js";
import { getvscode } from "./vscode-quarantine.js";

let vscodeWindow: typeof window | undefined;
export function setvscodeForActiveTextEditor(): void {
	getvscode().then((e) => {
		if (e) {
			vscodeWindow = e.window;
		}
	});
}

export function getActiveTextEditor(): PartialTextEditor | undefined {
	return vscodeWindow?.activeTextEditor;
}

export const NO_FILE_OR_PLACE = "N:-1";

export const getFilePosition = ({
	document,
	selection,
}: PartialTextEditor): string =>
	document.uri.scheme === "file"
		? `${document.fileName}:${selection.active.line}`
		: NO_FILE_OR_PLACE;
