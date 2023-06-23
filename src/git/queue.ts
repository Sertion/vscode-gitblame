export class Queue<
	ReturnValue = void,
	QueueFunction extends () => Promise<ReturnValue> = () => Promise<ReturnValue>,
> {
	private readonly list: QueueFunction[] = [];
	private readonly storage = new Map<QueueFunction, (r: ReturnValue) => void>();
	private readonly processing = new Set<QueueFunction>();
	private _maxParallel?: number;

	constructor(maxParallel = 2) {
		this.maxParallel = maxParallel;
	}

	public add(toQueue: QueueFunction): Promise<ReturnValue> {
		return new Promise<ReturnValue>((resolve) => {
			this.storage.set(toQueue, resolve);
			if (this.processing.size < this.maxParallel) {
				this.startFunction(toQueue);
			} else {
				this.list.push(toQueue);
			}
		});
	}

	public updateParalell(maxParallel: number): void {
		const oldMax = this.maxParallel;
		this.maxParallel = Math.max(1, maxParallel);
		const moreQueueSpace = Math.max(0, this.maxParallel - oldMax);

		for (let i = 0; i < moreQueueSpace; i++) {
			this.runNext();
		}
	}

	private set maxParallel(value: number) {
		this._maxParallel = value;
	}

	private get maxParallel(): number {
		return Math.max(1, Number(this._maxParallel));
	}

	private startFunction(func: QueueFunction): void {
		this.processing.add(func);
		const resolve = this.storage.get(func);
		this.storage.delete(func);
		if (resolve) {
			func()
				.then((r) => resolve(r))
				.finally(() => {
					this.processing.delete(func);
					this.runNext();
				});
		}
	}

	private runNext() {
		if (this.processing.size < this.maxParallel) {
			const next = this.list.shift();
			if (next) {
				this.startFunction(next);
			}
		}
	}
}
