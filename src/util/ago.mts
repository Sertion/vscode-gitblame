import { env } from "vscode";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365.25 * DAY;
const MONTH = YEAR / 12;

const timeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", YEAR],
    ["month", MONTH],
    ["day", DAY],
    ["hour", HOUR],
    ["minute", MINUTE],
];
export const between = (now: Date, compare: Date): string => {
    const diffMilliseconds = now.valueOf() - compare.valueOf();

    for (const [currentUnit, scale] of timeUnits) {
        if (diffMilliseconds > scale) {
            return (new Intl.RelativeTimeFormat(env.language))
                .format(-1 * Math.round(diffMilliseconds / scale), currentUnit);
        }
    }

    return "right now";
}
