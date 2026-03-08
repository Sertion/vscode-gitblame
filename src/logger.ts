import * as assert from "node:assert";
import type { LogOutputChannel } from "vscode";
import { getvscode } from "./vscode-quarantine.js";

export class Logger {
	private static instance?: Logger;

	public static async createInstance(): Promise<Logger> {
		const channel = (await getvscode())?.window.createOutputChannel(
			"Git Blame",
			{
				log: true,
			},
		);
		Logger.instance = new Logger(channel);
		return Logger.instance;
	}

	public static getInstance(): Logger {
		assert.ok(
			Logger.instance,
			"Logger.getInstance() before Logger.createInstance()",
		);
		return Logger.instance;
	}

	private constructor(private readonly out: LogOutputChannel | undefined) {}

	public static error(error: unknown): void {
		if (error instanceof Error) {
			Logger.getInstance().out?.error(error);
		}
	}

	public static info(info: string): void {
		Logger.getInstance().out?.info(info);
	}

	public static debug(debug: string): void {
		Logger.getInstance().out?.debug(debug);
	}

	public static trace(debug: string): void {
		Logger.getInstance().out?.trace(debug);
	}

	public dispose(): void {
		Logger.instance = undefined;
		this.out?.dispose();
	}
}
