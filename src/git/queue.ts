export class Queue<
	ReturnValue = void,
	QueueFunction extends () => Promise<ReturnValue> = () => Promise<ReturnValue>,
> {
	private readonly list: QueueFunction[] = [];
	private readonly storage = new Map<QueueFunction, (r: ReturnValue) => void>();
	private readonly processing = new Set<QueueFunction>();
	private readonly maxParallel: number;

	constructor(maxParallel = 2) {
		this.maxParallel = Math.max(1, maxParallel);
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

	private startFunction(func: QueueFunction): void {
		this.processing.add(func);
		const resolve = this.storage.get(func);
		this.storage.delete(func);
		if (resolve) {
			func()
				.then((r) => resolve(r))
				.finally(() => {
					this.processing.delete(func);
					const next = this.list.shift();
					if (next) {
						this.startFunction(next);
					}
				});
		}
	}
}
