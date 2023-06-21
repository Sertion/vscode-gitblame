import { FSWatcher, watch } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { getGitFolder } from "./util/gitcommand.mjs";

export type HeadChangeEvent = {
    gitRoot: string;
    repositoryRoot: string;
}

type HeadChangeEventCallbackFunction = (event: HeadChangeEvent) => void;

export class HeadWatch {
    private readonly heads: Map<string, FSWatcher> = new Map;
    private readonly filesWithFoundHeads: Set<string> = new Set;
    private callback: HeadChangeEventCallbackFunction = () => undefined;

    public onChange(callback: HeadChangeEventCallbackFunction): void {
        this.callback = callback;
    }

    public async addFile(filePath: string): Promise<void> {
        if (this.filesWithFoundHeads.has(filePath)) {
            return;
        }

        this.filesWithFoundHeads.add(filePath);

        const relativeGitRoot = await getGitFolder(filePath);
        const gitRoot = this.normalizeWindowsDriveLetter(resolve(dirname(filePath), relativeGitRoot));
        const watched = this.heads.has(gitRoot);

        if (watched === true || relativeGitRoot === "") {
            return;
        }

        const repositoryRoot = resolve(gitRoot, "..");

        this.heads.set(gitRoot, watch(
            join(gitRoot, "HEAD"),
            {
                persistent: false,
            },
            () => this.callback({gitRoot, repositoryRoot}),
        ));
    }

    public dispose(): void {
        for (const [, headWatcher] of this.heads) {
            headWatcher.close();
        }
        this.callback = () => undefined;
    }

    private normalizeWindowsDriveLetter(path: string): string {
        return path[0].toLowerCase() + path.substr(1);
    }
}
