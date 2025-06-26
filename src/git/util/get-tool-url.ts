import { URL } from "node:url";
import { Uri } from "vscode";
import { isUrl } from "../../util/is-url.js";
import { errorMessage } from "../../util/message.js";
import { getProperty } from "../../util/property.js";
import { split } from "../../util/split.js";
import { type InfoTokens, parseTokens } from "../../util/text-decorator.js";
import {
	getActiveFileOrigin,
	getDefaultBranch,
	getRelativePathOfActiveFile,
	getRemoteUrl,
} from "./git-command.js";
import { isUncommitted } from "./is-hash.js";
import { originUrlToToolUrl } from "./origin-url-to-tool-url.js";
import { projectNameFromOrigin } from "./project-name-from-origin.js";
import type { LineAttachedCommit } from "./stream-parsing.js";
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

const getPathIndex = (path: string, index?: string, splitOn = "/"): string => {
	const parts = path.split(splitOn).filter((a) => !!a);
	return parts[Number(index)] || "invalid-index";
};

const gitOriginHostname = ({
	hostname,
}: URL): string | ((index?: string) => string) => {
	return (index?: string): string => {
		if (index === "") {
			return hostname;
		}

		return getPathIndex(hostname, index, ".");
	};
};

export const gitRemotePath = (
	remote: string,
): string | ((index?: string) => string) => {
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
	} catch {
		return () => "no-remote-url";
	}
};

const isToolUrlPlural = (origin: string): boolean =>
	(getProperty("pluralWebPathSubstrings") ?? []).some((substring) =>
		origin.includes(substring),
	);

export const generateUrlTokens = async (
	lineAware: LineAttachedCommit,
): Promise<ToolUrlTokens | undefined> => {
	const remoteName = getProperty("remoteName");

	const origin = await getActiveFileOrigin(remoteName);

	if (origin === remoteName) {
		return;
	}

	const remoteUrl = await getRemoteUrl(remoteName);
	const tool = originUrlToToolUrl(remoteUrl);
	const filePath = await getRelativePathOfActiveFile();
	const defaultBranch = await getDefaultBranch(remoteName);

	return {
		hash: lineAware.commit.hash,
		"tool.protocol": tool?.protocol ?? "https:",
		"tool.commitpath": `/commit${isToolUrlPlural(remoteUrl) ? "s" : ""}/`,
		"project.name": projectNameFromOrigin(origin),
		"project.remote": stripGitRemoteUrl(remoteUrl),
		"project.defaultbranch": defaultBranch,
		"gitorigin.hostname": tool ? gitOriginHostname(tool) : "no-origin-url",
		"gitorigin.path": gitRemotePath(stripGitSuffix(origin)),
		"gitorigin.port": tool?.port ? `:${tool.port}` : "",
		"file.path": filePath,
		"file.path.result": filePath,
		"file.path.source": lineAware.filename,
		"file.line": lineAware.line.result.toString(),
		"file.line.result": lineAware.line.result.toString(),
		"file.line.source": lineAware.line.source.toString(),
	};
};

export const getToolUrl = async (
	commit?: LineAttachedCommit,
): Promise<Uri | undefined> => {
	if (!commit || isUncommitted(commit.commit)) {
		return;
	}
	const tokens = await generateUrlTokens(commit);

	if (tokens === undefined) {
		return;
	}

	const parsedUrl = parseTokens(getProperty("commitUrl"), tokens);

	if (isUrl(parsedUrl)) {
		return Uri.parse(parsedUrl, true);
	}

	errorMessage(
		`Malformed gitblame.commitUrl: '${parsedUrl}' from '${getProperty(
			"commitUrl",
		)}'`,
	);
};
