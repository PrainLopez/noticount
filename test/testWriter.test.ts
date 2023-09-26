import test from "node:test";
import { writer } from "../src/recordWriter";
import { InterfaceAccountingSession } from "../types/interfaces";

async function testWriter () {
  class dummySession implements InterfaceAccountingSession {
    naturalLanguageText: string | null;
    inTime: number | null;
    recordEvent: string | null;
    recordAmount: number | null;
    constructor(
      naturalLanguageText: string | null,
      inTime: number | null,
      recordEvent: string | null,
      recordAmount: number | null
    ) {
      this.naturalLanguageText = naturalLanguageText;
      this.inTime = inTime;
      this.recordEvent = recordEvent;
      this.recordAmount = recordAmount;
    }
    async process(): Promise<InterfaceAccountingSession> {
      return this;
    }
  }

  const session = new dummySession("test", 0, "test", 31.5);

  writer(await session.process());
}
