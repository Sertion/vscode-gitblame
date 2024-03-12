import { dirname } from "node:path";
import {
	Disposable,
	type MessageItem,
	type TextEditor,
	ThemeIcon,
	commands,
	env,
	window,
	workspace,
} from "vscode";

import type { LineAttatchedCommit } from "./util/stream-parsing.js";

import { type Document, validEditor } from "../util/editorvalidator.js";
import {
	NO_FILE_OR_PLACE,
	getActiveTextEditor,
	getFilePosition,
} from "../util/get-active.js";
import { errorMessage, infoMessage } from "../util/message.js";
import { getProperty } from "../util/property.js";
import {
	normalizeCommitInfoTokens,
	parseTokens,
} from "../util/textdecorator.js";
import { StatusBarView } from "../view.js";
import { Blamer } from "./blame.js";
import { HeadWatch } from "./head-watch.js";
import { getToolUrl } from "./util/get-tool-url.js";
import { isUncomitted } from "./util/is-hash.js";
import { isHash } from "./util/is-hash.js";

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

		this.updateView();
	}

	public async blameLink(): Promise<void> {
		const toolUrl = await getToolUrl(await this.commit(true));

		if (toolUrl) {
			commands.executeCommand("vscode.open", toolUrl);
		} else {
			errorMessage("Empty gitblame.commitUrl");
		}
	}

	public async showMessage(): Promise<void> {
		const lineAware = await this.commit();

		if (!lineAware || isUncomitted(lineAware.commit)) {
			this.view.clear();
			return;
		}

		const message = parseTokens(
			getProperty("infoMessageFormat"),
			normalizeCommitInfoTokens(lineAware.commit),
		);
		const toolUrl = await getToolUrl(lineAware);
		const action: ActionableMessageItem[] = [];

		if (toolUrl) {
			action.push({
				title: "Online",
				action() {
					commands.executeCommand("vscode.open", toolUrl);
				},
			});
		}

		action.push({
			title: "Terminal",
			action: () => this.runGitShow(),
		});

		this.view.set(lineAware.commit, getActiveTextEditor());

		(await infoMessage(message, action))?.action();
	}

	public async copyHash(): Promise<void> {
		const lineAware = await this.commit(true);

		if (lineAware && !isUncomitted(lineAware.commit)) {
			await env.clipboard.writeText(lineAware.commit.hash);
			infoMessage("Copied hash");
		}
	}

	public async copyToolUrl(): Promise<void> {
		const lineAware = await this.commit(true);
		const toolUrl = await getToolUrl(lineAware);

		if (toolUrl) {
			await env.clipboard.writeText(toolUrl.toString());
			infoMessage("Copied tool URL");
		} else {
			errorMessage("gitblame.commitUrl config empty");
		}
	}

	public async runGitShow(): Promise<void> {
		const editor = getActiveTextEditor();

		if (!validEditor(editor)) {
			return;
		}

		const currentLine = await this.commit(true);
		const hash = currentLine?.commit.hash ?? "HEAD";

		// Only ever allow HEAD or a git hash
		if (!isHash(hash, true)) {
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
					this.blame.file(textEditor.document.fileName);
					changeTextEditorSelection(textEditor);
				} else {
					this.view.clear();
				}
			}),
			window.onDidChangeTextEditorSelection(({ textEditor }) => {
				changeTextEditorSelection(textEditor);
			}),
			workspace.onDidSaveTextDocument((): void => {
				this.updateView();
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

	private async updateView(
		textEditor = getActiveTextEditor(),
		useDelay = true,
	): Promise<void> {
		if (!this.view.preUpdate(textEditor)) {
			return;
		}

		this.headWatcher.addFile(textEditor.document.fileName);

		const before = getFilePosition(textEditor);
		const lineAware = await this.blame.getLine(
			textEditor.document.fileName,
			textEditor.selection.active.line,
		);

		const textEditorAfter = getActiveTextEditor();
		if (!validEditor(textEditorAfter)) {
			return;
		}
		const after = getFilePosition(textEditorAfter);

		// Only update if we haven't moved since we started blaming
		// or if we no longer have focus on any file
		if (before === after || after === NO_FILE_OR_PLACE) {
			this.view.set(lineAware?.commit, textEditor, useDelay);
		}
	}

	private async commit(
		noVisibleActivity = false,
	): Promise<LineAttatchedCommit | undefined> {
		const notBlame = () => errorMessage("Unable to blame current line");
		const editor = getActiveTextEditor();

		if (!validEditor(editor)) {
			notBlame();
			return;
		}

		if (!noVisibleActivity) {
			this.view.activity();
		}

		this.headWatcher.addFile(editor.document.fileName);
		const line = await this.blame.getLine(
			editor.document.fileName,
			editor.selection.active.line,
		);

		if (!line) {
			notBlame();
		}

		return line;
	}
}
