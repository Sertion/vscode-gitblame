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
const RelativeTime = new Intl.RelativeTimeFormat(env.language);
export const between = (now: Date, compare: Date): string => {
	const diff = now.valueOf() - compare.valueOf();

	for (const [unit, scale] of timeUnits) {
		if (diff > scale) {
			return RelativeTime.format(-1 * Math.round(diff / scale), unit);
		}
	}

	return "right now";
};
