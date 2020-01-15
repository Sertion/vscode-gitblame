import { URL } from "url";

import {
    commands,
    Disposable,
    env,
    TextDocument,
    Uri,
    window,
    workspace,
} from "vscode";
import {
    container,
    injectable,
} from "tsyringe";

import {
    TITLE_VIEW_ONLINE,
} from "../constants";
import { ActionableMessageItem } from "../util/actionablemessageitem";
import { ErrorHandler } from "../util/errorhandler";
import { isUrl } from "../util/is-url";
import { Property } from "../util/property";
import { runNextTick } from "../util/run-next-tick";
import { TextDecorator } from "../util/textdecorator";
import { throttleFunction } from "../util/throttle.function";
import { StatusBarView } from "../view/view";
import {
    blankCommitInfo,
    GitCommitInfo,
    isBlankCommit,
} from "./util/blanks";
import {
    getOriginOfActiveFile,
    getRemoteUrl,
} from "./util/gitcommand";
import { stripGitRemoteUrl } from "./util/strip-git-remote-url";
import { GitBlame } from "./blame";

const NO_FILE_OR_PLACE = "no-file:-1";

@injectable()
export class GitExtension {
    private readonly disposable: Disposable;
    private readonly blame: GitBlame;
    private readonly statusBarView: StatusBarView;

    public constructor(blame: GitBlame, statusBarView: StatusBarView) {
        this.blame = blame;
        this.statusBarView = statusBarView;

        this.disposable = this.setupListeners();

        this.init();
    }

    public async blameLink(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = await this.getToolUrl(commitInfo);

        if (commitToolUrl) {
            commands.executeCommand("vscode.open", commitToolUrl);
        } else {
            window.showErrorMessage(
                "Missing gitblame.commitUrl configuration value.",
            );
        }
    }

    public async showMessage(): Promise<void> {
        const commitInfo = await this.getCommitInfo();

        if (isBlankCommit(commitInfo)) {
            this.clearView();
            return;
        }

        const messageFormat = container.resolve(Property).get(
            "infoMessageFormat",
        ) || "";
        const normalizedTokens = TextDecorator.normalizeCommitInfoTokens(
            commitInfo,
        );
        const message = TextDecorator.parseTokens(
            messageFormat,
            normalizedTokens,
        );
        const extraActions = this.generateMessageActions(commitInfo);

        this.updateView(commitInfo);

        const actionedItem = await window.showInformationMessage(
            message,
            ...(await extraActions),
        );

        if (actionedItem) {
            actionedItem.takeAction();
        }
    }

    public async copyHash(): Promise<void> {
        const commitInfo = await this.getCommitInfo();

        try {
            await env.clipboard.writeText(commitInfo.hash);
            window.showInformationMessage("Copied hash to clipboard");
        } catch (err) {
            container.resolve(ErrorHandler).logCritical(
                err,
                `Unable to copy hash to clipboard. hash: ${
                    commitInfo.hash
                }`,
            );
        }
    }

    public async copyToolUrl(): Promise<void> {
        const commitInfo = await this.getCommitInfo();
        const commitToolUrl = await this.getToolUrl(commitInfo);

        if (commitToolUrl) {
            try {
                await env.clipboard.writeText(commitToolUrl.toString());
                window.showInformationMessage("Copied tool URL to clipboard");
            } catch (err) {
                container.resolve(ErrorHandler).logCritical(
                    err,
                    `Unable to copy tool URL to clipboard. URL: ${
                        commitToolUrl
                    }`,
                );
            }
        } else {
            window.showErrorMessage(
                "Missing gitblame.commitUrl configuration value.",
            );
        }
    }

    public defaultWebPath(
        url: string,
        hash: string,
        isPlural: boolean,
    ): string {
        const gitlessUrl = stripGitRemoteUrl(url);

        let uri: URL;

        try {
            uri = new URL(`https://${ gitlessUrl }`);
        } catch (err) {
            return "";
        }

        const host = uri.hostname;
        const path = uri.pathname;
        const commit = isPlural ? "commits" : "commit";

        return `https://${ host }${ path }/${ commit }/${ hash }`;
    }

    public projectNameFromOrigin(origin: string): string {
        const match = /([a-zA-Z0-9_~%+.-]*?(\.git)?)$/.exec(origin);
        if (!match) {
            return "";
        }

        return match[1].replace(".git", "");
    }

    public dispose(): void {
        this.disposable.dispose();
    }

