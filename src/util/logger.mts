import { LogOutputChannel, window } from "vscode";

export class Logger {
    private static instance?: Logger;
    private readonly out: LogOutputChannel;

    public static getInstance(): Logger {
        return Logger.instance ??= new Logger();
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
        Logger.getInstance().out.info(info)
    }

    public dispose(): void {
        Logger.instance = undefined;
        this.out.dispose();
    }
}
