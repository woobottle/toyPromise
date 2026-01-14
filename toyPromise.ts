enum ToyPromiseState {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected',
}

class ToyPromise {
  private state: ToyPromiseState;
  private value: unknown;
  private reason: unknown;
  private onRejectedCallbacks: Function[] = [];
  private onFulfilledCallbacks: Function[] = [];

  constructor(args: (resolve: Function, reject?: Function) => void) {
    this.state = ToyPromiseState.PENDING;
    args(this.resolve.bind(this), this.reject.bind(this));
  }

  resolve(value: unknown) {
    if (this.state === ToyPromiseState.PENDING) {
      this.state = ToyPromiseState.FULFILLED;
      this.value = value;
      const callbacks = this.onFulfilledCallbacks.slice();
      this.onFulfilledCallbacks = [];
      this.onRejectedCallbacks = [];
      callbacks.forEach((cb) => cb());
    }
  };

  static resolve(value: unknown) {
    return new ToyPromise((resolve: Function) => resolve(value));
  }

  reject(reason: unknown) {
    if (this.state === ToyPromiseState.PENDING) {
      this.state = ToyPromiseState.REJECTED;
      this.reason = reason;
      const callbacks = this.onRejectedCallbacks.slice();
      this.onFulfilledCallbacks = [];
      this.onRejectedCallbacks = [];
      callbacks.forEach((cb) => cb());
    }
  };

  static reject(reason: unknown) {
    return new ToyPromise((_, reject?: Function) => { reject?.(reason) });
  }

  then(onFulfilled?: Function, onRejected?: Function) {
    return new ToyPromise((resolve: Function, reject?: Function) => {
      console.log('this.state', this.state);
      if (this.state === ToyPromiseState.FULFILLED) {
        queueMicrotask(() => {
          try {
            if (typeof onFulfilled === 'function') {
              const value = onFulfilled.call(this, this.value);
              resolve(value);
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
            if (typeof onRejected === 'function') {
              const reason = onRejected.call(this, this.reason);
              resolve(reason);
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
              if (typeof onFulfilled === 'function') {
                const value = onFulfilled.call(this, this.value);
                resolve(value);
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
              if (typeof onRejected === 'function') {
                const reason = onRejected.call(this, this.reason);
                resolve(reason);
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
  // new ToyPromise(res => res(1))
  //   .then()  // onFulfilled가 없으면 값을 그대로 전달
  //   .then((v: unknown) => console.log(v)); // 1
  new ToyPromise(res => res(1))
    .then((v: number) => new ToyPromise(res => res(v * 2)))  // Promise 반환
    .then((v: unknown) => console.log(v)); // 2 (중첩되지 않고 평탄화됨)
  new ToyPromise((_, rej) => rej?.('error'))
    .then((v: number) => v * 2)  // onRejected가 없으면 에러를 그대로 전파
    .catch((e: unknown) => console.log(e)); // 'error'
  // new ToyPromise(res => res(1))
  //   .then((v: unknown) => { throw new Error('boom'); })  // 예외 발생
  //   .catch((e: Error) => console.log(e.message)); // 'boom'
  // new ToyPromise(res => res(1))
  //   .finally(() => console.log('finally'))
  //   .then((v: unknown) => console.log(v)); // 1
  // ToyPromise.resolve(42).then((v: unknown) => console.log(v)); // 42
  // ToyPromise.reject('error').catch((e: unknown) => console.log(e)); // 'error'
  // const p = new ToyPromise((resolve) => resolve(1));
  // p.then(v => v * 10)
  //   .then(v => v + 10)
  //   .then(v => console.log('완성된 값', v)); // 20
  // function later(v, t = 50) {
  //   return new ToyPromise(res => setTimeout(() => res(v), t));
  // }
  // new ToyPromise(res => res(1))
  //   .then(v => later(v * 2))    // 여기서 ToyPromise 반환
  //   .then(v => later(v + 3))    // flattening 검증
  //   .then(v => console.log(v)); // 5
})();
