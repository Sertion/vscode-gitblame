import type { Commit } from "./stream-parsing.js";

export function isHash(hash: string, allowHead = false): boolean {
	if (allowHead && hash === "HEAD") {
		return true;
	}
	const length = hash.length;
	return (length === 40 || length === 64) && /^[a-z0-9]+$/.test(hash);
}

export function isUncommitted(commit: Commit): boolean {
	const length = commit.hash.length;
	return (length === 40 || length === 64) && /^0+$/.test(commit.hash);
}
