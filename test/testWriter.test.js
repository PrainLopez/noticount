import { writer } from "../src/recordWriter";
async function testWriter() {
    class dummySession {
        naturalLanguageText;
        inTime;
        recordEvent;
        recordAmount;
        constructor(naturalLanguageText, inTime, recordEvent, recordAmount) {
            this.naturalLanguageText = naturalLanguageText;
            this.inTime = inTime;
            this.recordEvent = recordEvent;
            this.recordAmount = recordAmount;
        }
        async process() {
            return this;
        }
    }
    const session = new dummySession("test", 0, "test", 31.5);
    writer(await session.process());
}
