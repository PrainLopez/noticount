import { EventEmitter } from "node:events";
import { InterfaceAccountingSession } from "../types/interfaces.js";
import { Client } from "@notionhq/client";

import config from "../config.json" assert { type: "json" };

const writeEvent = new EventEmitter();

/* 
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
 */

export function writer(session: InterfaceAccountingSession): void {
    writeEvent.emit('write', session);
}

// Notion database writer
writeEvent.on('write', async (session: InterfaceAccountingSession) => {
    if(config.writer.notion.enable !== true) {return;}
    const notion = new Client({ auth: config.writer.notion.apiKey });

    const properties = config.writer.notion.databaseSchema;
    properties.Event.title[0].text.content = session.recordEvent as string;
    properties.Amount.number = session.recordAmount as number;
    const response = await notion.pages.create({
        "parent": {
            "database_id": config.writer.notion.databaseId
        },
        // @ts-ignore
        "properties": properties
    })

    if (response.id === undefined) {
        throw new Error(`[ERROR] Notion database writer error \n${response}`);
    }
});