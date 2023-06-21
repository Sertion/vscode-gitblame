import type { Commit } from "./stream-parsing.mjs";

export function isUncomitted(commit: Commit): boolean {
	return /^0{40}$/.test(commit.hash);
}
