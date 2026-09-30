import { Disposable, window, workspace } from "vscode";
import { Blamer } from "./blame.js";
import { getActiveTextEditor } from "./get-active.js";
import type { LineAttachedCommit } from "./git/LineAttachedCommit.js";
import { Logger } from "./logger.js";
import { PropertyStore } from "./PropertyStore.js";
import {
	type Document,
	type PartialTextEditor,
	validEditor,
} from "./valid-editor.js";
import { View } from "./view.js";

export class Extension {
	public readonly blame = new Blamer();
	public readonly view = new View();

	private waitingForLine?: (reason?: LineAttachedCommit | undefined) => void;
	private readonly disposable = this.setupListeners();

	public async updateView(
		editor?: PartialTextEditor | undefined,
		useDelay = true,
	): Promise<void> {
		this.waitingForLine?.();
		if (!this.view.preUpdate(editor)) {
			return;
		}

		if (editor.document.lineCount > PropertyStore.get("maxLineCount")) {
			this.view.fileTooLong();
			return;
		}

		const { promise, resolve } = Promise.withResolvers<
			LineAttachedCommit | undefined
		>();
		this.waitingForLine = resolve;
		void this.blame
			.getLine(editor.document.fileName, editor.selection.active.line)
			.then(resolve);

		const line = await promise;
		if (line) {
			await this.view.set(line?.commit, editor, useDelay);
		}
	}

	public async commit(
		showActivity: boolean,
	): Promise<LineAttachedCommit | undefined> {
		const editor = getActiveTextEditor();

		if (!validEditor(editor)) {
			Logger.info(
				"Unable to blame current line. Active view is not a file on disk.",
			);
			return;
		}

		if (editor.document.lineCount > PropertyStore.get("maxLineCount")) {
			this.view.fileTooLong();
			Logger.info("Git Blame is disabled for the current file");
			return;
		}

		if (showActivity) {
			this.view.activity();
		}

		const fileName = editor.document.fileName;
		const lineNumber = editor.selection.active.line;

		const line = await this.blame.getLine(fileName, lineNumber);

		if (!line) {
			Logger.info(
				`Unable to blame "${fileName}:${lineNumber}". Failed to fetch blame information for it.`,
			);
		}

		return line;
	}

	public dispose(): void {
		this.blame.dispose();
		this.view.dispose();
		this.disposable.dispose();
	}

	private setupListeners(): Disposable {
		return Disposable.from(
			window.onDidChangeActiveTextEditor((ev) => void this.updateView(ev)),
			window.onDidChangeTextEditorSelection(
				(ev) => void this.updateView(ev?.textEditor),
			),
			workspace.onDidSaveTextDocument((document) => {
				const textEditor = getActiveTextEditor();
				if (textEditor?.document === document) {
					void this.updateView(textEditor, false);
				}
			}),
			workspace.onDidChangeTextDocument((ev) => {
				const textEditor = getActiveTextEditor();
				if (textEditor?.document === ev.document) {
					void this.updateView(textEditor, false);
				}
			}),
			workspace.onDidCloseTextDocument((document: Document): void =>
				this.blame.remove(document.fileName),
			),
		);
	}
}
