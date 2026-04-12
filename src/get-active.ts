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
