import { dirname } from "node:path";
import {
	commands,
	Disposable,
	env,
	type MessageItem,
	type TextDocument,
	type TextEditor,
	ThemeIcon,
	window,
	workspace,
} from "vscode";
import { Blamer } from "./blame.js";
import {
	getActiveTextEditor,
	getFilePosition,
	NO_FILE_OR_PLACE,
} from "./get-active.js";
import { getToolUrl } from "./git/get-tool-url.js";
import { HeadWatch } from "./git/head-watch.js";
import { isHash, isUncommitted } from "./git/is-hash.js";
import type { LineAttachedCommit } from "./git/stream-parsing.js";
import { errorMessage, infoMessage } from "./message.js";
import { getProperty } from "./property.js";
import {
	normalizeCommitInfoTokens,
	parseTokens,
} from "./string-stuff/text-decorator.js";
import {
	type Document,
	type PartialTextEditor,
	validEditor,
} from "./valid-editor.js";
import { StatusBarView } from "./view.js";

type ActionableMessageItem = MessageItem & {
	action: () => void;
};

export class Extension {
	private readonly disposable: Disposable;
	private readonly blame: Blamer;
	private readonly view: StatusBarView;
	private readonly headWatcher: HeadWatch;

	constructor() {
		this.blame = new Blamer();
		this.view = new StatusBarView();
		this.headWatcher = new HeadWatch();

		this.disposable = this.setupListeners();
	}

	public async blameLink(): Promise<void> {
		const lineAware = await this.commit(true);
		if (lineAware === undefined) {
			await errorMessage("No commit to copy link from");
			return;
		}
		const toolUrl = await getToolUrl(lineAware);

		if (toolUrl) {
			await commands.executeCommand("vscode.open", toolUrl);
		} else {
			await errorMessage("Empty gitblame.commitUrl");
		}
	}

	public async showMessage(): Promise<void> {
		const lineAware = await this.commit(false);

		if (!lineAware || isUncommitted(lineAware.commit)) {
			this.view.clear();
			await errorMessage("No commit to show");
			return;
		}

		const message = parseTokens(
			getProperty("infoMessageFormat"),
			normalizeCommitInfoTokens(lineAware.commit),
		);
		const toolUrl = await getToolUrl(lineAware);
		const actions: ActionableMessageItem[] = [];

		if (toolUrl) {
			actions.push({
				title: "Online",
				action() {
					commands.executeCommand("vscode.open", toolUrl);
				},
			});
		}

		actions.push({
			title: "Terminal",
			action: () => this.runGitShow(),
		});

		this.view.set(lineAware.commit, getActiveTextEditor());

		(await infoMessage(message, actions))?.action();
	}

	public async copyHash(): Promise<void> {
		const lineAware = await this.commit(true);

		if (lineAware && !isUncommitted(lineAware.commit)) {
			await env.clipboard.writeText(lineAware.commit.hash);
			await infoMessage("Copied hash");
		} else {
			await errorMessage("No commit to copy hash from");
		}
	}

	public async copyToolUrl(): Promise<void> {
		const lineAware = await this.commit(true);
		if (lineAware === undefined) {
			await errorMessage("No commit to copy link from");
			return;
		}
		const toolUrl = await getToolUrl(lineAware);

		if (toolUrl) {
			await env.clipboard.writeText(toolUrl.toString());
			await infoMessage("Copied tool URL");
		} else {
			await errorMessage("gitblame.commitUrl config empty");
		}
	}

	public async runGitShow(): Promise<void> {
		const editor = getActiveTextEditor();

		if (!validEditor(editor)) {
			return;
		}

		const currentLine = await this.commit(true);
		if (currentLine === undefined) {
			return;
		}
		const { hash } = currentLine.commit;

		// Only ever allow HEAD or a git hash
		if (hash !== "HEAD" && !isHash(hash)) {
			return;
		}

		const ignoreWhitespace = getProperty("ignoreWhitespace") ? "-w " : "";
		const terminal = window.createTerminal({
			name: `Git Blame: git show ${hash}`,
			iconPath: new ThemeIcon("git-commit"),
			isTransient: true,
			cwd: dirname(editor.document.fileName),
		});
		terminal.sendText(`git show ${ignoreWhitespace}${hash}; exit 0`, true);
		terminal.show();
	}

	public async updateView(
		editor = getActiveTextEditor(),
		useDelay = true,
	): Promise<void> {
		if (!this.view.preUpdate(editor)) {
			return;
		}

		if (this.isFileMaxLineCount(editor.document)) {
			return;
		}

		const before = getFilePosition(editor);
		const line = await this.getLine(editor);

		const textEditorAfter = getActiveTextEditor();
		if (!validEditor(textEditorAfter)) {
			return;
		}
		const after = getFilePosition(textEditorAfter);

		// Only update if we haven't moved since we started blaming
		// or if we no longer have focus on any file
		if (before === after || after === NO_FILE_OR_PLACE) {
			this.view.set(line?.commit, textEditorAfter, useDelay);
		}
	}

	public dispose(): void {
		this.view.dispose();
		this.disposable.dispose();
		this.blame.dispose();
		this.headWatcher.dispose();
	}

	private setupListeners(): Disposable {
		const changeTextEditorSelection = (textEditor: TextEditor): void => {
			const { scheme } = textEditor.document.uri;
			if (scheme === "file" || scheme === "untitled") {
				this.updateView(textEditor);
			}
		};

		this.headWatcher.onChange(({ repositoryRoot }) =>
			this.blame.removeFromRepository(repositoryRoot),
		);

		return Disposable.from(
			window.onDidChangeActiveTextEditor((textEditor): void => {
				if (validEditor(textEditor)) {
					this.view.activity();
					this.blame.prepareFile(textEditor.document.fileName);
					changeTextEditorSelection(textEditor);
				} else {
					this.view.clear();
				}
			}),
			window.onDidChangeTextEditorSelection(({ textEditor }) => {
				changeTextEditorSelection(textEditor);
			}),
			workspace.onDidSaveTextDocument((document: TextDocument): void => {
				if (getActiveTextEditor()?.document === document) {
					this.updateView();
				}
			}),
			workspace.onDidCloseTextDocument((document: Document): void => {
				this.blame.remove(document.fileName);
			}),
			workspace.onDidChangeTextDocument(({ document }) => {
				const textEditor = getActiveTextEditor();
				if (textEditor?.document === document) {
					this.updateView(textEditor, false);
				}
			}),
		);
	}

	private async commit(
		hideActivity: boolean,
	): Promise<LineAttachedCommit | undefined> {
		const editor = getActiveTextEditor();

		if (!validEditor(editor)) {
			void errorMessage(
				"Unable to blame current line. Active view is not a file on disk.",
			);
			return;
		}

		if (this.isFileMaxLineCount(editor.document)) {
			void errorMessage("Git Blame is disabled for the current file");
			return;
		}

		if (!hideActivity) {
			this.view.activity();
		}

		const line = await this.getLine(editor);

		if (!line) {
			void errorMessage(
				"Unable to blame current line. Unable to get blame information for line.",
			);
		}

		return line;
	}

	private isFileMaxLineCount(document: Document): boolean {
		if (document.lineCount > getProperty("maxLineCount")) {
			this.view.fileTooLong();
			return true;
		}
		return false;
	}

	private async getLine(
		editor: PartialTextEditor,
	): Promise<LineAttachedCommit | undefined> {
		this.headWatcher.addFile(editor.document.fileName);
		return await this.blame.getLine(
			editor.document.fileName,
			editor.selection.active.line,
		);
	}
}
