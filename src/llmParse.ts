import OpenAI from 'openai'
import { InterfaceAccountingSession } from '../types/interfaces.js';

import config from "../config.json" assert { type: "json" };

abstract class AbstractParser implements InterfaceAccountingSession {
  naturalLanguageText: string | null
  inTime: number | null
  recordEvent: string | null
  recordAmount: number | null
  abstract nextParser: InterfaceAccountingSession | null

  constructor(
    session: InterfaceAccountingSession,
    nextParser: InterfaceAccountingSession | null = null
  ) {
    this.naturalLanguageText = session.naturalLanguageText
    this.inTime = session.inTime
    this.recordEvent = session.recordEvent
    this.recordAmount = session.recordAmount
  }

  abstract process(): Promise<InterfaceAccountingSession>;
}

export async function parser(session: InterfaceAccountingSession): Promise<InterfaceAccountingSession> {
  if (session.naturalLanguageText === null) {
    throw new Error('Natural language text is null')
  }

  // chain of responsibility construction part
  // add new parser and chain next parser here
  const gptParser = new ChatGPTParser(session);
  gptParser.nextParser = null;

  // chain of responsibility execution part
  return await gptParser.process();
}

class ChatGPTParser extends AbstractParser {
  nextParser: InterfaceAccountingSession | null = null;
  apiKey: string = config.parser.chatGPT.apiKey;

  async process(): Promise<InterfaceAccountingSession> {
    if (config.parser.use == "chatGPT") {
      try {
        const openai = new OpenAI({
          apiKey: this.apiKey
        })

        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: config.parser.chatGPT.system_message,
            },
            {
              role: "user",
              content: this.naturalLanguageText,
            },
          ],
          temperature: config.parser.chatGPT.temperature,
          max_tokens: config.parser.chatGPT.max_tokens,
          top_p: config.parser.chatGPT.top_p,
          frequency_penalty: config.parser.chatGPT.frequency_penalty,
          presence_penalty: config.parser.chatGPT.presence_penalty,
        });

        let record: string = response.choices.at(-1)?.message.content as string;
        record.replace(/[\r\n]/g, " ");
        const recordObject = JSON.parse(record);
        console.log(`[INFO] ChatGPTParser: ${recordObject}\n ${record}`);
        this.recordEvent = recordObject.Event;
        this.recordAmount = recordObject.Amount;
      }
      catch (error) {
        throw new Error(`[ERROR] ChatGPTParser: ${error}`);
      }

      return this;
    }
    else {
      if (this.nextParser != null) {
        return await this.nextParser.process();
      }
      else {
        throw new Error('No parser enabled');
      }
    }
  }
}
