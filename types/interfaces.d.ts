export interface AbstractAccountingSession {
  naturalLanguageText: string | undefined;
  inTime: number | undefined;
  recordEvent: string | undefined;
  recordAmount: number | undefined;

  process(): Promise<AbstractAccountingSession>;
}
