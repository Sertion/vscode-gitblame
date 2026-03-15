export function stripGitSuffix(rawUrl: string): string {
	return rawUrl.replace(/\.git$/i, "");
}

export function stripGitRemoteUrl(rawUrl: string): string {
	// Remove .git-suffix
	return (
		stripGitSuffix(rawUrl)
			// Remove protocol
			.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
			// Remove username and password
			.replace(/^[^@]+@/, "")
			// hostname[:port]:path to hostname[:port]/path
			.replace(/^([^/:]+):(?=\D)/, "$1/")
			.replace(/\/$/, "")
	);
}
