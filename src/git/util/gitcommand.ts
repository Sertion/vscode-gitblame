import {
    ChildProcess,
    spawn,
} from "child_process";
import {
    dirname,
    normalize,
} from "path";

import {
    extensions,
    window,
} from "vscode";
import { container } from "tsyringe";

import { GIT_COMMAND_IN_PATH } from "../../constants";
import { validEditor } from "../../util/editorvalidator";
import { execute } from "../../util/execcommand";
import { Property } from "../../util/property";
import { ErrorHandler } from "../../util/errorhandler";

interface VscodeGitExtension {
    git: {
        path: string;
    };
}

export function getGitCommand(): string {
    const vscodeGit = extensions.getExtension<VscodeGitExtension>(
        "vscode.git",
    );

    if (
        vscodeGit
        && vscodeGit.exports
        && vscodeGit.exports.git
        && vscodeGit.exports.git.path
    ) {
        return vscodeGit.exports.git.path;
    } else {
        return GIT_COMMAND_IN_PATH;
    }
}

export async function getOriginOfActiveFile(
    remoteName: string,
): Promise<string> {
    if (!validEditor(window.activeTextEditor)) {
        return "";
    }

    const gitCommand = getGitCommand();
    const activeFile = window.activeTextEditor.document.fileName;
    const activeFileFolder = dirname(activeFile);
    const originUrl = await execute(gitCommand, [
        "ls-remote",
        "--get-url",
        remoteName,
    ], {
        cwd: activeFileFolder,
    });

    return originUrl.trim();
}

export async function getRemoteUrl(defaultRemote : string): Promise<string> {
    if (!validEditor(window.activeTextEditor)) {
        return "";
    }
    const gitCommand = getGitCommand();
    const activeFile = window.activeTextEditor.document.fileName;
    const activeFileFolder = dirname(activeFile);
    const currentBranch = await execute(gitCommand, [
        "symbolic-ref",
        "-q",
        "--short",
        "HEAD",
    ], {
        cwd: activeFileFolder,
    });
    var curRemote = await execute(gitCommand, [
        "config",
        "--local",
        "--get",
        `branch.${ currentBranch.trim() }.remote`,
    ], {
        cwd: activeFileFolder,
    });
    if (curRemote == "") {
        curRemote = defaultRemote;
    }
    const remoteUrl = await execute(gitCommand, [
        "config",
        "--local",
        "--get",
        `remote.${ curRemote.trim() }.url`,
    ], {
        cwd: activeFileFolder,
    });
    return remoteUrl.trim();
}

export async function getWorkTree(fileName: string): Promise<string> {
    const currentDirectory = dirname(fileName);
    const gitCommand = getGitCommand();
    const gitExecArguments = ["rev-parse", "--show-toplevel"];
    const gitExecOptions = {
        cwd: currentDirectory,
    };
    const workTree = await execute(
        gitCommand,
        gitExecArguments,
        gitExecOptions,
    );

    if (workTree.trim() === "") {
        return "";
    } else {
        return normalize(workTree.trim());
    }
}

export function spawnGitBlameStreamProcess(fileName: string): ChildProcess {
    const args = [];

    args.push("blame");

    if (container.resolve(Property).get("ignoreWhitespace")) {
        args.push("-w");
    }

    args.push("--incremental");
    args.push("--");
    args.push(fileName);

    const gitCommand = getGitCommand();
    const spawnOptions = {
        cwd: dirname(fileName),
    };

    container.resolve(ErrorHandler).logCommand(
        `${gitCommand} ${args.join(" ")}`,
    );

    return spawn(gitCommand, args, spawnOptions);
}
