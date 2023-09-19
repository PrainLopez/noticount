import { AbstractAccountingSession } from '../types/interfaces.js'
import config from '../config.json' assert { type: 'json' }

import OpenAI from 'openai'

async function gptParse (session: AbstractAccountingSession) {
  if (config.parser.chatGPT.enable) {
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
          content: session.naturalLanguageText
        }
      ],
      temperature: config.parser.chatGPT.temperature,
      max_tokens: config.parser.chatGPT.max_tokens,
      top_p: config.parser.chatGPT.top_p,
      frequency_penalty: config.parser.chatGPT.frequency_penalty,
      presence_penalty: config.parser.chatGPT.presence_penalty
    })
  }
}
