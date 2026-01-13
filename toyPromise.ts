class ToyPromise {
  private state: 'pending' | 'fulfilled' | 'rejected';
  private value: string;
  private reason: string;

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
