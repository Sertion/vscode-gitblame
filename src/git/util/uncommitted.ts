import type { Commit } from "./stream-parsing.js";

export function isUncomitted(commit: Commit): boolean {
	return /^0{40}$/.test(commit.hash);
}
