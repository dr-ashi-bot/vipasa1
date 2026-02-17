export class ProgressSubmittedEvent {
  constructor(
    public readonly userId: string,
    public readonly isCorrect: boolean,
    public readonly conceptId: string,
    public readonly correctInRow: number,
  ) {}
}
