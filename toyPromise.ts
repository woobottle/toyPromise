enum ToyPromiseState {
	PENDING = "pending",
	FULFILLED = "fulfilled",
	REJECTED = "rejected",
}

type Callback = () => void;
type ResolveFunc = (value: unknown) => void;
type RejectFunc = (reason: unknown) => void;
type OnFulfilledFunc = (value: unknown) => unknown;
type OnRejectedFunc = (reason: unknown) => unknown;
type OnFinallyFunc = () => void;

class ToyPromise {
	private state: ToyPromiseState;
	private value: unknown;
	private reason: unknown;
	private onRejectedCallbacks: Callback[] = [];
	private onFulfilledCallbacks: Callback[] = [];

	constructor(executor: (resolve: ResolveFunc, reject?: RejectFunc) => void) {
		this.state = ToyPromiseState.PENDING;
		executor(this.resolve.bind(this), this.reject.bind(this));
	}

	private runCallbacks() {
		const callbacks = this.onFulfilledCallbacks.slice();
		this.onFulfilledCallbacks = [];
		this.onRejectedCallbacks = [];
		for (const cb of callbacks) {
			cb();
		}
	}

	resolve(value: unknown) {
		if (this.state === ToyPromiseState.PENDING) {
			this.state = ToyPromiseState.FULFILLED;
			this.value = value;
			this.runCallbacks();
		}
	}

	static resolve(value: unknown) {
		return new ToyPromise((resolve) => resolve(value));
	}

	reject(reason: unknown) {
		if (this.state === ToyPromiseState.PENDING) {
			this.state = ToyPromiseState.REJECTED;
			this.reason = reason;
			this.runCallbacks();
		}
	}

	static reject(reason: unknown) {
		return new ToyPromise((_, reject) => {
			reject?.(reason);
		});
	}

	then(onFulfilled?: OnFulfilledFunc, onRejected?: OnRejectedFunc) {
		return new ToyPromise((resolve, reject) => {
			if (this.state === ToyPromiseState.FULFILLED) {
				queueMicrotask(() => {
					try {
						if (typeof onFulfilled === "function") {
							const value = onFulfilled.call(this, this.value);
							if (value instanceof ToyPromise) {
								value.then(resolve, reject);
							} else {
								resolve(value);
							}
						} else {
							resolve(this.value);
						}
					} catch (error) {
						reject?.(error);
					}
				});
			}
			if (this.state === ToyPromiseState.REJECTED) {
				queueMicrotask(() => {
					try {
						if (typeof onRejected === "function") {
							const reason = onRejected.call(this, this.reason);
							if (reason instanceof ToyPromise) {
								reason.then(resolve, reject);
							} else {
								resolve(reason);
							}
						} else {
							reject?.(this.reason);
						}
					} catch (error) {
						reject?.(error);
					}
				});
			}
			if (this.state === ToyPromiseState.PENDING) {
				this.onFulfilledCallbacks.push(() => {
					queueMicrotask(() => {
						try {
							if (typeof onFulfilled === "function") {
								const value = onFulfilled.call(this, this.value);
								if (value instanceof ToyPromise) {
									value.then(resolve, reject);
								} else {
									resolve(value);
								}
							} else {
								resolve(this.value);
							}
						} catch (error) {
							reject?.(error);
						}
					});
				});
				this.onRejectedCallbacks.push(() => {
					queueMicrotask(() => {
						try {
							if (typeof onRejected === "function") {
								const reason = onRejected.call(this, this.reason);
								if (reason instanceof ToyPromise) {
									reason.then(resolve, reject);
								} else {
									resolve(reason);
								}
							} else {
								reject?.(this.reason);
							}
						} catch (error) {
							reject?.(error);
						}
					});
				});
			}
		});
	}

	catch(onRejected?: OnRejectedFunc) {
		return this.then(undefined, onRejected);
	}

	finally(onFinally?: OnFinallyFunc) {
		return this.then(
			(value: unknown) => {
				onFinally?.();
				return value; // 값 그대로 전달
			},
			(reason: unknown) => {
				onFinally?.();
				throw reason; // 에러 그대로 전파
			},
		);
	}
}

export { ToyPromise };
