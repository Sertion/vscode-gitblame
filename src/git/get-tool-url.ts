import { URL } from "node:url";
import type { Uri as UriType } from "vscode";
import { Logger } from "../logger.js";
import { errorMessage } from "../message.js";
import { PropertyStore } from "../PropertyStore.js";
import { isUrl } from "../string-stuff/is-url.js";
import { split } from "../string-stuff/split.js";
import {
	type InfoTokens,
	parseTokens,
} from "../string-stuff/text-decorator.js";
import { getvscode } from "../vscode-quarantine.js";
import { getActiveFileOrigin } from "./command/getActiveFileOrigin.js";
import { getDefaultBranch } from "./command/getDefaultBranch.js";
import { getRelativePathOfActiveFile } from "./command/getRelativePathOfActiveFile.js";
import { getRemoteUrl } from "./command/getRemoteUrl.js";
import type { LineAttachedCommit } from "./LineAttachedCommit.js";
import { originUrlToToolUrl } from "./origin-url-to-tool-url.js";
import { projectNameFromOrigin } from "./project-name-from-origin.js";
import { stripGitRemoteUrl, stripGitSuffix } from "./strip-git-remote-url.js";

export type ToolUrlTokens = {
	hash: string;
	"project.name": string;
	"project.remote": string;
	"gitorigin.hostname": string | ((index?: string) => string | undefined);
	"gitorigin.path": string | ((index?: string) => string | undefined);
	"file.path": string;
	"file.path.result": string;
	"file.path.source": string;
	"file.line": string;
	"file.line.result": string;
	"file.line.source": string;
} & InfoTokens;

function getPathIndex(path: string, index?: string, splitOn = "/"): string {
	const parts = path.split(splitOn).filter((a) => !!a);
	return parts[Number(index)] || "invalid-index";
}

function gitOriginHostname(url: URL): string | ((index?: string) => string) {
	return (index?: string): string => {
		return index === "" ? url.hostname : getPathIndex(url.hostname, index, ".");
	};
}

/**
 * @internal
 */
export function gitRemotePath(
	remote: string,
): string | ((index?: string) => string) {
	if (/^[a-z0-9-]+?@/.test(remote)) {
		const [, path] = split(remote, ":");
		return (index = ""): string => {
			if (index === "") {
				return `/${path}`;
			}

			return getPathIndex(path, index);
		};
	}
	try {
		const { pathname } = new URL(remote);
		return (index = ""): string => {
			if (index === "") {
				return pathname;
			}

			return getPathIndex(pathname, index);
		};
	} catch (err) {
		if (err instanceof Error) {
			Logger.debug(
				`Failed to get git remote path token value: "${err.message}"`,
			);
		}
		return () => "no-remote-url";
	}
}

function isToolUrlPlural(origin: string): boolean {
	return PropertyStore.get("pluralWebPathSubstrings").some((substring) =>
		origin.includes(substring),
	);
}

/**
 * @internal
 */
export async function generateUrlTokens(
	lineAware: LineAttachedCommit,
): Promise<ToolUrlTokens | undefined> {
	const remoteName = PropertyStore.get("remoteName");

	const origin = await getActiveFileOrigin(remoteName);

	if (origin === remoteName || origin === undefined) {
		return;
	}

	const remoteUrl = await getRemoteUrl(remoteName);
	if (remoteUrl === undefined) {
		Logger.info("Unable to find remote URL. Can not provide URL");
		return;
	}

	const tool = originUrlToToolUrl(remoteUrl);
	const filePath = await getRelativePathOfActiveFile();
	const defaultBranch = await getDefaultBranch(remoteName);

	return {
		hash: lineAware.commit.hash,
		"tool.protocol": tool?.protocol ?? "https:",
		"tool.commitpath": `/commit${isToolUrlPlural(remoteUrl) ? "s" : ""}/`,
		"project.name": projectNameFromOrigin(origin),
		"project.remote": stripGitRemoteUrl(remoteUrl),
		"project.defaultbranch": defaultBranch ?? "UNABLE-TO-FIND-DEFAULT-BRANCH",
		"gitorigin.hostname": tool ? gitOriginHostname(tool) : "no-origin-url",
		"gitorigin.path": gitRemotePath(stripGitSuffix(origin)),
		"gitorigin.port": tool?.port ? `:${tool.port}` : "",
		"file.path": filePath ?? "UNABLE-TO-FIND-FILE-PATH",
		"file.path.result": filePath ?? "UNABLE-TO-FIND-FILE-PATH",
		"file.path.source": lineAware.filename,
		"file.line": lineAware.line.result.toString(),
		"file.line.result": lineAware.line.result.toString(),
		"file.line.source": lineAware.line.source.toString(),
	};
}

let Uri: typeof UriType | undefined;
export async function getToolUrl(
	commit?: LineAttachedCommit,
): Promise<UriType | undefined> {
	if (!commit?.commit.isCommitted()) {
		return;
	}
	const tokens = await generateUrlTokens(commit);

	if (tokens === undefined) {
		return;
	}

	const parsedUrl = parseTokens(PropertyStore.get("commitUrl"), tokens);

	if (isUrl(parsedUrl)) {
		Uri ??= (await getvscode())?.Uri;
		if (Uri === undefined) {
			return;
		}
		return Uri.parse(parsedUrl, true);
	}

	errorMessage(
		`Malformed gitblame.commitUrl: '${parsedUrl}' from '${PropertyStore.get(
			"commitUrl",
		)}'`,
	);
}
