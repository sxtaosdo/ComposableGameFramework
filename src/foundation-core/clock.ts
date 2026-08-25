export interface Clock {
  now(): number;
}

export class ManualClock implements Clock {
  public constructor(private currentTime = 0) {}

  public now(): number {
    return this.currentTime;
  }

  public advance(milliseconds: number): void {
    this.currentTime += milliseconds;
  }
}

