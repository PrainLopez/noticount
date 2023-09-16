import express, {Express, NextFunction, Request, Response} from "express";
import config from '../config.json' assert {type: "json"};

interface AbstractAccountingSession {
  naturalLanguageText: string | undefined;
  inTime: number | undefined;

  process(): Promise<AbstractAccountingSession>;
}

const listener = express();

listener.use(express.json());

listener.use('/recv', (req: Request, res: Response, next: NextFunction) => {
  const recvTime = Date.now();

  if (config.telegramBotListener.enable == true 
    || config.telegramBotListener.botToken == req.get('x-telegram-bot-api-secret-token')) {
      
      class RecvTelegramBotSession implements AbstractAccountingSession {
        naturalLanguageText: string | undefined;
        inTime: number | undefined;

        constructor(res: Response, recvTime: number) {
          this.naturalLanguageText = undefined; // TODO: Extract natural language text from request
          this.inTime = recvTime;
        }

        async process(): Promise<AbstractAccountingSession> {
          return new Promise((resolve, reject) => {
            try {
              resolve(this);
            } catch (error) {
              reject(error);
            }
          });
        }
      }
    }

  next();
});

listener.listen(config.port, () => {
  console.log(`[INFO] Listening on port ${config.port}`);
});