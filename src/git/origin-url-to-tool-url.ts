import { URL } from "node:url";

import { stripGitRemoteUrl } from "./strip-git-remote-url.js";

export function originUrlToToolUrl(url: string): URL | undefined {
	const httpProtocol = url.startsWith("http://") ? "http" : "https";

	let uri: URL;

	try {
		uri = new URL(`${httpProtocol}://${stripGitRemoteUrl(url)}`);
	} catch {
		return;
	}

	if (!url.startsWith("http://") && !url.startsWith("https://")) {
		uri.port = "";
	}

	if (uri.hostname === "ssh.dev.azure.com") {
		const azurePath = /^\/v3\/([^/]+)\/([^/]+)\/([^/]+)$/.exec(uri.pathname);
		if (azurePath) {
			const [, organization, project, repository] = azurePath;
			uri.hostname = "dev.azure.com";
			uri.pathname = `/${organization}/${project}/_git/${repository}`;
		}
	}

	return uri;
}
