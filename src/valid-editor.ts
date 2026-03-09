import type {
	Position as FullPosition,
	TextDocument,
	TextEditor,
} from "vscode";

export type Document = Pick<
	TextDocument,
	"uri" | "isUntitled" | "fileName" | "lineCount"
>;
export type PartialTextEditor = {
	readonly document: Document;
	selection: {
		active: Pick<FullPosition, "line">;
	};

	setDecorations?: TextEditor["setDecorations"];
};

export const validEditor = (
	editor?: PartialTextEditor,
): editor is PartialTextEditor => editor?.document.uri.scheme === "file";
