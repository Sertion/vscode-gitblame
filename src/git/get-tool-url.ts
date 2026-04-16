import { URL } from "node:url";
import { Logger } from "../logger.js";
import { errorMessage } from "../message.js";
import { PropertyStore } from "../PropertyStore.js";
import { isUrl } from "../string-stuff/is-url.js";
import { split } from "../string-stuff/split.js";
import {
	type InfoTokens,
	parseTokens,
} from "../string-stuff/text-decorator.js";
import { getGeneralGitInfo } from "./command/getGeneralGitInfo.js";
import type { LineAttachedCommit } from "./LineAttachedCommit.js";
import { originUrlToToolUrl } from "./origin-url-to-tool-url.js";
import { projectNameFromOrigin } from "./project-name-from-origin.js";
import { stripGitRemoteUrl, stripGitSuffix } from "./strip-git-remote-url.js";

export type ToolUrlTokens = {
	hash: string;
	"project.name": string;
	"project.remote": string;
	"project.currentbranch": string;
	"project.defaultbranch": string;
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
	const generalGit = await getGeneralGitInfo(PropertyStore.get("remoteName"));
	if (generalGit === undefined || generalGit.remoteUrl === "") {
		Logger.info("Unable to find remote URL. Can not provide URL.");
		return;
	}

	const tool = originUrlToToolUrl(generalGit.remoteUrl);

	return {
		hash: lineAware.commit.hash,
		"tool.protocol": tool?.protocol ?? "https:",
		"tool.commitpath": `/commit${isToolUrlPlural(generalGit.remoteUrl) ? "s" : ""}/`,
		"project.name": projectNameFromOrigin(generalGit.fileOrigin),
		"project.remote": stripGitRemoteUrl(generalGit.remoteUrl),
		"project.currentbranch": generalGit.currentBranch,
		"project.defaultbranch": generalGit.defaultBranch,
		"project.currenthash": generalGit.currentHash,
		"gitorigin.hostname": tool ? gitOriginHostname(tool) : "no-origin-url",
		"gitorigin.path": gitRemotePath(stripGitSuffix(generalGit.fileOrigin)),
		"gitorigin.port": tool?.port ? `:${tool.port}` : "",
		"file.path": generalGit.relativePathOfActiveFile,
		"file.path.result": generalGit.relativePathOfActiveFile,
		"file.path.source": lineAware.filename,
		"file.line": lineAware.line.result.toString(),
		"file.line.result": lineAware.line.result.toString(),
		"file.line.source": lineAware.line.source.toString(),
	};
}

export async function getToolUrl(
	commit?: LineAttachedCommit,
): Promise<URL | undefined> {
	const commitUrl = PropertyStore.get("commitUrl");
	if (commitUrl === "") {
		return;
	}
	if (!commit?.commit.isCommitted()) {
		return;
	}
	const tokens = await generateUrlTokens(commit);

	if (tokens === undefined) {
		return;
	}

	const parsedUrl = parseTokens(PropertyStore.get("commitUrl"), tokens);

	if (isUrl(parsedUrl)) {
		return new URL(parsedUrl);
	}

	errorMessage(
		`Malformed gitblame.commitUrl: '${parsedUrl}' from '${PropertyStore.get(
			"commitUrl",
		)}'`,
	);
}
