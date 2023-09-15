import express, {Express, NextFunction, Request, Response} from "express";
import config from '../config.json' assert {type: "json"};

interface AbstractAccountingSession {
  naturalLanguageText: string;
  inTime: number;

  process(): Promise<AbstractAccountingSession>;
}

const listener = express();

listener.use(express.json());

listener.use('/recv', (req: Request, res: Response, next: NextFunction) => {
  const recvTime = Date.now();

  if (config.telegramBotListener.enable == true 
    || config.telegramBotListener.botToken == req.get('x-telegram-bot-api-secret-token')) {
      
      class RecvTelegramBotSession implements AbstractAccountingSession {
        private naturalLanguageText: string;
        private inTime: number;

        constructor(res: Response, recvTime: number) {
          this.naturalLanguageText = naturalLanguageText;
          this.inTime = recvTime;
        }

        async process(): Promise<AbstractAccountingSession> {
          return this;
        }
      }
    }

  next();
});

listener.listen(config.port, () => {
  console.log(`[INFO] Listening on port ${config.port}`);
});