import express, { Express, NextFunction, Request, Response } from 'express'
import config from '../config.json' assert { type: 'json' }
import { AbstractAccountingSession } from '../types/interfaces.js'

const listener = express()

listener.use(express.json())

listener.use('/recv', (req: Request, res: Response, next: NextFunction) => {
  const recvTime = Date.now()

  if (
    config.listener.telegramBotListener.enable == true ||
    config.listener.telegramBotListener.botToken ==
      req.get('X-Telegram-Bot-Api-Secret-Token')
  ) {
    // TODO: Implement further authorization

    console.log(`[INFO] Received validated message from Telegram Bot`);

    class RecvTelegramBotSession implements AbstractAccountingSession {
      naturalLanguageText: string | undefined;
      inTime: number | undefined;
      recordEvent: undefined;
      recordAmount: undefined;

      constructor (req: Request, recvTime: number) {
        this.naturalLanguageText = req.body.message.text
        this.inTime = recvTime
      }

      async process (): Promise<AbstractAccountingSession> {
        return this;
      }
    }

    const session = new RecvTelegramBotSession(req, recvTime)
    session
      .process()
      .then(session => {
        // TODO: Next process
      })
      .catch(error => {
        // TODO: Handle error
      })
  } else {
    next();
  }
})

// final handler, 404
listener.use((req: Request, res: Response) => {
  res.status(404).send('404 Not Found');
  console.log(`[ERROR] Received unhandled message from ${req.ip}`);
})

listener.listen(config.port, () => {
  console.log(`[INFO] Listening on port ${config.port}`)
})
