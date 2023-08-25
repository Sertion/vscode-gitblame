import {
	Disposable,
	Position,
	Range,
	StatusBarAlignment,
	StatusBarItem,
	TextEditorDecorationType,
	ThemeColor,
	window,
	workspace,
} from "vscode";

import type { Commit } from "./git/util/stream-parsing.js";

import { isUncomitted } from "./git/util/uncommitted.js";
import { PartialTextEditor } from "./util/editorvalidator.js";
import { getActiveTextEditor } from "./util/get-active.js";
import { getProperty } from "./util/property.js";
import { toInlineTextView, toStatusBarTextView } from "./util/textdecorator.js";

export class StatusBarView {
	private readonly statusBar: StatusBarItem;
	private readonly decorationType: TextEditorDecorationType;
	private readonly configChange: Disposable;

	constructor() {
		this.decorationType = window.createTextEditorDecorationType({});

		this.statusBar = this.createStatusBarItem();
		this.configChange = workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("gitblame")) {
				this.createStatusBarItem();
			}
		});
	}

	public set(
		commit: Commit | undefined,
		editor: PartialTextEditor | undefined,
	): void {
		if (!commit) {
			this.clear();
		} else if (isUncomitted(commit)) {
			this.text(getProperty("statusBarMessageNoCommit"), false);
			if (editor) {
				this.createLineDecoration(getProperty("inlineMessageNoCommit"), editor);
			}
		} else {
			this.text(toStatusBarTextView(commit), true);
			if (editor) {
				this.createLineDecoration(toInlineTextView(commit), editor);
			}
		}
	}

	public clear(): void {
		this.text("", false);
		this.removeLineDecoration();
	}

	public activity(): void {
		this.text("$(sync~spin) Waiting for git blame response", false);
	}

	public dispose(): void {
		this.statusBar?.dispose();
		this.decorationType.dispose();
		this.configChange.dispose();
	}

	private command(): string {
		const action = getProperty("statusBarMessageClickAction");

		if (action === "Open tool URL") {
			return "gitblame.online";
		} else if (action === "Open git show") {
			return "gitblame.gitShow";
		}

		return "gitblame.quickInfo";
	}

	private text(text: string, command: boolean): void {
		this.statusBar.text = `$(git-commit) ${text.trimEnd()}`;
		this.statusBar.tooltip = `git blame${
			command ? "" : " - No info about the current line"
		}`;
		this.statusBar.command = command ? this.command() : undefined;
	}

	private createStatusBarItem(): StatusBarItem {
		if (this.statusBar) {
			this.statusBar.dispose();
		}

		const statusBar = window.createStatusBarItem(
			StatusBarAlignment.Right,
			getProperty("statusBarPositionPriority"),
		);

		statusBar.show();

		return statusBar;
	}

	private createLineDecoration(text: string, editor: PartialTextEditor): void {
		if (!getProperty("inlineMessageEnabled")) {
			return;
		}
		const margin = getProperty("inlineMessageMargin");
		const decorationPosition = new Position(
			editor.selection.active.line,
			Number.MAX_SAFE_INTEGER,
		);

		this.removeLineDecoration();
		// Add new decoration
		editor.setDecorations?.(this.decorationType, [
			{
				renderOptions: {
					after: {
						contentText: text,
						margin: `0 0 0 ${margin}rem`,
						color: new ThemeColor("editorCodeLens.foreground"),
					},
				},
				range: new Range(decorationPosition, decorationPosition),
			},
		]);
	}

	private removeLineDecoration(): void {
		const editor = getActiveTextEditor();
		editor?.setDecorations?.(this.decorationType, []);
	}
}
