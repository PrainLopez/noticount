import { EventEmitter } from "stream";
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
    const notion = new Client({ auth: config.writer.notion.apiKey });

    const response = await notion.pages.create({
        "parent": {
            "type": "database_id",
            "database_id": config.writer.notion.databaseId
        },
        "properties": {
            "Amount": {
                "type": "number",
                "number": session.recordAmount
            },
            "Event": {
                "type": "title",
                "title": [
                    {
                        "type": "text",
                        "text": {
                            "content": session.recordEvent as string,
                            "link": null
                        },
                        "annotations": {
                            "bold": false,
                            "italic": false,
                            "strikethrough": false,
                            "underline": false,
                            "code": false,
                            "color": "default"
                        }
                    }
                ]
            }
        },
    })

    return response;
});