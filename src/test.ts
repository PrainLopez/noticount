import { InterfaceAccountingSession } from "../types/interfaces.js";
import { writer } from "./recordWriter.js";
import { parser } from "./llmParse.js";

class TestSession implements InterfaceAccountingSession {
  naturalLanguageText: string | null;
  inTime: number | null;
  recordEvent: string | null;
  recordAmount: number | null;

  constructor(
    naturalLanguageText: string | null = null,
    inTime: number | null = null,
    recordEvent: string | null = null,
    recordAmount: number | null = null
  ) {
    this.naturalLanguageText = naturalLanguageText;
    this.inTime = inTime;
    this.recordAmount = recordAmount;
    this.recordEvent = recordEvent;
  }

  async process(): Promise<InterfaceAccountingSession> {
    return this;
  }
}

// test llmParse.ts
async function testParser() {
  let sessionParser: InterfaceAccountingSession = new TestSession(
    "傻逼百事要我4块钱",
    Date.now(),
    null,
    null
  );
  try {
    sessionParser = await parser(sessionParser);
    console.log(
      `[INFO] LLM Parsed message from TEST ${sessionParser.recordEvent}, ${sessionParser.recordAmount}`
    );
  } catch (error) {
    console.log(`[ERROR] LLMParse error \n${error}`);
  }
}

// test recordWriter.ts
async function testWriter() {
  let sessionWriter: InterfaceAccountingSession = new TestSession(
    "傻逼百事要我4块钱",
    Date.now(),
    "百事",
    4
  );
  try {
    writer(sessionWriter);
  } catch (error) {
    console.log(`[ERROR] recordWriter error \n${error}`);
  }
}

testParser();
testWriter();