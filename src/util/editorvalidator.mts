import type {
    Position as FullPosition,
    TextDocument,
    TextEditor,
} from "vscode";

export type Document = Pick<TextDocument, "uri" | "isUntitled" | "fileName">;
export type Position = Pick<FullPosition, "line">;
export type PartialSelection = {
    active: Position;
}
export type PartialTextEditor = {
    readonly document: Document;
    selection: PartialSelection;

    setDecorations?: TextEditor["setDecorations"];
}

export const validEditor = (
    editor?: PartialTextEditor,
): editor is PartialTextEditor => editor?.document.uri.scheme === "file";
