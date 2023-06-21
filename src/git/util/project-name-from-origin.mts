export const projectNameFromOrigin = (
    origin: string,
): string => /([a-zA-Z0-9_~%+.-]*?)(\.git)?$/.exec(origin)?.[1] ?? "";
