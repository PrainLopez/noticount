export interface InterfaceAccountingSession {
  naturalLanguageText: string | null;
  inTime: number | null;
  recordEvent: string | null;
  recordAmount: number | null;

  process(): Promise<InterfaceAccountingSession>;
}
