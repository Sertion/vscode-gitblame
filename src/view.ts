import {
	MarkdownString,
	Range,
	StatusBarAlignment,
	type StatusBarItem,
	ThemeColor,
	window,
	workspace,
} from "vscode";
import { getActiveTextEditor } from "./get-active.js";
import type { Commit } from "./git/Commit.js";
import { PropertyStore } from "./PropertyStore.js";
import {
	toInlineTextView,
	toStatusBarTextView,
} from "./string-stuff/text-decorator.js";
import { type PartialTextEditor, validEditor } from "./valid-editor.js";

const MESSAGE_NO_INFO = "No info about the current line";

export class View {
	private readonly ongoingViewUpdateRejects: Set<() => void> = new Set();
	private readonly statusBarTooltip = new MarkdownString();
	private readonly inlineTooltip = new MarkdownString();
	private readonly toolTipMarkdownCache = new WeakMap<Commit, string>();
	private readonly decorationType = window.createTextEditorDecorationType({});

	private statusBar = this.createStatusBarItem(
		PropertyStore.get("statusBarPositionPriority"),
	);
	private readonly configChange = workspace.onDidChangeConfiguration((e) => {
		if (e.affectsConfiguration("gitblame.statusBarPositionPriority")) {
			const newPriority = PropertyStore.get("statusBarPositionPriority");
			if (this.statusBar.priority !== newPriority) {
				const oldText = this.statusBar.text;
				this.statusBar = this.createStatusBarItem(newPriority);
				this.statusBar.command = this.getCommand();
				this.statusBar.text = oldText;
			}
		}
		if (e.affectsConfiguration("gitblame.statusBarMessageClickAction")) {
			this.statusBar.command = this.getCommand();
		}
	});

	public constructor() {
		this.updateStatusBar("", false);
		this.statusBarTooltip.supportThemeIcons = true;
		this.statusBarTooltip.supportHtml = true;
		this.inlineTooltip.supportThemeIcons = true;
		this.inlineTooltip.supportHtml = true;
	}

	public async set(
		commit: Commit | undefined,
		editor?: PartialTextEditor,
		useDelay = true,
	): Promise<void> {
		if (!commit) {
			this.clear();
			return;
		}

		if (commit.isCommitted()) {
			this.updateTooltipCommit(this.statusBarTooltip, commit, "status");
			this.setStatusBar(commit);
			this.updateTooltipCommit(this.inlineTooltip, commit, "inline");
			await this.setInline(commit, useDelay, editor);
			return;
		}

		this.updateTextNoCommand(
			this.statusBarTooltip,
			PropertyStore.get("statusBarMessageNoCommit"),
		);
		this.updateTextNoCommand(
			this.inlineTooltip,
			PropertyStore.get("statusBarMessageNoCommit"),
		);
		await this.setInline(
			PropertyStore.get("inlineMessageNoCommit"),
			useDelay,
			editor,
		);
	}

	public clear(): void {
		this.updateTextNoCommand(this.statusBarTooltip, "");
		this.updateTextNoCommand(this.inlineTooltip, "");
		this.removeLineDecoration();
	}

	public activity(): void {
		this.updateTextNoCommand(
			this.statusBarTooltip,
			"$(extensions-refresh)",
			"Waiting for git blame response",
		);
		this.updateTextNoCommand(
			this.inlineTooltip,
			"$(extensions-refresh)",
			"Waiting for git blame response",
		);
	}

	public fileTooLong(): void {
		this.updateTextNoCommand(
			this.statusBarTooltip,
			"",
			`No blame information is available. File has more than ${PropertyStore.get("maxLineCount")} lines`,
		);
		this.updateTextNoCommand(
			this.inlineTooltip,
			"",
			`No blame information is available. File has more than ${PropertyStore.get("maxLineCount")} lines`,
		);
	}

	public dispose(): void {
		this.statusBar.dispose();
		this.decorationType.dispose();
		this.configChange.dispose();
	}

	private getCommand(): string {
		return {
			"Open tool URL": "gitblame.online",
			"Open git show": "gitblame.gitShow",
			"Copy hash to clipboard": "gitblame.addCommitHashToClipboard",
			"Show info message": "gitblame.quickInfo",
		}[PropertyStore.get("statusBarMessageClickAction")];
	}

	private updateStatusBar(newText: string, hasCommand: boolean) {
		this.statusBar.text = newText ? `$(git-commit) ${newText}` : "";
		this.statusBar.command = hasCommand ? this.getCommand() : undefined;
	}

	private setStatusBar(commit: Commit): void {
		this.updateStatusBar(toStatusBarTextView(commit), true);
	}

