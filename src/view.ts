import {
	type Disposable,
	MarkdownString,
	Position,
	Range,
	StatusBarAlignment,
	type StatusBarItem,
	ThemeColor,
	window,
	workspace,
} from "vscode";
import { isUncommitted } from "./git/util/is-hash.js";
import type { Commit } from "./git/util/stream-parsing.js";
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
	private readonly decorationType = window.createTextEditorDecorationType({});
	private readonly configChange: Disposable;
	private readonly ongoingViewUpdateRejects: Set<() => void> = new Set();

	private statusBarText = "";
	private statusBarTooltip: MarkdownString = new MarkdownString();
	private statusBarCommand = false;
	private statusBarPriority: number | undefined = getProperty(
		"statusBarPositionPriority",
	);

	constructor() {
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
			this.updateTextNoCommand(
				getProperty("statusBarMessageNoCommit"),
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
			this.text(commit);
			if (editor) {
				void this.createLineDecoration(commit, editor, useDelay);
			}
		}
	}

	public clear(): void {
		this.updateTextNoCommand("", MESSAGE_NO_INFO);
		this.removeLineDecoration();
	}

	public activity(): void {
		this.updateTextNoCommand(
			"$(extensions-refresh)",
			"Waiting for git blame response",
		);
	}

	public fileTooLong(): void {
		const maxLineCount = getProperty("maxLineCount");
		this.updateTextNoCommand(
			"",
			`No blame information is available. File has more than ${maxLineCount} lines`,
		);
	}

	public dispose(): void {
		this.statusBar.dispose();
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
			statusBar.tooltip.value,
			statusBar.command ?? "",
		);
	}

	private text(commit: Commit): void {
		this.statusBarCommand = true;
		this.statusBarText = `$(git-commit) ${toStatusBarTextView(commit)}`;
		this.statusBarTooltip = this.generateFancyTooltip(commit, "status");

		this.updateStatusBar(this.statusBar);
	}

	private updateTextNoCommand(text: string, tooltip: string): void {
		this.statusBarCommand = false;
		this.statusBarTooltip = new MarkdownString();
		this.statusBarText = `$(git-commit) ${text.trimEnd()}`;
		this.statusBarTooltip.appendText(`git blame - ${tooltip}`);

		this.updateStatusBar(this.statusBar);
	}

	private generateFancyTooltip(
		commit: Commit,
		from: "inline" | "status",
	): MarkdownString {
		const fancyToolTip = new MarkdownString();

		if (!getProperty("extendedHoverInformation")?.includes(from)) {
			fancyToolTip.appendText("git blame");
			return fancyToolTip;
		}

		fancyToolTip.isTrusted = true;
		fancyToolTip.supportHtml = true;
		fancyToolTip.appendMarkdown("__git blame__<br>");
		fancyToolTip.appendMarkdown(
			`__Summary:__ ${commit.summary.replaceAll("<", "&lt;")}<br>`,
		);

		// sv-SE is close enough to ISO8601
		fancyToolTip.appendMarkdown(
			`__Time:__ ${new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "medium" }).format(commit.author.date)}<br>`,
		);

		const currentUserAlias = getProperty("currentUserAlias");

		if (currentUserAlias && commit.author.isCurrentUser) {
			fancyToolTip.appendMarkdown(`__Author:__ ${currentUserAlias}<br>`);
		} else {
			fancyToolTip.appendMarkdown(`__Author:__ ${commit.author.name}<br>`);
		}

		if (commit.author.name !== commit.committer.name) {
			fancyToolTip.appendMarkdown(
				`__Committer:__ ${commit.committer.name}<br>`,
			);
		}

		return fancyToolTip;
	}

	private createStatusBarItem(): StatusBarItem {
		this.statusBar?.dispose();

		const statusBar = window.createStatusBarItem(
			StatusBarAlignment.Right,
			this.statusBarPriority,
		);
		statusBar.name = "Git blame information";

		this.updateStatusBar(statusBar);

		statusBar.show();

		return statusBar;
	}

	private async createLineDecoration(
		text: string | Commit,
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
			const hoverMessage =
				typeof text === "string"
					? undefined
					: this.generateFancyTooltip(text, "inline");

			editor.setDecorations?.(this.decorationType, [
				{
					hoverMessage,
					renderOptions: {
						after: {
							contentText:
								typeof text === "string" ? text : toInlineTextView(text),
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
					setTimeout(() => {
						this.ongoingViewUpdateRejects.delete(reject);
						resolve(true);
					}, delay);
				});
			} catch {
				return false;
			}
		}

		return true;
	}
}