    private setupListeners(): Disposable {
        const disposables: Disposable[] = [];

        window.onDidChangeActiveTextEditor(
            this.onTextEditorMove,
            this,
            disposables,
        );
        window.onDidChangeTextEditorSelection(
            this.onTextEditorMove,
            this,
            disposables,
        );
        workspace.onDidSaveTextDocument(
            this.onTextEditorMove,
            this,
            disposables,
        );
        workspace.onDidCloseTextDocument(
            this.onCloseTextDocument,
            this,
            disposables,
        );

        return Disposable.from(...disposables);
    }

    private init(): void {
        this.onTextEditorMove();
    }

    @throttleFunction<GitExtension>(16)
    @runNextTick<GitExtension, void>()
    private async onTextEditorMove(): Promise<void> {
        const before = this.getCurrentActiveFilePosition();
        const commitInfo = await this.getCurrentLineInfo();
        const after = this.getCurrentActiveFilePosition();

        // Only update if we haven't moved since we started blaming
        // or if we no longer have focus on any file
        if (before === after || after === NO_FILE_OR_PLACE) {
            this.updateView(commitInfo);
        }
    }

    private getCurrentActiveFilePosition(): string {
        if (window.activeTextEditor === undefined) {
            return NO_FILE_OR_PLACE;
        }

        const {document, selection} = window.activeTextEditor;

        return `${document.fileName}:${selection.active.line}`;
    }

    private async onCloseTextDocument(document: TextDocument): Promise<void> {
        this.blame.removeDocument(document);
    }

    private async generateMessageActions(
        commitInfo: GitCommitInfo,
    ): Promise<ActionableMessageItem[]> {
        const commitToolUrl = await this.getToolUrl(commitInfo);
        const extraActions: ActionableMessageItem[] = [];

        if (commitToolUrl) {
            const viewOnlineAction = container.resolve(ActionableMessageItem);

            viewOnlineAction.setTitle(TITLE_VIEW_ONLINE);

            viewOnlineAction.setAction((): void => {
                commands.executeCommand("vscode.open", commitToolUrl);
            });

            extraActions.push(viewOnlineAction);
        }

        return extraActions;
    }

    private async getCommitInfo(): Promise<GitCommitInfo> {
        const commitInfo = await this.getCurrentLineInfo();

        if (commitInfo.generated) {
            window.showErrorMessage(
                "The current file and line can not be blamed.",
            );
        }

        return commitInfo;
    }

    private async getToolUrl(
        commitInfo: GitCommitInfo,
    ): Promise<Uri | undefined> {
        if (isBlankCommit(commitInfo)) {
            return;
        }

        const inferCommitUrl = container.resolve(Property).get(
            "inferCommitUrl",
        );

        const properties = container.resolve(Property);
        const defaultRemoteName = properties.get("remoteName") || "origin";
        const remote = getRemoteUrl(defaultRemoteName);
        const commitUrl = properties.get("commitUrl") || "";
        const origin = await getOriginOfActiveFile(defaultRemoteName);
        const projectName = this.projectNameFromOrigin(origin);
        const remoteUrl = stripGitRemoteUrl(await remote);
        const parsedUrl = TextDecorator.parseTokens(commitUrl, {
            "hash": (): string => commitInfo.hash,
            "project.remote": (): string => remoteUrl,
            "project.name": (): string => projectName,
        });

        if (isUrl(parsedUrl)) {
            return Uri.parse(parsedUrl);
        } else if (parsedUrl === '' && inferCommitUrl) {
            const isWebPathPlural = this.isToolUrlPlural(origin);
            if (origin) {
                const uri = this.defaultWebPath(
                    origin,
                    commitInfo.hash,
                    isWebPathPlural,
                );
                return Uri.parse(uri);
            } else {
                return;
            }
        } else {
            window.showErrorMessage(
                `Malformed URL in gitblame.commitUrl. ` +
                    `Currently expands to: '${ parsedUrl }'`,
            );
        }
    }

    private updateView(commitInfo: GitCommitInfo): void {
        if (commitInfo.generated) {
            this.clearView();
        } else {
            this.statusBarView.update(commitInfo);
        }
    }

    private clearView(): void {
        this.statusBarView.clear();
    }

    private async getCurrentLineInfo(): Promise<GitCommitInfo> {
        if (window.activeTextEditor === undefined) {
            return blankCommitInfo();
        }

        return this.blame.blameLine(
            window.activeTextEditor.document,
            window.activeTextEditor.selection.active.line,
        );
    }

    private isToolUrlPlural(origin: string): boolean {
        const isWebPathPlural = container.resolve(Property).get(
            "isWebPathPlural",
        );

        if (isWebPathPlural === true) {
            return true;
        }

        const urlParts = container.resolve(Property).get(
            "pluralWebPathSubstrings",
        );

        if (urlParts === undefined) {
            return false;
        }

        return urlParts.some(
            (substring): boolean => origin.includes(substring),
        );
    }
}