	private updateTextNoCommand(
		markdownString: MarkdownString,
		text: string,
		tooltip = MESSAGE_NO_INFO,
	): void {
		markdownString.value = "";
		markdownString.appendMarkdown("git blame<br><small>");
		markdownString.appendText(tooltip);
		markdownString.appendMarkdown("</small>");
		this.updateStatusBar(text.trimEnd(), false);
	}

	private updateTooltipCommit(
		markdownString: MarkdownString,
		commit: Commit,
		from: "inline" | "status",
	): void {
		const extendedHoverInformation = PropertyStore.get(
			"extendedHoverInformation",
		).includes(from);
		markdownString.value = "";

		const previousToolTip = this.toolTipMarkdownCache.get(commit);
		if (previousToolTip) {
			markdownString.appendMarkdown(previousToolTip);
			if (from === "status") {
				// This line should not be in the cache
				this.appendClickActionLine(markdownString);
			}
			return;
		}

		if (!extendedHoverInformation) {
			markdownString.appendText("git blame");
			if (from === "status") {
				this.appendClickActionLine(markdownString);
			}
			return;
		}

		markdownString.appendMarkdown("__git blame__");
		this.addInfoLine(markdownString, "Summary", commit.summary);
		this.addInfoLine(markdownString, "Hash", commit.hash.substring(0, 8));

		// sv-SE is close enough to ISO8601
		this.addInfoLine(
			markdownString,
			"Time",
			new Intl.DateTimeFormat("sv-SE", {
				dateStyle: "short",
				timeStyle: "medium",
			}).format(commit.author.date),
		);

		const currentUserAlias = PropertyStore.get("currentUserAlias");

		this.addInfoLine(
			markdownString,
			"Author",
			currentUserAlias && commit.author.isCurrentUser
				? currentUserAlias
				: commit.author.name,
		);

		if (commit.author.name !== commit.committer.name) {
			this.addInfoLine(markdownString, "Committer", commit.committer.name);
		}

		this.toolTipMarkdownCache.set(commit, markdownString.value);

		if (from === "status") {
			// This line should not be in the cache
			this.appendClickActionLine(markdownString);
		}
	}

	private createStatusBarItem(priority: number): StatusBarItem {
		this.statusBar?.dispose();

		const statusBar = window.createStatusBarItem(
			StatusBarAlignment.Right,
			priority,
		);
		statusBar.name = "Git blame information";
		statusBar.tooltip = this.statusBarTooltip;
		statusBar.show();

		return statusBar;
	}

	private async setInline(
		text: string | Commit,
		useDelay: boolean,
		editor?: PartialTextEditor,
	): Promise<void> {
		if (!editor || !PropertyStore.get("inlineMessageEnabled")) {
			return;
		}

		if (useDelay) {
			this.removeLineDecoration();
			if (!(await this.delayUpdate(PropertyStore.get("delayBlame")))) {
				return;
			}
		}

		const isString = typeof text === "string";

		editor.setDecorations?.(this.decorationType, [
			{
				hoverMessage: isString ? undefined : this.inlineTooltip,
				renderOptions: {
					after: {
						contentText: isString ? text : toInlineTextView(text),
						margin: `0 0 0 ${PropertyStore.get("inlineMessageMargin")}rem`,
						color: new ThemeColor("gitblame.inlineMessage"),
					},
				},
				range: new Range(
					editor.selection.active.line,
					Number.MAX_SAFE_INTEGER,
					editor.selection.active.line,
					Number.MAX_SAFE_INTEGER,
				),
			},
		]);
	}

	private removeLineDecoration(): void {
		getActiveTextEditor()?.setDecorations?.(this.decorationType, []);
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
		if (delay === 0) {
			return true;
		}
		const { promise, resolve, reject } = Promise.withResolvers<boolean>();
		setTimeout(resolve, delay, true);

		try {
			this.ongoingViewUpdateRejects.add(reject);
			await promise;
		} catch {
			return false;
		} finally {
			this.ongoingViewUpdateRejects.delete(reject);
		}

		return true;
	}

	private addInfoLine(
		toolTip: MarkdownString,
		title: string,
		content: string | number,
	): void {
		toolTip.appendMarkdown("<br>");
		toolTip.appendMarkdown(`__${title}:__ `);
		toolTip.appendText(content.toString());
	}

	private appendClickActionLine(toolTip: MarkdownString): void {
		toolTip.appendMarkdown("<br><small>$(cursor) ");
		toolTip.appendText(PropertyStore.get("statusBarMessageClickAction"));
		toolTip.appendMarkdown("</small>");
	}
}
