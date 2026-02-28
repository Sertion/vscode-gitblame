export const stripGitSuffix = (rawUrl: string): string =>
	rawUrl.replace(/\.git$/i, "");

export const stripGitRemoteUrl = (rawUrl: string): string =>
	// Remove .git-suffix
	stripGitSuffix(rawUrl)
		// Remove protocol
		.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
		// Remove username and password
		.replace(/^[^@]+@/, "")
		// hostname[:port]:path to hostname[:port]/path
		.replace(/^([^/:]+):(?=\D)/, "$1/")
		.replace(/\/$/, "");
