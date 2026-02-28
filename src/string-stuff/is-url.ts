import { URL } from "node:url";

export const isUrl = (check: string): boolean => {
	let url: URL;
	try {
		url = new URL(check);
	} catch {
		return false;
	}

	if (
		url.href !== check ||
		(url.protocol !== "http:" && url.protocol !== "https:")
	) {
		return false;
	}

	return !!(url.hostname && url.pathname);
};
