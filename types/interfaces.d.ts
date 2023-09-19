export interface AbstractAccountingSession {
  naturalLanguageText: string | null;
  inTime: number | null;
  recordEvent: string | null;
  recordAmount: number | null;

  process(): Promise<AbstractAccountingSession>;
}
