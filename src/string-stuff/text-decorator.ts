import { between } from "../ago.js";
import type { Commit, CommitLike } from "../git/Commit.js";
import type { CommitAuthorLike } from "../git/CommitAuthor.js";
import { PropertyStore } from "../PropertyStore.js";
import { split } from "./split.js";

type InfoTokenFunctionWithParameter = (value?: string) => string;
type InfoTokenFunction = InfoTokenFunctionWithParameter | string;

export type InfoTokens = {
	[key: string]: InfoTokenFunction | undefined;
};

export type InfoTokenNormalizedCommitInfo = {
	"author.mail": string;
	"author.name": string;
	"author.first_name": string;
	"author.timestamp": string;
	"author.tz": string;
	"author.date": string;
	"commit.hash": InfoTokenFunctionWithParameter;
	"commit.hash_short": InfoTokenFunctionWithParameter;
	"commit.summary": InfoTokenFunctionWithParameter;
	"committer.mail": string;
	"committer.name": string;
	"committer.first_name": string;
	"committer.timestamp": string;
	"committer.tz": string;
	"committer.date": string;
	"time.ago": string;
	"time.c_ago": string;
};

// sv-SE is close enough to ISO8601
const DateFormater = new Intl.DateTimeFormat("sv-SE", { dateStyle: "short" });

export function normalizeCommitInfoTokens({
	author,
	committer,
	hash,
	summary,
}: CommitLike): InfoTokenNormalizedCommitInfo {
	const now = new Date();
	const toIso = ({ date }: CommitAuthorLike) => DateFormater.format(date);

	const ago = between(now, author.date);
	const cAgo = between(now, committer.date);
	const shortness =
		(target: string, fallbackLength: string) =>
		(length = ""): string => {
			return target.slice(0, Number.parseInt(length || fallbackLength, 10));
		};
	const firstSplit = (target: string) => split(target)[0];
	const currentUserAlias = PropertyStore.get("currentUserAlias");

	return {
		"author.mail": author.mail,
		"author.name":
			author.isCurrentUser && currentUserAlias ? currentUserAlias : author.name,
		"author.first_name":
			author.isCurrentUser && currentUserAlias
				? currentUserAlias
				: firstSplit(author.name),
		"author.timestamp": author.timestamp,
		"author.tz": author.tz,
		"author.date": toIso(author),
		"committer.mail": committer.mail,
		"committer.name":
			committer.isCurrentUser && currentUserAlias
				? currentUserAlias
				: committer.name,
		"committer.first_name":
			committer.isCurrentUser && currentUserAlias
				? currentUserAlias
				: firstSplit(committer.name),
		"committer.timestamp": committer.timestamp,
		"committer.tz": committer.tz,
		"committer.date": toIso(committer),
		"commit.hash": shortness(hash, "64"),
		"commit.hash_short": shortness(hash, "7"),
		"commit.summary": shortness(summary, "65536"),
		"time.ago": ago,
		"time.c_ago": cAgo,
	};
}

const MODE = { OUT: 0, IN: 1, START: 2 } as const;

function createIndexOrEnd(
	target: string,
	index: number,
	endIndex: number,
): (char: string) => number {
	return (char: string) => {
		const indexOfChar = target.indexOf(char, index);
		if (indexOfChar === -1 || indexOfChar > endIndex) {
			return endIndex;
		}

		return indexOfChar;
	};
}
function createSubSectionOrEmpty(target: string, endIndex: number) {
	return (startIndex: number, lastIndex: number) => {
		if (lastIndex === startIndex || endIndex === startIndex) {
			return "";
		}

		return target.substring(startIndex + 1, lastIndex);
	};
}

type TokenReplaceGroup = [InfoTokenFunction, string?, string?];

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
	let mode: (typeof MODE)[keyof typeof MODE] = MODE.OUT;

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

function modify(value: string, modifier = ""): string {
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
}

function sanitizeToken(token: string): string {
	return token.replaceAll("\u202e", "");
}

export function parseTokens<T extends InfoTokens>(
	target: string,
	infoTokens: T,
): string {
	let out = "";

	for (const [funcStr, mod, param] of parse(target, infoTokens)) {
		if (typeof funcStr === "string") {
			out += modify(funcStr, mod);
		} else {
			out += modify(funcStr(param), mod);
		}
	}

	return sanitizeToken(out);
}

export function toStatusBarTextView(commit: Commit): string {
	return parseTokens(
		PropertyStore.get("statusBarMessageFormat"),
		normalizeCommitInfoTokens(commit),
	);
}

export function toInlineTextView(commit: Commit): string {
	return parseTokens(
		PropertyStore.get("inlineMessageFormat"),
		normalizeCommitInfoTokens(commit),
	);
}
