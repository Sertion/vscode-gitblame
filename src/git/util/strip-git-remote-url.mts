export const stripGitSuffix = (rawUrl: string): string => rawUrl
    .replace(/\.git$/i, "");

export const stripGitRemoteUrl = (
        rawUrl: string,
    ): string =>
        // Remove .git-suffix
        stripGitSuffix(rawUrl)
        // Remove protocol, username and/or password
        .replace(/^([a-z-]+:\/\/)?([\w%:\\]+?@)?/i, "")
        // Convert hostname:path to hostname/path
        .replace(/:([a-z_.~+%-][a-z0-9_.~+%-]+)\/?/i, "/$1/");
