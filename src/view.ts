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
import { getActiveTextEditor } from "./get-active.js";
import type { Commit } from "./git/Commit.js";
import { Logger } from "./logger.js";
import { PropertyStore } from "./PropertyStore.js";
import {
	toInlineTextView,
	toStatusBarTextView,
} from "./string-stuff/text-decorator.js";
import { type PartialTextEditor, validEditor } from "./valid-editor.js";

const MESSAGE_NO_INFO = "No info about the current line";

export class StatusBarView {
	private statusBar: StatusBarItem;
	private readonly decorationType = window.createTextEditorDecorationType({});
	private readonly configChange: Disposable;
	private readonly ongoingViewUpdateRejects: Set<() => void> = new Set();

	private statusBarText = "";
	private statusBarTooltip: MarkdownString = new MarkdownString();
	private statusBarPriority: number | undefined = PropertyStore.get(
		"statusBarPositionPriority",
	);

	private command?: string;
	private lastText?: string;
	private lastToolTip?: MarkdownString;
	private readonly toolTipMarkdownCache = new WeakMap<Commit, MarkdownString>();

	constructor() {
		this.statusBar = this.createStatusBarItem();
		this.configChange = workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("gitblame")) {
				const newPriority = PropertyStore.get("statusBarPositionPriority");
				if (this.statusBarPriority !== newPriority) {
					this.statusBarPriority = newPriority;
					this.statusBar = this.createStatusBarItem();
				}
				this.updateCommand();
			}
		});
	}

	public async set(
		commit: Commit | undefined,
		editor: PartialTextEditor | undefined,
		useDelay = true,
	): Promise<void> {
		if (!commit) {
			this.clear();
			return;
		}

		if (commit.isCommitted()) {
			this.text(commit);
			if (editor) {
				await this.createLineDecoration(commit, editor, useDelay);
			}
			return;
		}

		this.updateTextNoCommand(
			PropertyStore.get("statusBarMessageNoCommit"),
			MESSAGE_NO_INFO,
		);
		if (editor) {
			await this.createLineDecoration(
				PropertyStore.get("inlineMessageNoCommit"),
				editor,
				useDelay,
			);
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
		const maxLineCount = PropertyStore.get("maxLineCount");
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

	private updateCommand() {
		this.command = {
			"Open tool URL": "gitblame.online",
			"Open git show": "gitblame.gitShow",
			"Copy hash to clipboard": "gitblame.addCommitHashToClipboard",
			"Show info message": "gitblame.quickInfo",
		}[PropertyStore.get("statusBarMessageClickAction")];

		if (this.statusBar.command !== undefined) {
			this.statusBar.command = this.command;
		}
	}

	private updateStatusBar(statusBar: StatusBarItem, hasCommand: boolean) {
		if (
			this.lastToolTip === this.statusBarTooltip &&
			this.lastText === this.statusBarText
		) {
			Logger.debug(
				"No need to update status bar as text and tooltip are unchanged.",
			);
			return;
		}
		statusBar.text = this.statusBarText;
		statusBar.tooltip = this.statusBarTooltip;
		statusBar.command = hasCommand ? this.command : undefined;

		this.lastText = this.statusBarText;
		this.lastToolTip = this.statusBarTooltip;
	}

	private text(commit: Commit): void {
		this.statusBarText = `$(git-commit) ${toStatusBarTextView(commit)}`;
		this.statusBarTooltip = this.generateFancyTooltip(commit, "status");

		this.updateStatusBar(this.statusBar, true);
	}

	private updateTextNoCommand(text: string, tooltip: string): void {
		this.statusBarTooltip = new MarkdownString(`git blame - ${tooltip}`);
		this.statusBarText = `$(git-commit) ${text.trimEnd()}`;

		this.updateStatusBar(this.statusBar, false);
	}

	private generateFancyTooltip(
		commit: Commit,
		from: "inline" | "status",
	): MarkdownString {
		const previousToolTip = this.toolTipMarkdownCache.get(commit);
		if (previousToolTip) {
			return previousToolTip;
		}

		const fancyToolTip = new MarkdownString();

		if (!PropertyStore.get("extendedHoverInformation")?.includes(from)) {
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

		const currentUserAlias = PropertyStore.get("currentUserAlias");

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

		this.toolTipMarkdownCache.set(commit, fancyToolTip);

		return fancyToolTip;
	}

	private createStatusBarItem(): StatusBarItem {
		this.statusBar?.dispose();

		const statusBar = window.createStatusBarItem(
			StatusBarAlignment.Right,
			this.statusBarPriority,
		);
		statusBar.name = "Git blame information";

		this.updateStatusBar(statusBar, false);

		statusBar.show();

		return statusBar;
	}

	private async createLineDecoration(
		text: string | Commit,
		editor: PartialTextEditor,
		useDelay: boolean,
	): Promise<void> {
		if (!PropertyStore.get("inlineMessageEnabled")) {
			return;
		}

		this.removeLineDecoration();

		if (useDelay) {
			await this.delayUpdate(PropertyStore.get("delayBlame"));
		}

		// Add new decoration
		const decorationPosition = new Position(
			editor.selection.active.line,
			Number.MAX_SAFE_INTEGER,
		);
		const isString = typeof text === "string";

		editor.setDecorations?.(this.decorationType, [
			{
				hoverMessage: isString
					? undefined
					: this.generateFancyTooltip(text, "inline"),
				renderOptions: {
					after: {
						contentText: isString ? text : toInlineTextView(text),
						margin: `0 0 0 ${PropertyStore.get("inlineMessageMargin")}rem`,
						color: new ThemeColor("gitblame.inlineMessage"),
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
