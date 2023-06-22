import {
	commands,
	Disposable,
	env,
	MessageItem,
	TextEditor,
	window,
	workspace,
} from "vscode";

import type { LineAttatchedCommit } from "./util/stream-parsing.js";

import { Document, validEditor } from "../util/editorvalidator.js";
import {
	normalizeCommitInfoTokens,
	parseTokens,
} from "../util/textdecorator.js";
import { StatusBarView } from "../view.js";
import { Blamer } from "./blame.js";
import { getProperty } from "../util/property.js";
import { getToolUrl } from "./util/get-tool-url.js";
import { isUncomitted } from "./util/uncommitted.js";
import { errorMessage, infoMessage } from "../util/message.js";
import {
	getActiveTextEditor,
	getFilePosition,
	NO_FILE_OR_PLACE,
} from "../util/get-active.js";
import { HeadWatch } from "./head-watch.js";

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
		const action: ActionableMessageItem[] | undefined = toolUrl
			? [
					{
						title: "View",
						action() {
							commands.executeCommand("vscode.open", toolUrl);
						},
					},
			  ]
			: undefined;

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

		this.headWatcher.onChange(({ repositoryRoot }) => {
			this.blame.removeFromRepository(repositoryRoot);
		});

		return Disposable.from(
			window.onDidChangeActiveTextEditor((textEditor): void => {
				if (validEditor(textEditor)) {
					this.view.activity();
					this.blame.file(textEditor.document.fileName);
					/**
					 * For unknown reasons files without previous or stored
					 * selection locations don't trigger the change selection
					 * event. I have not been able to find a way to detect when
					 * this happens. Running the event handler twice seames to
					 * be a good enough workaround.
					 */
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
					this.updateView(textEditor, 0);
				}
			}),
		);
	}

	private async updateView(
		textEditor = getActiveTextEditor(),
		delay = getProperty("delayBlame"),
	): Promise<void> {
		this.view.clear();
		if (!validEditor(textEditor)) {
			return;
		}
		this.view.activity();
		this.headWatcher.addFile(textEditor.document.fileName);

		const before = getFilePosition(textEditor);
		const lineAware = await this.blame.getLine(
			textEditor.document.fileName,
			textEditor.selection.active.line,
		);
		if (delay > 0) {
			await new Promise((f) => setTimeout(f, delay));
		}
		const after = getFilePosition(textEditor);

		// Only update if we haven't moved since we started blaming
		// or if we no longer have focus on any file
		if (before === after || after === NO_FILE_OR_PLACE) {
			this.view.set(lineAware?.commit, textEditor);
		}
	}

	private async commit(
		undercover = false,
	): Promise<LineAttatchedCommit | undefined> {
		const notBlame = () => errorMessage("Unable to blame current line");
		const editor = getActiveTextEditor();

		if (!validEditor(editor)) {
			notBlame();
			return;
		}

		if (!undercover) {
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
