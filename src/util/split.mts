export const split = (target: string, char = " "): [string, string] => {
    const index = target.indexOf(char[0]);

    if (index === -1) {
        return [target, ""];
    }

    return [target.substr(0, index), target.substr(index + 1).trim()];
}
