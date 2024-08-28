import {
	type Disposable,
	Position,
	Range,
	StatusBarAlignment,
	type StatusBarItem,
	type TextEditorDecorationType,
	ThemeColor,
	window,
	workspace,
} from "vscode";

import type { Commit } from "./git/util/stream-parsing.js";

import { isUncommitted } from "./git/util/is-hash.js";
import { getActiveTextEditor } from "./util/get-active.js";
import { Logger } from "./util/logger.js";
import { getProperty } from "./util/property.js";
import {
	toInlineTextView,
	toStatusBarTextView,
} from "./util/text-decorator.js";
import { type PartialTextEditor, validEditor } from "./util/valid-editor.js";

const MESSAGE_NO_INFO = "No info about the current line";

export class StatusBarView {
	private statusBar: StatusBarItem;
	private readonly decorationType: TextEditorDecorationType;
	private readonly configChange: Disposable;
	private readonly ongoingViewUpdateRejects: Set<() => void> = new Set();

	private statusBarText = "";
	private statusBarTooltip = "";
	private statusBarCommand = false;
	private statusBarPriority: number | undefined = undefined;

	constructor() {
		this.decorationType = window.createTextEditorDecorationType({});
		this.statusBarPriority = getProperty("statusBarPositionPriority");

		this.statusBar = this.createStatusBarItem();
		this.configChange = workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("gitblame")) {
				const newPriority = getProperty("statusBarPositionPriority");
				if (this.statusBarPriority !== newPriority) {
					this.statusBarPriority = newPriority;
					this.statusBar = this.createStatusBarItem();
				}
			}
		});
	}

	public set(
		commit: Commit | undefined,
		editor: PartialTextEditor | undefined,
		useDelay = true,
	): void {
		if (!commit) {
			this.clear();
		} else if (isUncommitted(commit)) {
			this.text(
				getProperty("statusBarMessageNoCommit"),
				false,
				MESSAGE_NO_INFO,
			);
			if (editor) {
				void this.createLineDecoration(
					getProperty("inlineMessageNoCommit"),
					editor,
					useDelay,
				);
			}
		} else {
			this.text(toStatusBarTextView(commit), true);
			if (editor) {
				void this.createLineDecoration(
					toInlineTextView(commit),
					editor,
					useDelay,
				);
			}
		}
	}

	public clear(): void {
		this.text("", false, MESSAGE_NO_INFO);
		this.removeLineDecoration();
	}

	public activity(): void {
		this.text("$(extensions-refresh)", false, "Waiting for git blame response");
	}

	public fileToLong(): void {
		const maxLineCount = getProperty("maxLineCount");
		this.text(
			"",
			false,
			`No blame information is available. File has more than ${maxLineCount} lines`,
		);
	}

	public dispose(): void {
		this.statusBar?.dispose();
		this.decorationType.dispose();
		this.configChange.dispose();
	}

	private command(): string {
		return {
			"Open tool URL": "gitblame.online",
			"Open git show": "gitblame.gitShow",
			"Copy hash to clipboard": "gitblame.addCommitHashToClipboard",
			"Show info message": "gitblame.quickInfo",
		}[getProperty("statusBarMessageClickAction")];
	}

	private updateStatusBar(statusBar: StatusBarItem) {
		statusBar.text = this.statusBarText;
		statusBar.tooltip = this.statusBarTooltip;
		statusBar.command = this.statusBarCommand ? this.command() : undefined;

		Logger.debug(
			"Updating status bar item with: Text:'%s', tooltip:'git blame%s', command:%s",
			statusBar.text,
			statusBar.tooltip,
			statusBar.command ?? "",
		);
	}

	private text(text: string, command: boolean, tooltip = ""): void {
		const suffix = command || !tooltip ? "" : ` - ${tooltip}`;
		this.statusBarText = `$(git-commit) ${text.trimEnd()}`;
		this.statusBarTooltip = `git blame${suffix}`;
		this.statusBarCommand = command;

		this.updateStatusBar(this.statusBar);
	}

	private createStatusBarItem(): StatusBarItem {
		this.statusBar?.dispose();

		const statusBar = window.createStatusBarItem(
			StatusBarAlignment.Right,
			this.statusBarPriority,
		);

		this.updateStatusBar(statusBar);

		statusBar.show();

		return statusBar;
	}

	private async createLineDecoration(
		text: string,
		editor: PartialTextEditor,
		useDelay: boolean,
	): Promise<void> {
		if (!getProperty("inlineMessageEnabled")) {
			return;
		}

		this.removeLineDecoration();
		// Add new decoration
		if (useDelay && (await this.delayUpdate(getProperty("delayBlame")))) {
			const margin = getProperty("inlineMessageMargin");
			const decorationPosition = new Position(
				editor.selection.active.line,
				Number.MAX_SAFE_INTEGER,
			);
			editor.setDecorations?.(this.decorationType, [
				{
					renderOptions: {
						after: {
							contentText: text,
							margin: `0 0 0 ${margin}rem`,
							color: new ThemeColor("gitblame.inlineMessage"),
						},
					},
					range: new Range(decorationPosition, decorationPosition),
				},
			]);
		}
	}

	private removeLineDecoration(): void {
		const editor = getActiveTextEditor();
		editor?.setDecorations?.(this.decorationType, []);
	}

	public preUpdate(
		textEditor: PartialTextEditor | undefined,
	): textEditor is PartialTextEditor {
		if (!validEditor(textEditor)) {
			this.clear();
			return false;
		}
		for (const rejects of this.ongoingViewUpdateRejects) {
			rejects();
		}
		this.ongoingViewUpdateRejects.clear();
		this.activity();

		return true;
	}

	private async delayUpdate(delay: number): Promise<boolean> {
		if (delay > 0) {
			try {
				return await new Promise((resolve, reject) => {
					this.ongoingViewUpdateRejects.add(reject);
					setTimeout(() => resolve(true), delay);
				});
			} catch {
				return false;
			}
		}

		return true;
	}
}
