import { format } from "node:util";
import { type LogOutputChannel, window } from "vscode";

export class Logger {
	private static instance?: Logger;
	private readonly out: LogOutputChannel;

	public static getInstance(): Logger {
		Logger.instance ??= new Logger();
		return Logger.instance;
	}

	private constructor() {
		this.out = window.createOutputChannel("Git Blame", {
			log: true,
		});
	}

	public static error(error: unknown): void {
		if (error instanceof Error) {
			Logger.getInstance().out.error(error);
		}
	}

	public static info(info: string): void {
		Logger.getInstance().out.info(info);
	}

	public static debug(debug: string, ...args: (string | number)[]): void {
		Logger.getInstance().out.debug(format(debug, ...args));
	}

	public static trace(debug: string, ...args: (string | number)[]): void {
		Logger.getInstance().out.trace(format(debug, ...args));
	}

	public dispose(): void {
		Logger.instance = undefined;
		this.out.dispose();
	}
}
