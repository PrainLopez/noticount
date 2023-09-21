import { AbstractAccountingSession } from "../types/interfaces.js";

import { config } from "process";

abstract class AbstractWriter implements AbstractAccountingSession {
    naturalLanguageText: string | null
    inTime: number | null
    recordEvent: string | null
    recordAmount: number | null
    abstract nextWriter: AbstractAccountingSession | null
    
    constructor(
        session: AbstractAccountingSession,
        nextWriter: AbstractAccountingSession | null = null
    ) {
        this.naturalLanguageText = session.naturalLanguageText
        this.inTime = session.inTime
        this.recordEvent = session.recordEvent
        this.recordAmount = session.recordAmount
    }
    
    abstract process(): Promise<AbstractAccountingSession>;
}

export function writer (session: AbstractAccountingSession): void {}