import { window } from "vscode";

import type { PartialTextEditor } from "./editorvalidator.js";

export const getActiveTextEditor = (): PartialTextEditor | undefined =>
	window.activeTextEditor;

export const NO_FILE_OR_PLACE = "N:-1";

export const getFilePosition = ({
	document,
	selection,
}: PartialTextEditor): string =>
	document.uri.scheme !== "file"
		? NO_FILE_OR_PLACE
		: `${document.fileName}:${selection.active.line}`;
