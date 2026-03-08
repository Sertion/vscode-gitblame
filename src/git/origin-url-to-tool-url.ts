import { URL } from "node:url";

import { stripGitRemoteUrl } from "./strip-git-remote-url.js";

export function originUrlToToolUrl(url: string): URL | undefined {
	const httpProtocol = !url.startsWith("http://") ? "https" : "http";

	let uri: URL;

	try {
		uri = new URL(`${httpProtocol}://${stripGitRemoteUrl(url)}`);
	} catch {
		return;
	}

	if (!url.startsWith("http://") && !url.startsWith("https://")) {
		uri.port = "";
	}

	return uri;
}
