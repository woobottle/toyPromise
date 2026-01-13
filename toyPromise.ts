class ToyPromise {
  private state: 'pending' | 'fulfilled' | 'rejected';
  private value: string;
  private reason: string;
  private onRejectedCallbacks: ((value: string, reason: string) => void)[] = [];
  private onFulfilledCallbacks: ((value: string, reason: string) => void)[] = [];

  resolve(reason: string, value: string) {
    if (this.state === 'pending') {
      this.state = 'fulfilled';
      this.reason = reason;
      this.value = value;
    }
  };

  reject(reason: string, value: string) {
    if (this.state === 'pending') {
      this.state = 'rejected';
      this.reason = reason;
      this.value = value;
    }
  };
};
