enum ToyPromiseState {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
}

class ToyPromise {
  private state: ToyPromiseState;
  private value: string;
  private reason: string;
  private onRejectedCallbacks: Function[] = [];
  private onFulfilledCallbacks: Function[] = [];

  constructor(args: (resolve: Function, reject?: Function) => void) {
    this.state = ToyPromiseState.PENDING;
    args(this.resolve.bind(this), this.reject.bind(this));
  }

  resolve(value: string) {
    if (this.state === ToyPromiseState.PENDING) {
      this.state = ToyPromiseState.FULFILLED;
      this.value = value;
    }
  };

  reject(reason: string) {
    if (this.state === ToyPromiseState.PENDING) {
      this.state = ToyPromiseState.REJECTED;
      this.reason = reason;
    }
  };

  then(onFulfilled?: Function, onRejected?: Function) {
    return new ToyPromise((resolve: Function, reject?: Function) => {
      if (this.state === ToyPromiseState.FULFILLED) {
        try {
          const value = onFulfilled ? onFulfilled.call(this, this.value) : this.value;
          resolve(value);
        } catch (error) {
          reject?.(error);
        }
      }
      if (this.state === ToyPromiseState.REJECTED) {
        const reason = onRejected ? onRejected.call(this, this.reason) : this.reason;
        reject?.(reason);
      }
      if (this.state === ToyPromiseState.PENDING) {
        this.onFulfilledCallbacks.push(() => {
          const value = onFulfilled ? onFulfilled.call(this, this.value) : this.value;
          resolve(value);
        });
        this.onRejectedCallbacks.push(() => {
          const reason = onRejected ? onRejected.call(this, this.reason) : this.reason;
          reject?.(reason);
        });
      }
    });
  };

  catch(onRejected?: Function) {
    return this.then(undefined, onRejected);
  };

  finally(onFinally?: Function) {
    return this.then(
      (value: unknown) => {
        onFinally?.();
        return value;  // 값 그대로 전달
      },
      (reason: unknown) => {
        onFinally?.();
        throw reason;  // 에러 그대로 전파
      }
    );
  }
};

(function () {
  new ToyPromise(res => res(1))
    .then()  // onFulfilled가 없으면 값을 그대로 전달
    .then((v: unknown) => console.log(v)); // 1
  new ToyPromise(res => res(1))
    .then((v: number) => new ToyPromise(res => res(v * 2)))  // Promise 반환
    .then((v: unknown) => console.log(v)); // 2 (중첩되지 않고 평탄화됨)
  new ToyPromise((_, rej) => rej?.('error'))
    .then((v: number) => v * 2)  // onRejected가 없으면 에러를 그대로 전파
    .catch((e: unknown) => console.log(e)); // 'error'
  new ToyPromise(res => res(1))
    .then((v: unknown) => { throw new Error('boom'); })  // 예외 발생
    .catch((e: Error) => console.log(e.message)); // 'boom'
  new ToyPromise(res => res(1))
    .finally(() => console.log('finally'))
    .then((v: unknown) => console.log(v)); // 1
})();