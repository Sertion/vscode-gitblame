import { window } from "vscode";

import type { PartialTextEditor } from "./valid-editor.js";

export const getActiveTextEditor = (): PartialTextEditor | undefined =>
	window.activeTextEditor;

export const NO_FILE_OR_PLACE = "N:-1";

export const getFilePosition = ({
	document,
	selection,
}: PartialTextEditor): string =>
	document.uri.scheme === "file"
		? `${document.fileName}:${selection.active.line}`
		: NO_FILE_OR_PLACE;
