export class AbortReason {
  reason: any;

  constructor(reason: any) {
    this.reason = reason;
  }

  toString() {
    return this.reason;
  }
}
