import { AbstractAccountingSession } from '../types/interfaces.js'
import config from '../config.json' assert { type: 'json' }
import OpenAI from 'openai'

abstract class AbstractParser implements AbstractAccountingSession {
  naturalLanguageText: string | null
  inTime: number | null
  recordEvent: string | null
  recordAmount: number | null
  nextParser: AbstractAccountingSession | null

  constructor(
    session: AbstractAccountingSession,
    nextParser: AbstractAccountingSession | null = null
  ) {
    this.naturalLanguageText = session.naturalLanguageText
    this.inTime = session.inTime
    this.recordEvent = session.recordEvent
    this.recordAmount = session.recordAmount
    this.nextParser = nextParser
  }

  abstract process(): Promise<AbstractAccountingSession>;
}

export async function parser(
  session: AbstractAccountingSession
): Promise<AbstractAccountingSession> {
  if (session.naturalLanguageText === null) {
    throw new Error('Natural language text is null')
  }

  // chain of responsibility construction part
  // add new parser here
  const gptParser = new ChatGPTParser(session);

  // chain of responsibility execution part
  return await gptParser.process();
}

class ChatGPTParser extends AbstractParser {
  async process(): Promise<AbstractAccountingSession> {
    if (config.parser.use == "chatGPT") {
      try {
        const openai = new OpenAI({
          apiKey: config.parser.chatGPT.apiKey
        })

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: config.parser.chatGPT.system_message
            },
            {
              role: 'user',
              content: this.naturalLanguageText
            }
          ],
          temperature: config.parser.chatGPT.temperature,
          max_tokens: config.parser.chatGPT.max_tokens,
          top_p: config.parser.chatGPT.top_p,
          frequency_penalty: config.parser.chatGPT.frequency_penalty,
          presence_penalty: config.parser.chatGPT.presence_penalty
        });

        const record: string = response.choices.at(-1)?.message.content as string;
        const recordObject = JSON.parse(record) as { recordEvent: string, recordAmount: number };
        this.recordEvent = recordObject.recordEvent;
        this.recordAmount = recordObject.recordAmount;
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
