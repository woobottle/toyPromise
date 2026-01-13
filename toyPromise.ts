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

  constructor(resolve: Function, reject?: Function) {
    this.state = ToyPromiseState.PENDING;
    resolve(this.resolve.bind(this));
    reject?.(this.reject.bind(this));
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
    return new ToyPromise((resolve: Function, reject: Function) => {
      if (this.state === ToyPromiseState.FULFILLED) {
        const value = onFulfilled ? onFulfilled.call(this, this.value) : this.value;
        resolve(value);
      }
      if (this.state === ToyPromiseState.REJECTED) {
        const reason = onRejected ? onRejected.call(this, this.reason) : this.reason;
        reject(reason);
      }
      if (this.state === ToyPromiseState.PENDING) {
        this.onFulfilledCallbacks.push(() => {
          const value = onFulfilled ? onFulfilled.call(this, this.value) : this.value;
          resolve(value);
        });
        this.onRejectedCallbacks.push(() => {
          const reason = onRejected ? onRejected.call(this, this.reason) : this.reason;
          reject(reason);
        });
      }
    });
  };
};

(function () {
  // new ToyPromise(res => res(1))
  //   .then()  // onFulfilled가 없으면 값을 그대로 전달
  //   .then(v => console.log(v)); // 1
  new ToyPromise(res => res(1))
    .then(v => new ToyPromise(res => res(v * 2)))  // Promise 반환
    .then(v => console.log(v)); // 2 (중첩되지 않고 평탄화됨)
})();