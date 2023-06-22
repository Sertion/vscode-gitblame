import { getProperty } from "./property.js";
import { between } from "./ago.js";

import type { Commit, CommitAuthor } from "../git/util/stream-parsing.js";

type InfoTokenFunctionWithParameter = (value?: string) => string;
type InfoTokenFunction = InfoTokenFunctionWithParameter | string;

export type InfoTokens = {
	[key: string]: InfoTokenFunction | undefined;
};

export type InfoTokenNormalizedCommitInfo = {
	"author.mail": string;
	"author.name": string;
	"author.timestamp": string;
	"author.tz": string;
	"author.date": string;
	"commit.hash": InfoTokenFunctionWithParameter;
	"commit.hash_short": InfoTokenFunctionWithParameter;
	"commit.summary": InfoTokenFunctionWithParameter;
	"committer.mail": string;
	"committer.name": string;
	"committer.timestamp": string;
	"committer.tz": string;
	"committer.date": string;
	"time.ago": string;
	"time.c_ago": string;
};

type TokenReplaceGroup = [InfoTokenFunction, string?, string?];

export const normalizeCommitInfoTokens = ({
	author,
	committer,
	hash,
	summary,
}: Commit): InfoTokenNormalizedCommitInfo => {
	const now = new Date();
	const toIso = ({ date }: CommitAuthor) => date.toISOString().slice(0, 10);

	const ago = between(now, author.date);
	const cAgo = between(now, committer.date);
	const shortness =
		(target: string, fallbackLength: string) => (length = ""): string => {
			return target.substr(0, parseInt(length || fallbackLength, 10));
		};

	return {
		"author.mail": author.mail,
		"author.name": author.name,
		"author.timestamp": author.timestamp,
		"author.tz": author.tz,
		"author.date": toIso(author),
		"committer.mail": committer.mail,
		"committer.name": committer.name,
		"committer.timestamp": committer.timestamp,
		"committer.tz": committer.tz,
		"committer.date": toIso(committer),
		"commit.hash": shortness(hash, "40"),
		"commit.hash_short": shortness(hash, "7"),
		"commit.summary": shortness(summary, "65536"),
		"time.ago": ago,
		"time.c_ago": cAgo,
	};
};

enum MODE {
	OUT = 0,
	IN = 1,
	START = 2,
}

const createIndexOrEnd =
	(target: string, index: number, endIndex: number) => (char: string) => {
		const indexOfChar = target.indexOf(char, index);
		if (indexOfChar === -1 || indexOfChar > endIndex) {
			return endIndex;
		}

		return indexOfChar;
	};
const createSubSectionOrEmpty =
	(target: string, endIndex: number) =>
	(startIndex: number, lastIndex: number) => {
		if (lastIndex === startIndex || endIndex === startIndex) {
			return "";
		}

		return target.substring(startIndex + 1, lastIndex);
	};

function createTokenReplaceGroup<T extends InfoTokens>(
	infoTokens: T,
	target: string,
	index: number,
): TokenReplaceGroup {
	const endIndex = target.indexOf("}", index);
	const indexOrEnd = createIndexOrEnd(target, index, endIndex);
	const subSectionOrEmpty = createSubSectionOrEmpty(target, endIndex);

	const parameterIndex = indexOrEnd(",");
	const modifierIndex = indexOrEnd("|");
	const functionName = target.substring(
		index,
		Math.min(parameterIndex, modifierIndex),
	);

	return [
		infoTokens[functionName] ?? functionName,
		subSectionOrEmpty(modifierIndex, endIndex),
		subSectionOrEmpty(parameterIndex, modifierIndex),
	];
}

function* parse<T extends InfoTokens>(
	target: string,
	infoTokens: T,
): Generator<TokenReplaceGroup> {
	let lastSplit = 0;
	let startIndex = 0;
	let mode = MODE.OUT;

	for (let index = 0; index < target.length; index++) {
		if (mode === MODE.OUT && target[index] === "$") {
			mode = MODE.START;
		} else if (mode === MODE.START && target[index] === "{") {
			mode = MODE.IN;
			startIndex = index - 1;
			yield [target.slice(lastSplit, startIndex)];
			lastSplit = startIndex;
		} else if (mode === MODE.START) {
			mode = MODE.OUT;
		} else if (mode === MODE.IN) {
			mode = MODE.OUT;
			const endIndex = target.indexOf("}", index);
			if (endIndex === -1) {
				break;
			}

			yield createTokenReplaceGroup(infoTokens, target, index);

			lastSplit = endIndex + 1;
		}
	}

	yield [target.slice(lastSplit)];
}

const modify = (value: string, modifier = ""): string => {
	if (modifier === "u") {
		return value.toUpperCase();
	}
	if (modifier === "l") {
		return value.toLowerCase();
	}
	if (modifier) {
		return `${value}|${modifier}`;
	}

	return value;
};

const sanitizeToken = (token: string): string => {
	return token.replace(/\u202e/g, "");
};

export const parseTokens = <T extends InfoTokens>(
	target: string,
	infoTokens: T,
): string => {
	let out = "";

	for (const [funcStr, mod, param] of parse(target, infoTokens)) {
		if (typeof funcStr === "string") {
			out += modify(funcStr, mod);
		} else {
			out += modify(funcStr(param), mod);
		}
	}

	return sanitizeToken(out);
};

export const toStatusBarTextView = (commit: Commit): string =>
	parseTokens(
		getProperty("statusBarMessageFormat"),
		normalizeCommitInfoTokens(commit),
	);

export const toInlineTextView = (commit: Commit): string =>
	parseTokens(
		getProperty("inlineMessageFormat"),
		normalizeCommitInfoTokens(commit),
	);
