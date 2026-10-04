/** Allow a single tracking blip without asking a person to be perfectly motionless.
 * The latest frame must still be usable and at least 85% of the rolling window good.
 * No poor frame is accepted into the physiological signal as a consequence. */
export class ReadinessWindow {
  private frames: { time: number; good: boolean }[] = [];
  update(time: number, good: boolean) {
    this.frames.push({ time, good });
    this.frames = this.frames.filter((frame) => time - frame.time <= 1700);
    const span = time - this.frames[0].time;
    const ratio =
      this.frames.filter((frame) => frame.good).length / this.frames.length;
    return good && span >= 1500 && this.frames.length >= 10 && ratio >= 0.85;
  }
  reset() {
    this.frames = [];
  }
}
