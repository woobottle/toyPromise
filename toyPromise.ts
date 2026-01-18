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

  private runCallbacks(callbacks: Callback[]) {
    for (const cb of callbacks) {
      cb();
    }
  }

  private clearCallbacks(callbacks: Callback[]) {
    callbacks = [];
  }

  resolve(value: unknown) {
    if (!(value instanceof ToyPromise) && typeof value === "object" && value !== null && value.hasOwnProperty("then")) {
      (value as { then: OnFulfilledFunc }).then(this.resolve.bind(this));
      return;
    }
    if (this.state === ToyPromiseState.PENDING) {
      this.state = ToyPromiseState.FULFILLED;
      this.value = value;
      this.runCallbacks(this.onFulfilledCallbacks);
      this.clearCallbacks(this.onFulfilledCallbacks);
    }
  }

  static resolve(value: unknown) {
    return new ToyPromise((resolve) => resolve(value));
  }

  reject(reason: unknown) {
    if (this.state === ToyPromiseState.PENDING) {
      this.state = ToyPromiseState.REJECTED;
      this.reason = reason;
      this.runCallbacks(this.onRejectedCallbacks);
      this.clearCallbacks(this.onRejectedCallbacks);
    }
  }

  static reject(reason: unknown) {
    return new ToyPromise((_, reject) => {
      reject?.(reason);
    });
  }

  private addMicrotask(callback: Callback) {
    queueMicrotask(() => {
      callback();
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
              resolve(this.reason);
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
                resolve(this.reason);
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

  static all(promises: ToyPromise[]) {
    return new ToyPromise((resolve, reject) => {
      const results: unknown[] = [];
      let resolvedCount = 0;
      for (let i = 0; i < promises.length; i++) {
        promises[i].then((value) => {
          results[i] = value;
          resolvedCount++;
          if (resolvedCount === promises.length) {
            resolve(results);
          }
        });
        promises[i].catch((reason) => {
          reject?.(reason);
        });
      }
    });
  }

  static race(promises: ToyPromise[]) {
    return new ToyPromise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i].then((value) => {
          resolve(value);
        });
        promises[i].catch((reason) => {
          reject?.(reason);
        });
      }
    });
  }
}

export { ToyPromise };

